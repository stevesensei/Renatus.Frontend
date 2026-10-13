<script setup lang="ts">
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
  await operation.run(async()=>{await api('player/'+player.value?.id+'/textures',playerSchema,{method:'put',json:{skinTextureId:skinId.value,capeTextureId:capeId.value,skinModel:{default:0,slim:1}[model.value]}});await loadUserResources();},'角色装扮已保存');
}

</script>
<template>
  <PageHeading eyebrow="角色装扮" :title="player?.name ?? '角色未找到'" description="皮肤披风随便选"><RouterLink to="/players" class="button-link secondary"><ArrowLeft :size="18" />返回角色</RouterLink></PageHeading>
  <Message v-if="!player" severity="error">{{ operation.pending.value ? '正在加载角色…' : operation.error.value || '此角色不存在，请从角色列表重新选择。' }}</Message>
  <div v-else class="settings-grid">
    <section class="panel character-preview">
      <SkinViewer :skin="state.textures.find(t => t.id === skinId)?.image" :cape="state.textures.find(t => t.id === capeId)?.image ?? null" :model="model" />
      <div class="model-picker"><label for="player-model">皮肤模型</label><Select v-model="model" input-id="player-model" :options="[{ label: '默认模型', value: 'default' }, { label: '细手臂', value: 'slim' }]" option-label="label" option-value="value" /></div>
      <Button label="保存装扮" :loading="operation.pending.value" :disabled="operation.pending.value" class="w-full" @click="save" />
    </section>
    <div class="form-stack">
      <section class="panel">
        <div class="section-heading"><div><h2>皮肤</h2><p class="muted">自有材质和已收藏皮肤</p></div><Button text label="清除选择" severity="secondary" @click="skinId = null" /></div>
        <div class="selection-grid">
          <button v-for="texture in skins" :key="texture.id" type="button" :class="['selection-card', { selected: skinId === texture.id }]" :aria-pressed="skinId === texture.id" @click="skinId = skinId === texture.id ? null : texture.id">
            <SkinViewer :skin="texture.image" :model="model" :interactive="false" /><span>{{ texture.name }}</span><Check v-if="skinId === texture.id" class="selection-check" :size="20" />
          </button>
        </div>
      </section>
      <section class="panel">
        <div class="section-heading"><div><h2>披风</h2><p class="muted">超级地球捐赠</p></div><Button text label="清除选择" severity="secondary" @click="capeId = null" /></div>
        <div class="selection-grid">
          <button type="button" :class="['selection-card', 'empty-choice', { selected: capeId === null }]" :aria-pressed="capeId === null" @click="capeId = null"><X :size="28" /><span>不使用披风</span></button>
          <button v-for="texture in capes" :key="texture.id" type="button" :class="['selection-card', { selected: capeId === texture.id }]" :aria-pressed="capeId === texture.id" @click="capeId = capeId === texture.id ? null : texture.id">
            <SkinViewer :cape="texture.image" :interactive="false" /><span>{{ texture.name }}</span><Check v-if="capeId === texture.id" class="selection-check" :size="20" />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
