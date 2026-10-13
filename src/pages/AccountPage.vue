<script setup lang="ts">
import {Camera, ShieldCheck} from '@lucide/vue';
import {reactive, ref} from 'vue';
import PageHeading from '../components/PageHeading.vue';
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
  await operation.run(async () => {
    state.account = await api('account', accountSchema, {
      method: 'put',
      json: {nickName: profile.nickname, email: profile.email, avatarBase64: profile.avatar || null}
    });
    Object.assign(profile, state.account);
  }, '个人资料已保存');
}

async function changePassword(): Promise<void> {
  if (password.next !== password.confirm) {
    error.value = '两次输入的新密码不一致。';
    return;
  }
  await operation.run(async () => {
    if (!isSecureContext) throw new ApiError('请使用 HTTPS 安全修改密码。');
    await api('account/password', emptyResponse, {
      method: 'put',
      json: {currentPassword: password.current, newPassword: password.next}
    });
    password.current = '';
    password.next = '';
    password.confirm = '';
  }, '密码已更新');
}

</script>
<template>
  <PageHeading eyebrow="个人中心" title="账户设置" description="请在此处更新个人资料"/>
  <div class="account-grid">
    <section class="panel profile-summary">
      <Avatar :image="profile.avatar || undefined"
              :label="profile.avatar ? undefined : (profile.nickname || profile.username).slice(0,1)" shape="circle"
              class="large-avatar"/>
      <h2>{{profile.nickname || profile.username}}</h2>
      <p class="muted">@{{profile.username}}</p>
      <Tag :value="profile.role === 'Admin' ? '管理员' : '玩家'" severity="secondary"/>
      <div class="profile-note">
        <ShieldCheck :size="18"/>
        <span>你的账户</span></div>
    </section>
    <div class="form-stack">
      <form class="panel form-stack" @submit.prevent="save">
        <div><h2>个人资料</h2>
          <p class="muted">昵称和头像将展示在站点中</p></div>
        <div class="avatar-upload"><label class="file-button">
          <Camera :size="18"/>
          上传头像<input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadAvatar"/></label>
          <Button text severity="secondary" label="移除头像" :disabled="!profile.avatar" @click="profile.avatar = ''"/>
        </div>
        <p class="muted small">PNG、JPEG 或 WebP，最大 1.5 MB。</p>
        <Message v-if="avatarError" severity="error">{{avatarError}}</Message>
        <div class="form-grid"><label class="field">用户名
          <InputText :model-value="profile.username" disabled/>
        </label><label class="field">昵称
          <InputText v-model="profile.nickname" required maxlength="64"/>
        </label><label class="field span-2">邮箱
          <InputText v-model="profile.email" required type="email" maxlength="256"/>
        </label></div>
        <div class="form-actions">
          <Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value"
                  label="保存资料"/>
        </div>
      </form>
      <form class="panel form-stack" @submit.prevent="changePassword">
        <div><h2>修改密码</h2>
          <p class="muted">重置密码</p></div>
        <label class="field">当前密码
          <Password v-model="password.current" :feedback="false" toggle-mask
                    :input-props="{ required: true, autocomplete: 'current-password' }" fluid/>
        </label>
        <div class="form-grid"><label class="field">新密码
          <Password v-model="password.next" toggle-mask
                    :input-props="{ required: true, autocomplete: 'new-password', maxlength: 128 }" fluid/>
        </label><label class="field">确认新密码
          <Password v-model="password.confirm" :feedback="false" toggle-mask
                    :input-props="{ required: true, autocomplete: 'new-password' }" fluid/>
        </label></div>
        <Message v-if="error" severity="error">{{error}}</Message>
        <div class="form-actions">
          <Button type="submit" :loading="operation.pending.value" :disabled="operation.pending.value" outlined
                  label="更新密码"/>
        </div>
      </form>
    </div>
  </div>
</template>
