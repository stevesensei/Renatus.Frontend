<script setup lang="ts">
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
function filters():void{listing.filter({...(sha256.value?{sha256:sha256.value}:{}),...(kind.value===null?{}:{type:String({skin:0,cape:1}[kind.value])}),...(visibility.value===null?{}:{isPublic:String(visibility.value)}),...(author.value.trim()?{uploaderId:author.value.trim()}:{}),...(source.value===null?{}:{source:String({原创:0,转载:1}[source.value])})});}
watch([sha256,kind,visibility,author,source],filters);onMounted(filters);
async function edit(texture:TexturePreview):Promise<void>{await operation.run(async()=>{editing.value=await api('admin/textures/'+texture.id,textureSchema);visible.value=true;});}
async function save():Promise<void>{
 const texture=editing.value;if(texture===null)return;
 await operation.run(async()=>{await api('admin/textures/'+texture.id,textureSchema,{method:'patch',json:{name:texture.name,descriptionMarkdown:texture.description,isPublic:texture.isPublic,source:{原创:0,转载:1}[texture.source],skinModel:{default:0,slim:1}[texture.model]}});visible.value=false;await listing.load();},'材质已保存');
}
async function remove():Promise<void>{await operation.run(async()=>{await api('admin/textures/'+deleteId.value,emptyResponse,{method:'delete'});await listing.load();},'材质已删除');}

</script>
<template>
  <PageHeading eyebrow="管理面板" title="材质管理" description="查看社区创作，管理名称、说明与公开范围。" />
  <section class="panel"><div class="table-toolbar"><InputText v-model="sha256" aria-label="SHA256 筛选" placeholder="SHA256 精确匹配" /><Select v-model="kind" :options="[{label:'皮肤',value:'skin'},{label:'披风',value:'cape'}]" option-label="label" option-value="value" show-clear placeholder="全部类型" aria-label="材质类型" /><Select v-model="visibility" :options="[{label:'公开',value:true},{label:'私人',value:false}]" option-label="label" option-value="value" show-clear placeholder="可见范围" aria-label="可见范围" /><Select v-model="source" :options="['原创','转载']" show-clear placeholder="全部来源" aria-label="材质来源" /><InputText v-model="author" placeholder="上传者 ID" aria-label="上传者 ID" /></div>
    <DataTable :value="filtered" paginator lazy :first="listing.first.value" :rows="listing.rows.value" :total-records="listing.total.value" :loading="listing.loading.value" @page="listing.paginate" striped-rows><Column field="name" header="材质名称" sortable /><Column header="类型"><template #body="{data}">{{ data.type === 'skin' ? '皮肤' : '披风' }}</template></Column><Column field="author" header="上传者" /><Column field="source" header="来源" /><Column header="公开状态"><template #body="{data}"><Tag :value="data.isPublic ? '公开' : '私人'" :severity="data.isPublic ? 'success' : 'secondary'" /></template></Column><Column field="createdAt" header="上传日期" /><Column header="操作"><template #body="{data}"><div class="table-actions"><RouterLink :to="{path:'/texture/preview',query:{id:data.id}}" class="icon-link" aria-label="查看材质详情"><ArrowUpRight :size="17" /></RouterLink><Button text aria-label="编辑材质" @click="edit(data)"><Pencil :size="16" /></Button><Button text severity="danger" aria-label="删除材质" @click="deleteId = data.id; deleting = true"><Trash2 :size="16" /></Button></div></template></Column><template #empty>没有匹配的材质。</template></DataTable>
  </section>
  <Dialog v-model:visible="visible" header="编辑材质" modal class="form-dialog"><form v-if="editing" id="admin-texture" class="form-stack" @submit.prevent="save"><label class="field">名称<InputText v-model="editing.name" required maxlength="80" /></label><div class="form-grid"><label class="field">来源<Select v-model="editing.source" :options="['原创','转载']" /></label><label class="field">模型<Select v-model="editing.model" :options="[{label:'默认模型',value:'default'},{label:'细手臂',value:'slim'}]" option-label="label" option-value="value" :disabled="editing.type === 'cape'" /></label></div><div class="visibility-row"><label for="admin-public">公开展示</label><ToggleSwitch v-model="editing.isPublic" input-id="admin-public" /></div><div class="section-heading"><label for="admin-description">材质说明</label><Button type="button" text :label="markdownPreview ? '返回编辑' : '预览 Markdown'" @click="markdownPreview = !markdownPreview" /></div><MarkdownContent v-if="markdownPreview" :content="editing.description" /><Textarea v-else id="admin-description" v-model="editing.description" rows="6" maxlength="4000" /></form><template #footer><Button outlined severity="secondary" label="取消" @click="visible = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="admin-texture" label="保存材质" /></template></Dialog>
  <ConfirmAction v-model:visible="deleting" title="删除材质" description="确定删除此材质？角色的对应绑定也会清除。" @confirm="remove" />
</template>
