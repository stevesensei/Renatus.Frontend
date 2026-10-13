<script setup lang="ts">
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { computed } from 'vue';
const props = defineProps<{ readonly content: string }>();
const html = computed(() => DOMPurify.sanitize(marked.parse(props.content, { async: false }), { FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'] }));
</script>
<template><div class="markdown" v-html="html"></div></template>
