<script setup lang="ts">
import { Copy, KeyRound, Pencil, Plus, Save, Trash2, X } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import type { z } from 'zod';
import {
  connectClientSchema,
  connectConfigSchema,
  createConnectClient,
  deleteConnectClient,
  loadConnectClients,
  loadConnectConfig,
  rotateConnectClientSecret,
  saveConnectConfig,
  updateConnectClient,
} from '../../api/connect';
import PageHeading from '../../components/PageHeading.vue';
import { useOperation } from '../../composables/operation';
import { t } from '../../i18n';

type ConnectClient = z.infer<typeof connectClientSchema>;

const operation = useOperation();
const ready = ref(false);
const config = reactive<z.infer<typeof connectConfigSchema>>({ enabled: false, issuer: '', sharedClientId: '', sharedClientRedirectUris: [], allowImplicitFlow: false, hasSigningKey: false, hasEncryptionKey: false, accessTokenTtlSeconds: 900, refreshTokenTtlSeconds: 2592000, authorizationCodeTtlSeconds: 300, deviceCodeTtlSeconds: 600, requiresRestart: false, status: 'disabled' });
const sharedRedirectUris = ref('');
const keyReplacement = reactive({ signing: false, encryption: false });
const clients = ref<ConnectClient[]>([]);
const clientDialog = ref(false);
const editingClientId = ref<string | null>(null);
const clientDraft = reactive({ clientId: '', displayName: '', redirectUris: '', confidential: false, allowImplicitFlow: false });
const issuedSecret = ref('');
const issuedClientId = ref('');

function redirectUris(): string[] {
  return clientDraft.redirectUris.split(/\r?\n/).map((value) => value.trim()).filter((value) => value.length > 0);
}

async function load(): Promise<void> {
  await operation.run(async () => {
    const [configResult, clientResult] = await Promise.all([loadConnectConfig(), loadConnectClients()]);
    Object.assign(config, configResult);
    sharedRedirectUris.value = configResult.sharedClientRedirectUris.join('\n');
    clients.value = clientResult;
    ready.value = true;
  });
}

async function saveConfig(): Promise<void> {
  await operation.run(async () => {
    Object.assign(config, await saveConnectConfig({
      enabled: config.enabled,
      issuer: config.issuer,
      sharedClientId: config.sharedClientId,
      sharedClientRedirectUris: sharedRedirectUris.value.split(/\r?\n/).map((value) => value.trim()).filter((value) => value.length > 0),
      allowImplicitFlow: config.allowImplicitFlow,
      replaceSigningKey: keyReplacement.signing,
      replaceEncryptionKey: keyReplacement.encryption,
      accessTokenTtlSeconds: config.accessTokenTtlSeconds,
      refreshTokenTtlSeconds: config.refreshTokenTtlSeconds,
      authorizationCodeTtlSeconds: config.authorizationCodeTtlSeconds,
      deviceCodeTtlSeconds: config.deviceCodeTtlSeconds,
    }));
    keyReplacement.signing = false;
    keyReplacement.encryption = false;
  }, t('adminConnect.saved'));
}

function openCreate(): void {
  editingClientId.value = null;
  Object.assign(clientDraft, { clientId: '', displayName: '', redirectUris: '', confidential: false, allowImplicitFlow: false });
  clientDialog.value = true;
}

function openEdit(client: ConnectClient): void {
  editingClientId.value = client.clientId;
  Object.assign(clientDraft, { ...client, redirectUris: client.redirectUris.join('\n') });
  clientDialog.value = true;
}

async function saveClient(): Promise<void> {
  await operation.run(async () => {
    if (editingClientId.value) {
      await updateConnectClient(editingClientId.value, { displayName: clientDraft.displayName, redirectUris: redirectUris(), confidential: clientDraft.confidential, allowImplicitFlow: clientDraft.allowImplicitFlow });
    } else {
      const result = await createConnectClient({ clientId: clientDraft.clientId, displayName: clientDraft.displayName, redirectUris: redirectUris(), confidential: clientDraft.confidential, allowImplicitFlow: clientDraft.allowImplicitFlow });
      if (result.clientSecret) showSecret(result.clientId, result.clientSecret);
    }
    clients.value = await loadConnectClients();
    clientDialog.value = false;
  }, t('adminConnect.clientSaved'));
}

