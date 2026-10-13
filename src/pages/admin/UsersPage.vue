<script setup lang="ts">
import { t } from '../../i18n';
import { Eye, KeyRound, Pencil, Search, ShieldOff, Trash2 } from '@lucide/vue';
import { onMounted, ref, watch } from 'vue';
import type { z } from 'zod';
import ConfirmAction from '../../components/ConfirmAction.vue';
import PageHeading from '../../components/PageHeading.vue';
import { state } from '../../data/state';
import type { UserPreview } from '../../data/types';
import { api, ApiError, emptyResponse } from '../../api/client';
import { userSchema, userDetailSchema } from '../../api/admin';
import { accountSchema } from '../../api/schemas';
import { useAdminPage } from '../../composables/adminPage';
import { useOperation } from '../../composables/operation';
const operation=useOperation();const listing=useAdminPage('admin/users',userSchema);const filtered=listing.items;
const search=ref('');const role=ref<UserPreview['role']|null>(null);const disabled=ref<boolean|null>(null);
const editing=ref<UserPreview|null>(null);const detail=ref<z.infer<typeof userDetailSchema>|null>(null);
const editVisible=ref(false);const detailVisible=ref(false);const passwordVisible=ref(false);const password=ref('');
const actionUser=ref<UserPreview|null>(null);const deleting=ref(false);
watch([search,role,disabled],()=>listing.filter({search:search.value,...(role.value===null?{}:{role:String({Admin:1,Player:0}[role.value])}),...(disabled.value===null?{}:{isDisabled:String(disabled.value)})}));
onMounted(listing.load);
function edit(user:UserPreview):void{editing.value={...user};editVisible.value=true;}
async function showDetail(user:UserPreview):Promise<void>{await operation.run(async()=>{detail.value=await api('admin/users/'+user.id,userDetailSchema);detailVisible.value=true;});}
async function save():Promise<void>{
 const user=editing.value;if(user===null)return;
 await operation.run(async()=>{await api('admin/users/'+user.id,userSchema,{method:'patch',json:{nickName:user.nickname,email:user.email,preferredLanguage:user.language,role:{Admin:1,Player:0}[user.role],maxPlayerCount:user.maxPlayers,isDisabled:user.disabled}});await listing.load();if(user.id===state.account.id)state.account=await api('account',accountSchema);editVisible.value=false;},t('adminUsers.saved'));
}
async function remove():Promise<void>{
 const user=actionUser.value;if(user===null)return;
 await operation.run(async()=>{await api('admin/users/'+user.id+'?confirm=true',emptyResponse,{method:'delete'});await listing.load();},t('adminUsers.deleted'));
}
async function resetPassword():Promise<void>{
 const user=actionUser.value;if(user===null)return;
 await operation.run(async()=>{if(!isSecureContext)throw new ApiError(t('adminUsers.httpsRequired'));await api('admin/users/'+user.id+'/password',emptyResponse,{method:'post',json:{newPassword:password.value}});password.value='';passwordVisible.value=false;},t('adminUsers.passwordReset'));
}
async function revoke(user:UserPreview):Promise<void>{await operation.run(async()=>{await api('admin/users/'+user.id+'/sessions/revoke',emptyResponse,{method:'post'});},t('adminUsers.sessionsRevoked'));}

