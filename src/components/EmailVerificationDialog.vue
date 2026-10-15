<script setup lang="ts">
import {computed, onBeforeUnmount, ref, useId, watch} from 'vue';
import type {z} from 'zod';
import {api} from '../api/client';
import {accountSchema, registrationSchema} from '../api/schemas';
import {useOperation} from '../composables/operation';
import {state} from '../data/state';
import {t} from '../i18n';

type Account = z.infer<typeof accountSchema>;
const props = defineProps<{readonly profile: Pick<Account, 'nickname' | 'email' | 'avatar'>}>();
const visible = defineModel<boolean>('visible', {required: true});
const emit = defineEmits<{verified: [account: Account]}>();
const sending = useOperation();
const saving = useOperation();
const code = ref('');
const countdown = ref(0);
const expiresAt = ref('');
const sent = ref(false);
const formId = useId() + '-email-verification';
const resendTimes = new Map<string, number>();
const changingEmail = computed(() => props.profile.email.trim().toUpperCase() !== state.account.email.trim().toUpperCase());
const pending = computed(() => sending.pending.value || saving.pending.value);
let timer: ReturnType<typeof setInterval> | undefined;

function refreshCountdown(): void {
  const until = resendTimes.get(props.profile.email.trim().toUpperCase()) ?? 0;
  countdown.value = Math.max(0, Math.ceil((until - Date.now()) / 1000));
  if (!countdown.value) clearInterval(timer);
}

watch(() => [visible.value, props.profile.email], () => {
  clearInterval(timer);
  code.value = '';
  expiresAt.value = '';
  sent.value = false;
  sending.error.value = '';
  saving.error.value = '';
  refreshCountdown();
  if (visible.value && countdown.value > 0) timer = setInterval(refreshCountdown, 1000);
});

async function sendCode(): Promise<void> {
  if (pending.value || countdown.value > 0) return;
  await sending.run(async () => {
    const response = await api('auth/register-code', registrationSchema, {
      method: 'post', json: {email: props.profile.email.trim()}
    });
    resendTimes.set(props.profile.email.trim().toUpperCase(), Date.now() + response.resendAfterSeconds * 1000);
    expiresAt.value = new Date(response.expiresAt).toLocaleTimeString('zh-CN');
    sent.value = true;
    refreshCountdown();
    clearInterval(timer);
    if (countdown.value > 0) timer = setInterval(refreshCountdown, 1000);
  });
}

async function verify(): Promise<void> {
  if (pending.value || !/^[0-9]{6}$/.test(code.value)) return;
  await saving.run(async () => {
    const account = await api('account', accountSchema, {
      method: 'put',
      json: {nickName: props.profile.nickname, email: props.profile.email.trim(), avatarBase64: props.profile.avatar || null, verificationCode: code.value}
    });
    state.account = account;
    emit('verified', account);
    visible.value = false;
  }, t('emailVerification.verified'));
}

onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <Dialog v-model:visible="visible" modal class="compact-dialog" :closable="!pending" :close-on-escape="!pending"
          :header="changingEmail ? t('emailVerification.changeTitle') : t('emailVerification.title')">
    <form :id="formId" class="form-stack" @submit.prevent="verify">
      <p class="muted">{{ t(changingEmail ? 'emailVerification.changeDescription' : 'emailVerification.description', {email: profile.email}) }}</p>
      <div class="code-row">
        <label class="field">{{ t('emailVerification.code') }}
          <InputText v-model="code" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="one-time-code" :disabled="pending"/>
        </label>
        <Button type="button" outlined :loading="sending.pending.value" :disabled="pending || countdown > 0"
                :label="countdown > 0 ? t('emailVerification.resendDelay', {seconds: countdown}) : t('emailVerification.send')" @click="sendCode"/>
      </div>
      <Message v-if="sent" severity="success">{{ t('emailVerification.codeSent') }}</Message>
      <p v-if="expiresAt" class="muted small">{{ t('emailVerification.expiresAt', {time: expiresAt}) }}</p>
      <Message v-if="sending.error.value || saving.error.value" severity="error">{{ sending.error.value || saving.error.value }}</Message>
    </form>
    <template #footer>
      <Button type="button" outlined severity="secondary" :disabled="pending" :label="t('common.cancel')" @click="visible = false"/>
      <Button type="submit" :form="formId" :loading="saving.pending.value" :disabled="pending || !/^[0-9]{6}$/.test(code)" :label="t('emailVerification.confirm')"/>
    </template>
  </Dialog>
</template>
