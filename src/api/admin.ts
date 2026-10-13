import { z } from 'zod';
import { playerSchema } from './players';
import { id, role } from './schemas';
import { textureSchema } from './textures';

const rawUser = z.object({
  id,
  userName: z.string(),
  nickName: z.string(),
  email: z.string(),
  role,
  preferredLanguage: z.string(),
  maxPlayerCount: z.number(),
  isDisabled: z.boolean(),
  createdAt: z.string(),
});
const toUser = (user: z.infer<typeof rawUser>) => ({
  id: user.id,
  username: user.userName,
  nickname: user.nickName,
  email: user.email,
  role: user.role,
  language: user.preferredLanguage,
  maxPlayers: user.maxPlayerCount,
  disabled: user.isDisabled,
  createdAt: user.createdAt,
});
export const userSchema = rawUser.transform(toUser);
export const userDetailSchema = rawUser
  .extend({
    players: z.array(playerSchema),
    textures: z.array(textureSchema),
    sessions: z.array(z.object({ id, playerName: z.string().nullish(), lastUsedAt: z.string() })),
  })
  .transform((user) => ({ ...toUser(user), players: user.players, textures: user.textures, sessions: user.sessions }));
export const overviewSchema = z.object({
  totalUsers: z.number(),
  totalPlayers: z.number(),
  totalTextures: z.number(),
  totalClients: z.number(),
  recentActivities: z.array(
    z.object({ clientId: id, userName: z.string(), playerName: z.string().nullish(), lastUsedAt: z.string() }),
  ),
});
