<script setup lang="ts">
import type { Component } from 'vue';
defineProps<{ readonly label: string; readonly value: string | number; readonly icon: Component; readonly detail?: string }>();
</script>
<template><section class="metric-card"><span class="metric-icon"><component :is="icon" :size="22" /></span><div><p class="muted">{{ label }}</p><strong>{{ value }}</strong><p v-if="detail" class="metric-detail">{{ detail }}</p></div></section></template>
