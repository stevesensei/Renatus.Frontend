<script setup lang="ts">
import { t } from '../i18n';
import {Plus, Settings2, Trash2, Users} from '@lucide/vue';
import {computed, onMounted, reactive, ref} from 'vue';
import {RouterLink} from 'vue-router';
import ConfirmAction from '../components/ConfirmAction.vue';
import PageHeading from '../components/PageHeading.vue';
import SkinViewer from '../components/SkinViewer.vue';
import {state} from '../data/state';
import type {PlayerPreview} from '../data/types';
import {api, emptyResponse} from '../api/client';
import {playerSchema} from '../api/players';
import {loadUserResources} from '../api/resources';
import {useOperation} from '../composables/operation';

const operation = useOperation();
const create = ref(false);
const deleting = ref(false);
const deleteId = ref('');
const error = operation.error;
const draft = reactive<Pick<PlayerPreview, 'name' | 'model' | 'skinId' | 'capeId'>>({
  name: '',
  model: 'default',
  skinId: null,
  capeId: null
});
const maximum = computed(() => state.maxPlayers);
const owned = computed(() => state.players);
const skins = computed(() => state.textures.filter((texture) => texture.type === 'skin'));
const capes = computed(() => state.textures.filter((texture) => texture.type === 'cape'));
const models = [{label: t('common.defaultModel'), value: 'default'}, {label: t('common.slimModel'), value: 'slim'}];
onMounted(() => operation.run(loadUserResources));

async function save(): Promise<void> {
  await operation.run(async () => {
    await api('player', playerSchema, {
      method: 'post',
      json: {
        name: draft.name.trim(),
        skinModel: {default: 0, slim: 1}[draft.model],
        skinTextureId: draft.skinId,
        capeTextureId: draft.capeId
      }
    });
    await loadUserResources();
    create.value = false;
    draft.name = '';
  }, t('players.created'));
}

async function remove(): Promise<void> {
  await operation.run(async () => {
    await api('player/' + deleteId.value, emptyResponse, {method: 'delete'});
    await loadUserResources();
  }, t('players.deleted'));
}

</script>
<template>
  <PageHeading :eyebrow="t('players.eyebrow')" :title="t('nav.myPlayers')" :description="t('players.description')">
    <Button :disabled="owned.length >= maximum" @click="create = true; error = ''">
      <Plus :size="18"/>{{ t('players.create') }}</Button>
  </PageHeading>
  <div class="quota-bar">
    <Users :size="18"/>
    <span>{{ t('players.quotaPrefix') }}<strong>{{owned.length}}</strong>{{ t('players.quotaRemaining', { maximum: maximum }) }}</span><span
      class="muted">{{ t('players.quotaHint') }}</span></div>
  <div v-if="owned.length" class="player-grid">
    <article v-for="player in owned" :key="player.id" class="player-card">
      <div class="player-stage">
        <SkinViewer :skin="state.textures.find(t => t.id === player.skinId)?.image"
                    :cape="state.textures.find(t => t.id === player.capeId)?.image ?? null" :model="player.model"
                    :interactive="false"/>
      </div>
      <div class="player-caption"><h2>{{player.name}}</h2>
        <p class="muted">{{ t('players.summary', { value1: player.model === 'slim' ? t('players.slimModel') : t('common.defaultModel'), value2: player.createdAt }) }}</p>
        <div class="inline-actions">
          <RouterLink :to="'/players/' + player.id + '/settings'" class="button-link secondary">
            <Settings2 :size="16"/>{{ t('players.settings') }}</RouterLink>
          <Button text severity="danger" :aria-label="t('players.deletePrefix') + player.name"
                  @click="deleteId = player.id; deleting = true">
            <Trash2 :size="17"/>
          </Button>
        </div>
      </div>
    </article>
  </div>
  <div v-else class="panel empty-state">
    <Users :size="44"/>
    <h2>{{ t('players.emptyTitle') }}</h2>
    <p class="muted">{{ t('players.emptyDescription') }}</p>
    <Button :label="t('players.create')" @click="create = true"/>
  </div>
  <Dialog v-model:visible="create" :header="t('players.create')" modal class="compact-dialog">
    <form id="create-player" class="form-stack" @submit.prevent="save"><label class="field">{{ t('common.playerName') }}<InputText v-model="draft.name" required maxlength="16" :placeholder="t('players.namePlaceholder')"/>
    </label><label class="field">{{ t('common.skinModel') }}<Select v-model="draft.model" :options="models" option-label="label"
                                                 option-value="value"/></label><label class="field">{{ t('common.skin') }}<Select
        v-model="draft.skinId" :options="skins" option-label="name" option-value="id" show-clear
        :placeholder="t('players.defaultSkin')"/></label><label class="field">{{ t('common.cape') }}<Select v-model="draft.capeId" :options="capes"
                                                                             option-label="name" option-value="id"
                                                                             show-clear
                                                                             :placeholder="t('playerSettings.noCape')"/></label>
      <Message v-if="error" severity="error">{{error}}</Message>
    </form>
    <template #footer>
      <Button outlined severity="secondary" :label="t('common.cancel')" @click="create = false"/>
      <Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" form="create-player"
              :label="t('players.create')"/>
    </template>
  </Dialog>
  <ConfirmAction v-model:visible="deleting" :title="t('players.delete')" :description="t('players.deleteConfirmation')"
                 @confirm="remove"/>
</template>
