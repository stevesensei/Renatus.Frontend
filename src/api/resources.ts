import { state } from '../data/state';
import { loadPlayers } from './players';
import { loadFavoriteTextures, loadOwnedTextures } from './textures';
export async function loadUserResources(): Promise<void> {
  const [players, owned, favorite] = await Promise.all([loadPlayers(), loadOwnedTextures(), loadFavoriteTextures()]);
  state.players = players.players.map((player) => ({
    ...player,
    owner: state.account.id,
    ownerName: state.account.username,
  }));
  state.maxPlayers = players.maxPlayerCount;
  const entries = new Map(favorite.textures.map((texture) => [texture.id, { ...texture, isFavorited: true }]));
  for (const texture of owned.textures)
    entries.set(texture.id, {
      ...texture,
      author: state.account.nickname,
      uploaderId: state.account.id,
      owned: true,
      isFavorited: true,
    });
  state.textures = [...entries.values()];
}