/** Keeps a newly issued client secret only in volatile page state so it is shown exactly once. */
function showSecret(clientId: string, secret: string): void {
  issuedClientId.value = clientId;
  issuedSecret.value = secret;
}

async function rotateSecret(client: ConnectClient): Promise<void> {
  await operation.run(async () => {
    const result = await rotateConnectClientSecret(client.clientId);
    if (result.clientSecret) showSecret(result.clientId, result.clientSecret);
  }, t('adminConnect.secretRotated'));
}

async function copySecret(): Promise<void> {
  await navigator.clipboard.writeText(issuedSecret.value);
}

async function removeClient(client: ConnectClient): Promise<void> {
  await operation.run(async () => {
    await deleteConnectClient(client.clientId);
    clients.value = await loadConnectClients();
  }, t('adminConnect.clientDeleted'));
}

onMounted(load);
</script>

<template>
  <PageHeading :eyebrow="t('adminConnect.eyebrow')" :title="t('adminConnect.title')" :description="t('adminConnect.description')" />
  <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}</Message>
  <template v-if="ready">
    <Message v-if="config.requiresRestart" severity="warn">{{ t('adminConnect.restartRequired') }}</Message>
    <form class="panel form-stack" @submit.prevent="saveConfig">
      <div class="section-heading"><div><h2>{{ t('adminConnect.settings') }}</h2><p class="muted">{{ t('adminConnect.settingsHint') }}</p></div><Tag :value="config.status" :severity="config.enabled ? 'success' : 'secondary'" /></div>
      <div class="form-grid">
        <label class="visibility-row span-2"><span>{{ t('adminConnect.enabled') }}</span><ToggleSwitch v-model="config.enabled" /></label>
        <label class="field span-2">{{ t('adminConnect.issuer') }}<InputText v-model="config.issuer" required maxlength="512" /></label>
        <label class="field">{{ t('adminConnect.sharedClientId') }}<InputText v-model="config.sharedClientId" required maxlength="200" /></label>
        <label class="visibility-row"><span>{{ t('adminConnect.implicit') }}</span><ToggleSwitch v-model="config.allowImplicitFlow" /></label>
        <label class="field span-2">{{ t('adminConnect.sharedRedirectUris') }}<Textarea v-model="sharedRedirectUris" rows="3" :placeholder="t('adminConnect.redirectUrisHint')" /></label>
        <label class="field">{{ t('adminConnect.accessTtl') }}<InputNumber v-model="config.accessTokenTtlSeconds" :min="60" /></label>
        <label class="field">{{ t('adminConnect.refreshTtl') }}<InputNumber v-model="config.refreshTokenTtlSeconds" :min="60" /></label>
        <label class="field">{{ t('adminConnect.codeTtl') }}<InputNumber v-model="config.authorizationCodeTtlSeconds" :min="60" /></label>
        <label class="field">{{ t('adminConnect.deviceTtl') }}<InputNumber v-model="config.deviceCodeTtlSeconds" :min="60" /></label>
      </div>
      <div class="key-status"><Tag :value="config.hasSigningKey ? t('adminConnect.signingReady') : t('adminConnect.signingMissing')" :severity="config.hasSigningKey ? 'success' : 'warn'" /><Tag :value="config.hasEncryptionKey ? t('adminConnect.encryptionReady') : t('adminConnect.encryptionMissing')" :severity="config.hasEncryptionKey ? 'success' : 'warn'" /></div>
