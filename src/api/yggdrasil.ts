import { z } from 'zod';
import { api } from './client';

export const yggdrasilConfigSchema = z.object({
  authServerEnabled: z.boolean(),
  uuidAlgorithm: z.enum(['v3', 'v4']),
  accessTokenExpireHours: z.number().int().min(1).max(720),
  refreshTokenExpireHours: z.number().int().min(1).max(2160),
  joinSessionTtlSeconds: z.number().int().min(1).max(300),
  maxProfileLookupCount: z.number().int().min(1).max(1000),
  maxActiveSessions: z.number().int().min(1).max(100),
  authenticationRateLimitMilliseconds: z.number().int().min(1).max(60000),
  nonEmailLogin: z.boolean(),
  usernameCheck: z.boolean(),
});

export function loadYggdrasilConfig() {
  return api('admin/yggdrasil/config', yggdrasilConfigSchema);
}

/** Sends only the public configuration allowlist; keys and metadata cannot enter the payload. */
export function saveYggdrasilConfig(config: z.infer<typeof yggdrasilConfigSchema>) {
  return api('admin/yggdrasil/config', yggdrasilConfigSchema, {
    method: 'put',
    json: yggdrasilConfigSchema.parse(config),
  });
}
