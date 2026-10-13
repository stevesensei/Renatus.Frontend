<script setup lang="ts">
import { t } from '../../i18n';
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
 await operation.run(async()=>{await api('admin/players/'+player.id,playerSchema,{method:'patch',json:{name:player.name,skinModel:{default:0,slim:1}[player.model],userId:player.owner,skinTextureId:player.skinId||null,capeTextureId:player.capeId||null,clearSkinTexture:!player.skinId,clearCapeTexture:!player.capeId}});visible.value=false;await listing.load();},t('adminPlayers.saved'));
}
async function remove():Promise<void>{await operation.run(async()=>{await api('admin/players/'+deleteId.value,emptyResponse,{method:'delete'});await listing.load();},t('players.deleted'));}

</script>
<template>
  <PageHeading :eyebrow="t('nav.admin')" :title="t('nav.adminPlayers')" :description="t('adminPlayers.description')" />
  <section class="panel"><div class="table-toolbar"><span class="search-field"><Search :size="17" /><InputText v-model="search" :aria-label="t('adminPlayers.searchLabel')" :placeholder="t('adminPlayers.searchPlaceholder')" /></span><InputText v-model="owner" :placeholder="t('adminPlayers.ownerId')" :aria-label="t('adminPlayers.ownerFilter')" /></div>
    <DataTable :value="filtered" paginator lazy :first="listing.first.value" :rows="listing.rows.value" :total-records="listing.total.value" :loading="listing.loading.value" @page="listing.paginate" striped-rows><Column field="name" :header="t('common.playerName')" sortable /><Column field="ownerName" :header="t('adminPlayers.owner')" /><Column :header="t('common.model')"><template #body="{data}">{{ data.model === 'slim' ? t('common.slimModel') : t('common.defaultModel') }}</template></Column><Column :header="t('common.skin')"><template #body="{data}">{{ data.skinId ?? t('common.unbound') }}</template></Column><Column :header="t('common.cape')"><template #body="{data}">{{ data.capeId ?? t('common.unbound') }}</template></Column><Column field="createdAt" :header="t('common.createdAt')" /><Column :header="t('common.actions')"><template #body="{data}"><div class="table-actions"><Button text :aria-label="t('adminPlayers.edit')" @click="edit(data)"><Pencil :size="16" /></Button><Button text severity="danger" :aria-label="t('players.delete')" @click="deleteId = data.id; deleting = true"><Trash2 :size="16" /></Button></div></template></Column><template #empty>{{ t('adminPlayers.empty') }}</template></DataTable>
  </section>
  <Dialog v-model:visible="visible" :header="t('adminPlayers.edit')" modal class="form-dialog"><form v-if="editing" id="admin-player" class="form-grid" @submit.prevent="save"><label class="field">{{ t('adminPlayers.name') }}<InputText v-model="editing.name" required maxlength="16" /></label><label class="field">{{ t('adminPlayers.owner') }}<InputText v-model="editing.owner" required :placeholder="t('adminPlayers.ownerPlaceholder')" /></label><label class="field span-2">{{ t('common.skinModel') }}<Select v-model="editing.model" :options="[{label:t('common.defaultModel'),value:'default'},{label:t('common.slimModel'),value:'slim'}]" option-label="label" option-value="value" /></label><label class="field">{{ t('adminPlayers.skinBinding') }}<InputText v-model="editing.skinId" :placeholder="t('adminPlayers.skinPlaceholder')" /></label><label class="field">{{ t('adminPlayers.capeBinding') }}<InputText v-model="editing.capeId" :placeholder="t('adminPlayers.capePlaceholder')" /></label><p class="muted small span-2">{{ t('adminPlayers.clearHint') }}</p><Message v-if="error" class="span-2" severity="error">{{ error }}</Message></form><template #footer><Button outlined severity="secondary" :label="t('common.cancel')" @click="visible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="admin-player" :label="t('adminPlayers.save')" /></template></Dialog>
  <ConfirmAction v-model:visible="deleting" :title="t('players.delete')" :description="t('adminPlayers.deleteConfirmation')" @confirm="remove" />
</template>
