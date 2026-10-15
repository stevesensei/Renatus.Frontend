import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';
import App from './App.vue';
import { locale, primeVueLocale } from './i18n';
import { router } from './router';
import { renatusAura } from './theme';
import { ui } from './ui';
import './styles/tokens.css';
import './styles/base.css';
import './styles/controls.css';
import './styles/tables.css';
import './styles/shell.css';
import './styles/landing.css';
import './styles/account.css';
import './styles/collections.css';
import './styles/detail.css';
import './styles/union.css';
import './styles/responsive.css';

const app = createApp(App);
document.documentElement.lang = locale;
app.use(PrimeVue, {
  locale: primeVueLocale,
  theme: { preset: renatusAura, options: { darkModeSelector: '.dark' } },
  ripple: true,
});
app.use(ToastService);
app.use(router);
for (const [name, component] of Object.entries(ui)) app.component(name, component);
app.mount('#app');
