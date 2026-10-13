import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { ApiError } from '../api/client';
export function useOperation() {
  const toast = useToast();
  const pending = ref(false);
  const error = ref('');
  async function run(action: () => Promise<void>, success?: string): Promise<boolean> {
    pending.value = true;
    error.value = '';
    try {
      await action();
      if (success) toast.add({ severity: 'success', summary: success, life: 3000 });
      return true;
    } catch (cause) {
      if (!(cause instanceof ApiError)) throw cause;
      error.value = cause.message;
      toast.add({ severity: 'error', summary: cause.message, life: 5000 });
      return false;
    } finally {
      pending.value = false;
    }
  }
  return { pending, error, run };
}
