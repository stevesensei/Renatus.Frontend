import { reactive } from 'vue';
import { z } from 'zod';
import { resetPrivateState } from '../data/state';

const savedSession = z.object({
  token: z.string().min(1),
  expiresAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
});
export const session = reactive({ token: '', expiresAt: '', initialized: false });
const key = 'renatus:session';
const saved = sessionStorage.getItem(key);
if (saved !== null) {
  try {
    const result = savedSession.safeParse(JSON.parse(saved));
    if (result.success && Date.parse(result.data.expiresAt) > Date.now()) Object.assign(session, result.data);
    else sessionStorage.removeItem(key);
  } catch (cause) {
    if (cause instanceof SyntaxError) sessionStorage.removeItem(key);
    else throw cause;
  }
}
export function setSession(token: string, expiresAt: string): void {
  Object.assign(session, { token, expiresAt, initialized: true });
  sessionStorage.setItem(key, JSON.stringify({ token, expiresAt }));
}
export function clearSession(): void {
  session.token = '';
  session.expiresAt = '';
  session.initialized = false;
  resetPrivateState();
  sessionStorage.removeItem(key);
}
