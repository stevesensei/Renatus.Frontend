<script setup lang="ts">
import { t } from '../../i18n';
import { ArrowUpRight, Pencil, Trash2 } from '@lucide/vue';
import { onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import ConfirmAction from '../../components/ConfirmAction.vue';
import MarkdownContent from '../../components/MarkdownContent.vue';
import PageHeading from '../../components/PageHeading.vue';
import type { TexturePreview, TextureKind } from '../../data/types';
import { api, emptyResponse } from '../../api/client';
import { textureSchema } from '../../api/textures';
import { useAdminPage } from '../../composables/adminPage';
import { useOperation } from '../../composables/operation';
const route=useRoute();const operation=useOperation();
const listing=useAdminPage('admin/textures',textureSchema);const filtered=listing.items;
const sha256=ref('');const kind=ref<TextureKind|null>(null);const visibility=ref<boolean|null>(null);
const author=ref(typeof route.query['uploaderId']==='string'?route.query['uploaderId']:'');const source=ref<TexturePreview['source']|null>(null);
const editing=ref<TexturePreview|null>(null);const visible=ref(false);const deleting=ref(false);const deleteId=ref('');const markdownPreview=ref(false);
function filters():void{listing.filter({...(sha256.value?{sha256:sha256.value}:{}),...(kind.value===null?{}:{type:String({skin:0,cape:1}[kind.value])}),...(visibility.value===null?{}:{isPublic:String(visibility.value)}),...(author.value.trim()?{uploaderId:author.value.trim()}:{}),...(source.value===null?{}:{source:String({original:0,repost:1}[source.value])})});}
watch([sha256,kind,visibility,author,source],filters);onMounted(filters);
async function edit(texture:TexturePreview):Promise<void>{await operation.run(async()=>{editing.value=await api('admin/textures/'+texture.id,textureSchema);visible.value=true;});}
async function save():Promise<void>{
 const texture=editing.value;if(texture===null)return;
 await operation.run(async()=>{await api('admin/textures/'+texture.id,textureSchema,{method:'patch',json:{name:texture.name,descriptionMarkdown:texture.description,isPublic:texture.isPublic,source:{original:0,repost:1}[texture.source],skinModel:{default:0,slim:1}[texture.model]}});visible.value=false;await listing.load();},t('adminTextures.saved'));
}
async function remove():Promise<void>{await operation.run(async()=>{await api('admin/textures/'+deleteId.value,emptyResponse,{method:'delete'});await listing.load();},t('adminTextures.deleted'));}

</script>
<template>
  <PageHeading :eyebrow="t('nav.admin')" :title="t('nav.adminTextures')" :description="t('adminTextures.description')" />
  <section class="panel"><div class="table-toolbar"><InputText v-model="sha256" :aria-label="t('adminTextures.hashFilter')" :placeholder="t('adminTextures.hashPlaceholder')" /><Select v-model="kind" :options="[{label:t('common.skin'),value:'skin'},{label:t('common.cape'),value:'cape'}]" option-label="label" option-value="value" show-clear :placeholder="t('common.allTypes')" :aria-label="t('common.textureType')" /><Select v-model="visibility" :options="[{label:t('common.public'),value:true},{label:t('common.private'),value:false}]" option-label="label" option-value="value" show-clear :placeholder="t('common.visibility')" :aria-label="t('common.visibility')" /><Select v-model="source" :options="[{label:t('common.original'),value:'original'},{label:t('common.repost'),value:'repost'}]" option-label="label" option-value="value" show-clear :placeholder="t('adminTextures.allSources')" :aria-label="t('common.textureSource')" /><InputText v-model="author" :placeholder="t('adminTextures.uploaderId')" :aria-label="t('adminTextures.uploaderId')" /></div>
    <DataTable :value="filtered" paginator lazy :first="listing.first.value" :rows="listing.rows.value" :total-records="listing.total.value" :loading="listing.loading.value" @page="listing.paginate" striped-rows><Column field="name" :header="t('common.textureName')" sortable /><Column :header="t('common.type')"><template #body="{data}">{{ data.type === 'skin' ? t('common.skin') : t('common.cape') }}</template></Column><Column field="author" :header="t('common.uploader')" /><Column :header="t('common.source')"><template #body="{data}">{{ data.source === 'original' ? t('common.original') : t('common.repost') }}</template></Column><Column :header="t('adminTextures.publicStatus')"><template #body="{data}"><Tag :value="data.isPublic ? t('common.public') : t('common.private')" :severity="data.isPublic ? 'success' : 'secondary'" /></template></Column><Column field="createdAt" :header="t('common.uploadedAt')" /><Column :header="t('common.actions')"><template #body="{data}"><div class="table-actions"><RouterLink :to="{path:'/texture/preview',query:{id:data.id}}" class="icon-link" :aria-label="t('adminTextures.viewDetails')"><ArrowUpRight :size="17" /></RouterLink><Button text :aria-label="t('adminTextures.edit')" @click="edit(data)"><Pencil :size="16" /></Button><Button text severity="danger" :aria-label="t('adminTextures.delete')" @click="deleteId = data.id; deleting = true"><Trash2 :size="16" /></Button></div></template></Column><template #empty>{{ t('adminTextures.empty') }}</template></DataTable>
  </section>
  <Dialog v-model:visible="visible" :header="t('adminTextures.edit')" modal class="form-dialog"><form v-if="editing" id="admin-texture" class="form-stack" @submit.prevent="save"><label class="field">{{ t('common.name') }}<InputText v-model="editing.name" required maxlength="80" /></label><div class="form-grid"><label class="field">{{ t('common.source') }}<Select v-model="editing.source" :options="[{label:t('common.original'),value:'original'},{label:t('common.repost'),value:'repost'}]" option-label="label" option-value="value" /></label><label class="field">{{ t('common.model') }}<Select v-model="editing.model" :options="[{label:t('common.defaultModel'),value:'default'},{label:t('common.slimModel'),value:'slim'}]" option-label="label" option-value="value" :disabled="editing.type === 'cape'" /></label></div><div class="visibility-row"><label for="admin-public">{{ t('adminTextures.publicDisplay') }}</label><ToggleSwitch v-model="editing.isPublic" input-id="admin-public" /></div><div class="section-heading"><label for="admin-description">{{ t('common.textureDescription') }}</label><Button type="button" text :label="markdownPreview ? t('common.backToEditing') : t('common.previewMarkdown')" @click="markdownPreview = !markdownPreview" /></div><MarkdownContent v-if="markdownPreview" :content="editing.description" /><Textarea v-else id="admin-description" v-model="editing.description" rows="6" maxlength="4000" /></form><template #footer><Button outlined severity="secondary" :label="t('common.cancel')" @click="visible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="admin-texture" :label="t('adminTextures.save')" /></template></Dialog>
  <ConfirmAction v-model:visible="deleting" :title="t('adminTextures.delete')" :description="t('adminTextures.deleteConfirmation')" @confirm="remove" />
</template>
