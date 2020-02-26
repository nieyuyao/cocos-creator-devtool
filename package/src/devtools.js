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
import AppConnecting from './components/AppConnecting.vue';
import App from "./components/App.vue";
Vue.use(ElHeader);
Vue.use(ElSwitch);
Vue.use(ElTooltip);
Vue.use(ElContainer);
Vue.use(ElAside);
Vue.use(ElInput);
Vue.use(ElTree);
Vue.use(ElMain);
Vue.use(ElButton);
Vue.use(ElTable);
Vue.use(ElTableColumn);
Vue.use(ElInputNumber);
Vue.use(ElColorPicker);

let app = new Vue({
    render: (h) => h(AppConnecting)
}).$mount('#app');

function injectScript(cb) {
    const scriptName = chrome.runtime.getURL('injected.bundle.js');
    const injectedScript = `
        (function() {
            var script = document.constructor.prototype.createElement.call(document, 'script');
            script.src = "${scriptName}";
            document.documentElement.appendChild(script);
            script.parentNode.removeChild(script);
        })();
    `;
    chrome.devtools.inspectedWindow.eval(injectedScript, (res, err) => {
        if (err) {
            console.log(err, 'inject scripit');
            return;
        }
        cb();
    });
}

function initApp() {
    app = new Vue({
        extends: App
    }).$mount('#app');
}

function inject() {
    // initApp();
    injectScript(initApp);
}

chrome.devtools.network.onNavigated.addListener(() => {
    app.$destroy();
    inject();
});

//
inject();


