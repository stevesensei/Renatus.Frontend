import { createRouter, createWebHistory } from 'vue-router';
import { initializeAuth } from './api/auth';
import { session } from './api/session';
import { state } from './data/state';
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', alias: '/home', component: () => import('./pages/HomePage.vue'), meta: { title: '首页' } },
    { path: '/login', component: () => import('./pages/LoginPage.vue'), meta: { title: '登录 / 注册' } },
    { path: '/dashboard', component: () => import('./pages/DashboardPage.vue'), meta: { title: '控制台', auth: true } },
    { path: '/account', component: () => import('./pages/AccountPage.vue'), meta: { title: '账户设置', auth: true } },
    { path: '/players', component: () => import('./pages/PlayersPage.vue'), meta: { title: '我的角色', auth: true } },
    {
      path: '/players/:id/settings',
      component: () => import('./pages/PlayerSettingsPage.vue'),
      meta: { title: '角色设置', auth: true },
    },
    { path: '/textures', component: () => import('./pages/TexturesPage.vue'), meta: { title: '材质库' } },
    {
      path: '/textures/upload',
      component: () => import('./pages/UploadPage.vue'),
      meta: { title: '上传材质', auth: true },
    },
    { path: '/texture/preview', component: () => import('./pages/TextureDetailPage.vue'), meta: { title: '材质详情' } },
    {
      path: '/admin',
      component: () => import('./pages/admin/OverviewPage.vue'),
      meta: { title: '管理概览', auth: true, admin: true },
    },
    {
      path: '/admin/users',
      component: () => import('./pages/admin/UsersPage.vue'),
      meta: { title: '用户管理', auth: true, admin: true },
    },
    {
      path: '/admin/players',
      component: () => import('./pages/admin/PlayersPage.vue'),
      meta: { title: '角色管理', auth: true, admin: true },
    },
    {
      path: '/admin/textures',
      component: () => import('./pages/admin/TexturesPage.vue'),
      meta: { title: '材质管理', auth: true, admin: true },
    },
    {
      path: '/admin/site',
      component: () => import('./pages/admin/SitePage.vue'),
      meta: { title: '站点设置', auth: true, admin: true },
    },
    {
      path: '/admin/announcements',
      component: () => import('./pages/admin/AnnouncementsPage.vue'),
      meta: { title: '公告管理', auth: true, admin: true },
    },
    { path: '/Error', component: () => import('./pages/ErrorPage.vue'), meta: { title: '发生错误' } },
    { path: '/:pathMatch(.*)*', component: () => import('./pages/ErrorPage.vue'), meta: { title: '页面未找到' } },
  ],
});
router.afterEach((route) => {
  document.title = String(route.meta['title'] ?? 'Renatus') + ' · Renatus';
});

router.beforeEach(async (to) => {
  await initializeAuth();
  if (to.meta['auth'] && (!session.token || !state.account.id))
    return { path: '/login', query: { returnUrl: to.fullPath } };
  if (to.meta['admin'] && state.account.role !== 'Admin') return '/dashboard';
  return true;
});
