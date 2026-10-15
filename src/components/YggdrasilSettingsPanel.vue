<script setup lang="ts">
import { Save } from '@lucide/vue';
import { onMounted, ref } from 'vue';
import type { z } from 'zod';
import { loadYggdrasilConfig, saveYggdrasilConfig, type yggdrasilConfigSchema } from '../api/yggdrasil';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

const operation = useOperation();
const config = ref<z.infer<typeof yggdrasilConfigSchema> | null>(null);
const uuidOptions = ['v3', 'v4'];

/** Saves the traditional Yggdrasil settings independently of Union and Connect configuration. */
async function save(): Promise<void> {
  const draft = config.value;
  if (!draft) return;
  await operation.run(async () => { config.value = await saveYggdrasilConfig(draft); }, t('adminYggdrasil.saved'));
}

onMounted(() => operation.run(async () => { config.value = await loadYggdrasilConfig(); }));
</script>

<template>
  <form class="panel form-stack" @submit.prevent="save">
    <div><h2>{{ t('adminYggdrasil.title') }}</h2><p class="muted">{{ t('adminYggdrasil.description') }}</p></div>
    <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
    <div v-if="config" class="form-grid">
      <label class="visibility-row span-2"><span>{{ t('adminYggdrasil.enabled') }}</span><ToggleSwitch v-model="config.authServerEnabled" /></label>
      <label class="field">{{ t('adminYggdrasil.uuid') }}<Select v-model="config.uuidAlgorithm" :options="uuidOptions" /></label>
      <label class="field">{{ t('adminYggdrasil.sessions') }}<InputNumber v-model="config.maxActiveSessions" :min="1" :max="100" /></label>
      <label class="field">{{ t('adminYggdrasil.access') }}<InputNumber v-model="config.accessTokenExpireHours" :min="1" :max="720" /></label>
      <label class="field">{{ t('adminYggdrasil.refresh') }}<InputNumber v-model="config.refreshTokenExpireHours" :min="config.accessTokenExpireHours" :max="2160" /></label>
      <label class="field">{{ t('adminYggdrasil.join') }}<InputNumber v-model="config.joinSessionTtlSeconds" :min="1" :max="300" /></label>
      <label class="field">{{ t('adminYggdrasil.lookup') }}<InputNumber v-model="config.maxProfileLookupCount" :min="1" :max="1000" /></label>
      <label class="field span-2">{{ t('adminYggdrasil.rateLimit') }}<InputNumber v-model="config.authenticationRateLimitMilliseconds" :min="1" :max="60000" /></label>
      <label class="visibility-row"><span>{{ t('adminYggdrasil.nonEmail') }}</span><ToggleSwitch v-model="config.nonEmailLogin" /></label>
      <label class="visibility-row"><span>{{ t('adminYggdrasil.username') }}</span><ToggleSwitch v-model="config.usernameCheck" /></label>
    </div>
    <div v-if="config" class="form-actions"><Button type="submit" :loading="operation.pending.value"><Save :size="17" />{{ t('common.save') }}</Button></div>
  </form>
</template>
