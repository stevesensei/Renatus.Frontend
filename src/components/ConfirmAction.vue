<script setup lang="ts">
const visible = defineModel<boolean>('visible', { required: true });
defineProps<{ readonly title: string; readonly description: string }>();
const emit = defineEmits<{ confirm: [] }>();
</script>
<template><Dialog v-model:visible="visible" :header="title" modal class="compact-dialog"><p>{{ description }}</p><template #footer><Button severity="secondary" outlined label="取消" @click="visible = false" /><Button severity="danger" label="确认删除" @click="emit('confirm'); visible = false" /></template></Dialog></template>
