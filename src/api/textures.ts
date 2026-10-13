import { z } from 'zod';
import { api } from './client';
import { id, kind, model, nullableId, source } from './schemas';

const rawTexture = z.object({
  id,
  name: z.string(),
  type: kind,
  source,
  skinModel: model,
  width: z.number(),
  height: z.number(),
  createdAt: z.string(),
  descriptionMarkdown: z.string().optional().default(''),
  isPublic: z.boolean().optional().default(true),
  sha256: z
    .string()
    .nullish()
    .transform((value) => value ?? ''),
  isFavorited: z.boolean().optional().default(false),
  uploader: z.string().optional(),
  uploaderName: z.string().optional(),
  uploaderId: nullableId,
  dataUrl: z.string().optional(),
  sizeBytes: z.number().optional().default(0),
});
export const textureSchema = rawTexture.transform((texture) => ({
  id: texture.id,
  name: texture.name,
  type: texture.type,
  model: texture.skinModel,
  source: texture.source,
  width: texture.width,
  height: texture.height,
  createdAt: texture.createdAt,
  description: texture.descriptionMarkdown,
  isPublic: texture.isPublic,
  sha256: texture.sha256,
  isFavorited: texture.isFavorited,
  owned: false,
  author: texture.uploader ?? texture.uploaderName ?? '',
  uploaderId: texture.uploaderId,
  image: texture.dataUrl ?? '/api/yggdrasil/textures/' + texture.id.replaceAll('-', '') + '.png',
  sizeBytes: texture.sizeBytes,
}));
export const textureListSchema = z.object({ textures: z.array(textureSchema) });
export const texturePageSchema = textureListSchema.extend({
  page: z.number(),
  pageSize: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
});
export const favoriteSchema = z.object({ textureId: id, isFavorited: z.boolean() });
export const loadOwnedTextures = () => api('texture', textureListSchema);
export const loadFavoriteTextures = () => api('texture/favorite', textureListSchema);
