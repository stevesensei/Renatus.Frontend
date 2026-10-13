import { t } from '../i18n';
export const animationOptions = [
  { label: t('animations.still'), value: null },
  { label: t('animations.idle'), value: 'idle' },
  { label: t('animations.walk'), value: 'walk' },
  { label: t('animations.run'), value: 'run' },
  { label: t('animations.fly'), value: 'fly' },
  { label: t('animations.wave'), value: 'wave' },
  { label: t('animations.crouch'), value: 'crouch' },
  { label: t('animations.hit'), value: 'hit' },
] as const;
