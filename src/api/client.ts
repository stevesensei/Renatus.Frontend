import type { Options } from 'ky';
import ky, { HTTPError, NetworkError, TimeoutError } from 'ky';
import { z } from 'zod';
import { clearSession, session } from './session';

const transport = ky.create({ timeout: 20000, retry: 0 });
const envelope = z.object({ code: z.number(), message: z.string(), data: z.unknown().optional() });
const problem = z.object({
  title: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number = 0,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: Pick<Options, 'method' | 'json' | 'searchParams'> = {},
): Promise<T> {
  const headers = new Headers();
  if (session.token) headers.set('Authorization', 'Bearer ' + session.token);
  try {
    const response = envelope.parse(await transport('/api/' + path, { ...options, headers }).json<unknown>());
    if (response.code !== 10000) throw new ApiError(response.message, 200);
    return schema.parse(response.data);
  } catch (cause) {
    if (cause instanceof HTTPError) {
      if (cause.response.status === 401) clearSession();
      const details = problem.safeParse(cause.data);
      const message = details.success
        ? Object.values(details.data.errors ?? {})
            .flat()
            .join(' ') || details.data.title
        : '';
      throw new ApiError(
        message || (cause.response.status === 403 ? '你没有权限执行此操作。' : '请求失败，请稍后重试。'),
        cause.response.status,
      );
    }
    if (cause instanceof TimeoutError || cause instanceof NetworkError)
      throw new ApiError('无法连接服务，请检查网络后重试。');
    if (cause instanceof z.ZodError) throw new ApiError('服务返回的数据格式无效，请联系管理员。');
    throw cause;
  }
}
export const emptyResponse = z.unknown().transform(() => undefined);
