<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue';
import { computed, ref } from 'vue';
import type { z } from 'zod';
import type { connectInteractionSchema } from '../api/connect';
import { t } from '../i18n';

type ConnectInteraction = z.infer<typeof connectInteractionSchema>;

const props = defineProps<{ interaction: ConnectInteraction; pending: boolean }>();
const emit = defineEmits<{ decide: [approve: boolean, playerId?: string] }>();
const selectedProfile = ref('');

const needsProfile = computed(() => props.interaction.scopes.includes('Yggdrasil.PlayerProfiles.Select'));
const scopeNames: Readonly<Record<string, string>> = {
  openid: t('connect.scopeOpenId'),
  profile: t('connect.scopeProfile'),
  email: t('connect.scopeEmail'),
  offline_access: t('connect.scopeOffline'),
  'Yggdrasil.PlayerProfiles.Read': t('connect.scopeProfilesRead'),
  'Yggdrasil.PlayerProfiles.Select': t('connect.scopeProfileSelect'),
  'Yggdrasil.Server.Join': t('connect.scopeServerJoin'),
};

function scopeName(scope: string): string {
  return scopeNames[scope] ?? scope;
}
</script>

<template>
  <section class="panel consent-card form-stack">
    <div class="consent-icon"><ShieldCheck :size="32" /></div>
    <div><h2>{{ interaction.clientName }}</h2><p class="muted">{{ t('connect.clientRequest', { value1: interaction.clientId }) }}</p></div>
    <div><h3>{{ t('connect.requestedAccess') }}</h3><ul class="scope-list"><li v-for="scope in interaction.scopes" :key="scope">{{ scopeName(scope) }}</li></ul></div>
    <label v-if="needsProfile" class="field">{{ t('connect.selectProfile') }}
      <Select v-model="selectedProfile" :options="interaction.profiles" option-label="name" option-value="id" :placeholder="t('connect.selectProfileHint')" />
    </label>
    <p class="muted small">{{ t('consent.expiresAt', { value1: new Date(interaction.expiresAt).toLocaleString() }) }}</p>
    <div class="consent-actions"><Button outlined severity="secondary" :disabled="pending" @click="emit('decide', false)">{{ t('consent.deny') }}</Button><Button :loading="pending" :disabled="needsProfile && !selectedProfile" @click="emit('decide', true, selectedProfile || undefined)">{{ t('consent.approve') }}</Button></div>
  </section>
</template>
