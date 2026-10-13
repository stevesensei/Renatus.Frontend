import { state } from '../data/state';
import { ApiError, api } from './client';
import { accountSchema, authSchema, sessionKeySchema, siteSchema } from './schemas';
import { clearSession, session, setSession } from './session';
export async function initializeAuth(): Promise<void> {
  if (session.token && Date.parse(session.expiresAt) <= Date.now()) logout();
  if (session.initialized || !session.token) return;
  try {
    state.account = await api('account', accountSchema);
    session.initialized = true;
  } catch (cause) {
    if (!(cause instanceof ApiError)) throw cause;
    if (cause.status === 401 || cause.status === 200) logout();
  }
}
export function logout(): void {
  clearSession();
}
export async function loadSite(): Promise<void> {
  const site = await api('site/config', siteSchema);
  state.site = {
    title: site.title,
    description: site.description,
    heroImage: site.heroImage,
    publicBaseUrl: site.apiBaseUrl,
    buttons: site.buttons,
  };
  state.announcements = { login: site.loginAnnouncement, site: site.siteAnnouncement };
}
export async function encryptPassword(
  password: string,
): Promise<{ readonly sessionKeyId: string; readonly encryptedPassword: string }> {
  if (!isSecureContext) throw new ApiError('请通过 HTTPS 访问站点，以安全提交密码。');
  const response = await api('auth/session-key', sessionKeySchema, { method: 'post' });
  const pem = response.publicKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey(
    'spki',
    Uint8Array.from(atob(pem), (value) => value.charCodeAt(0)),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
  try {
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      key,
      new TextEncoder().encode(Math.floor(Date.now() / 1000) + '.' + password),
    );
    return {
      sessionKeyId: response.sessionKeyId,
      encryptedPassword: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    };
  } catch (cause) {
    if (cause instanceof Error) throw new ApiError('密码加密失败，请检查密码长度后重试。');
    throw cause;
  }
}
export async function authenticate(path: 'login' | 'register', body: object): Promise<void> {
  const response = await api('auth/' + path, authSchema, { method: 'post', json: body });
  setSession(response.accessToken, response.expiresAt);
  state.account = await api('account', accountSchema);
}
