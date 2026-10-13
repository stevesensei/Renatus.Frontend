import zhCN from '../locales/zh_CN.json';

export type MessageKey = keyof typeof zhCN.messages;
type Parameters = Readonly<Record<string, string | number>>;
export const locale = 'zh-CN';
export const primeVueLocale = zhCN.primevue;

export function t(key: MessageKey, parameters: Parameters = {}): string {
  return zhCN.messages[key].replace(/\{(\w+)\}/g, (placeholder: string, name: string) =>
    parameters[name] === undefined ? placeholder : String(parameters[name]),
  );
}
