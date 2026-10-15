<script setup lang="ts">
import { Activity, KeyRound, RefreshCw, Save, ShieldAlert, Trash2 } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import { z } from 'zod';
import {
  createUnionBlacklistEntry,
  deleteUnionBlacklistEntry,
  diagnoseUnion,
  invalidateUnionBlacklistEntry,
  loadUnionAdminSettings,
  loadUnionAdminStatus,
  loadUnionBlacklist,
  runUnionAdminAction,
  saveUnionAdminSettings,
  unionStatusSchema,
} from '../../api/union';
import PageHeading from '../../components/PageHeading.vue';
import YggdrasilSettingsPanel from '../../components/YggdrasilSettingsPanel.vue';
import { useOperation } from '../../composables/operation';
import { t } from '../../i18n';

type UnionStatus = z.infer<typeof unionStatusSchema>;
type BlacklistRow = Record<string, unknown>;

const operation = useOperation();
const ready = ref(false);
const status = ref<UnionStatus | null>(null);
const settings = reactive({ enabled: false, apiRoot: '', memberCode: '', memberKey: '', requestTimeoutSeconds: 10, oauth2Enabled: false, oauth2ConsentPath: '/oauth/union/consent', hasMemberKey: false, hasOAuth2SigningKey: false });
const blacklist = ref<BlacklistRow[]>([]);
const query = ref('');
const page = ref(1);
const entry = reactive({ email: '', reason: '' });
const diagnosis = ref('');
const rowSchema = z.array(z.object({}).catchall(z.unknown()));

