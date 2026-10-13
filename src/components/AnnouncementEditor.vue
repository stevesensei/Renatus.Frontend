<script setup lang="ts">
import { t } from '../i18n';
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
    <div class="section-heading"><div><h2>{{ heading }}</h2><p class="muted">{{ description }}</p></div><Button type="submit" :loading="pending" :label="t('announcements.save')" /></div>
    <div class="form-grid"><label class="field">{{ t('announcements.title') }}<InputText v-model="draft.title" required maxlength="160" /></label><label class="field">{{ t('announcements.imageUrl') }}<InputText v-model="draft.image" maxlength="1024" :placeholder="t('announcements.imageUrlPlaceholder')" /></label></div>
    <div class="section-heading"><span class="field-label">{{ t('announcements.body') }}</span><Select v-model="mode" :options="[{label:t('announcements.splitMode'),value:'split'},{label:t('announcements.editMode'),value:'edit'},{label:t('announcements.previewMode'),value:'preview'}]" option-label="label" option-value="value" :aria-label="t('announcements.editorMode')" /></div>
    <div :class="['markdown-editor', { single: mode !== 'split' }]"><label v-if="mode !== 'preview'" class="field">{{ t('announcements.markdownContent') }}<Textarea v-model="draft.body" rows="10" maxlength="16000" :placeholder="t('announcements.bodyPlaceholder')" /></label><section v-if="mode !== 'edit'" class="markdown-preview"><p class="eyebrow">{{ t('announcements.contentPreview') }}</p><MarkdownContent :content="draft.body || t('announcements.emptyBody')" /><img v-if="draft.image" :src="draft.image" :alt="t('announcements.imageAlt')" class="announcement-image" /></section></div>
  </form>
</template>
