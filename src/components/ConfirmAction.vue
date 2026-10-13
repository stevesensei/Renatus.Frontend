<script setup lang="ts">
import { t } from '../i18n';
const visible = defineModel<boolean>('visible', { required: true });
defineProps<{ readonly title: string; readonly description: string }>();
const emit = defineEmits<{ confirm: [] }>();
</script>
<template><Dialog v-model:visible="visible" :header="title" modal class="compact-dialog"><p>{{ description }}</p><template #footer><Button severity="secondary" outlined :label="t('common.cancel')" @click="visible = false" /><Button severity="danger" :label="t('common.confirmDelete')" @click="emit('confirm'); visible = false" /></template></Dialog></template>