</script>
<template>
  <PageHeading :eyebrow="t('nav.admin')" :title="t('nav.adminUsers')" :description="t('adminUsers.description')" />
  <section class="panel">
    <div class="table-toolbar"><span class="search-field"><Search :size="17" /><InputText v-model="search" :aria-label="t('adminUsers.searchLabel')" :placeholder="t('adminUsers.searchPlaceholder')" /></span><Select v-model="role" :options="[{label:t('common.adminRole'),value:'Admin'},{label:t('common.playerRole'),value:'Player'}]" option-label="label" option-value="value" show-clear :placeholder="t('adminUsers.allRoles')" :aria-label="t('adminUsers.roleFilter')" /><Select v-model="disabled" :options="[{ label: t('common.active'), value: false }, { label: t('common.disabled'), value: true }]" option-label="label" option-value="value" show-clear :placeholder="t('adminUsers.allStates')" :aria-label="t('adminUsers.stateFilter')" /></div>
    <DataTable :value="filtered" paginator lazy :first="listing.first.value" :rows="listing.rows.value" :total-records="listing.total.value" :loading="listing.loading.value" @page="listing.paginate" :rows-per-page-options="[5,10,20]" striped-rows>
      <Column field="username" :header="t('common.username')" sortable /><Column field="nickname" :header="t('common.nickname')" /><Column field="email" :header="t('common.email')" />
      <Column :header="t('common.player')"><template #body="{ data }"><Tag :value="data.role === 'Admin' ? t('common.adminRole') : t('common.playerRole')" :severity="data.role === 'Admin' ? 'help' : 'secondary'" /></template></Column>
      <Column :header="t('common.status')"><template #body="{ data }"><Tag :value="data.disabled ? t('common.disabled') : t('common.active')" :severity="data.disabled ? 'danger' : 'success'" /></template></Column>
      <Column field="maxPlayers" :header="t('adminUsers.playerLimit')" />
      <Column :header="t('common.actions')"><template #body="{ data }"><div class="table-actions"><Button text severity="secondary" :aria-label="t('adminUsers.viewDetails')" @click="showDetail(data)"><Eye :size="16" /></Button><Button text :aria-label="t('adminUsers.edit')" @click="edit(data)"><Pencil :size="16" /></Button><Button text severity="secondary" :aria-label="t('common.resetPassword')" @click="actionUser = data; password = ''; passwordVisible = true"><KeyRound :size="16" /></Button><Button text severity="warn" :aria-label="t('adminUsers.revokeSessions')" @click="revoke(data)"><ShieldOff :size="16" /></Button><Button text severity="danger" :aria-label="t('adminUsers.delete')" @click="actionUser = data; deleting = true"><Trash2 :size="16" /></Button></div></template></Column>
      <template #empty>{{ t('adminUsers.empty') }}</template>
    </DataTable>
  </section>
  <Dialog v-model:visible="editVisible" :header="t('adminUsers.edit')" modal class="form-dialog"><form v-if="editing" id="edit-user" class="form-grid" @submit.prevent="save"><label class="field">{{ t('common.nickname') }}<InputText v-model="editing.nickname" required maxlength="64" /></label><label class="field">{{ t('common.email') }}<InputText v-model="editing.email" required type="email" maxlength="256" /></label><label class="field">{{ t('common.player') }}<Select v-model="editing.role" :options="[{label:t('common.adminRole'),value:'Admin'},{label:t('common.playerRole'),value:'Player'}]" option-label="label" option-value="value" /></label><label class="field">{{ t('common.language') }}<Select v-model="editing.language" :options="[{label:t('language.chinese'),value:'zh_CN'},{label:t('language.english'),value:'en_US'}]" option-label="label" option-value="value" /></label><label class="field">{{ t('adminUsers.playerLimit') }}<InputNumber v-model="editing.maxPlayers" :min="0" :max="100" /></label><div class="field"><label for="user-disabled">{{ t('adminUsers.disableAccount') }}</label><ToggleSwitch v-model="editing.disabled" input-id="user-disabled" /></div></form><template #footer><Button severity="secondary" outlined :label="t('common.cancel')" @click="editVisible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="edit-user" :label="t('adminUsers.save')" /></template></Dialog>
  <Dialog v-model:visible="detailVisible" :header="t('adminUsers.details')" modal class="form-dialog"><dl v-if="detail" class="metadata"><div><dt>{{ t('common.id') }}</dt><dd class="mono">{{ detail.id }}</dd></div><div><dt>{{ t('common.username') }}</dt><dd>{{ detail.username }}</dd></div><div><dt>{{ t('common.nickname') }}</dt><dd>{{ detail.nickname }}</dd></div><div><dt>{{ t('common.email') }}</dt><dd>{{ detail.email }}</dd></div><div><dt>{{ t('common.language') }}</dt><dd>{{ detail.language === 'zh_CN' ? t('language.chinese') : detail.language === 'en_US' ? t('language.english') : detail.language }}</dd></div><div><dt>{{ t('common.createdAt') }}</dt><dd>{{ detail.createdAt }}</dd></div><div><dt>{{ t('adminUsers.playerCount') }}</dt><dd>{{ t('adminUsers.playerQuota', { value1: detail.players.length, value2: detail.maxPlayers }) }}</dd></div><div><dt>{{ t('adminUsers.textureCount') }}</dt><dd>{{ detail.textures.length }}</dd></div><div><dt>{{ t('common.player') }}</dt><dd>{{ detail.role === "Admin" ? t('common.adminRole') : t('common.playerRole') }}</dd></div><div><dt>{{ t('common.status') }}</dt><dd>{{ detail.disabled ? t('common.disabled') : t('common.active') }}</dd></div></dl><section v-if="detail" class="form-stack"><h3>{{ t('adminUsers.sessionCount', { value1: detail.sessions.length }) }}</h3><DataTable :value="detail.sessions" striped-rows><Column :header="t('adminUsers.boundPlayer')"><template #body="{data}">{{ data.playerName || t('common.unassignedPlayer') }}</template></Column><Column :header="t('common.lastUsed')"><template #body="{data}">{{ new Date(data.lastUsedAt).toLocaleString("zh-CN") }}</template></Column><template #empty>{{ t('adminUsers.emptySessions') }}</template></DataTable></section></Dialog>
  <Dialog v-model:visible="passwordVisible" :header="t('adminUsers.resetPassword')" modal class="compact-dialog"><form id="reset-password" class="form-stack" @submit.prevent="resetPassword"><p class="muted">{{ t('adminUsers.selectedUser', { value1: actionUser?.username ?? '' }) }}</p><label class="field">{{ t('common.newPassword') }}<Password v-model="password" toggle-mask :input-props="{ required: true, autocomplete: 'new-password' }" fluid /></label></form><template #footer><Button severity="secondary" outlined :label="t('common.cancel')" @click="passwordVisible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="reset-password" :label="t('common.resetPassword')" /></template></Dialog>
  <ConfirmAction v-model:visible="deleting" :title="t('adminUsers.delete')" :description="t('adminUsers.deleteConfirmation')" @confirm="remove" />
</template>
