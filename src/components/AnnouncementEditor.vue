<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import MarkdownContent from './MarkdownContent.vue';
interface Announcement { readonly title:string; readonly body:string; readonly image:string; }
const props=defineProps<{readonly heading:string;readonly description:string;readonly value:Announcement;readonly save:(value:Announcement)=>Promise<boolean>}>();
const draft=reactive({...props.value});const mode=ref('split');const pending=ref(false);
watch(()=>props.value,(value)=>Object.assign(draft,value));
async function save():Promise<void>{pending.value=true;try{await props.save({...draft});}finally{pending.value=false;}}

</script>
<template>
  <form class="panel form-stack" @submit.prevent="save">
    <div class="section-heading"><div><h2>{{ heading }}</h2><p class="muted">{{ description }}</p></div><Button type="submit" :loading="pending" label="保存公告" /></div>
    <div class="form-grid"><label class="field">公告标题<InputText v-model="draft.title" required maxlength="160" /></label><label class="field">图片地址<InputText v-model="draft.image" maxlength="1024" placeholder="/image.png 或 https://…" /></label></div>
    <div class="section-heading"><span class="field-label">公告正文</span><Select v-model="mode" :options="[{label:'编辑与预览',value:'split'},{label:'仅编辑',value:'edit'},{label:'仅预览',value:'preview'}]" option-label="label" option-value="value" aria-label="Markdown 编辑模式" /></div>
    <div :class="['markdown-editor', { single: mode !== 'split' }]"><label v-if="mode !== 'preview'" class="field">Markdown 内容<Textarea v-model="draft.body" rows="10" maxlength="16000" placeholder="输入公告正文，支持 Markdown。" /></label><section v-if="mode !== 'edit'" class="markdown-preview"><p class="eyebrow">内容预览</p><MarkdownContent :content="draft.body || '暂无公告内容。'" /><img v-if="draft.image" :src="draft.image" alt="公告配图预览" class="announcement-image" /></section></div>
  </form>
</template>
