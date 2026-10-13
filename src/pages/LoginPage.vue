<script setup lang="ts">
import { t } from '../i18n';
import {Brush, ShieldCheck, Users} from '@lucide/vue';
import {computed, onBeforeUnmount, reactive, ref} from 'vue';
import {RouterLink, useRoute, useRouter} from 'vue-router';
import {api} from '../api/client';
import {authenticate, encryptPassword} from '../api/auth';
import {registrationSchema} from '../api/schemas';
import {useOperation} from '../composables/operation';
import MarkdownContent from '../components/MarkdownContent.vue';
import {state} from '../data/state';

const route = useRoute();
const router = useRouter();
const operation = useOperation();
const sending = useOperation();
const register = computed(() => route.query['mode'] === 'register');
const form = reactive({login: '', username: '', email: '', nickname: '', code: '', password: ''});
const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

async function sendCode(): Promise<void> {
  await sending.run(async () => {
    const result = await api('auth/register-code', registrationSchema, {method: 'post', json: {email: form.email}});
    const until = Date.now() + result.resendAfterSeconds * 1000;
    clearInterval(timer);
    countdown.value = result.resendAfterSeconds;
    timer = setInterval(() => {
      countdown.value = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      if (!countdown.value) clearInterval(timer);
    }, 1000);
  }, t('login.codeSent'));
}

async function submit(): Promise<void> {
  await operation.run(async () => {
    const encrypted = await encryptPassword(form.password);
    const body = register.value ? {
      ...encrypted,
      username: form.username,
      email: form.email,
      nickName: form.nickname,
      verificationCode: form.code
    } : {...encrypted, login: form.login};
    await authenticate(register.value ? 'register' : 'login', body);
    const target = route.query['returnUrl'];
    await router.replace(typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && target.indexOf(String.fromCharCode(92)) < 0 ? target : '/dashboard');
    form.password = '';
  });
}

onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <div class="auth-page">
    <section class="auth-announcement"><p class="eyebrow">{{ t('login.welcomeEyebrow') }}</p>
      <h1>{{ state.announcements.login.title || t('login.welcome') }}</h1>
      <MarkdownContent :content="state.announcements.login.body"/>
      <img v-if="state.announcements.login.image" :src="state.announcements.login.image" :alt="t('login.announcement')"
           class="announcement-image"/>
      <div class="auth-benefits">
        <p>
          <ShieldCheck :size="20"/>{{ t('login.authBenefit') }}</p>
        <p>
          <Users :size="20"/>{{ t('login.playersBenefit') }}</p>
        <p>
          <Brush :size="20"/>{{ t('login.texturesBenefit') }}</p>
      </div>
      <RouterLink to="/" class="text-link">{{ t('nav.backToHome') }}</RouterLink>
    </section>
    <section class="auth-form"><p class="eyebrow">{{register ? t('login.registerEyebrow') : t('login.signInEyebrow')}}</p>
      <h2>{{ register ? t('login.registerTitle') : t('login.signInTitle') }}</h2>
      <p class="muted">{{ register ? t('login.registerDescription') : t('login.signInDescription') }}</p>
      <div class="auth-tabs">
        <RouterLink to="/login" :class="{selected:!register}">{{ t('login.signIn') }}</RouterLink>
        <RouterLink to="/login?mode=register" :class="{selected:register}">{{ t('login.register') }}</RouterLink>
      </div>
      <form class="form-stack" @submit.prevent="submit">
        <template v-if="register"><label class="field">{{ t('common.username') }}<InputText v-model="form.username" required maxlength="64" autocomplete="username"/>
        </label><label class="field">{{ t('common.email') }}<InputText v-model="form.email" required type="email" autocomplete="email"/>
        </label>
          <div class="code-row"><label class="field">{{ t('login.code') }}<InputText v-model="form.code" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric"/>
          </label>
            <Button type="button" outlined :loading="sending.pending.value" :disabled="!form.email||countdown>0"
                    :label="countdown>0?t('login.resendDelay', {seconds:countdown}):t('login.requestCode')" @click="sendCode"/>
          </div>
          <label class="field">{{ t('common.nickname') }}<InputText v-model="form.nickname" maxlength="64"/>
          </label></template>
        <label v-else class="field">{{ t('login.identifier') }}<InputText v-model="form.login" required autocomplete="username"/>
        </label><label class="field">{{ t('login.password') }}<Password v-model="form.password" :feedback="register" toggle-mask
                  :input-props="{required:true,autocomplete:register?'new-password':'current-password',maxlength:128}"
                  fluid/>
      </label>
        <Message v-if="operation.error.value" severity="error">{{operation.error.value}}</Message>
        <Message v-if="sending.error.value" severity="error">{{sending.error.value}}</Message>
        <Button type="submit" :loading="operation.pending.value" :label="register?t('login.createAccount'):t('login.signInAction')"
                class="w-full"/>
      </form>
      <p class="auth-form-footer">{{ register ? t('login.hasAccount') : t('login.noAccount') }}
        <RouterLink :to="register?'/login':'/login?mode=register'">{{ register ? t('login.goToSignIn') : t('login.registerNow') }}</RouterLink>
      </p>
    </section>
  </div>
</template>
