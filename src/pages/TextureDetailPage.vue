<script setup lang="ts">
import { t } from '../i18n';
import {ArrowLeft, Download, Heart, RotateCw} from '@lucide/vue';
import {onMounted, ref, watch} from 'vue';
import {RouterLink, useRoute, useRouter} from 'vue-router';
import MarkdownContent from '../components/MarkdownContent.vue';
import PageHeading from '../components/PageHeading.vue';
import SkinViewer from '../components/SkinViewer.vue';
import {animationOptions} from '../data/animations';
import {state} from '../data/state';
import type {AnimationName, TexturePreview} from '../data/types';
import {api, ApiError} from '../api/client';
import {id} from '../api/schemas';
import {session} from '../api/session';
import {favoriteSchema, loadOwnedTextures, textureSchema} from '../api/textures';
import {useOperation} from '../composables/operation';

const route = useRoute();
const router = useRouter();
const operation = useOperation();
const texture = ref<TexturePreview | null>(null);
const rotation = ref(false);
const animation = ref<AnimationName | null>(matchMedia('(prefers-reduced-motion: reduce)').matches ? null : 'idle');
let revision = 0;

async function load(): Promise<void> {
  const current = ++revision;
  texture.value = null;
  await operation.run(async () => {
    const parsed = id.safeParse(route.query['id']);
    if (!parsed.success) throw new ApiError(t('textureDetails.invalidAddress'));
    const result = await api((state.account.role === 'Admin' && session.token ? 'admin/textures/' : 'texture/') + parsed.data, textureSchema);
    if (current !== revision) return;
    if (session.token) {
      const owned = await loadOwnedTextures();
      const match = owned.textures.find(item => item.id === result.id);
      if (match) Object.assign(result, {owned: true, isPublic: match.isPublic, sha256: match.sha256});
    }
    if (current === revision) texture.value = result;
  });
}

async function toggleFavorite(selected: TexturePreview): Promise<void> {
  if (!session.token) {
    await router.push({path: '/login', query: {returnUrl: route.fullPath}});
    return;
  }
  await operation.run(async () => {
    const result = selected.isFavorited ? await api('texture/favorite/' + selected.id, favoriteSchema, {method: 'delete'}) : await api('texture/favorite', favoriteSchema, {
      method: 'post',
      json: {textureId: selected.id}
    });
    selected.isFavorited = result.isFavorited;
  });
}

onMounted(load);
watch(() => route.query['id'], load);

</script>
<template>
  <PageHeading :eyebrow="t('textureDetails.eyebrow')" :title="t('textureDetails.title')" :description="t('textureDetails.description')">
    <RouterLink to="/textures" class="button-link secondary">
      <ArrowLeft :size="18"/>{{ t('nav.backToTextures') }}</RouterLink>
  </PageHeading>
  <Message v-if="!texture" severity="error">
    {{ operation.pending.value ? t('textures.loading') : operation.error.value || t('textureDetails.missing') }}
  </Message>
  <div v-else class="detail-grid">
    <section class="panel detail-viewer">
      <div class="viewer-toolbar">
        <Tag :value="texture.type === 'skin' ? t('common.skin') : t('common.cape')" severity="secondary"/>
        <Button text severity="secondary" :aria-pressed="rotation" @click="rotation = !rotation">
          <RotateCw :size="17"/>
          {{ rotation ? t('textureDetails.stopRotation') : t('textureDetails.startRotation') }}
        </Button>
      </div>
      <div class="detail-stage">
        <SkinViewer :skin="texture.type === 'skin' ? texture.image : undefined"
                    :cape="texture.type === 'cape' ? texture.image : null" :model="texture.model" :animation="animation"
                    :rotating="rotation"/>
      </div>
      <p class="muted small center">{{ t('viewer.controlsHint') }}</p>
      <div class="animation-buttons">
        <Button v-for="item in animationOptions" :key="String(item.value)" :label="item.label" size="small"
                :outlined="animation !== item.value" @click="animation = item.value"/>
      </div>
    </section>
    <section class="panel detail-info">
      <div class="section-heading"><h2>{{ t('textureDetails.information') }}</h2>
        <Button text :aria-pressed="texture.isFavorited" :disabled="texture.owned || operation.pending.value"
                :title="texture.owned ? t('textures.ownerFavorite') : undefined" @click="toggleFavorite(texture)">
          <Heart :size="18" :fill="texture.isFavorited ? 'currentColor' : 'none'"/>
          {{ texture.isFavorited ? t('textures.favorited') : t('textures.favorite') }}
        </Button>
      </div>
      <h3 class="texture-detail-title">{{texture.name}}</h3>
      <dl class="metadata">
        <div>
          <dt>{{ t('common.uploader') }}</dt>
          <dd>{{texture.author}}</dd>
        </div>
        <div>
          <dt>{{ t('common.textureType') }}</dt>
          <dd>{{ texture.type === 'skin' ? t('common.skin') : t('common.cape') }}</dd>
        </div>
        <div>
          <dt>{{ t('textureDetails.compatibleModel') }}</dt>
          <dd>{{ texture.model === 'slim' ? t('common.slimModel') : t('common.defaultModel') }}</dd>
        </div>
        <div>
          <dt>{{ t('textureDetails.id') }}</dt>
          <dd class="mono">{{texture.id}}</dd>
        </div>
        <div>
          <dt>{{ t('textureDetails.fileSize') }}</dt>
          <dd>{{ t('textureDetails.sizeValue', { value1: ((texture.sizeBytes) / 1024).toFixed(1) }) }}</dd>
        </div>
        <div>
          <dt>{{ t('textureDetails.dimensions') }}</dt>
          <dd>{{ t('textureDetails.dimensionsValue', { value1: texture.width, value2: texture.height }) }}</dd>
        </div>
        <div>
          <dt>{{ t('common.textureSource') }}</dt>
          <dd>
            <Tag :value="texture.source === 'original' ? t('common.original') : t('common.repost')" severity="success"/>
          </dd>
        </div>
        <div>
          <dt>{{ t('common.uploadedAt') }}</dt>
          <dd>{{texture.createdAt}}</dd>
        </div>
        <div>
          <dt>{{ t('common.visibility') }}</dt>
          <dd>{{ texture.isPublic ? t('common.public') : t('dashboard.privateTextures') }}</dd>
        </div>
      </dl>
      <section class="texture-description"><h3>{{ t('textureDetails.about') }}</h3>
        <MarkdownContent :content="texture.description || t('textureDetails.emptyDescription')"/>
      </section>
      <a :href="texture.image" :download="texture.id + '.png'" class="button-link secondary">
        <Download :size="17"/>{{ t('textureDetails.download') }}</a></section>
  </div>
</template>
