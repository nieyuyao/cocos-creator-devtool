import Vue from 'vue';
import ElHeader from 'element-ui/lib/header';
import ElSwitch from 'element-ui/lib/switch';
import ElTooltip from 'element-ui/lib/tooltip';
import ElContainer from 'element-ui/lib/container';
import ElAside from 'element-ui/lib/aside';
import ElInput from 'element-ui/lib/input';
import ElTree from 'element-ui/lib/tree';
import ElMain from 'element-ui/lib/main';
import ElButton from 'element-ui/lib/button';
import ElTable from 'element-ui/lib/table';
import ElTableColumn from 'element-ui/lib/table-column';
import ElInputNumber from 'element-ui/lib/input-number';
import ElColorPicker from 'element-ui/lib/color-picker';
import 'element-ui/lib/theme-chalk/index.css';
import './assets/reset.css';
import locale from 'element-ui/lib/locale/lang/en';
import AppConnecting from './components/AppConnecting.vue';
import App from "./components/App.vue";

Vue.use(ElHeader, { locale });
Vue.use(ElSwitch, { locale });
Vue.use(ElTooltip, { locale });
Vue.use(ElContainer, { locale });
Vue.use(ElAside, { locale });
Vue.use(ElInput, { locale });
Vue.use(ElTree, { locale });
Vue.use(ElMain, { locale });
Vue.use(ElButton, { locale });
Vue.use(ElTable, { locale });
Vue.use(ElTableColumn, { locale });
Vue.use(ElInputNumber, { locale });
Vue.use(ElColorPicker, { locale });

const app = new Vue({
    render: (h) => h(AppConnecting)
}).$mount('#app');

function initApp() {
    new Vue({
        extends: App
    }).$mount('#app');
}
initApp();

chrome.devtools.network.onNavigated.addListener(() => {
    app.$destroy();
    initApp();
});


