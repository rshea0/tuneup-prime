import Vue from 'vue';
import VueRouter from 'vue-router';

import ActivatePage from './views/activate-page.vue';
import ConsolidatePage from './views/consolidate-page.vue';
import HomePage from './views/home-page.vue';
import RelocatePage from './views/relocate-page.vue';
import SettingsPage from './views/settings-page.vue';
import SmartPlaylistsPage from './views/smart-playlists/smart-playlists-page.vue';

Vue.use(VueRouter);

export const router = new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/activate',
      name: 'activate',
      component: ActivatePage,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
    },
    {
      path: '/smart-playlists',
      name: 'smart-playlists',
      component: SmartPlaylistsPage,
    },
    {
      path: '/relocate',
      name: 'relocate',
      component: RelocatePage,
    },
    {
      path: '/consolidate',
      name: 'consolidate',
      component: ConsolidatePage,
    },
  ],
});
