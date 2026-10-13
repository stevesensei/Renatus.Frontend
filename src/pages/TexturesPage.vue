<script setup lang="ts">
import { t } from '../i18n';
import {Brush, Plus, Search} from '@lucide/vue';
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {RouterLink, useRouter} from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import TextureCard from '../components/TextureCard.vue';
import {state} from '../data/state';
import type {TexturePreview} from '../data/types';
import {api} from '../api/client';
import {session} from '../api/session';
import {loadOwnedTextures, loadFavoriteTextures, texturePageSchema} from '../api/textures';
import {useOperation} from '../composables/operation';

const operation = useOperation();
const router = useRouter();
const search = ref('');
const kind = ref('all');
const collection = ref('public');
const page = ref(1);
const items = ref<TexturePreview[]>([]);
const count = ref(0);
const total = ref(1);
const filtered = computed(() => ({length: count.value}));
const currentPage = computed(() => page.value);
let timer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;

async function load(): Promise<void> {
  const current = ++revision;
  await operation.run(async () => {
    if (collection.value === 'favorites') {
      const favorites = await loadFavoriteTextures();
      const selected = favorites.textures.filter(t => (kind.value === 'all' || t.type === kind.value) && (t.name + t.author).toLowerCase().includes(search.value.toLowerCase()));
      if (current !== revision) return;
      count.value = selected.length;
      total.value = Math.max(1, Math.ceil(selected.length / 12));
      page.value = Math.min(page.value, total.value);
      items.value = selected.slice((page.value - 1) * 12, page.value * 12).map(t => ({
        ...t,
        isFavorited: true,
        owned: state.textures.some(owned => owned.id === t.id && owned.owned)
      }));
    } else {
      const result = await api('texture/public', texturePageSchema, {
        searchParams: {
          page: page.value,
          pageSize: 12,
          search: search.value, ...(kind.value === 'all' ? {} : {type: kind.value === 'skin' ? 0 : 1})
        }
      });
      if (current !== revision) return;
      count.value = result.totalCount;
      total.value = Math.max(1, result.totalPages);
      page.value = result.page;
      items.value = result.textures.map(t => ({
        ...t,
        owned: state.textures.some(owned => owned.id === t.id && owned.owned)
      }));
    }
  });
}

onMounted(async () => {
  if (session.token) await operation.run(async () => {
    const result = await loadOwnedTextures();
    state.textures = result.textures.map(t => ({...t, owned: true, isFavorited: true}));
  });
  await load();
});
watch([collection, kind, search], () => {
  page.value = 1;
  ++revision;
  clearTimeout(timer);
  timer = setTimeout(load, 300);
});
watch(page, () => {
  void load();
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  ++revision;
});

</script>
<template>
  <PageHeading :eyebrow="t('textures.eyebrow')" :title="t('nav.textures')" :description="t('textures.description')">
    <RouterLink to="/textures/upload" class="button-link">
      <Plus :size="18"/>{{ t('nav.uploadTexture') }}</RouterLink>
  </PageHeading>
  <div class="library-toolbar">
    <div class="segmented">
      <Button :outlined="collection !== 'public'" :label="t('textures.publicCollection')" @click="collection = 'public'; page = 1"/>
      <Button :outlined="collection !== 'favorites'" :label="t('textures.favoriteCollection')"
              @click="session.token ? collection = 'favorites' : router.push({path:'/login',query:{returnUrl:'/textures'}})"/>
    </div>
    <div class="filter-cluster"><span class="search-field"><Search :size="17"/><InputText v-model="search"
                                                                                          :aria-label="t('textures.searchLabel')"
                                                                                          :placeholder="t('textures.searchPlaceholder')"/></span><Select
        v-model="kind"
        :options="[{ label: t('common.allTypes'), value: 'all' }, { label: t('common.skin'), value: 'skin' }, { label: t('common.cape'), value: 'cape' }]"
        option-label="label" option-value="value" :aria-label="t('common.textureType')"/></div>
  </div>
  <p class="result-count muted">{{ t('textures.resultCount', { value1: filtered.length }) }}</p>
  <Message v-if="operation.error.value" severity="error">{{operation.error.value}}</Message>
  <Message v-else-if="operation.pending.value" severity="info">{{ t('textures.loading') }}</Message>
  <div v-else-if="items.length" class="texture-grid">
    <TextureCard v-for="texture in items" :key="texture.id" :texture="texture"/>
  </div>
  <section v-else class="panel empty-state">
    <Brush :size="44"/>
    <h2>{{ t('textures.emptyTitle') }}</h2>
    <p class="muted">{{ t('textures.emptyDescription') }}</p>
    <Button outlined :label="t('textures.clearFilters')" @click="search = ''; kind = 'all'"/>
  </section>
  <div class="pagination">
    <Button outlined severity="secondary" :label="t('common.previousPage')" :disabled="currentPage <= 1" @click="page = currentPage - 1"/>
    <span>{{ t('textures.pagination', { currentPage: currentPage, total: total }) }}</span>
    <Button outlined severity="secondary" :label="t('common.nextPage')" :disabled="currentPage >= total"
            @click="page = currentPage + 1"/>
  </div>
</template>
