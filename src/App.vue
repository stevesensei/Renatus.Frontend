<script setup lang="ts">
import { ArrowLeft, Box, ChevronRight, LogOut, Menu, Moon, Sun, X } from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { loadSite, logout } from './api/auth';
import { session } from './api/session';
import { useOperation } from './composables/operation';
import { state } from './data/state';
const route = useRoute(); const router = useRouter();
const dark = ref(false); const menu = ref(false);
const operation = useOperation();
const admin = computed(() => route.path.startsWith('/admin'));
const authenticated = computed(() => Boolean(session.token && state.account.id));
const navigation = computed(() => [
  { path: '/', label: '首页' }, { path: '/textures', label: '材质库' },
  ...(authenticated.value ? [{ path: '/dashboard', label: '控制台' }, { path: '/players', label: '我的角色' }] : []),
  ...(authenticated.value && state.account.role === 'Admin' ? [{ path: '/admin', label: '管理面板' }] : []),
]);
const adminPages = [{path:'/admin',title:'社区概览'},{path:'/admin/users',title:'用户管理'},{path:'/admin/players',title:'角色管理'},{path:'/admin/textures',title:'材质管理'},{path:'/admin/site',title:'站点设置'},{path:'/admin/announcements',title:'公告管理'}];
function toggleTheme(): void { dark.value = !dark.value; document.documentElement.classList.toggle('dark', dark.value); }
async function signout(): Promise<void> { logout(); await router.push('/login'); }
watch(() => session.token, (token) => { if (!token && route.meta['auth']) void router.replace({path:'/login',query:{returnUrl:route.fullPath}}); });
watch(() => state.account.role, (role) => { if (role !== 'Admin' && route.meta['admin']) void router.replace('/dashboard'); });
onMounted(() => operation.run(loadSite));
</script>
<template>
  <a class="skip-link" href="#main-content">跳转到内容</a>
  <header class="app-header">
    <RouterLink to="/" class="brand"><span class="brand-mark"><Box :size="22" /></span><span>{{ state.site.title }}</span></RouterLink>
    <nav class="desktop-nav" aria-label="主要导航"><RouterLink v-for="item in navigation" :key="item.path" :to="item.path" :class="{selected: item.path === '/' ? route.path === '/' : route.path.startsWith(item.path)}">{{ item.label }}</RouterLink></nav>
    <div class="header-actions">
      <Button text severity="secondary" :aria-label="dark ? '切换浅色主题' : '切换深色主题'" @click="toggleTheme"><Sun v-if="dark" :size="18" /><Moon v-else :size="18" /></Button>
      <template v-if="authenticated"><RouterLink to="/account" class="account-link"><Avatar :image="state.account.avatar || undefined" :label="state.account.avatar ? undefined : state.account.nickname.slice(0,1)" shape="circle" /><span>{{ state.account.nickname }}</span></RouterLink><Button text severity="secondary" aria-label="退出登录" @click="signout"><LogOut :size="18" /></Button></template>
      <RouterLink v-else to="/login" class="button-link">登录 / 注册</RouterLink>
      <Button class="menu-toggle" text severity="secondary" aria-label="切换导航菜单" :aria-expanded="menu" @click="menu = !menu"><X v-if="menu" :size="20" /><Menu v-else :size="20" /></Button>
    </div>
  </header>
  <nav v-if="menu" class="mobile-nav" aria-label="移动导航"><RouterLink v-for="item in navigation" :key="item.path" :to="item.path" @click="menu = false">{{ item.label }}<ChevronRight :size="16" /></RouterLink></nav>
  <Message v-if="operation.error.value" severity="error">{{ operation.error.value }}<Button text label="重新加载" @click="operation.run(loadSite)" /></Message>
  <div :class="['app-layout',{'admin-layout':admin}]"><aside v-if="admin" class="admin-sidebar"><span class="eyebrow">管理面板</span><nav aria-label="管理导航"><RouterLink v-for="(page,index) in adminPages" :key="page.path" :to="page.path" :class="{selected:route.path===page.path}"><span class="nav-number">0{{index+1}}</span>{{page.title}}</RouterLink></nav><RouterLink class="sidebar-back" to="/dashboard"><ArrowLeft :size="16" />返回控制台</RouterLink></aside>
  <main id="main-content" :class="['page-content',{'full-page':route.path==='/'||route.path==='/login'}]"><RouterView /></main></div>
  <footer class="app-footer"><span>{{ state.site.title }} · 让每一次冒险，都属于你。</span><RouterLink to="/textures">探索材质库</RouterLink></footer>
  <Toast position="bottom-right" />
</template>
