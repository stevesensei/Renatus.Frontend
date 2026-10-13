<script setup lang="ts">
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
 await operation.run(async()=>{await api('admin/users/'+user.id,userSchema,{method:'patch',json:{nickName:user.nickname,email:user.email,preferredLanguage:user.language,role:{Admin:1,Player:0}[user.role],maxPlayerCount:user.maxPlayers,isDisabled:user.disabled}});await listing.load();if(user.id===state.account.id)state.account=await api('account',accountSchema);editVisible.value=false;},'用户资料已保存');
}
async function remove():Promise<void>{
 const user=actionUser.value;if(user===null)return;
 await operation.run(async()=>{await api('admin/users/'+user.id+'?confirm=true',emptyResponse,{method:'delete'});await listing.load();},'用户已删除');
}
async function resetPassword():Promise<void>{
 const user=actionUser.value;if(user===null)return;
 await operation.run(async()=>{if(!isSecureContext)throw new ApiError('请使用 HTTPS 安全重置密码。');await api('admin/users/'+user.id+'/password',emptyResponse,{method:'post',json:{newPassword:password.value}});password.value='';passwordVisible.value=false;},'密码已重置');
}
async function revoke(user:UserPreview):Promise<void>{await operation.run(async()=>{await api('admin/users/'+user.id+'/sessions/revoke',emptyResponse,{method:'post'});},'该用户的游戏会话已撤销');}

</script>
<template>
  <PageHeading eyebrow="管理面板" title="用户管理" description="查看账户资料，管理社区中的用户。" />
  <section class="panel">
    <div class="table-toolbar"><span class="search-field"><Search :size="17" /><InputText v-model="search" aria-label="搜索用户" placeholder="搜索用户名、昵称或邮箱" /></span><Select v-model="role" :options="['Admin', 'Player']" show-clear placeholder="全部角色" aria-label="筛选用户角色" /><Select v-model="disabled" :options="[{ label: '正常', value: false }, { label: '已禁用', value: true }]" option-label="label" option-value="value" show-clear placeholder="全部状态" aria-label="筛选用户状态" /></div>
    <DataTable :value="filtered" paginator lazy :first="listing.first.value" :rows="listing.rows.value" :total-records="listing.total.value" :loading="listing.loading.value" @page="listing.paginate" :rows-per-page-options="[5,10,20]" striped-rows>
      <Column field="username" header="用户名" sortable /><Column field="nickname" header="昵称" /><Column field="email" header="邮箱" />
      <Column header="角色"><template #body="{ data }"><Tag :value="data.role" :severity="data.role === 'Admin' ? 'help' : 'secondary'" /></template></Column>
      <Column header="状态"><template #body="{ data }"><Tag :value="data.disabled ? '已禁用' : '正常'" :severity="data.disabled ? 'danger' : 'success'" /></template></Column>
      <Column field="maxPlayers" header="角色额度" />
      <Column header="操作"><template #body="{ data }"><div class="table-actions"><Button text severity="secondary" aria-label="查看用户详情" @click="showDetail(data)"><Eye :size="16" /></Button><Button text aria-label="编辑用户" @click="edit(data)"><Pencil :size="16" /></Button><Button text severity="secondary" aria-label="重置密码" @click="actionUser = data; password = ''; passwordVisible = true"><KeyRound :size="16" /></Button><Button text severity="warn" aria-label="撤销游戏会话" @click="revoke(data)"><ShieldOff :size="16" /></Button><Button text severity="danger" aria-label="删除用户" @click="actionUser = data; deleting = true"><Trash2 :size="16" /></Button></div></template></Column>
      <template #empty>没有匹配的用户。</template>
    </DataTable>
  </section>
  <Dialog v-model:visible="editVisible" header="编辑用户" modal class="form-dialog"><form v-if="editing" id="edit-user" class="form-grid" @submit.prevent="save"><label class="field">昵称<InputText v-model="editing.nickname" required maxlength="64" /></label><label class="field">邮箱<InputText v-model="editing.email" required type="email" maxlength="256" /></label><label class="field">角色<Select v-model="editing.role" :options="['Admin','Player']" /></label><label class="field">语言<Select v-model="editing.language" :options="['zh_CN','en_US']" /></label><label class="field">角色额度<InputNumber v-model="editing.maxPlayers" :min="0" :max="100" /></label><div class="field"><label for="user-disabled">禁用账户</label><ToggleSwitch v-model="editing.disabled" input-id="user-disabled" /></div></form><template #footer><Button severity="secondary" outlined label="取消" @click="editVisible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="edit-user" label="保存用户" /></template></Dialog>
  <Dialog v-model:visible="detailVisible" header="用户详情" modal class="form-dialog"><dl v-if="detail" class="metadata"><div><dt>ID</dt><dd class="mono">{{ detail.id }}</dd></div><div><dt>用户名</dt><dd>{{ detail.username }}</dd></div><div><dt>昵称</dt><dd>{{ detail.nickname }}</dd></div><div><dt>邮箱</dt><dd>{{ detail.email }}</dd></div><div><dt>语言</dt><dd>{{ detail.language }}</dd></div><div><dt>创建日期</dt><dd>{{ detail.createdAt }}</dd></div><div><dt>角色数</dt><dd>{{ detail.players.length }} / {{ detail.maxPlayers }}</dd></div><div><dt>材质数</dt><dd>{{ detail.textures.length }}</dd></div><div><dt>角色</dt><dd>{{ detail.role === "Admin" ? "管理员" : "玩家" }}</dd></div><div><dt>状态</dt><dd>{{ detail.disabled ? "已禁用" : "正常" }}</dd></div></dl><section v-if="detail" class="form-stack"><h3>游戏会话（{{ detail.sessions.length }}）</h3><DataTable :value="detail.sessions" striped-rows><Column header="绑定角色"><template #body="{data}">{{ data.playerName || "未绑定角色" }}</template></Column><Column header="最近使用"><template #body="{data}">{{ new Date(data.lastUsedAt).toLocaleString("zh-CN") }}</template></Column><template #empty>没有游戏会话。</template></DataTable></section></Dialog>
  <Dialog v-model:visible="passwordVisible" header="重置用户密码" modal class="compact-dialog"><form id="reset-password" class="form-stack" @submit.prevent="resetPassword"><p class="muted">用户：{{ actionUser?.username }}</p><label class="field">新密码<Password v-model="password" toggle-mask :input-props="{ required: true, autocomplete: 'new-password' }" fluid /></label></form><template #footer><Button severity="secondary" outlined label="取消" @click="passwordVisible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="reset-password" label="重置密码" /></template></Dialog>
  <ConfirmAction v-model:visible="deleting" title="删除用户" description="确定删除此账户及其数据？此操作不可撤销。" @confirm="remove" />
</template>
