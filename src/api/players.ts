import { z } from 'zod';
import { api } from './client';
import { id, model, nullableId } from './schemas';
export const playerSchema = z
  .object({
    id,
    name: z.string(),
    skinModel: model,
    skinTextureId: nullableId,
    capeTextureId: nullableId,
    createdAt: z.string(),
    userId: nullableId,
    userName: z.string().optional().default(''),
  })
  .transform((player) => ({
    id: player.id,
    name: player.name,
    model: player.skinModel,
    skinId: player.skinTextureId,
    capeId: player.capeTextureId,
    createdAt: player.createdAt,
    owner: player.userId ?? '',
    ownerName: player.userName,
  }));
export const playerListSchema = z.object({ players: z.array(playerSchema), maxPlayerCount: z.number() });
export const loadPlayers = () => api('player', playerListSchema);
