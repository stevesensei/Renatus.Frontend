<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { z } from 'zod';
import { useRoute } from 'vue-router';
import { connectInteractionSchema, decideConnectInteraction, loadConnectInteraction } from '../api/connect';
import ConnectInteractionCard from '../components/ConnectInteractionCard.vue';
import PageHeading from '../components/PageHeading.vue';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

type ConnectInteraction = z.infer<typeof connectInteractionSchema>;

const route = useRoute();
const operation = useOperation();
const userCode = ref('');
const interaction = ref<ConnectInteraction | null>(null);
const queryCode = computed(() => (typeof route.query['user_code'] === 'string' ? route.query['user_code'] : ''));
const interactionId = computed(() => (typeof route.query['interaction'] === 'string' ? route.query['interaction'] : ''));

function resolve(): void {
  const code = userCode.value.trim();
  if (code) window.location.assign(`/connect/verify?user_code=${encodeURIComponent(code)}`);
}

/** Completes the resolved device interaction using the existing authenticated browser session. */
async function decide(approve: boolean, playerId?: string): Promise<void> {
  const current = interaction.value;
  if (!current) return;
  await operation.run(async () => {
    const result = await decideConnectInteraction(current.interactionId, approve, playerId);
    window.location.assign(result.completionUrl);
  });
}

onMounted(() => {
  userCode.value = queryCode.value;
  if (interactionId.value) {
    void operation.run(async () => { interaction.value = await loadConnectInteraction(interactionId.value); });
  } else if (userCode.value) resolve();
});
</script>

<template>
  <div class="consent-wrap">
    <PageHeading :eyebrow="t('connect.deviceEyebrow')" :title="t('connect.deviceTitle')" :description="t('connect.deviceDescription')" />
    <form v-if="!interaction" class="panel device-form form-stack" @submit.prevent="resolve">
      <label class="field">{{ t('connect.userCode') }}<InputText v-model="userCode" required maxlength="32" autocomplete="one-time-code" :placeholder="t('connect.userCodeHint')" /></label>
      <Button type="submit" :loading="operation.pending.value" :disabled="!userCode.trim()">{{ t('connect.continue') }}</Button>
    </form>
    <ConnectInteractionCard v-else :interaction="interaction" :pending="operation.pending.value" @decide="decide" />
    <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  </div>
</template>
