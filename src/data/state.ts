import { reactive } from 'vue';
import type { z } from 'zod';
import type { accountSchema, adminSiteSchema, announcementSchema } from '../api/schemas';
import { t } from '../i18n';
import type { PlayerPreview, TexturePreview, UserPreview } from './types';

interface AppState {
  account: z.infer<typeof accountSchema>;
  players: PlayerPreview[];
  textures: TexturePreview[];
  users: UserPreview[];
  maxPlayers: number;
  site: z.infer<typeof adminSiteSchema>;
  announcements: { login: z.infer<typeof announcementSchema>; site: z.infer<typeof announcementSchema> };
}
export const state = reactive<AppState>({
  account: { id: '', username: '', nickname: '', email: '', avatar: '', role: 'Player' },
  players: [],
  textures: [],
  users: [],
  maxPlayers: 0,
  site: {
    title: t('app.name'),
    description: '',
    heroImage: '',
    publicBaseUrl: '',
    buttons: [],
    copyright: '',
    icpRegistrationNumber: '',
  },
  announcements: { login: { title: '', body: '', image: '' }, site: { title: '', body: '', image: '' } },
});
export function resetPrivateState(): void {
  state.account = { id: '', username: '', nickname: '', email: '', avatar: '', role: 'Player' };
  state.players = [];
  state.textures = [];
  state.users = [];
  state.maxPlayers = 0;
}