function field(row: BlacklistRow, ...names: readonly string[]): string {
  for (const name of names) {
    const value = row[name];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return '';
}

function rowId(row: BlacklistRow): number | null {
  const parsed = Number(field(row, 'id', 'blacklist_id'));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function blacklistRows(payload: BlacklistRow): BlacklistRow[] {
  const direct = rowSchema.safeParse(payload['items']);
  if (direct.success) return direct.data;
  const data = payload['data'];
  const nested = z.object({ items: rowSchema }).safeParse(data);
  if (nested.success) return nested.data.items;
  const arrayData = rowSchema.safeParse(data);
  return arrayData.success ? arrayData.data : [];
}

async function load(): Promise<void> {
  await operation.run(async () => {
    const [statusResult, settingsResult] = await Promise.all([loadUnionAdminStatus(), loadUnionAdminSettings()]);
    status.value = statusResult;
    Object.assign(settings, settingsResult, { memberKey: '' });
    ready.value = true;
    await searchBlacklist();
  });
}

async function save(): Promise<void> {
  await operation.run(async () => {
    const result = await saveUnionAdminSettings({
      enabled: settings.enabled,
      apiRoot: settings.apiRoot,
      memberCode: settings.memberCode,
      requestTimeoutSeconds: settings.requestTimeoutSeconds,
      oauth2Enabled: settings.oauth2Enabled,
      oauth2ConsentPath: settings.oauth2ConsentPath,
      ...(settings.memberKey ? { memberKey: settings.memberKey } : {}),
    });
    Object.assign(settings, result, { memberKey: '' });
    status.value = await loadUnionAdminStatus();
  }, t('adminUnion.saved'));
}

async function runAction(action: 'updatelist' | 'updateprivatekey' | 'sync'): Promise<void> {
  await operation.run(async () => {
    await runUnionAdminAction(action);
    status.value = await loadUnionAdminStatus();
  }, t('adminUnion.actionDone'));
}

async function diagnose(): Promise<void> {
  await operation.run(async () => { diagnosis.value = (await diagnoseUnion()).status; }, t('adminUnion.diagnosed'));
}

async function searchBlacklist(): Promise<void> {
  const result = await loadUnionBlacklist(query.value, page.value);
  blacklist.value = blacklistRows(result);
}

async function addBlacklist(): Promise<void> {
  await operation.run(async () => {
    await createUnionBlacklistEntry(entry.email, entry.reason);
    entry.email = '';
    entry.reason = '';
    await searchBlacklist();
  }, t('adminUnion.blacklistAdded'));
}

async function changeBlacklist(row: BlacklistRow, action: 'invalidate' | 'delete'): Promise<void> {
  const id = rowId(row);
  if (id === null) return;
  await operation.run(async () => {
    if (action === 'invalidate') await invalidateUnionBlacklistEntry(id);
    else await deleteUnionBlacklistEntry(id);
    await searchBlacklist();
  }, t('adminUnion.blacklistUpdated'));
}

onMounted(load);
</script>

<template>
  <PageHeading :eyebrow="t('adminUnion.eyebrow')" :title="t('adminUnion.title')" :description="t('adminUnion.description')" />
  <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  <YggdrasilSettingsPanel />
  <template v-if="ready">
    <div v-if="status" class="metrics-grid four union-metrics">
      <section class="panel"><span class="muted">{{ t('adminUnion.service') }}</span><strong>{{ status.enabled ? t('common.enabled') : t('common.disabled') }}</strong></section>
      <section class="panel"><span class="muted">{{ t('adminUnion.directoryVersion') }}</span><strong>{{ status.serverListVersion }}</strong></section>
      <section class="panel"><span class="muted">{{ t('adminUnion.keyVersion') }}</span><strong>{{ status.privateKeyVersion }}</strong></section>
      <section class="panel"><span class="muted">{{ t('adminUnion.syncStatus') }}</span><strong>{{ status.needsProfileSync ? t('adminUnion.pendingSync') : t('adminUnion.synced') }}</strong></section>
    </div>
    <form class="panel form-stack" @submit.prevent="save">
      <div><h2>{{ t('adminUnion.settings') }}</h2><p class="muted">{{ t('adminUnion.settingsHint') }}</p></div>
      <div class="form-grid">
        <label class="visibility-row span-2"><span>{{ t('adminUnion.enabled') }}</span><ToggleSwitch v-model="settings.enabled" /></label>
        <label class="field span-2">{{ t('adminUnion.apiRoot') }}<InputText v-model="settings.apiRoot" required maxlength="512" /></label>
        <label class="field">{{ t('adminUnion.memberCode') }}<InputText v-model="settings.memberCode" required maxlength="100" /></label>
        <label class="field">{{ t('adminUnion.timeout') }}<InputNumber v-model="settings.requestTimeoutSeconds" :min="1" :max="120" /></label>
        <label class="field span-2">{{ t('adminUnion.memberKey') }}<Password v-model="settings.memberKey" :feedback="false" toggle-mask fluid autocomplete="new-password" :placeholder="settings.hasMemberKey ? t('adminUnion.secretPreserved') : t('adminUnion.secretRequired')" /></label>
        <label class="visibility-row span-2"><span>{{ t('adminUnion.oauthEnabled') }}</span><ToggleSwitch v-model="settings.oauth2Enabled" /></label>
        <label class="field span-2">{{ t('adminUnion.consentPath') }}<InputText v-model="settings.oauth2ConsentPath" required maxlength="256" /></label>
      </div>
      <Message severity="info">{{ t('adminUnion.secretHint') }}</Message>
      <div class="form-actions"><Button type="submit" :loading="operation.pending.value"><Save :size="17" />{{ t('common.save') }}</Button></div>
    </form>
    <section class="panel form-stack">
      <div><h2>{{ t('adminUnion.operations') }}</h2><p class="muted">{{ t('adminUnion.operationsHint') }}</p></div>
      <div class="inline-actions operation-buttons"><Button outlined @click="runAction('updatelist')"><RefreshCw :size="17" />{{ t('adminUnion.refreshDirectory') }}</Button><Button outlined @click="runAction('updateprivatekey')"><KeyRound :size="17" />{{ t('adminUnion.refreshKey') }}</Button><Button outlined @click="runAction('sync')"><RefreshCw :size="17" />{{ t('adminUnion.syncProfiles') }}</Button><Button outlined @click="diagnose"><Activity :size="17" />{{ t('adminUnion.diagnose') }}</Button></div>
      <Message v-if="diagnosis" :severity="diagnosis === 'ok' ? 'success' : 'warn'">{{ t('adminUnion.diagnosis', { value1: diagnosis }) }}</Message>
      <Message v-if="status?.lastProfileSyncError" severity="warn">{{ status.lastProfileSyncError }}</Message>
    </section>
    <section class="panel form-stack">
      <div><h2>{{ t('adminUnion.blacklist') }}</h2><p class="muted">{{ t('adminUnion.blacklistHint') }}</p></div>
      <form class="form-grid" @submit.prevent="addBlacklist"><label class="field">{{ t('common.email') }}<InputText v-model="entry.email" type="email" required maxlength="256" /></label><label class="field">{{ t('adminUnion.reason') }}<InputText v-model="entry.reason" required maxlength="500" /></label><div class="form-actions span-2"><Button type="submit"><ShieldAlert :size="17" />{{ t('adminUnion.addBlacklist') }}</Button></div></form>
      <form class="filter-cluster" @submit.prevent="searchBlacklist"><InputText v-model="query" :placeholder="t('common.search')" /><Button type="submit" outlined>{{ t('common.search') }}</Button></form>
      <DataTable v-if="blacklist.length" :value="blacklist" striped-rows><Column :header="t('common.email')"><template #body="slot">{{ field(slot.data, 'email') }}</template></Column><Column :header="t('adminUnion.reason')"><template #body="slot">{{ field(slot.data, 'reason', 'comment') }}</template></Column><Column :header="t('common.status')"><template #body="slot">{{ field(slot.data, 'status', 'valid', 'invalidated') }}</template></Column><Column><template #body="slot"><div class="table-actions"><Button text :aria-label="t('adminUnion.invalidate')" @click="changeBlacklist(slot.data, 'invalidate')"><ShieldAlert :size="17" /></Button><Button text severity="danger" :aria-label="t('common.delete')" @click="changeBlacklist(slot.data, 'delete')"><Trash2 :size="17" /></Button></div></template></Column></DataTable>
      <p v-else class="muted">{{ t('adminUnion.blacklistEmpty') }}</p>
    </section>
  </template>
</template>
