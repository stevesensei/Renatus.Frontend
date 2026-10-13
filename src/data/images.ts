import { z } from 'zod';
import type { TextureKind, TexturePreview } from './types';
export class PreviewImageError extends Error {}
const png = z
  .instanceof(File)
  .refine((file) => file.type === 'image/png', '请选择 PNG 图片。')
  .refine((file) => file.size <= 2 * 1024 * 1024, 'PNG 文件不能超过 2 MiB。');
const avatar = z
  .instanceof(File)
  .refine((file) => ['image/png', 'image/jpeg', 'image/webp'].includes(file.type), '头像支持 PNG、JPEG 或 WebP。')
  .refine((file) => file.size <= 1_500_000, '头像不能超过 1.5 MB。');
export async function imageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new PreviewImageError('图片读取失败。'));
    reader.onerror = () => reject(new PreviewImageError('图片读取失败。'));
    reader.readAsDataURL(file);
  });
}
export async function readAvatar(file: File): Promise<string> {
  const result = avatar.safeParse(file);
  if (!result.success) throw new PreviewImageError(result.error.issues[0]?.message ?? '头像格式无效。');
  return imageDataUrl(result.data);
}
export async function readPng(
  file: File,
  type: TextureKind,
): Promise<Readonly<Pick<TexturePreview, 'image' | 'width' | 'height' | 'sha256' | 'sizeBytes'>>> {
  const result = png.safeParse(file);
  if (!result.success) throw new PreviewImageError(result.error.issues[0]?.message ?? 'PNG 格式无效。');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value))
    throw new PreviewImageError('文件不是有效的 PNG 图片。');
  const view = new DataView(bytes.buffer);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  const unit = width / 64;
  if (unit < 1 || !Number.isInteger(unit) || (height !== 32 * unit && (type === 'cape' || height !== 64 * unit)))
    throw new PreviewImageError(type === 'cape' ? '披风尺寸应为 64n × 32n。' : '皮肤尺寸应为 64n × 32n 或 64n × 64n。');
  try {
    const decoded = await createImageBitmap(file);
    decoded.close();
  } catch (cause) {
    if (cause instanceof Error) throw new PreviewImageError('PNG 图片无法解码，请选择完整的图片文件。');
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
