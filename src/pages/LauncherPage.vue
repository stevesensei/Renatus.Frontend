<script setup lang="ts">
import { Copy, GripVertical } from '@lucide/vue';
import { computed, ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import { state } from '../data/state';
import { t } from '../i18n';

const copied = ref(false);
const apiLocation = computed(() => `${state.site.publicBaseUrl.replace(/\/$/, '')}/api/yggdrasil/`);

/** Copies the public authlib-injector API location without including account credentials or tokens. */
async function copyLocation(): Promise<void> {
  await navigator.clipboard.writeText(apiLocation.value);
  copied.value = true;
}

/** Supplies launchers with the same public API location through the standard drag data payload. */
function beginDrag(event: DragEvent): void {
  event.dataTransfer?.setData('text/plain', apiLocation.value);
  event.dataTransfer?.setData('text/uri-list', apiLocation.value);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <PageHeading :eyebrow="t('launcher.eyebrow')" :title="t('launcher.title')" :description="t('launcher.description')" />
  <div class="launcher-grid">
    <section class="panel form-stack">
      <div><h2>{{ t('launcher.authlibTitle') }}</h2><p class="muted">{{ t('launcher.authlibHint') }}</p></div>
      <button class="launcher-config" type="button" draggable="true" @dragstart="beginDrag" @click="copyLocation">
        <GripVertical :size="20" /><span><strong>{{ state.site.title }}</strong><small>{{ apiLocation }}</small></span><Copy :size="18" />
      </button>
      <Message v-if="copied" severity="success">{{ t('launcher.copied') }}</Message>
      <Button outlined @click="copyLocation"><Copy :size="17" />{{ t('launcher.copy') }}</Button>
    </section>
    <section class="panel form-stack"><h2>{{ t('launcher.stepsTitle') }}</h2>
      <ol class="setup-steps"><li>{{ t('launcher.step1') }}</li><li>{{ t('launcher.step2') }}</li><li>{{ t('launcher.step3') }}</li></ol>
      <Message severity="info">{{ t('launcher.secretHint') }}</Message>
    </section>
  </div>
</template>
