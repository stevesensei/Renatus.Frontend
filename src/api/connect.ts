import { z } from 'zod';
import { api, emptyResponse } from './client';
import { id } from './schemas';

export const connectProfileSchema = z.object({ id, name: z.string() });
export const connectInteractionSchema = z.object({
  interactionId: z.string().min(1),
  clientId: z.string(),
  clientName: z.string(),
  scopes: z.array(z.string()),
  profiles: z.array(connectProfileSchema),
  deviceFlow: z.boolean(),
  expiresAt: z.string(),
});
export const connectCompletionSchema = z.object({ completionUrl: z.string().min(1) });
export const connectGrantSchema = z.object({
  authorizationId: id,
  clientId: z.string(),
  clientName: z.string(),
  scopes: z.array(z.string()),
  createdAt: z.string(),
});

export const connectConfigSchema = z.object({
  enabled: z.boolean(),
  issuer: z.string(),
  sharedClientId: z.string(),
  sharedClientRedirectUris: z.array(z.string()).default([]),
  allowImplicitFlow: z.boolean(),
  hasSigningKey: z.boolean(),
  hasEncryptionKey: z.boolean(),
  accessTokenTtlSeconds: z.number().int().min(1),
  refreshTokenTtlSeconds: z.number().int().min(1),
  authorizationCodeTtlSeconds: z.number().int().min(1),
  deviceCodeTtlSeconds: z.number().int().min(1),
  requiresRestart: z.boolean().default(false),
  status: z.enum(['disabled', 'enabled', 'restart-required']).default('disabled'),
});

export const connectClientSchema = z.object({
  clientId: z.string(),
  displayName: z.string(),
  redirectUris: z.array(z.string()),
  confidential: z.boolean(),
  allowImplicitFlow: z.boolean(),
});
export const connectClientSecretSchema = connectClientSchema.extend({ clientSecret: z.string().nullish() });
export const connectClientsSchema = z.array(connectClientSchema);
export const connectGrantsSchema = z.array(connectGrantSchema);

export function loadConnectInteraction(interactionId: string) {
  return api(`connect/interactions/${encodeURIComponent(interactionId)}`, connectInteractionSchema);
}

export function decideConnectInteraction(interactionId: string, approve: boolean, playerId?: string) {
  return api(`connect/interactions/${encodeURIComponent(interactionId)}/decision`, connectCompletionSchema, {
    method: 'post',
    json: { approve, ...(playerId ? { playerId } : {}) },
  });
}

export function revokeConnectGrant(authorizationId: string) {
  return api(`connect/grants/${authorizationId}`, emptyResponse, { method: 'delete' });
}

export function loadConnectConfig() {
  return api('admin/connect/config', connectConfigSchema);
}

export function saveConnectConfig(config: {
  readonly enabled: boolean;
  readonly issuer: string;
  readonly sharedClientId: string;
  readonly sharedClientRedirectUris: readonly string[];
  readonly allowImplicitFlow: boolean;
  readonly replaceSigningKey: boolean;
  readonly replaceEncryptionKey: boolean;
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;
  readonly authorizationCodeTtlSeconds: number;
  readonly deviceCodeTtlSeconds: number;
}) {
  return api('admin/connect/config', connectConfigSchema, { method: 'put', json: config });
}

export function loadConnectClients() {
  return api('admin/connect/clients', connectClientsSchema);
}

export function createConnectClient(client: {
  readonly clientId: string;
  readonly displayName: string;
  readonly redirectUris: readonly string[];
  readonly confidential: boolean;
  readonly allowImplicitFlow: boolean;
}) {
  return api('admin/connect/clients', connectClientSecretSchema, { method: 'post', json: client });
}

export function updateConnectClient(
  clientId: string,
  client: {
    readonly displayName: string;
    readonly redirectUris: readonly string[];
    readonly confidential: boolean;
    readonly allowImplicitFlow: boolean;
  },
) {
  return api(`admin/connect/clients/${encodeURIComponent(clientId)}`, connectClientSchema, {
    method: 'put',
    json: client,
  });
}

export function rotateConnectClientSecret(clientId: string) {
  return api(`admin/connect/clients/${encodeURIComponent(clientId)}/rotate-secret`, connectClientSecretSchema, {
    method: 'post',
  });
}

export function deleteConnectClient(clientId: string) {
  return api(`admin/connect/clients/${encodeURIComponent(clientId)}`, emptyResponse, { method: 'delete' });
}
