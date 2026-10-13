<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AnnouncementEditor from '../../components/AnnouncementEditor.vue';
import PageHeading from '../../components/PageHeading.vue';
import { state } from '../../data/state';
import { api } from '../../api/client';
import { announcementSchema } from '../../api/schemas';
import { useOperation } from '../../composables/operation';
import type { z } from 'zod';
const operation=useOperation();const ready=ref(false);
onMounted(()=>operation.run(async()=>{const [login,site]=await Promise.all([api('admin/announcements/login',announcementSchema),api('admin/announcements/site',announcementSchema)]);state.announcements={login,site};ready.value=true;}));
async function saveLogin(value:z.infer<typeof announcementSchema>):Promise<boolean>{return operation.run(async()=>{state.announcements.login=await api('admin/announcements/login',announcementSchema,{method:'put',json:value});},'登录公告已保存');}
async function saveSite(value:z.infer<typeof announcementSchema>):Promise<boolean>{return operation.run(async()=>{state.announcements.site=await api('admin/announcements/site',announcementSchema,{method:'put',json:value});},'站点公告已保存');}

</script>
<template>
  <PageHeading eyebrow="管理面板 / 社区内容" title="公告管理" description="让新的消息，出现在冒险开始的地方。"><RouterLink to="/admin/site" class="button-link secondary">站点设置</RouterLink></PageHeading>
  <div v-if="ready" class="form-stack">
    <AnnouncementEditor heading="登录公告" description="展示在登录 / 注册页面的欢迎消息。" :value="state.announcements.login" :save="saveLogin" />
    <AnnouncementEditor heading="站点公告" description="展示在用户控制台的社区公告。" :value="state.announcements.site" :save="saveSite" />
  </div>
</template>
