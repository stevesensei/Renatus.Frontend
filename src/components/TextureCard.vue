<script setup lang="ts">
import { t } from '../i18n';
import { ArrowUpRight, Heart } from '@lucide/vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { api } from '../api/client';
import { session } from '../api/session';
import { favoriteSchema } from '../api/textures';
import { useOperation } from '../composables/operation';
import type { TexturePreview } from '../data/types';
import SkinViewer from './SkinViewer.vue';
defineProps<{readonly texture:TexturePreview}>();
const operation=useOperation();const route=useRoute();const router=useRouter();
async function toggleFavorite(texture:TexturePreview):Promise<void>{
 if(!session.token){await router.push({path:'/login',query:{returnUrl:route.fullPath}});return;}
 await operation.run(async()=>{const result=texture.isFavorited?await api('texture/favorite/'+texture.id,favoriteSchema,{method:'delete'}):await api('texture/favorite',favoriteSchema,{method:'post',json:{textureId:texture.id}});texture.isFavorited=result.isFavorited;});
}

</script>
<template>
  <article class="texture-card">
    <div class="texture-visual"><SkinViewer :skin="texture.type === 'skin' ? texture.image : undefined" :cape="texture.type === 'cape' ? texture.image : null" :model="texture.model" :interactive="false" /><Tag class="texture-kind" :value="texture.type === 'skin' ? t('common.skin') : t('common.cape')" severity="secondary" /><Button class="favorite-button" rounded severity="secondary" :aria-label="texture.isFavorited ? t('textures.unfavorite') : t('textures.favoriteMaterial')" :aria-pressed="texture.isFavorited" :disabled="texture.owned || operation.pending.value" :title="texture.owned ? t('textures.ownerFavorite') : undefined" @click="toggleFavorite(texture)"><Heart :size="17" :fill="texture.isFavorited ? 'currentColor' : 'none'" /></Button></div>
    <div class="texture-caption"><RouterLink :to="{ path: '/texture/preview', query: { id: texture.id } }"><h2>{{ texture.name }}</h2><ArrowUpRight :size="17" /></RouterLink><p class="muted">{{ texture.author }}<span>{{ texture.model === 'slim' ? t('common.slimModel') : t('common.defaultModel') }}</span></p></div>
  </article>
</template>
