<script setup lang="ts">
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
    if (!parsed.success) throw new ApiError('材质地址无效。');
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
  <PageHeading eyebrow="材质" title="材质预览" description="海澜之家，黑带人的衣柜">
    <RouterLink to="/textures" class="button-link secondary">
      <ArrowLeft :size="18"/>
      返回材质库
    </RouterLink>
  </PageHeading>
  <Message v-if="!texture" severity="error">
    {{operation.pending.value ? '正在加载材质…' : operation.error.value || '这份材质不存在，或你没有访问权限。'}}
  </Message>
  <div v-else class="detail-grid">
    <section class="panel detail-viewer">
      <div class="viewer-toolbar">
        <Tag :value="texture.type === 'skin' ? '皮肤' : '披风'" severity="secondary"/>
        <Button text severity="secondary" :aria-pressed="rotation" @click="rotation = !rotation">
          <RotateCw :size="17"/>
          {{rotation ? '停止旋转' : '自动旋转'}}
        </Button>
      </div>
      <div class="detail-stage">
        <SkinViewer :skin="texture.type === 'skin' ? texture.image : undefined"
                    :cape="texture.type === 'cape' ? texture.image : null" :model="texture.model" :animation="animation"
                    :rotating="rotation"/>
      </div>
      <p class="muted small center">拖动旋转 · 滚轮缩放</p>
      <div class="animation-buttons">
        <Button v-for="item in animationOptions" :key="String(item.value)" :label="item.label" size="small"
                :outlined="animation !== item.value" @click="animation = item.value"/>
      </div>
    </section>
    <section class="panel detail-info">
      <div class="section-heading"><h2>材质信息</h2>
        <Button text :aria-pressed="texture.isFavorited" :disabled="texture.owned || operation.pending.value"
                :title="texture.owned ? '上传者的材质自动收藏' : undefined" @click="toggleFavorite(texture)">
          <Heart :size="18" :fill="texture.isFavorited ? 'currentColor' : 'none'"/>
          {{texture.isFavorited ? '已收藏' : '收藏'}}
        </Button>
      </div>
      <h3 class="texture-detail-title">{{texture.name}}</h3>
      <dl class="metadata">
        <div>
          <dt>上传者</dt>
          <dd>{{texture.author}}</dd>
        </div>
        <div>
          <dt>材质类型</dt>
          <dd>{{texture.type === 'skin' ? '皮肤' : '披风'}}</dd>
        </div>
        <div>
          <dt>适用模型</dt>
          <dd>{{texture.model === 'slim' ? '细手臂' : '默认模型'}}</dd>
        </div>
        <div>
          <dt>TID</dt>
          <dd class="mono">{{texture.id}}</dd>
        </div>
        <div>
          <dt>文件大小</dt>
          <dd>{{((texture.sizeBytes) / 1024).toFixed(1)}} KB</dd>
        </div>
        <div>
          <dt>分辨率</dt>
          <dd>{{texture.width}} × {{texture.height}}</dd>
        </div>
        <div>
          <dt>材质来源</dt>
          <dd>
            <Tag :value="texture.source" severity="success"/>
          </dd>
        </div>
        <div>
          <dt>上传日期</dt>
          <dd>{{texture.createdAt}}</dd>
        </div>
        <div>
          <dt>可见范围</dt>
          <dd>{{texture.isPublic ? '公开' : '私人材质'}}</dd>
        </div>
      </dl>
      <section class="texture-description"><h3>关于这份创作</h3>
        <MarkdownContent :content="texture.description || '这个人很懒，什么都没有写。'"/>
      </section>
      <a :href="texture.image" :download="texture.id + '.png'" class="button-link secondary">
        <Download :size="17"/>
        下载 PNG</a></section>
  </div>
</template>
