<script setup lang="ts">
import { t } from '../i18n';
import {
  CrouchAnimation, FlyingAnimation, HitAnimation, IdleAnimation, Render,
  RunningAnimation, WalkingAnimation, WaveAnimation,
} from 'skin3d';
import type { PlayerAnimation } from 'skin3d';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { AnimationName, SkinModel } from '../data/types';
const props = withDefaults(defineProps<{
  readonly skin?: string | undefined;
  readonly cape?: string | null;
  readonly model?: SkinModel;
  readonly animation?: AnimationName | null;
  readonly rotating?: boolean;
  readonly interactive?: boolean;
}>(), { skin: import.meta.env.BASE_URL + 'skins/steve.png', cape: null, model: 'default', animation: null, rotating: false, interactive: true });
const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLDivElement | null>(null);
const error = ref('');
const loading = ref(true);
let viewer: Render | null = null;
let observer: ResizeObserver | null = null;
let destroyed = false;
let textureRevision = 0;
const animations: Readonly<Record<AnimationName, () => PlayerAnimation>> = {
  idle: () => new IdleAnimation(), walk: () => new WalkingAnimation(), run: () => new RunningAnimation(),
  fly: () => new FlyingAnimation(), wave: () => new WaveAnimation('right'),
  crouch: () => new CrouchAnimation(), hit: () => new HitAnimation(),
};
function resize(): void {
  if (viewer === null || container.value === null) return;
  const box = container.value.getBoundingClientRect();
  viewer.width = Math.max(1, Math.round(box.width));
  viewer.height = Math.max(1, Math.round(box.height));
  viewer.zoom = box.width / Math.max(box.height, 1) < 0.8 ? 0.68 : 0.86;
  viewer.render();
}
function animate(): void {
  if (viewer === null) return;
  viewer.autoRotate = props.rotating;
  viewer.animation = props.animation === null ? null : animations[props.animation]();
  viewer.renderPaused = !props.interactive;
  viewer.render();
}
async function textures(): Promise<void> {
  const current = viewer;
  if (current === null) return;
  const revision = ++textureRevision;
  loading.value = true;
  error.value = '';
  try {
    await current.loadSkin(props.skin, { model: props.model });
    if (destroyed || revision !== textureRevision) return;
    if (props.cape === null) current.loadCape(null);
    else await current.loadCape(props.cape, { backEquipment: 'cape' });
    if (destroyed || revision !== textureRevision) return;
    current.playerWrapper.rotation.y = props.cape === null ? 0.24 : Math.PI;
    current.render();
  } catch (cause) {
    if (destroyed) return;
    if (cause instanceof Error) error.value = t('viewer.loadFailed');
    else throw cause;
  } finally {
    if (!destroyed && revision === textureRevision) loading.value = false;
  }
}
onMounted(async () => {
  if (canvas.value === null) return;
  try {
    viewer = new Render({ canvas: canvas.value, width: 1, height: 1, fov: 42, zoom: 0.86, maxPixelRatio: props.interactive ? 2 : 1, renderPaused: !props.interactive, enableControls: props.interactive, materialType: 'standard' });
    viewer.globalLight.intensity = 2.4;
    viewer.cameraLight.intensity = 0.8;
    viewer.controls.enablePan = false;
    observer = new ResizeObserver(resize);
    if (container.value !== null) observer.observe(container.value);
    resize();
    await textures();
    if (!destroyed) animate();
  } catch (cause) {
    if (cause instanceof Error) { error.value = t('viewer.unsupported'); loading.value = false; }
    else throw cause;
  }
});
watch(() => [props.skin, props.cape, props.model], textures);
watch(() => [props.animation, props.rotating], animate);
onBeforeUnmount(() => { destroyed = true; observer?.disconnect(); viewer?.dispose(); });
</script>
<template>
  <div ref="container" class="skin-viewer">
    <canvas ref="canvas" role="img" :aria-label="t('viewer.description')"></canvas>
    <p v-if="loading" class="viewer-state" role="status">{{ t('viewer.loading') }}</p>
    <p v-if="error" class="viewer-state" role="alert">{{ error }}</p>
  </div>
</template>
