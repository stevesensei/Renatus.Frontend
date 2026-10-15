<script setup lang="ts">
import { Globe } from '@lucide/vue';
import ky from 'ky';
import { computed, ref, watch } from 'vue';
import { z } from 'zod';

const props = defineProps<{ readonly code: string; readonly rootUrl: string }>();
const metadataSchema = z.object({ meta: z.object({ serverName: z.string().trim().min(1) }) });
const name = ref('');
const iconFailed = ref(false);
const siteUrl = computed(() => {
  const url = URL.parse(props.rootUrl);
  if (url?.protocol !== 'https:' && url?.protocol !== 'http:') return '';
  url.search = '';
  url.hash = '';
  return url.href.replace(/\/+$/, '') + '/';
});
const iconUrl = computed(() => siteUrl.value ? new URL('favicon.ico', siteUrl.value).href : '');

async function loadName(baseUrl: string, signal: AbortSignal): Promise<void> {
  try {
    const response = await ky.get(new URL('api/yggdrasil', baseUrl), {
      credentials: 'omit', retry: 0, timeout: 5000, signal,
    }).json<unknown>();
    const result = metadataSchema.safeParse(response);
    if (!signal.aborted) name.value = result.success ? result.data.meta.serverName : '';
  } catch (cause) {
    if (!(cause instanceof Error)) throw cause;
    if (!signal.aborted) name.value = '';
  }
}

watch(siteUrl, (url, _previous, onCleanup) => {
  name.value = '';
  iconFailed.value = false;
  if (!url) return;
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  void loadName(url, controller.signal);
}, { immediate: true });
</script>

<template>
  <article class="panel union-directory-card">
    <span class="union-station-icon" aria-hidden="true">
      <img v-if="iconUrl && !iconFailed" :src="iconUrl" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="iconFailed = true" />
      <Globe v-else :size="24" />
    </span>
    <div><h3>{{ code }}</h3><p class="muted">{{ name || code }}</p>
      <a v-if="siteUrl" class="text-link" :href="siteUrl" target="_blank" rel="noreferrer">{{ rootUrl }}</a>
    </div>
  </article>
</template>
