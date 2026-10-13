<script setup lang="ts">
import { Pencil, Search, Trash2 } from '@lucide/vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ConfirmAction from '../../components/ConfirmAction.vue';
import PageHeading from '../../components/PageHeading.vue';
import type { PlayerPreview } from '../../data/types';
import { api, emptyResponse } from '../../api/client';
import { playerSchema } from '../../api/players';
import { useAdminPage } from '../../composables/adminPage';
import { useOperation } from '../../composables/operation';
const route=useRoute();const operation=useOperation();
const listing=useAdminPage('admin/players',playerSchema);const filtered=listing.items;
const search=ref('');const owner=ref(typeof route.query['ownerId']==='string'?route.query['ownerId']:'');
const editing=ref<PlayerPreview|null>(null);const visible=ref(false);const deleting=ref(false);const deleteId=ref('');
const error=operation.error;
watch([search,owner],()=>listing.filter({search:search.value,...(owner.value.trim()?{ownerId:owner.value.trim()}:{})}));
onMounted(()=>{listing.filter({...(owner.value?{ownerId:owner.value}:{})});});
async function edit(player:PlayerPreview):Promise<void>{await operation.run(async()=>{editing.value=await api('admin/players/'+player.id,playerSchema);visible.value=true;});}
async function save():Promise<void>{
 const player=editing.value;if(player===null)return;
 await operation.run(async()=>{await api('admin/players/'+player.id,playerSchema,{method:'patch',json:{name:player.name,skinModel:{default:0,slim:1}[player.model],userId:player.owner,skinTextureId:player.skinId||null,capeTextureId:player.capeId||null,clearSkinTexture:!player.skinId,clearCapeTexture:!player.capeId}});visible.value=false;await listing.load();},'角色资料已保存');
}
async function remove():Promise<void>{await operation.run(async()=>{await api('admin/players/'+deleteId.value,emptyResponse,{method:'delete'});await listing.load();},'角色已删除');}

</script>
<template>
  <PageHeading eyebrow="管理面板" title="角色管理" description="查看角色归属，调整名称、模型和材质绑定。" />
  <section class="panel"><div class="table-toolbar"><span class="search-field"><Search :size="17" /><InputText v-model="search" aria-label="搜索角色" placeholder="搜索角色名称" /></span><InputText v-model="owner" placeholder="所属用户 ID" aria-label="筛选角色归属" /></div>
    <DataTable :value="filtered" paginator lazy :first="listing.first.value" :rows="listing.rows.value" :total-records="listing.total.value" :loading="listing.loading.value" @page="listing.paginate" striped-rows><Column field="name" header="角色名称" sortable /><Column field="ownerName" header="所属用户" /><Column header="模型"><template #body="{data}">{{ data.model === 'slim' ? '细手臂' : '默认模型' }}</template></Column><Column header="皮肤"><template #body="{data}">{{ data.skinId ?? '未绑定' }}</template></Column><Column header="披风"><template #body="{data}">{{ data.capeId ?? '未绑定' }}</template></Column><Column field="createdAt" header="创建日期" /><Column header="操作"><template #body="{data}"><div class="table-actions"><Button text aria-label="编辑角色" @click="edit(data)"><Pencil :size="16" /></Button><Button text severity="danger" aria-label="删除角色" @click="deleteId = data.id; deleting = true"><Trash2 :size="16" /></Button></div></template></Column><template #empty>没有匹配的角色。</template></DataTable>
  </section>
  <Dialog v-model:visible="visible" header="编辑角色" modal class="form-dialog"><form v-if="editing" id="admin-player" class="form-grid" @submit.prevent="save"><label class="field">角色名<InputText v-model="editing.name" required maxlength="16" /></label><label class="field">所属用户<InputText v-model="editing.owner" required placeholder="所属用户 GUID" /></label><label class="field span-2">皮肤模型<Select v-model="editing.model" :options="[{label:'默认模型',value:'default'},{label:'细手臂',value:'slim'}]" option-label="label" option-value="value" /></label><label class="field">皮肤绑定<InputText v-model="editing.skinId" placeholder="皮肤 GUID，留空清除" /></label><label class="field">披风绑定<InputText v-model="editing.capeId" placeholder="披风 GUID，留空清除" /></label><p class="muted small span-2">清除选择将移除对应的材质绑定。</p><Message v-if="error" class="span-2" severity="error">{{ error }}</Message></form><template #footer><Button outlined severity="secondary" label="取消" @click="visible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="admin-player" label="保存角色" /></template></Dialog>
  <ConfirmAction v-model:visible="deleting" title="删除角色" description="确定删除此角色？此操作不可撤销。" @confirm="remove" />
</template>
