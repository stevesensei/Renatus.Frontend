import { z } from 'zod';
export const id = z.uuid();
export const nullableId = id.nullish().transform((value) => value ?? null);
export const role = z
  .union([z.literal(0), z.literal(1)])
  .transform((value) => (({ 0: 'Player', 1: 'Admin' }) as const)[value]);
export const model = z
  .union([z.literal(0), z.literal(1)])
  .transform((value) => (({ 0: 'default', 1: 'slim' }) as const)[value]);
export const kind = z
  .union([z.literal(0), z.literal(1)])
  .transform((value) => (({ 0: 'skin', 1: 'cape' }) as const)[value]);
export const source = z
  .union([z.literal(0), z.literal(1)])
  .transform((value) => (({ 0: 'original', 1: 'repost' }) as const)[value]);
export const accountSchema = z
  .object({
    id,
    username: z.string(),
    nickName: z.string(),
    email: z.string(),
    avatarBase64: z.string().nullish(),
    role,
  })
  .transform((user) => ({
    id: user.id,
    username: user.username,
    nickname: user.nickName,
    email: user.email,
    avatar: user.avatarBase64 ?? '',
    role: user.role,
  }));
export const announcementSchema = z.object({ title: z.string(), body: z.string(), image: z.string() });
export const buttonSchema = z.object({
  label: z.string(),
  url: z.string(),
  style: z
    .string()
    .nullish()
    .transform((value) => value ?? 'filled'),
  target: z
    .string()
    .nullish()
    .transform((value) => value ?? '_self'),
});
export const siteSchema = z.object({
  title: z.string(),
  description: z.string(),
  heroImage: z.string(),
  buttons: z.array(buttonSchema),
  copyright: z.string().default(''),
  icpRegistrationNumber: z.string().default(''),
  apiBaseUrl: z.string(),
  loginAnnouncement: announcementSchema,
  siteAnnouncement: announcementSchema,
});
export const adminSiteSchema = z.object({
  title: z.string(),
  description: z.string(),
  heroImage: z.string(),
  publicBaseUrl: z.string(),
  buttons: z.array(buttonSchema),
  copyright: z.string().default(''),
  icpRegistrationNumber: z.string().default(''),
});
export const authSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.string(),
  user: z.object({ id, username: z.string(), nickName: z.string(), email: z.string(), role }),
});
export const sessionKeySchema = z.object({ sessionKeyId: id, publicKey: z.string(), expiresAt: z.string() });
export const registrationSchema = z.object({ expiresAt: z.string(), resendAfterSeconds: z.number().int().min(0) });
export function pageSchema<T>(item: z.ZodType<T>) {
  return z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  });
}
