<script setup lang="ts">
import { Copy, Link2, RefreshCw, ShieldCheck, Unlink } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import type { z } from 'zod';
import {
  bindUnionProfile,
  createBindToken,
  loadUnionDirectory,
  loadUnionProfiles,
  loadUnionSecurity,
  remapUnionProfile,
  type unionProfileSchema,
  unbindUnionProfile,
} from '../api/union';
import PageHeading from '../components/PageHeading.vue';
import { useOperation } from '../composables/operation';
import { t } from '../i18n';

type UnionProfile = z.infer<typeof unionProfileSchema>;
type ProfileDraft = { token: string; targetMinecraftUuid: string };

const operation = useOperation();
const profiles = ref<UnionProfile[]>([]);
const servers = ref<ReadonlyArray<Record<string, unknown>>>([]);
const securityLevel = ref<string>('');
const drafts = reactive<Record<string, ProfileDraft>>({});

const hasProfiles = computed(() => profiles.value.length > 0);

function textField(item: Record<string, unknown>, ...names: readonly string[]): string {
  for (const name of names) {
    const value = item[name];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return '';
}

function draftFor(playerId: string): ProfileDraft {
  const existing = drafts[playerId];
  if (existing) return existing;
  const created = reactive<ProfileDraft>({ token: '', targetMinecraftUuid: '' });
  drafts[playerId] = created;
  return created;
}

async function load(): Promise<void> {
  await operation.run(async () => {
    const [profileResult, directoryResult, securityResult] = await Promise.all([
      loadUnionProfiles(),
      loadUnionDirectory(),
      loadUnionSecurity(),
    ]);
    profiles.value = profileResult.profiles;
    servers.value = directoryResult.servers;
    securityLevel.value = String(securityResult.level);
  });
}

async function generateToken(profile: UnionProfile): Promise<void> {
  await operation.run(async () => {
    draftFor(profile.playerId).token = (await createBindToken(profile.playerId)).token;
  }, t('union.tokenCreated'));
}

async function bind(profile: UnionProfile): Promise<void> {
  const draft = draftFor(profile.playerId);
  await operation.run(async () => {
    await bindUnionProfile(profile.playerId, draft.token);
    draft.token = '';
    await load();
  }, t('union.bound'));
}

async function unbind(profile: UnionProfile): Promise<void> {
  await operation.run(async () => {
    await unbindUnionProfile(profile.playerId);
    await load();
  }, t('union.unbound'));
}

async function remap(profile: UnionProfile): Promise<void> {
  const draft = draftFor(profile.playerId);
  await operation.run(async () => {
    await remapUnionProfile(profile.playerId, draft.targetMinecraftUuid);
    draft.targetMinecraftUuid = '';
    await load();
  }, t('union.remapped'));
}

async function copyToken(token: string): Promise<void> {
  await navigator.clipboard.writeText(token);
}

onMounted(load);
</script>

<template>
  <PageHeading :eyebrow="t('union.eyebrow')" :title="t('union.title')" :description="t('union.description')">
    <Button outlined :loading="operation.pending.value" @click="load"><RefreshCw :size="17" />{{ t('common.reload') }}</Button>
  </PageHeading>
  <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  <section class="panel union-status-strip">
    <div><ShieldCheck :size="20" /><span>{{ t('union.securityLevel') }}</span><strong>{{ securityLevel || t('common.unknown') }}</strong></div>
    <span class="muted">{{ t('union.securityHint') }}</span>
  </section>
  <section class="form-stack">
    <div class="section-heading"><div><h2>{{ t('union.profiles') }}</h2><p class="muted">{{ t('union.profilesHint') }}</p></div></div>
    <div v-if="hasProfiles" class="form-stack">
      <article v-for="profile in profiles" :key="profile.playerId" class="panel form-stack">
        <div class="section-heading">
          <div><h3>{{ profile.name }}</h3><p class="mono muted">{{ profile.minecraftUuid }}</p></div>
          <Tag :value="profile.detail ? t('union.connected') : t('union.notConnected')" :severity="profile.detail ? 'success' : 'secondary'" />
        </div>
        <Message v-if="profile.conflicts.length" severity="warn">{{ t('union.conflicts', { count: profile.conflicts.length }) }}</Message>
        <div class="form-grid">
          <label class="field span-2">{{ t('union.bindToken') }}
            <div class="inline-actions"><InputText v-model="draftFor(profile.playerId).token" autocomplete="off" maxlength="512" />
              <Button type="button" outlined :aria-label="t('common.copy')" :disabled="!draftFor(profile.playerId).token" @click="copyToken(draftFor(profile.playerId).token)"><Copy :size="17" /></Button>
            </div>
          </label>
          <div class="inline-actions span-2">
            <Button outlined @click="generateToken(profile)"><Link2 :size="17" />{{ t('union.createToken') }}</Button>
            <Button :disabled="!draftFor(profile.playerId).token" @click="bind(profile)">{{ t('union.bind') }}</Button>
            <Button outlined severity="danger" @click="unbind(profile)"><Unlink :size="17" />{{ t('union.unbind') }}</Button>
          </div>
          <label class="field span-2">{{ t('union.targetUuid') }}
            <InputText v-model="draftFor(profile.playerId).targetMinecraftUuid" maxlength="36" :placeholder="t('union.targetUuidHint')" />
          </label>
          <div class="form-actions span-2"><Button outlined :disabled="!draftFor(profile.playerId).targetMinecraftUuid" @click="remap(profile)">{{ t('union.remap') }}</Button></div>
        </div>
      </article>
    </div>
    <section v-else class="panel empty-state"><h3>{{ t('union.noProfiles') }}</h3><p class="muted">{{ t('union.noProfilesHint') }}</p></section>
  </section>
  <section class="form-stack union-directory">
    <div class="section-heading"><div><h2>{{ t('union.directory') }}</h2><p class="muted">{{ t('union.directoryHint') }}</p></div></div>
    <div v-if="servers.length" class="collection-grid">
      <article v-for="(server, index) in servers" :key="textField(server, 'code') || index" class="panel">
        <h3>{{ textField(server, 'name', 'title', 'code') || t('union.unnamedServer') }}</h3>
        <p class="muted">{{ textField(server, 'code') }}</p>
        <a v-if="textField(server, 'bs_root', 'url')" class="text-link" :href="textField(server, 'bs_root', 'url')" target="_blank" rel="noreferrer">{{ textField(server, 'bs_root', 'url') }}</a>
      </article>
    </div>
    <section v-else class="panel empty-state"><p class="muted">{{ t('union.noServers') }}</p></section>
  </section>
</template>
