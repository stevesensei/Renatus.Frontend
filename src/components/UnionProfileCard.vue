<script setup lang="ts">
import { Copy, Link2, Unlink } from '@lucide/vue';
import { computed, ref } from 'vue';
import type { z } from 'zod';
import { bindUnionProfile, createBindToken, unbindUnionProfile, type unionDirectorySchema, type unionProfileSchema } from '../api/union';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';
import { state } from '../data/state';
import UnionProfileTable from './UnionProfileTable.vue';

const props = defineProps<{
  readonly profile: z.infer<typeof unionProfileSchema>;
  readonly servers: z.infer<typeof unionDirectorySchema>['servers'];
}>();
const emit = defineEmits<{ changed: [] }>();
const operation = useOperation();
const canCreateMaster = computed(() => state.account.role === 'Admin');
const token = ref('');
const generatedToken = ref('');
const copyError = ref('');
const confirmUnbind = ref(false);
const bound = computed(() => (props.profile.detail?.bind_status ?? 0) > 0);
const bindings = computed(() => props.profile.detail?.bind ?? []);
const isMaster = computed(() => !bound.value && bindings.value.length > 0);
const status = computed(() => bound.value ? t('union.boundStatus') : isMaster.value ? t('union.masterStatus') : t('union.independent'));

async function generateToken(): Promise<void> {
  await operation.run(async () => {
    generatedToken.value = (await createBindToken(props.profile.playerId)).token;
    copyError.value = '';
  }, t('union.tokenCreated'));
}

async function bind(): Promise<void> {
  const success = await operation.run(async () => {
    await bindUnionProfile(props.profile.playerId, token.value.trim());
    token.value = '';
    generatedToken.value = '';
  }, t('union.bound'));
  if (success) emit('changed');
}

async function unbind(): Promise<void> {
  const success = await operation.run(() => unbindUnionProfile(props.profile.playerId), t('union.unbound'));
  if (success) { confirmUnbind.value = false; emit('changed'); }
}

async function copyToken(): Promise<void> {
  copyError.value = '';
  try { await navigator.clipboard.writeText(generatedToken.value); }
  catch (cause) {
    if (cause instanceof Error) copyError.value = t('union.copyFailed');
    else throw cause;
  }
}
</script>

<template>
  <article class="panel union-profile-card">
    <header class="section-heading union-profile-heading">
      <div><h3>{{ profile.name }}</h3><p class="mono muted">{{ profile.minecraftUuid }}</p></div>
      <Tag :value="profile.detail ? status : t('union.notConnected')" :severity="bound ? 'success' : 'secondary'" />
    </header>
    <template v-if="profile.detail">
      <UnionProfileTable :current="profile.detail" :bindings="bindings" :servers="servers" />
      <section v-if="profile.conflicts.length" class="union-conflicts form-stack">
        <div><h4>{{ t('union.conflictTitle') }}</h4><p class="muted small">{{ t('union.conflictHint') }}</p></div>
        <Message severity="warn">{{ t('union.conflicts', { count: profile.conflicts.length }) }}</Message>
        <UnionProfileTable v-if="profile.conflicts[0]" :current="profile.conflicts[0]" :bindings="profile.conflicts.slice(1)" :servers="servers" conflicts />
      </section>
      <div class="union-bind-actions form-stack">
        <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
        <template v-if="bound">
          <p class="muted">{{ t('union.boundHint') }}</p>
          <div><Button outlined severity="danger" :disabled="operation.pending.value" @click="confirmUnbind = true"><Unlink :size="17" />{{ t('union.unbind') }}</Button></div>
        </template>
        <template v-else>
          <div v-if="canCreateMaster" class="union-token-create">
            <p class="muted">{{ t('union.createTokenHint') }}</p>
            <Button outlined :loading="operation.pending.value" :disabled="operation.pending.value" @click="generateToken"><Link2 :size="17" />{{ t('union.createToken') }}</Button>
          </div>
          <label v-if="canCreateMaster && generatedToken" class="field">{{ t('union.generatedToken') }}
            <div class="union-token-input"><InputText :model-value="generatedToken" readonly autocomplete="off" /><Button outlined :aria-label="t('common.copy')" @click="copyToken"><Copy :size="17" /></Button></div>
          </label>
          <Message v-if="canCreateMaster && copyError" severity="error">{{ copyError }}</Message>
          <Message v-if="isMaster" severity="info">{{ t('union.masterHint') }}</Message>
          <form v-else class="form-stack" @submit.prevent="bind">
            <p class="muted">{{ t('union.enterTokenHint') }}</p>
            <label class="field">{{ t('union.targetToken') }}<InputText v-model="token" autocomplete="off" maxlength="4096" required :disabled="operation.pending.value" /></label>
            <div class="form-actions"><Button type="submit" :loading="operation.pending.value" :disabled="!token.trim() || operation.pending.value" :label="t('union.bindToMaster')" /></div>
          </form>
        </template>
      </div>
    </template>
    <Message v-else severity="info">{{ t('union.profileUnavailable') }}</Message>
    <Dialog v-model:visible="confirmUnbind" modal class="compact-dialog" :header="t('union.unbind')" :closable="!operation.pending.value">
      <p>{{ t('union.unbindConfirm') }}</p>
      <template #footer><Button outlined severity="secondary" :disabled="operation.pending.value" :label="t('common.cancel')" @click="confirmUnbind = false" /><Button severity="danger" :loading="operation.pending.value" :disabled="operation.pending.value" :label="t('union.unbind')" @click="unbind" /></template>
    </Dialog>
  </article>
</template>
