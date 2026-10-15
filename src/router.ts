import { createRouter, createWebHistory } from 'vue-router';
import { initializeAuth } from './api/auth';
import { session } from './api/session';
import { state } from './data/state';
import { t } from './i18n';
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (to) => (to.hash ? { el: to.hash } : { top: 0 }),
  routes: [
    { path: '/', alias: '/home', component: () => import('./pages/HomePage.vue'), meta: { title: t('nav.home') } },
    { path: '/login', component: () => import('./pages/LoginPage.vue'), meta: { title: t('app.signInOrRegister') } },
    {
      path: '/dashboard',
      component: () => import('./pages/DashboardPage.vue'),
      meta: { title: t('nav.dashboard'), auth: true },
    },
    {
      path: '/account',
      component: () => import('./pages/AccountPage.vue'),
      meta: { title: t('account.title'), auth: true },
    },
    { path: '/union', component: () => import('./pages/UnionPage.vue'), meta: { title: t('union.title'), auth: true } },
    {
      path: '/launcher',
      redirect: '/dashboard#launcher',
    },
    {
      path: '/authorizations',
      component: () => import('./pages/AuthorizationsPage.vue'),
      meta: { title: t('authorizations.title'), auth: true },
    },
    {
      path: '/activity',
      component: () => import('./pages/ActivityPage.vue'),
      meta: { title: t('activity.title'), auth: true },
    },
    {
      path: '/oauth/union/consent',
      component: () => import('./pages/UnionConsentPage.vue'),
      meta: { title: t('consent.unionTitle'), auth: true },
    },
    {
      path: '/connect/consent',
      component: () => import('./pages/ConnectConsentPage.vue'),
      meta: { title: t('connect.consentTitle'), auth: true },
    },
    {
      path: '/connect/device/verify',
      component: () => import('./pages/DeviceVerificationPage.vue'),
      meta: { title: t('connect.deviceTitle'), auth: true },
    },
    {
      path: '/players',
      component: () => import('./pages/PlayersPage.vue'),
      meta: { title: t('nav.myPlayers'), auth: true },
    },
    {
      path: '/players/:id/settings',
      component: () => import('./pages/PlayerSettingsPage.vue'),
      meta: { title: t('players.settings'), auth: true },
    },
    { path: '/textures', component: () => import('./pages/TexturesPage.vue'), meta: { title: t('nav.textures') } },
    {
      path: '/textures/upload',
      component: () => import('./pages/UploadPage.vue'),
      meta: { title: t('nav.uploadTexture'), auth: true },
    },
    {
      path: '/texture/preview',
      component: () => import('./pages/TextureDetailPage.vue'),
      meta: { title: t('nav.textureDetails') },
    },
    {
      path: '/admin',
      component: () => import('./pages/admin/OverviewPage.vue'),
      meta: { title: t('nav.adminOverview'), auth: true, admin: true },
    },
    {
      path: '/admin/users',
      component: () => import('./pages/admin/UsersPage.vue'),
      meta: { title: t('nav.adminUsers'), auth: true, admin: true },
    },
    {
      path: '/admin/players',
      component: () => import('./pages/admin/PlayersPage.vue'),
      meta: { title: t('nav.adminPlayers'), auth: true, admin: true },
    },
    {
      path: '/admin/textures',
      component: () => import('./pages/admin/TexturesPage.vue'),
      meta: { title: t('nav.adminTextures'), auth: true, admin: true },
    },
    {
      path: '/admin/site',
      component: () => import('./pages/admin/SitePage.vue'),
      meta: { title: t('nav.siteSettings'), auth: true, admin: true },
    },
    {
      path: '/admin/announcements',
      component: () => import('./pages/admin/AnnouncementsPage.vue'),
      meta: { title: t('nav.announcements'), auth: true, admin: true },
    },
    {
      path: '/admin/union',
      component: () => import('./pages/admin/UnionPage.vue'),
      meta: { title: t('adminUnion.title'), auth: true, admin: true },
    },
    {
      path: '/admin/connect',
      component: () => import('./pages/admin/ConnectPage.vue'),
      meta: { title: t('adminConnect.title'), auth: true, admin: true },
    },
    {
      path: '/admin/activity',
      component: () => import('./pages/ActivityPage.vue'),
      meta: { title: t('activity.adminTitle'), auth: true, admin: true },
    },
    { path: '/Error', component: () => import('./pages/ErrorPage.vue'), meta: { title: t('error.title') } },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('./pages/ErrorPage.vue'),
      meta: { title: t('error.notFound') },
    },
  ],
});
router.afterEach((route) => {
  document.title = t('app.documentTitle', { title: String(route.meta['title'] ?? t('app.name')) });
});

router.beforeEach(async (to) => {
  await initializeAuth();
  if (to.meta['auth'] && (!session.token || !state.account.id))
    return { path: '/login', query: { returnUrl: to.fullPath } };
  if (to.meta['admin'] && state.account.role !== 'Admin') return '/dashboard';
  return true;
});
