<script setup lang="ts">
import { t } from '../i18n';
import {ArrowLeft, Upload} from '@lucide/vue';
import {computed, reactive, ref, shallowRef, watch} from 'vue';
import {RouterLink, useRouter} from 'vue-router';
import MarkdownContent from '../components/MarkdownContent.vue';
import PageHeading from '../components/PageHeading.vue';
import SkinViewer from '../components/SkinViewer.vue';
import {animationOptions} from '../data/animations';
import {PreviewImageError, readPng} from '../data/images';
import type {AnimationName, TexturePreview} from '../data/types';
import {api} from '../api/client';
import {textureSchema} from '../api/textures';
import {useOperation} from '../composables/operation';

const operation = useOperation();
const router = useRouter();
const form = reactive<Pick<TexturePreview, 'name' | 'type' | 'source' | 'model' | 'description'>>({
  name: '',
  type: 'skin',
  source: 'original',
  model: 'default',
  description: ''
});
const privateTexture = ref(false);
const file = shallowRef<File | null>(null);
const image = ref<Readonly<Pick<TexturePreview, 'image' | 'width' | 'height' | 'sha256' | 'sizeBytes'>> | null>(null);
const error = operation.error;
const animation = ref<AnimationName | null>(null);
const markdownPreview = ref(false);
const fallback = import.meta.env.BASE_URL + 'skins/steve.png';
const skin = computed(() => form.type === 'skin' ? image.value?.image ?? fallback : fallback);
let revision = 0;

async function load(): Promise<void> {
  const selected = file.value;
  if (selected === null) return;
  const current = ++revision;
  error.value = '';
  image.value = null;
  try {
    const result = await readPng(selected, form.type);
    if (current === revision) image.value = result;
  } catch (cause) {
    if (cause instanceof PreviewImageError) error.value = cause.message; else throw cause;
  }
}

async function selectFile(event: Event): Promise<void> {
  if (!(event.target instanceof HTMLInputElement)) return;
  file.value = event.target.files?.[0] ?? null;
  await load();
}

watch(() => form.type, load);

async function publish(): Promise<void> {
  const selected = image.value;
  if (selected === null) return;
  await operation.run(async () => {
    const texture = await api('texture', textureSchema, {
      method: 'post',
      json: {
        name: form.name,
        type: {skin: 0, cape: 1}[form.type],
        skinModel: {default: 0, slim: 1}[form.model],
        source: {original: 0, repost: 1}[form.source],
        descriptionMarkdown: form.description,
        isPublic: !privateTexture.value,
        dataBase64: selected.image
      }
    });
    await router.push({path: '/texture/preview', query: {id: texture.id}});
  }, t('upload.published'));
}

</script>
<template>
  <PageHeading :eyebrow="t('upload.eyebrow')" :title="t('nav.uploadTexture')" :description="t('upload.description')">
    <RouterLink to="/textures" class="button-link secondary">
      <ArrowLeft :size="18"/>{{ t('nav.backToTextures') }}</RouterLink>
  </PageHeading>
  <div class="upload-grid">
    <form class="panel form-stack" @submit.prevent="publish">
      <div><h2>{{ t('textureDetails.information') }}</h2>
        <p class="muted">{{ t('upload.informationDescription') }}</p></div>
      <label class="field">{{ t('common.textureName') }}<InputText v-model="form.name" required maxlength="80" :placeholder="t('upload.namePlaceholder')"/>
      </label>
      <div class="form-grid"><label class="field">{{ t('common.textureType') }}<Select v-model="form.type"
                                                                  :options="[{label:t('common.skin'),value:'skin'},{label:t('common.cape'),value:'cape'}]"
                                                                  option-label="label"
                                                                  option-value="value"/></label><label class="field">{{ t('common.source') }}<Select
          v-model="form.source" :options="[{label:t('common.original'),value:'original'},{label:t('common.repost'),value:'repost'}]" option-label="label" option-value="value"/></label></div>
      <label v-if="form.type === 'skin'" class="field">{{ t('common.skinModel') }}<Select v-model="form.model"
                                                                       :options="[{label:t('common.defaultModel'),value:'default'},{label:t('common.slimModel'),value:'slim'}]"
                                                                       option-label="label"
                                                                       option-value="value"/></label>
      <div class="field"><label for="texture-description">{{ t('common.textureDescription') }}</label>
        <div class="inline-actions">
          <Button type="button" size="small" :text="markdownPreview" :label="t('common.edit')" @click="markdownPreview = false"/>
          <Button type="button" size="small" :text="!markdownPreview" :label="t('common.preview')" @click="markdownPreview = true"/>
        </div>
        <MarkdownContent v-if="markdownPreview" :content="form.description || t('upload.emptyDescription')"/>
        <Textarea v-else id="texture-description" v-model="form.description" rows="5" maxlength="4000"
                  :placeholder="t('upload.descriptionPlaceholder')"/><span class="muted small">{{ t('upload.descriptionCount', { value1: form.description.length }) }}</span>
      </div>
      <label class="upload-dropzone">
        <Upload :size="28"/>
        <strong>{{ file?.name ?? t('upload.chooseFile') }}</strong><span>{{ t('upload.fileHint', { value1: form.type === 'skin' ? t('upload.skinDimensionsHint') : t('upload.capeDimensionsHint') }) }}</span><input
          type="file" accept=".png,image/png" required @change="selectFile"/></label>
      <Message v-if="error" severity="error">{{error}}</Message>
      <div class="visibility-row">
        <div><label for="private-texture">{{ t('upload.private') }}</label>
          <p class="muted small">{{ t('upload.publicHint') }}</p></div>
        <ToggleSwitch v-model="privateTexture" input-id="private-texture"/>
      </div>
      <Button type="submit" :loading="operation.pending.value" :disabled="image === null || !form.name.trim()"
              :label="t('upload.publish')"/>
    </form>
    <section class="panel upload-preview">
      <div class="section-heading"><h2>{{ t('upload.livePreview') }}</h2>
        <Tag :value="t('common.threeDimensional')" severity="secondary"/>
      </div>
      <div class="large-skin-stage">
        <SkinViewer :skin="skin" :cape="form.type === 'cape' ? image?.image ?? null : null"
                    :model="form.type === 'cape' ? 'default' : form.model" :animation="animation"/>
      </div>
      <p class="muted small center">{{ t('viewer.controlsHint') }}</p>
      <div class="animation-buttons">
        <Button v-for="item in animationOptions" :key="String(item.value)" :label="item.label" size="small"
                :outlined="animation !== item.value" @click="animation = item.value"/>
      </div>
    </section>
  </div>
</template>
