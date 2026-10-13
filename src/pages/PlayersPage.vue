<script setup lang="ts">
import { Plus, Settings2, Trash2, Users } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import ConfirmAction from '../components/ConfirmAction.vue';
import PageHeading from '../components/PageHeading.vue';
import SkinViewer from '../components/SkinViewer.vue';
import { state } from '../data/state';
import type { PlayerPreview } from '../data/types';
import { api, emptyResponse } from '../api/client';
import { playerSchema } from '../api/players';
import { loadUserResources } from '../api/resources';
import { useOperation } from '../composables/operation';
const operation = useOperation();
const create = ref(false); const deleting = ref(false); const deleteId = ref('');
const error = operation.error;
const draft = reactive<Pick<PlayerPreview,'name'|'model'|'skinId'|'capeId'>>({name:'',model:'default',skinId:null,capeId:null});
const maximum = computed(() => state.maxPlayers);
const owned = computed(() => state.players);
const skins = computed(() => state.textures.filter((texture) => texture.type==='skin'));
const capes = computed(() => state.textures.filter((texture) => texture.type==='cape'));
const models = [{label:'默认模型',value:'default'},{label:'细手臂',value:'slim'}];
onMounted(() => operation.run(loadUserResources));
async function save(): Promise<void> {
  await operation.run(async () => {
    await api('player',playerSchema,{method:'post',json:{name:draft.name.trim(),skinModel:{default:0,slim:1}[draft.model],skinTextureId:draft.skinId,capeTextureId:draft.capeId}});
    await loadUserResources(); create.value=false; draft.name='';
  }, '角色已创建');
}
async function remove(): Promise<void> { await operation.run(async () => {await api('player/'+deleteId.value,emptyResponse,{method:'delete'});await loadUserResources();},'角色已删除'); }

</script>
<template>
  <PageHeading eyebrow="你的 Minecraft 身份" title="我的角色" description="选择你的装扮，继续属于这个角色的故事。"><Button :disabled="owned.length >= maximum" @click="create = true; error = ''"><Plus :size="18" />创建角色</Button></PageHeading>
  <div class="quota-bar"><Users :size="18" /><span>已创建 <strong>{{ owned.length }}</strong> / {{ maximum }} 个角色</span><span class="muted">每个角色，都是一段不同的冒险。</span></div>
  <div v-if="owned.length" class="player-grid"><article v-for="player in owned" :key="player.id" class="player-card"><div class="player-stage"><SkinViewer :skin="state.textures.find(t => t.id === player.skinId)?.image" :cape="state.textures.find(t => t.id === player.capeId)?.image ?? null" :model="player.model" :interactive="false" /></div><div class="player-caption"><h2>{{ player.name }}</h2><p class="muted">{{ player.model === 'slim' ? '细手臂模型' : '默认模型' }} · {{ player.createdAt }}</p><div class="inline-actions"><RouterLink :to="'/players/' + player.id + '/settings'" class="button-link secondary"><Settings2 :size="16" />角色设置</RouterLink><Button text severity="danger" :aria-label="'删除 ' + player.name" @click="deleteId = player.id; deleting = true"><Trash2 :size="17" /></Button></div></div></article></div>
  <div v-else class="panel empty-state"><Users :size="44" /><h2>你的旅程还未开始</h2><p class="muted">创建第一个 Minecraft 角色。</p><Button label="创建角色" @click="create = true" /></div>
  <Dialog v-model:visible="create" header="创建角色" modal class="compact-dialog"><form id="create-player" class="form-stack" @submit.prevent="save"><label class="field">角色名称<InputText v-model="draft.name" required maxlength="16" placeholder="Minecraft 玩家名" /></label><label class="field">皮肤模型<Select v-model="draft.model" :options="models" option-label="label" option-value="value" /></label><label class="field">皮肤<Select v-model="draft.skinId" :options="skins" option-label="name" option-value="id" show-clear placeholder="使用默认皮肤" /></label><label class="field">披风<Select v-model="draft.capeId" :options="capes" option-label="name" option-value="id" show-clear placeholder="不使用披风" /></label><Message v-if="error" severity="error">{{ error }}</Message></form><template #footer><Button outlined severity="secondary" label="取消" @click="create = false" /><Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="create-player" label="创建角色" /></template></Dialog>
  <ConfirmAction v-model:visible="deleting" title="删除角色" description="确定删除此角色？此操作无法撤销。" @confirm="remove" />
</template>
