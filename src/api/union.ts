import { z } from 'zod';
import { api, emptyResponse } from './client';
import { id } from './schemas';

const centerObject = z.object({}).catchall(z.unknown());

export const unionMemberProfileSchema = z.object({
  internal_id: z.union([z.string(), z.number()]).optional(),
  name: z.string().nullish(),
  bind_mapped_name: z.string().nullish(),
  mapped_name: z.string().nullish(),
  uuid: z.string().nullish(),
  mapped_uuid: z.string().nullish(),
  backend: z.string().nullish(),
  backend_name: z.string().nullish(),
  backend_scopes: z.object({ self: z.string().nullish() }).nullish(),
  bind_status: z.number().int().nullish(),
});

const unionProfileDetailSchema = unionMemberProfileSchema.extend({
  bind: z.array(unionMemberProfileSchema).default([]),
});

export const unionProfileSchema = z.object({
  playerId: id,
  minecraftUuid: id,
  name: z.string(),
  detail: unionProfileDetailSchema.nullish(),
  conflicts: z.array(unionMemberProfileSchema),
});

export const unionProfilesSchema = z.object({ profiles: z.array(unionProfileSchema) });
export const unionDirectorySchema = z.object({ servers: z.array(centerObject) });
export const unionSecuritySchema = z.object({ level: z.union([z.string(), z.number()]) });
export const unionBindTokenSchema = z.object({ token: z.string().min(1) });
export const unionInteractionSchema = z.object({
  interactionId: z.string().min(1),
  expiresAt: z.string(),
  continuation: centerObject,
});
export const unionInteractionResultSchema = z.object({ redirectUri: z.url() });

export const unionStatusSchema = z.object({
  enabled: z.boolean(),
  serverListVersion: z.number().int(),
  privateKeyVersion: z.number().int(),
  needsProfileSync: z.boolean(),
  lastProfileSyncAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  lastProfileSyncError: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
});

export const unionSettingsSchema = z
  .object({
    enabled: z.boolean(),
    apiRoot: z.string(),
    memberCode: z.string(),
    hasMemberKey: z.boolean(),
    requestTimeoutSeconds: z.number().int().min(1),
    oAuth2Enabled: z.boolean().default(false),
    hasOAuth2SigningKey: z.boolean().default(false),
    oAuth2ConsentPath: z.string().default('/oauth/union/consent'),
  })
  .transform(({ oAuth2Enabled, oAuth2ConsentPath, ...settings }) => ({
    ...settings,
    oauth2Enabled: oAuth2Enabled,
    oauth2ConsentPath: oAuth2ConsentPath,
  }));

export const unionOperationSchema = z.object({
  status: z.string(),
  statusCode: z.number().int().nullable().optional(),
  data: z.unknown().optional(),
});

export const unionBlacklistSchema = centerObject;
export const activityItemSchema = z.object({
  id: id,
  action: z.string(),
  userId: id.nullish().transform((value) => value ?? null),
  userName: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  playerId: id.nullish().transform((value) => value ?? null),
  playerName: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  parameters: centerObject.nullish().transform((value) => value ?? null),
  ipAddress: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  createdAt: z.string(),
});
export const activityPageSchema = z.object({
  items: z.array(activityItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});

export function loadUnionProfiles() {
  return api('union/profiles', unionProfilesSchema);
}

export function loadUnionDirectory() {
  return api('union/directory', unionDirectorySchema);
}

export function loadUnionSecurity() {
  return api('union/security-level', unionSecuritySchema);
}

export function createBindToken(playerId: string) {
  return api(`union/profiles/${playerId}/bind-token`, unionBindTokenSchema, { method: 'post' });
}

export function bindUnionProfile(playerId: string, token: string) {
  return api(`union/profiles/${playerId}/bind`, emptyResponse, { method: 'post', json: { token } });
}

export function unbindUnionProfile(playerId: string) {
  return api(`union/profiles/${playerId}/unbind`, emptyResponse, { method: 'post' });
}

export function remapUnionProfile(playerId: string, targetMinecraftUuid: string) {
  return api(`union/profiles/${playerId}/remap`, emptyResponse, {
    method: 'post',
    json: { targetMinecraftUuid },
  });
}

export function loadUnionInteraction(interactionId: string) {
  return api(`union/oauth2/interactions/${encodeURIComponent(interactionId)}`, unionInteractionSchema);
}

export function decideUnionInteraction(interactionId: string, approve: boolean) {
  return api(`union/oauth2/interactions/${encodeURIComponent(interactionId)}`, unionInteractionResultSchema, {
    method: 'post',
    json: { approve },
  });
}

export function loadUnionAdminStatus() {
  return api('admin/union/member/status', unionStatusSchema);
}

export function loadUnionAdminSettings() {
  return api('admin/union/member/settings', unionSettingsSchema);
}

export function saveUnionAdminSettings(settings: {
  readonly enabled: boolean;
  readonly apiRoot: string;
  readonly memberCode: string;
  readonly memberKey?: string;
  readonly requestTimeoutSeconds: number;
  readonly oauth2Enabled: boolean;
  readonly oauth2ConsentPath: string;
}) {
  return api('admin/union/member/settings', unionSettingsSchema, { method: 'put', json: settings });
}

export function runUnionAdminAction(action: 'updatelist' | 'updateprivatekey' | 'sync') {
  return api(`admin/union/member/${action}`, emptyResponse, { method: 'post' });
}

export function diagnoseUnion() {
  return api('admin/union/member/diagnose', unionOperationSchema, { method: 'post' });
}

export function loadUnionBlacklist(query: string, page: number) {
  return api('admin/union/blacklist', unionBlacklistSchema, { searchParams: { q: query, page } });
}

export function createUnionBlacklistEntry(email: string, reason: string) {
  return api('admin/union/blacklist', emptyResponse, { method: 'post', json: { email, reason } });
}

export function invalidateUnionBlacklistEntry(entryId: number) {
  return api(`admin/union/blacklist/${entryId}/invalidate`, emptyResponse, { method: 'post' });
}

export function deleteUnionBlacklistEntry(entryId: number) {
  return api(`admin/union/blacklist/${entryId}`, emptyResponse, { method: 'delete' });
}

export function loadActivity(admin: boolean, page: number, pageSize = 20) {
  return api(`${admin ? 'admin/' : ''}union/activity`, activityPageSchema, { searchParams: { page, pageSize } });
}
