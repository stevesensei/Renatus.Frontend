<script setup lang="ts">
import { t } from '../i18n';
import {Camera, ShieldCheck} from '@lucide/vue';
import {computed, reactive, ref} from 'vue';
import { RouterLink } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import EmailVerificationDialog from '../components/EmailVerificationDialog.vue';
import {PreviewImageError, readAvatar} from '../data/images';
import {state} from '../data/state';
import {api, emptyResponse, ApiError} from '../api/client';
import {accountSchema} from '../api/schemas';
import {useOperation} from '../composables/operation';

const operation = useOperation();
const profile = reactive({...state.account});
const password = reactive({current: '', next: '', confirm: ''});
const error = operation.error;
const avatarError = ref('');
const emailVerification = ref(false);
const emailChanged = computed(() => profile.email.trim().toUpperCase() !== state.account.email.trim().toUpperCase());

async function uploadAvatar(event: Event): Promise<void> {
  if (!(event.target instanceof HTMLInputElement)) return;
  const file = event.target.files?.[0];
  if (file === undefined) return;
  avatarError.value = '';
  try {
    profile.avatar = await readAvatar(file);
  } catch (cause) {
    if (cause instanceof PreviewImageError) avatarError.value = cause.message; else throw cause;
  }
}

async function save(): Promise<void> {
  if (emailChanged.value || !state.account.emailVerifiedAt) {
    emailVerification.value = true;
    return;
  }
  await operation.run(async () => {
    state.account = await api('account', accountSchema, {
      method: 'put',
      json: {nickName: profile.nickname, email: profile.email, avatarBase64: profile.avatar || null}
    });
    Object.assign(profile, state.account);
  }, t('account.profileSaved'));
}

async function changePassword(): Promise<void> {
  if (password.next !== password.confirm) {
    error.value = t('account.passwordMismatch');
    return;
  }
  await operation.run(async () => {
    if (!isSecureContext) throw new ApiError(t('account.httpsRequired'));
    await api('account/password', emptyResponse, {
      method: 'put',
      json: {currentPassword: password.current, newPassword: password.next}
    });
    password.current = '';
    password.next = '';
    password.confirm = '';
  }, t('account.passwordUpdated'));
}

</script>
<template>
  <PageHeading :eyebrow="t('account.eyebrow')" :title="t('account.title')" :description="t('account.description')"><div class="inline-actions"><RouterLink class="button-link secondary" to="/authorizations">{{ t('authorizations.title') }}</RouterLink><RouterLink class="button-link secondary" to="/activity">{{ t('activity.title') }}</RouterLink></div></PageHeading>
  <div class="account-grid">
    <section class="panel profile-summary">
      <Avatar :image="profile.avatar || undefined"
              :label="profile.avatar ? undefined : (profile.nickname || profile.username).slice(0,1)" shape="circle"
              class="large-avatar"/>
      <h2>{{profile.nickname || profile.username}}</h2>
      <p class="muted">{{ t('account.usernameDisplay', { value1: profile.username }) }}</p>
      <Tag :value="profile.role === 'Admin' ? t('common.adminRole') : t('common.playerRole')" severity="secondary"/>
      <div class="profile-note">
        <ShieldCheck :size="18"/>
        <span>{{ t('account.identityNote') }}</span></div>
    </section>
    <div class="form-stack">
      <form class="panel form-stack" @submit.prevent="save">
        <div><h2>{{ t('account.profile') }}</h2>
          <p class="muted">{{ t('account.profileDescription') }}</p></div>
        <div class="avatar-upload"><label class="file-button">
          <Camera :size="18"/>{{ t('account.uploadAvatar') }}<input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadAvatar"/></label>
          <Button text severity="secondary" :label="t('account.removeAvatar')" :disabled="!profile.avatar" @click="profile.avatar = ''"/>
        </div>
        <p class="muted small">{{ t('account.avatarHint') }}</p>
        <Message v-if="avatarError" severity="error">{{avatarError}}</Message>
        <div class="form-grid"><label class="field">{{ t('common.username') }}<InputText :model-value="profile.username" disabled/>
        </label><label class="field">{{ t('common.nickname') }}<InputText v-model="profile.nickname" required maxlength="64"/>
        </label><label class="field span-2">{{ t('common.email') }}<InputText v-model="profile.email" required type="email" maxlength="256"/>
        </label></div>
        <div class="inline-actions">
          <Tag v-if="!emailChanged && state.account.emailVerifiedAt" severity="success" :value="t('emailVerification.verifiedStatus')"/>
          <template v-else>
            <span class="muted small">{{ t(emailChanged ? 'emailVerification.emailChanged' : 'emailVerification.pendingStatus') }}</span>
            <Button type="submit" text :disabled="operation.pending.value" :label="t('emailVerification.verify')"/>
          </template>
        </div>
        <div class="form-actions">
          <Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value"
                  :label="t('account.saveProfile')"/>
        </div>
      </form>
      <form class="panel form-stack" @submit.prevent="changePassword">
        <div><h2>{{ t('account.changePassword') }}</h2>
          <p class="muted">{{ t('common.resetPassword') }}</p></div>
        <label class="field">{{ t('account.currentPassword') }}<Password v-model="password.current" :feedback="false" toggle-mask
                    :input-props="{ required: true, autocomplete: 'current-password' }" fluid/>
        </label>
        <div class="form-grid"><label class="field">{{ t('common.newPassword') }}<Password v-model="password.next" toggle-mask
                    :input-props="{ required: true, autocomplete: 'new-password', maxlength: 128 }" fluid/>
        </label><label class="field">{{ t('account.confirmPassword') }}<Password v-model="password.confirm" :feedback="false" toggle-mask
                    :input-props="{ required: true, autocomplete: 'new-password' }" fluid/>
        </label></div>
        <Message v-if="error" severity="error">{{error}}</Message>
        <div class="form-actions">
          <Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" outlined
                  :label="t('account.updatePassword')"/>
        </div>
      </form>
    </div>
  </div>
  <EmailVerificationDialog v-model:visible="emailVerification" :profile="profile" @verified="Object.assign(profile, $event)"/>
</template>
