<script setup lang="ts">
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
const draft=reactive<z.infer<typeof adminSiteSchema>>({title:'',description:'',heroImage:'',publicBaseUrl:'',buttons:[]});
onMounted(()=>operation.run(async()=>{const result=await api('admin/site',adminSiteSchema);Object.assign(draft,result);while(draft.buttons.length<3)draft.buttons.push({label:'',url:'',style:'filled',target:'_self'});ready.value=true;}));
async function save():Promise<void>{await operation.run(async()=>{await api('admin/site',adminSiteSchema,{method:'put',json:draft});await loadSite();},'站点设置已保存');}

</script>
<template>
  <PageHeading eyebrow="管理面板 / 社区内容" title="站点设置" description="为你的社区定义名字、故事和入口。"><RouterLink to="/" class="button-link secondary"><ExternalLink :size="17" />查看首页</RouterLink></PageHeading>
  <form v-if="ready" class="form-stack" @submit.prevent="save">
    <section class="panel form-stack"><div><h2>站点身份</h2><p class="muted">首页中展示的名称、介绍与主视觉。</p></div><div class="form-grid"><label class="field">站点标题<InputText v-model="draft.title" required maxlength="120" /></label><label class="field">API 公网地址<InputText v-model="draft.publicBaseUrl" required maxlength="512" /></label><label class="field span-2">首页背景图<InputText v-model="draft.heroImage" maxlength="1024" /></label><label class="field span-2">站点介绍<Textarea v-model="draft.description" rows="3" maxlength="500" /></label></div><p class="muted small">此地址用于 Minecraft 认证和材质 URL，请填写用户可以访问的 API 公网地址。</p></section>
    <section class="panel form-stack"><div><h2>首页按钮</h2><p class="muted">最多展示三个入口。留空的按钮不会显示。</p></div><section v-for="(button,index) in draft.buttons" :key="index" class="button-editor"><h3>按钮 {{ index + 1 }}</h3><div class="form-grid"><label class="field">按钮文字<InputText v-model="button.label" maxlength="80" /></label><label class="field">跳转地址<InputText v-model="button.url" maxlength="1024" placeholder="/textures" /></label><label class="field">按钮样式<Select v-model="button.style" :options="[{label:'主要按钮',value:'filled'},{label:'描边按钮',value:'outlined'},{label:'文字按钮',value:'text'}]" option-label="label" option-value="value" /></label><label class="field">打开方式<Select v-model="button.target" :options="[{label:'当前页面',value:'_self'},{label:'新标签页',value:'_blank'}]" option-label="label" option-value="value" /></label></div></section></section>
    <Message v-if="error" severity="error">{{ error }}</Message><div class="form-actions"><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value"><Save :size="17" />保存站点设置</Button></div>
  </form>
</template>
