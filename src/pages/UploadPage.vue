<script setup lang="ts">
import { ArrowLeft, Upload } from '@lucide/vue';
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import MarkdownContent from '../components/MarkdownContent.vue';
import PageHeading from '../components/PageHeading.vue';
import SkinViewer from '../components/SkinViewer.vue';
import { animationOptions } from '../data/animations';
import { PreviewImageError, readPng } from '../data/images';
import type { AnimationName, TexturePreview } from '../data/types';
import { api } from '../api/client';
import { textureSchema } from '../api/textures';
import { useOperation } from '../composables/operation';
const operation=useOperation();const router=useRouter();
const form=reactive<Pick<TexturePreview,'name'|'type'|'source'|'model'|'description'>>({name:'',type:'skin',source:'原创',model:'default',description:''});
const privateTexture=ref(false);const file=shallowRef<File|null>(null);
const image=ref<Readonly<Pick<TexturePreview,'image'|'width'|'height'|'sha256'|'sizeBytes'>>|null>(null);
const error=operation.error;const animation=ref<AnimationName|null>(null);const markdownPreview=ref(false);
const fallback=import.meta.env.BASE_URL+'skins/steve.png';
const skin=computed(()=>form.type==='skin'?image.value?.image??fallback:fallback);
let revision=0;
async function load():Promise<void>{
 const selected=file.value;if(selected===null)return;
 const current=++revision;error.value='';image.value=null;
 try{const result=await readPng(selected,form.type);if(current===revision)image.value=result;}
 catch(cause){if(cause instanceof PreviewImageError)error.value=cause.message;else throw cause;}
}
async function selectFile(event:Event):Promise<void>{if(!(event.target instanceof HTMLInputElement))return;file.value=event.target.files?.[0]??null;await load();}
watch(()=>form.type,load);
async function publish():Promise<void>{
 const selected=image.value;if(selected===null)return;
 await operation.run(async()=>{
  const texture=await api('texture',textureSchema,{method:'post',json:{name:form.name,type:{skin:0,cape:1}[form.type],skinModel:{default:0,slim:1}[form.model],source:{原创:0,转载:1}[form.source],descriptionMarkdown:form.description,isPublic:!privateTexture.value,dataBase64:selected.image}});
  await router.push({path:'/texture/preview',query:{id:texture.id}});
 },'材质已上传');
}

</script>
<template>
  <PageHeading eyebrow="分享你的创作" title="上传材质" description="上传你的 PNG 皮肤或披风，先看看它在游戏中的样子。"><RouterLink to="/textures" class="button-link secondary"><ArrowLeft :size="18" />返回材质库</RouterLink></PageHeading>
  <div class="upload-grid">
    <form class="panel form-stack" @submit.prevent="publish">
      <div><h2>材质信息</h2><p class="muted">每一套装扮，都有它自己的故事。</p></div>
      <label class="field">材质名称<InputText v-model="form.name" required maxlength="80" placeholder="为你的创作起个名字" /></label>
      <div class="form-grid"><label class="field">材质类型<Select v-model="form.type" :options="[{label:'皮肤',value:'skin'},{label:'披风',value:'cape'}]" option-label="label" option-value="value" /></label><label class="field">来源<Select v-model="form.source" :options="['原创','转载']" /></label></div>
      <label v-if="form.type === 'skin'" class="field">皮肤模型<Select v-model="form.model" :options="[{label:'默认模型',value:'default'},{label:'细手臂',value:'slim'}]" option-label="label" option-value="value" /></label>
      <div class="field"><label for="texture-description">材质说明</label><div class="inline-actions"><Button type="button" size="small" :text="markdownPreview" label="编辑" @click="markdownPreview = false" /><Button type="button" size="small" :text="!markdownPreview" label="预览" @click="markdownPreview = true" /></div><MarkdownContent v-if="markdownPreview" :content="form.description || '暂无说明。'" /><Textarea v-else id="texture-description" v-model="form.description" rows="5" maxlength="4000" placeholder="写下创作灵感，支持 Markdown。" /><span class="muted small">{{ form.description.length }} / 4000</span></div>
      <label class="upload-dropzone"><Upload :size="28" /><strong>{{ file?.name ?? '选择或拖入 PNG 文件' }}</strong><span>最大 2 MiB · {{ form.type === 'skin' ? '64n × 32n / 64n × 64n' : '64n × 32n' }}</span><input type="file" accept=".png,image/png" required @change="selectFile" /></label>
      <Message v-if="error" severity="error">{{ error }}</Message>
      <div class="visibility-row"><div><label for="private-texture">设为私人材质</label><p class="muted small">公开材质会展示在社区材质库中。</p></div><ToggleSwitch v-model="privateTexture" input-id="private-texture" /></div>
      <Button type="submit" :loading="operation.pending.value" :disabled="image === null || !form.name.trim()" label="发布材质" />
    </form>
    <section class="panel upload-preview"><div class="section-heading"><h2>实时预览</h2><Tag value="3D" severity="secondary" /></div><div class="large-skin-stage"><SkinViewer :skin="skin" :cape="form.type === 'cape' ? image?.image ?? null : null" :model="form.type === 'cape' ? 'default' : form.model" :animation="animation" /></div><p class="muted small center">拖动旋转 · 滚轮缩放</p><div class="animation-buttons"><Button v-for="item in animationOptions" :key="String(item.value)" :label="item.label" size="small" :outlined="animation !== item.value" @click="animation = item.value" /></div></section>
  </div>
</template>
