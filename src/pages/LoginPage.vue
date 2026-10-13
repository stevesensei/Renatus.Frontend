<script setup lang="ts">
import { Brush, ShieldCheck, Users } from '@lucide/vue';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { api } from '../api/client';
import { authenticate, encryptPassword } from '../api/auth';
import { registrationSchema } from '../api/schemas';
import { useOperation } from '../composables/operation';
import MarkdownContent from '../components/MarkdownContent.vue';
import { state } from '../data/state';
const route = useRoute(); const router = useRouter();
const operation = useOperation(); const sending = useOperation();
const register = computed(() => route.query['mode'] === 'register');
const form = reactive({login:'',username:'',email:'',nickname:'',code:'',password:''});
const countdown = ref(0); let timer: ReturnType<typeof setInterval> | undefined;
async function sendCode(): Promise<void> {
  await sending.run(async () => {
    const result = await api('auth/register-code', registrationSchema, {method:'post',json:{email:form.email}});
    const until = Date.now() + result.resendAfterSeconds * 1000;
    clearInterval(timer);
    countdown.value = result.resendAfterSeconds;
    timer = setInterval(() => { countdown.value = Math.max(0, Math.ceil((until-Date.now())/1000)); if(!countdown.value) clearInterval(timer); },1000);
  }, '验证码已发送，请检查邮箱。');
}
async function submit(): Promise<void> {
  await operation.run(async () => {
    const encrypted = await encryptPassword(form.password);
    const body = register.value ? {...encrypted,username:form.username,email:form.email,nickName:form.nickname,verificationCode:form.code} : {...encrypted,login:form.login};
    await authenticate(register.value?'register':'login',body);
    const target = route.query['returnUrl'];
    await router.replace(typeof target==='string' && target.startsWith('/') && !target.startsWith('//') && target.indexOf(String.fromCharCode(92)) < 0 ? target : '/dashboard');
    form.password = '';
  });
}
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <div class="auth-page"><section class="auth-announcement"><p class="eyebrow">WELCOME TO RENATUS</p><h1>{{ state.announcements.login.title || '欢迎来到 Renatus' }}</h1><MarkdownContent :content="state.announcements.login.body" /><img v-if="state.announcements.login.image" :src="state.announcements.login.image" alt="登录公告" class="announcement-image" /><div class="auth-benefits"><p><ShieldCheck :size="20" />安全的账户认证</p><p><Users :size="20" />管理你的 Minecraft 角色</p><p><Brush :size="20" />发现和分享皮肤材质</p></div><RouterLink to="/" class="text-link">返回首页</RouterLink></section>
  <section class="auth-form"><p class="eyebrow">{{register?'JOIN THE COMMUNITY':'WELCOME BACK'}}</p><h2>{{register?'创建你的账户':'欢迎回来'}}</h2><p class="muted">{{register?'准备好，开启属于你的旅程。':'登录，继续你的下一段冒险。'}}</p><div class="auth-tabs"><RouterLink to="/login" :class="{selected:!register}">登录</RouterLink><RouterLink to="/login?mode=register" :class="{selected:register}">注册</RouterLink></div>
  <form class="form-stack" @submit.prevent="submit"><template v-if="register"><label class="field">用户名<InputText v-model="form.username" required maxlength="64" autocomplete="username" /></label><label class="field">邮箱<InputText v-model="form.email" required type="email" autocomplete="email" /></label><div class="code-row"><label class="field">验证码<InputText v-model="form.code" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" /></label><Button type="button" outlined :loading="sending.pending.value" :disabled="!form.email||countdown>0" :label="countdown>0?String(countdown)+' 秒后重发':'获取验证码'" @click="sendCode" /></div><label class="field">昵称<InputText v-model="form.nickname" maxlength="64" /></label></template><label v-else class="field">用户名或邮箱<InputText v-model="form.login" required autocomplete="username" /></label><label class="field">密码<Password v-model="form.password" :feedback="register" toggle-mask :input-props="{required:true,autocomplete:register?'new-password':'current-password',maxlength:128}" fluid /></label><Message v-if="operation.error.value" severity="error">{{operation.error.value}}</Message><Message v-if="sending.error.value" severity="error">{{sending.error.value}}</Message><Button type="submit" :loading="operation.pending.value" :label="register?'创建账户':'登录账户'" class="w-full" /></form><p class="auth-form-footer">{{register?'已经有账户？':'还没有账户？'}}<RouterLink :to="register?'/login':'/login?mode=register'">{{register?'去登录':'立即注册'}}</RouterLink></p></section></div>
</template>
