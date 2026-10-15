<script setup lang="ts">
import { Copy, ExternalLink, GripVertical } from '@lucide/vue';
import { computed, ref } from 'vue';
import { state } from '../data/state';
import { t } from '../i18n';

const copied = ref(false);
const copyFailed = ref(false);
const copying = ref(false);
const apiLocation = computed(() => `${state.site.publicBaseUrl.replace(/\/+$/, '')}/api/yggdrasil`);
const launcherLocation = computed(() => `authlib-injector:yggdrasil-server:${encodeURIComponent(apiLocation.value)}`);

async function copyLocation(): Promise<void> {
  copied.value = false;
  copyFailed.value = false;
  if (!navigator.clipboard) {
    copyFailed.value = true;
    return;
  }
  copying.value = true;
  try {
    await navigator.clipboard.writeText(apiLocation.value);
    copied.value = true;
  } catch (cause) {
    if (!(cause instanceof Error)) throw cause;
    copyFailed.value = true;
  } finally {
    copying.value = false;
  }
}

function beginDrag(event: DragEvent): void {
  event.dataTransfer?.setData('text/plain', launcherLocation.value);
  event.dataTransfer?.setData('text/uri-list', launcherLocation.value);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <section id="launcher" class="launcher-section" aria-labelledby="launcher-title">
    <div class="section-heading">
      <div class="section-heading-copy">
        <p class="eyebrow">{{ t('launcher.eyebrow') }}</p>
        <h2 id="launcher-title">{{ t('launcher.title') }}</h2>
        <p class="muted">{{ t('launcher.description') }}</p>
      </div>
    </div>
    <div class="launcher-grid">
      <section class="panel form-stack">
        <div><h3>{{ t('launcher.authlibTitle') }}</h3><p class="muted">{{ t('launcher.authlibHint') }}</p></div>
        <a class="launcher-config" :href="launcherLocation" draggable="true" :title="t('launcher.open')" @dragstart="beginDrag">
          <GripVertical :size="20" aria-hidden="true" />
          <span><strong>{{ state.site.title }}</strong><small>{{ apiLocation }}</small></span>
          <ExternalLink :size="18" aria-hidden="true" />
        </a>
        <Message v-if="copied" severity="success">{{ t('launcher.copied') }}</Message>
        <Message v-if="copyFailed" severity="error">{{ t('launcher.copyFailed') }}</Message>
        <Button outlined :loading="copying" :disabled="copying" @click="copyLocation"><Copy :size="17" aria-hidden="true" />{{ t('launcher.copy') }}</Button>
      </section>
      <section class="panel form-stack">
        <h3>{{ t('launcher.stepsTitle') }}</h3>
        <ol class="setup-steps"><li>{{ t('launcher.step1') }}</li><li>{{ t('launcher.step2') }}</li><li>{{ t('launcher.step3') }}</li></ol>
        <Message severity="info">{{ t('launcher.secretHint') }}</Message>
        <p class="muted">{{ t('launcher.helpHint') }} <a class="text-link" href="https://docs.hljumc.cn/quickstart/launcher" target="_blank" rel="noopener noreferrer">{{ t('launcher.helpLink') }}</a></p>
      </section>
    </div>
  </section>
</template>