<p class="muted small">{{ t('adminConnect.keyHint') }}</p><div class="form-grid"><label class="visibility-row"><span>{{ t('adminConnect.replaceSigning') }}</span><ToggleSwitch v-model="keyReplacement.signing" /></label><label class="visibility-row"><span>{{ t('adminConnect.replaceEncryption') }}</span><ToggleSwitch v-model="keyReplacement.encryption" /></label></div><Message v-if="keyReplacement.signing || keyReplacement.encryption" severity="warn">{{ t('adminConnect.replaceHint') }}</Message>
      <div class="form-actions"><Button type="submit" :loading="operation.pending.value"><Save :size="17" />{{ t('common.save') }}</Button></div>
    </form>
    <section class="panel form-stack">
      <div class="section-heading"><div><h2>{{ t('adminConnect.clients') }}</h2><p class="muted">{{ t('adminConnect.clientsHint') }}</p></div><Button @click="openCreate"><Plus :size="17" />{{ t('adminConnect.addClient') }}</Button></div>
      <DataTable v-if="clients.length" :value="clients" striped-rows><Column field="displayName" :header="t('adminConnect.displayName')" /><Column field="clientId" :header="t('adminConnect.clientId')" /><Column :header="t('adminConnect.clientType')"><template #body="slot"><Tag :value="slot.data.confidential ? t('adminConnect.confidential') : t('adminConnect.public')" severity="secondary" /></template></Column><Column><template #body="slot"><div class="table-actions"><Button text :aria-label="t('common.edit')" @click="openEdit(slot.data)"><Pencil :size="17" /></Button><Button text :aria-label="t('adminConnect.rotateSecret')" :disabled="!slot.data.confidential" @click="rotateSecret(slot.data)"><KeyRound :size="17" /></Button><Button text severity="danger" :aria-label="t('common.delete')" @click="removeClient(slot.data)"><Trash2 :size="17" /></Button></div></template></Column></DataTable>
      <p v-else class="muted">{{ t('adminConnect.noClients') }}</p>
    </section>
  </template>
  <Dialog v-model:visible="clientDialog" modal :header="editingClientId ? t('adminConnect.editClient') : t('adminConnect.addClient')" class="form-dialog">
    <form id="connect-client-form" class="form-stack" @submit.prevent="saveClient">
      <label class="field">{{ t('adminConnect.clientId') }}<InputText v-model="clientDraft.clientId" required maxlength="200" :disabled="Boolean(editingClientId)" /></label>
      <label class="field">{{ t('adminConnect.displayName') }}<InputText v-model="clientDraft.displayName" required maxlength="200" /></label>
      <label class="field">{{ t('adminConnect.redirectUris') }}<Textarea v-model="clientDraft.redirectUris" required rows="5" :placeholder="t('adminConnect.redirectUrisHint')" /></label>
      <label class="visibility-row"><span>{{ t('adminConnect.confidential') }}</span><ToggleSwitch v-model="clientDraft.confidential" /></label>
      <label class="visibility-row"><span>{{ t('adminConnect.clientImplicit') }}</span><ToggleSwitch v-model="clientDraft.allowImplicitFlow" /></label>
    </form>
    <template #footer><Button outlined severity="secondary" @click="clientDialog = false">{{ t('common.cancel') }}</Button><Button type="submit" form="connect-client-form" :loading="operation.pending.value">{{ t('common.save') }}</Button></template>
  </Dialog>
  <Dialog :visible="Boolean(issuedSecret)" modal :header="t('adminConnect.secretTitle')" :closable="false" class="form-dialog">
    <div class="form-stack"><Message severity="warn">{{ t('adminConnect.secretOnce') }}</Message><label class="field">{{ issuedClientId }}<Password :model-value="issuedSecret" :feedback="false" toggle-mask readonly fluid /></label><Button outlined @click="copySecret"><Copy :size="17" />{{ t('common.copy') }}</Button></div>
    <template #footer><Button @click="issuedSecret = ''; issuedClientId = ''"><X :size="17" />{{ t('common.done') }}</Button></template>
  </Dialog>
</template>
