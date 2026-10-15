<script setup lang="ts">
import { RefreshCw, ShieldCheck } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import type { z } from 'zod';
import { loadUnionDirectory, loadUnionProfiles, loadUnionSecurity, type unionDirectorySchema, type unionProfileSchema } from '../api/union';
import PageHeading from '../components/PageHeading.vue';
import UnionProfileCard from '../components/UnionProfileCard.vue';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

const operation = useOperation();
const profiles = ref<z.infer<typeof unionProfileSchema>[]>([]);
const servers = ref<z.infer<typeof unionDirectorySchema>['servers']>([]);
const securityLevel = ref<string | null>(null);
const loaded = ref(false);
const partialLoad = ref(false);
const securityLabel = computed(() => securityLevel.value === null ? t('common.unknown') : `SL${securityLevel.value.replace(/^SL/i, '')}`);
const levels = [
  { code: 'SL3', severity: 'success', label: t('union.securitySl3') },
  { code: 'SL1', severity: 'warn', label: t('union.securitySl1') },
  { code: 'SL0', severity: 'danger', label: t('union.securitySl0') },
] as const;
const securitySeverity = computed(() => levels.find(level => level.code === securityLabel.value)?.severity ?? 'secondary');

function stationText(server: Record<string, unknown>, key: string): string {
  const value = server[key];
  return typeof value === 'string' ? value : '';
}

function stationUrl(server: Record<string, unknown>): string {
  const url = URL.parse(stationText(server, 'bs_root'));
  return url?.protocol === 'https:' || url?.protocol === 'http:' ? url.href : '';
}

async function load(): Promise<void> {
  await operation.run(async () => {
    const [profileResult, directoryResult, securityResult] = await Promise.allSettled([
      loadUnionProfiles(), loadUnionDirectory(), loadUnionSecurity(),
    ]);
    if (profileResult.status === 'rejected') throw profileResult.reason;
    profiles.value = profileResult.value.profiles;
    servers.value = directoryResult.status === 'fulfilled' ? directoryResult.value.servers : [];
    securityLevel.value = securityResult.status === 'fulfilled' ? String(securityResult.value.level) : null;
    partialLoad.value = directoryResult.status === 'rejected' || securityResult.status === 'rejected';
    loaded.value = true;
  });
}

onMounted(load);
</script>

<template>
  <PageHeading :eyebrow="t('union.eyebrow')" :title="t('union.title')" :description="t('union.description')">
    <Button outlined :loading="operation.pending.value" :disabled="operation.pending.value" @click="load"><RefreshCw :size="17" />{{ t('common.reload') }}</Button>
  </PageHeading>
  <div class="form-stack">
    <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
    <div class="union-intro-grid">
      <section class="panel form-stack union-guide">
        <h2>{{ t('union.guideTitle') }}</h2>
        <p>{{ t('union.guideNames') }}</p><p>{{ t('union.guideBinding') }}</p>
        <p class="muted">{{ t('union.guideRules') }}</p>
      </section>
      <aside class="panel form-stack union-notice">
        <h2>{{ t('union.noticeTitle') }}</h2>
        <p>{{ t('union.noticeOwnership') }}</p><p>{{ t('union.noticeUuid') }}</p>
        <p class="muted small">{{ t('union.noticeRemap') }}</p>
      </aside>
    </div>
    <section class="panel union-security">
      <div class="union-security-current"><ShieldCheck :size="24" /><div><h2>{{ t('union.securityLevel') }}</h2><p class="muted small">{{ t('union.securityHint') }}</p></div><Tag :value="securityLabel" :severity="securitySeverity" /></div>
      <ul class="union-security-legend"><li v-for="level in levels" :key="level.code"><Tag :value="level.code" :severity="level.severity" /><span>{{ level.label }}</span></li></ul>
    </section>
    <Message v-if="partialLoad" severity="warn">{{ t('union.partialLoad') }}</Message>
    <section class="form-stack" :aria-busy="operation.pending.value">
      <div class="section-heading"><div><h2>{{ t('union.profiles') }}</h2><p class="muted">{{ t('union.profilesHint') }}</p></div></div>
      <p v-if="!loaded && operation.pending.value" role="status" class="muted">{{ t('union.loading') }}</p>
      <UnionProfileCard v-for="profile in profiles" :key="profile.playerId" :profile="profile" :servers="servers" @changed="load" />
      <section v-if="loaded && !profiles.length" class="panel empty-state"><h3>{{ t('union.noProfiles') }}</h3><p class="muted">{{ t('union.noProfilesHint') }}</p></section>
    </section>
    <section class="form-stack">
      <div class="section-heading"><div><h2>{{ t('union.directory') }}</h2><p class="muted">{{ t('union.directoryHint') }}</p></div></div>
      <div v-if="servers.length" class="collection-grid">
        <article v-for="(server, index) in servers" :key="stationText(server, 'code') || index" class="panel union-directory-card">
          <Tag :value="stationText(server, 'code') || t('common.unknown')" severity="secondary" />
          <div><h3>{{ stationText(server, 'name') || stationText(server, 'code') || t('union.unnamedServer') }}</h3>
            <a v-if="stationUrl(server)" class="text-link" :href="stationUrl(server)" target="_blank" rel="noreferrer">{{ stationText(server, 'bs_root') }}</a>
          </div>
        </article>
      </div>
      <section v-else-if="loaded" class="panel empty-state"><p class="muted">{{ t('union.noServers') }}</p></section>
    </section>
  </div>
</template>
