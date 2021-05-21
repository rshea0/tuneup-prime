import './scss/app.scss';

import { initStore } from '@/store';
import Buefy from 'buefy';
import { Color, Titlebar } from 'custom-electron-titlebar';
import Vue from 'vue';

import App from './app.vue';
import { router } from './router';

function init() {
  initStore();
  initVue();
}

function initVue() {
  Vue.config.productionTip = false;

  Vue.use(Buefy, {
    defaultIconPack: 'fas',
  });

  new Vue({
    router,
    render: h => h(App),
  }).$mount('#app');

  new Titlebar({
    backgroundColor: Color.fromHex('#1e1e1e'),
    menu: null,
    maximizable: false,
  });
}

init();
