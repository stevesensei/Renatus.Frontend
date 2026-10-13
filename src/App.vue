<script setup lang="ts">
import { t } from './i18n';
import {ArrowLeft, ChevronRight, LogOut, Menu, Moon, Sun, X} from '@lucide/vue';
import {computed, onMounted, ref, watch} from 'vue';
import {RouterLink, RouterView, useRoute, useRouter} from 'vue-router';
import {loadSite, logout} from './api/auth';
import {session} from './api/session';
import {useOperation} from './composables/operation';
import {state} from './data/state';

const route = useRoute();
const router = useRouter();
const logoUrl = import.meta.env.BASE_URL + 'logo.png';
const dark = ref(false);
const menu = ref(false);
const operation = useOperation();
const admin = computed(() => route.path.startsWith('/admin'));
const authenticated = computed(() => Boolean(session.token && state.account.id));
const navigation = computed(() => [
  {path: '/', label: t('nav.home')}, {path: '/textures', label: t('nav.textures')},
  ...(authenticated.value ? [{path: '/dashboard', label: t('nav.dashboard')}, {path: '/players', label: t('nav.myPlayers')}] : []),
  ...(authenticated.value && state.account.role === 'Admin' ? [{path: '/admin', label: t('nav.admin')}] : []),
]);
const adminPages = [{path: '/admin', title: t('nav.communityOverview')}, {
  path: '/admin/users',
  title: t('nav.adminUsers')
}, {path: '/admin/players', title: t('nav.adminPlayers')}, {path: '/admin/textures', title: t('nav.adminTextures')}, {
  path: '/admin/site',
  title: t('nav.siteSettings')
}, {path: '/admin/announcements', title: t('nav.announcements')}];

function toggleTheme(): void {
  dark.value = !dark.value;
  document.documentElement.classList.toggle('dark', dark.value);
}

async function signout(): Promise<void> {
  logout();
  await router.push('/login');
}

watch(() => session.token, (token) => {
  if (!token && route.meta['auth']) void router.replace({path: '/login', query: {returnUrl: route.fullPath}});
});
watch(() => state.account.role, (role) => {
  if (role !== 'Admin' && route.meta['admin']) void router.replace('/dashboard');
});
onMounted(() => operation.run(loadSite));
</script>
<template>
  <a class="skip-link" href="#main-content">{{ t('app.skipToContent') }}</a>
  <header class="app-header">
    <RouterLink to="/" class="brand"><img class="brand-mark" :src="logoUrl" :alt="t('app.logo', {site: state.site.title})" /><span>{{state.site.title}}</span>
    </RouterLink>
    <nav class="desktop-nav" :aria-label="t('app.mainNavigation')">
      <RouterLink v-for="item in navigation" :key="item.path" :to="item.path"
                  :class="{selected: item.path === '/' ? route.path === '/' : route.path.startsWith(item.path)}">
        {{item.label}}
      </RouterLink>
    </nav>
    <div class="header-actions">
      <Button text severity="secondary" :aria-label="dark ? t('app.lightTheme') : t('app.darkTheme')" @click="toggleTheme">
        <Sun v-if="dark" :size="18"/>
        <Moon v-else :size="18"/>
      </Button>
      <template v-if="authenticated">
        <RouterLink to="/account" class="account-link">
          <Avatar :image="state.account.avatar || undefined"
                  :label="state.account.avatar ? undefined : state.account.nickname.slice(0,1)" shape="circle"/>
          <span>{{state.account.nickname}}</span></RouterLink>
        <Button text severity="secondary" :aria-label="t('app.signOut')" @click="signout">
          <LogOut :size="18"/>
        </Button>
      </template>
      <RouterLink v-else to="/login" class="button-link">{{ t('app.signInOrRegister') }}</RouterLink>
      <Button class="menu-toggle" text severity="secondary" :aria-label="t('app.toggleNavigation')" :aria-expanded="menu"
              @click="menu = !menu">
        <X v-if="menu" :size="20"/>
        <Menu v-else :size="20"/>
      </Button>
    </div>
  </header>
  <nav v-if="menu" class="mobile-nav" :aria-label="t('app.mobileNavigation')">
    <RouterLink v-for="item in navigation" :key="item.path" :to="item.path" @click="menu = false">{{item.label}}
      <ChevronRight :size="16"/>
    </RouterLink>
  </nav>
  <Message v-if="operation.error.value" severity="error">{{operation.error.value}}
    <Button text :label="t('common.reload')" @click="operation.run(loadSite)"/>
  </Message>
  <div :class="['app-layout',{'admin-layout':admin}]">
    <aside v-if="admin" class="admin-sidebar"><span class="eyebrow">{{ t('nav.admin') }}</span>
      <nav :aria-label="t('app.adminNavigation')">
        <RouterLink v-for="(page,index) in adminPages" :key="page.path" :to="page.path"
                    :class="{selected:route.path===page.path}"><span
            class="nav-number">{{ t('app.navigationNumber', { value1: index + 1 }) }}</span>{{page.title}}
        </RouterLink>
      </nav>
      <RouterLink class="sidebar-back" to="/dashboard">
        <ArrowLeft :size="16"/>{{ t('nav.backToDashboard') }}</RouterLink>
    </aside>
    <main id="main-content" :class="['page-content',{'full-page':route.path==='/'||route.path==='/login'}]">
      <RouterView/>
    </main>
  </div>
  <footer class="app-footer">
    <div class="footer-info"><span>{{ t('app.footer', { value1: state.site.title }) }}</span><span
        v-if="state.site.copyright">{{state.site.copyright}}</span><span
        v-if="state.site.icpRegistrationNumber">{{state.site.icpRegistrationNumber}}</span></div>
    <RouterLink to="/textures">{{ t('nav.exploreTextures') }}</RouterLink>
  </footer>
  <Toast position="bottom-right"/>
</template>
