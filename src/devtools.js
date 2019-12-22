import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/en';
import App from "./components/App.vue";

const tabTitle = "Cocos Creator Devtool";
const icon = "img/48.png";
const html = "html/devtool.html";

chrome.devtools.inspectedWindow.eval(
	"!!window.cc && !!window.cc.game",
	hasCC => {
		if (hasCC) createCocosCreatorDevtoolPanel();
	}
);

function createCocosCreatorDevtoolPanel() {
	chrome.devtools.panels.create(tabTitle, icon, html, panel => {
		"Shown,Hidden,Search".split(",").forEach(event => {
			panel["on" + event].addListener(function (arg1, arg2) {
				if (event === "Hidden") {
					window.app.onHidden();
				}
				chrome.runtime.sendMessage({
					type: ":cc-devtool-" + event.toLowerCase()
				});
			});
		});
	});
}

Vue.use(ElementUI, { locale });
new Vue({
    el: '#app',
    render: (h) => h(App)
});