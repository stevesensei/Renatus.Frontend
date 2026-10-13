import { z } from 'zod';
import { t } from '../i18n';
import type { TextureKind, TexturePreview } from './types';
export class PreviewImageError extends Error {}
const png = z
  .instanceof(File)
  .refine((file) => file.type === 'image/png', t('images.pngRequired'))
  .refine((file) => file.size <= 2 * 1024 * 1024, t('images.pngSizeLimit'));
const avatar = z
  .instanceof(File)
  .refine((file) => ['image/png', 'image/jpeg', 'image/webp'].includes(file.type), t('images.avatarTypes'))
  .refine((file) => file.size <= 1_500_000, t('images.avatarSizeLimit'));
export async function imageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new PreviewImageError(t('images.readFailed')));
    reader.onerror = () => reject(new PreviewImageError(t('images.readFailed')));
    reader.readAsDataURL(file);
  });
}
export async function readAvatar(file: File): Promise<string> {
  const result = avatar.safeParse(file);
  if (!result.success) throw new PreviewImageError(result.error.issues[0]?.message ?? t('images.invalidAvatar'));
  return imageDataUrl(result.data);
}
export async function readPng(
  file: File,
  type: TextureKind,
): Promise<Readonly<Pick<TexturePreview, 'image' | 'width' | 'height' | 'sha256' | 'sizeBytes'>>> {
  const result = png.safeParse(file);
  if (!result.success) throw new PreviewImageError(result.error.issues[0]?.message ?? t('images.invalidPng'));
  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value))
    throw new PreviewImageError(t('images.invalidSignature'));
  const view = new DataView(bytes.buffer);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  const unit = width / 64;
  if (unit < 1 || !Number.isInteger(unit) || (height !== 32 * unit && (type === 'cape' || height !== 64 * unit)))
    throw new PreviewImageError(type === 'cape' ? t('images.capeDimensions') : t('images.skinDimensions'));
  try {
    const decoded = await createImageBitmap(file);
    decoded.close();
  } catch (cause) {
    if (cause instanceof Error) throw new PreviewImageError(t('images.decodeFailed'));
    else throw cause;
  }
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return {
    image: await imageDataUrl(file),
    width,
    height,
    sizeBytes: bytes.length,
    sha256: Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
}
