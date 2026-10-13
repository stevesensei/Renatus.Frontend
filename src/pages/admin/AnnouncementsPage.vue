<script setup lang="ts">
import { t } from '../../i18n';
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
async function saveLogin(value:z.infer<typeof announcementSchema>):Promise<boolean>{return operation.run(async()=>{state.announcements.login=await api('admin/announcements/login',announcementSchema,{method:'put',json:value});},t('announcements.loginSaved'));}
async function saveSite(value:z.infer<typeof announcementSchema>):Promise<boolean>{return operation.run(async()=>{state.announcements.site=await api('admin/announcements/site',announcementSchema,{method:'put',json:value});},t('announcements.siteSaved'));}

</script>
<template>
  <PageHeading :eyebrow="t('admin.contentEyebrow')" :title="t('nav.announcements')" :description="t('announcements.description')"><RouterLink to="/admin/site" class="button-link secondary">{{ t('nav.siteSettings') }}</RouterLink></PageHeading>
  <div v-if="ready" class="form-stack">
    <AnnouncementEditor :heading="t('login.announcement')" :description="t('announcements.loginDescription')" :value="state.announcements.login" :save="saveLogin" />
    <AnnouncementEditor :heading="t('dashboard.siteAnnouncement')" :description="t('announcements.siteDescription')" :value="state.announcements.site" :save="saveSite" />
  </div>
</template>
