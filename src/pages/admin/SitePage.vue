<script setup lang="ts">
import { t } from '../../i18n';
import { ExternalLink, Save } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import type { z } from 'zod';
import { RouterLink } from 'vue-router';
import PageHeading from '../../components/PageHeading.vue';
import { api } from '../../api/client';
import { loadSite } from '../../api/auth';
import { adminSiteSchema } from '../../api/schemas';
import { useOperation } from '../../composables/operation';
const operation=useOperation();const error=operation.error;const ready=ref(false);
const draft=reactive<z.infer<typeof adminSiteSchema>>({title:'',description:'',heroImage:'',publicBaseUrl:'',buttons:[],copyright:'',icpRegistrationNumber:''});
onMounted(()=>operation.run(async()=>{const result=await api('admin/site',adminSiteSchema);Object.assign(draft,result);while(draft.buttons.length<3)draft.buttons.push({label:'',url:'',style:'filled',target:'_self'});ready.value=true;}));
async function save():Promise<void>{await operation.run(async()=>{await api('admin/site',adminSiteSchema,{method:'put',json:draft});await loadSite();},t('site.saved'));}

</script>
<template>
  <PageHeading :eyebrow="t('admin.contentEyebrow')" :title="t('nav.siteSettings')" :description="t('site.description')"><RouterLink to="/" class="button-link secondary"><ExternalLink :size="17" />{{ t('site.viewHome') }}</RouterLink></PageHeading>
  <form v-if="ready" class="form-stack" @submit.prevent="save">
    <section class="panel form-stack"><div><h2>{{ t('site.identity') }}</h2><p class="muted">{{ t('site.identityDescription') }}</p></div><div class="form-grid"><label class="field">{{ t('site.title') }}<InputText v-model="draft.title" required maxlength="120" /></label><label class="field">{{ t('site.publicBaseUrl') }}<InputText v-model="draft.publicBaseUrl" required maxlength="512" /></label><label class="field span-2">{{ t('site.heroImage') }}<InputText v-model="draft.heroImage" maxlength="1024" /></label><label class="field span-2">{{ t('site.introduction') }}<Textarea v-model="draft.description" rows="3" maxlength="500" /></label></div><p class="muted small">{{ t('site.publicBaseUrlHint') }}</p></section>
    <section class="panel form-stack"><div><h2>{{ t('site.footer') }}</h2><p class="muted">{{ t('site.footerDescription') }}</p></div><div class="form-grid"><label class="field span-2">{{ t('site.copyright') }}<Textarea v-model="draft.copyright" rows="2" maxlength="500" :placeholder="t('site.copyrightPlaceholder')" /></label><label class="field span-2">{{ t('site.icpNumber') }}<InputText v-model="draft.icpRegistrationNumber" maxlength="80" :placeholder="t('site.icpPlaceholder')" /></label></div></section>
    <section class="panel form-stack"><div><h2>{{ t('site.buttons') }}</h2><p class="muted">{{ t('site.buttonsDescription') }}</p></div><section v-for="(button,index) in draft.buttons" :key="index" class="button-editor"><h3>{{ t('site.buttonHeading', { value1: index + 1 }) }}</h3><div class="form-grid"><label class="field">{{ t('site.buttonLabel') }}<InputText v-model="button.label" maxlength="80" /></label><label class="field">{{ t('site.buttonUrl') }}<InputText v-model="button.url" maxlength="1024" :placeholder="t('site.buttonUrlPlaceholder')" /></label><label class="field">{{ t('site.buttonStyle') }}<Select v-model="button.style" :options="[{label:t('site.primaryButton'),value:'filled'},{label:t('site.outlinedButton'),value:'outlined'},{label:t('site.textButton'),value:'text'}]" option-label="label" option-value="value" /></label><label class="field">{{ t('site.buttonTarget') }}<Select v-model="button.target" :options="[{label:t('site.currentWindow'),value:'_self'},{label:t('site.newWindow'),value:'_blank'}]" option-label="label" option-value="value" /></label></div></section></section>
    <Message v-if="error" severity="error">{{ error }}</Message><div class="form-actions"><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value"><Save :size="17" />{{ t('site.save') }}</Button></div>
  </form>
</template>
