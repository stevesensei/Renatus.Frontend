<script setup lang="ts">
import { t } from '../i18n';
import { ArrowLeft, Check, X } from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import SkinViewer from '../components/SkinViewer.vue';
import { state } from '../data/state';
import type { SkinModel } from '../data/types';
import { api } from '../api/client';
import { playerSchema } from '../api/players';
import { loadUserResources } from '../api/resources';
import { useOperation } from '../composables/operation';
const route=useRoute();const operation=useOperation();
const player=computed(()=>state.players.find((item)=>item.id===route.params['id']));
const skinId=ref<string|null>(null);const capeId=ref<string|null>(null);const model=ref<SkinModel>('default');
const skins=computed(()=>state.textures.filter((texture)=>texture.type==='skin'));
const capes=computed(()=>state.textures.filter((texture)=>texture.type==='cape'));
async function load():Promise<void>{await operation.run(async()=>{await loadUserResources();skinId.value=player.value?.skinId??null;capeId.value=player.value?.capeId??null;model.value=player.value?.model??'default';});}
onMounted(load);watch(()=>route.params['id'],load);
async function save():Promise<void>{
  if(player.value===undefined)return;
  await operation.run(async()=>{await api('player/'+player.value?.id+'/textures',playerSchema,{method:'put',json:{skinTextureId:skinId.value,capeTextureId:capeId.value,skinModel:{default:0,slim:1}[model.value]}});await loadUserResources();},t('playerSettings.saved'));
}

</script>
<template>
  <PageHeading :eyebrow="t('playerSettings.eyebrow')" :title="player?.name ?? t('playerSettings.notFound')" :description="t('playerSettings.description')"><RouterLink to="/players" class="button-link secondary"><ArrowLeft :size="18" />{{ t('nav.backToPlayers') }}</RouterLink></PageHeading>
  <Message v-if="!player" severity="error">{{ operation.pending.value ? t('playerSettings.loading') : operation.error.value || t('playerSettings.missing') }}</Message>
  <div v-else class="settings-grid">
    <section class="panel character-preview">
      <SkinViewer :skin="state.textures.find(t => t.id === skinId)?.image" :cape="state.textures.find(t => t.id === capeId)?.image ?? null" :model="model" />
      <div class="model-picker"><label for="player-model">{{ t('common.skinModel') }}</label><Select v-model="model" input-id="player-model" :options="[{ label: t('common.defaultModel'), value: 'default' }, { label: t('common.slimModel'), value: 'slim' }]" option-label="label" option-value="value" /></div>
      <Button :label="t('playerSettings.save')" :loading="operation.pending.value" :disabled="operation.pending.value" class="w-full" @click="save" />
    </section>
    <div class="form-stack">
      <section class="panel">
        <div class="section-heading"><div><h2>{{ t('common.skin') }}</h2><p class="muted">{{ t('playerSettings.skinDescription') }}</p></div><Button text :label="t('playerSettings.clear')" severity="secondary" @click="skinId = null" /></div>
        <div class="selection-grid">
          <button v-for="texture in skins" :key="texture.id" type="button" :class="['selection-card', { selected: skinId === texture.id }]" :aria-pressed="skinId === texture.id" @click="skinId = skinId === texture.id ? null : texture.id">
            <SkinViewer :skin="texture.image" :model="model" :interactive="false" /><span>{{ texture.name }}</span><Check v-if="skinId === texture.id" class="selection-check" :size="20" />
          </button>
        </div>
      </section>
      <section class="panel">
        <div class="section-heading"><div><h2>{{ t('common.cape') }}</h2><p class="muted">{{ t('playerSettings.capeDescription') }}</p></div><Button text :label="t('playerSettings.clear')" severity="secondary" @click="capeId = null" /></div>
        <div class="selection-grid">
          <button type="button" :class="['selection-card', 'empty-choice', { selected: capeId === null }]" :aria-pressed="capeId === null" @click="capeId = null"><X :size="28" /><span>{{ t('playerSettings.noCape') }}</span></button>
          <button v-for="texture in capes" :key="texture.id" type="button" :class="['selection-card', { selected: capeId === texture.id }]" :aria-pressed="capeId === texture.id" @click="capeId = capeId === texture.id ? null : texture.id">
            <SkinViewer :cape="texture.image" :interactive="false" /><span>{{ texture.name }}</span><Check v-if="capeId === texture.id" class="selection-check" :size="20" />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
