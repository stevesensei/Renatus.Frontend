import type { DataTablePageEvent } from 'primevue/datatable';
import { onBeforeUnmount, ref, shallowRef } from 'vue';
import type { z } from 'zod';
import { api } from '../api/client';
import { pageSchema } from '../api/schemas';
import { useOperation } from './operation';
export function useAdminPage<T>(path: string, schema: z.ZodType<T>) {
  const items = shallowRef<T[]>([]);
  const total = ref(0);
  const first = ref(0);
  const rows = ref(10);
  const operation = useOperation();
  let revision = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const query = ref<Record<string, string>>({});
  async function load(): Promise<void> {
    const request = ++revision;
    await operation.run(async () => {
      const response = await api(path, pageSchema(schema), {
        searchParams: { ...query.value, page: Math.floor(first.value / rows.value) + 1, pageSize: rows.value },
      });
      if (request !== revision) return;
      items.value = response.items;
      total.value = response.totalCount;
      if (first.value >= total.value && first.value > 0) {
        first.value = Math.max(0, Math.ceil(total.value / rows.value) - 1) * rows.value;
        await load();
      }
    });
  }
  function filter(params: Record<string, string>): void {
    query.value = params;
    first.value = 0;
    ++revision;
    clearTimeout(timer);
    timer = setTimeout(load, 300);
  }
  function paginate(event: DataTablePageEvent): void {
    first.value = event.first;
    rows.value = event.rows;
    void load();
  }
  onBeforeUnmount(() => {
    clearTimeout(timer);
    ++revision;
  });
  return { items, total, first, rows, loading: operation.pending, error: operation.error, load, filter, paginate };
}
