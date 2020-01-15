/**
 * 背景脚本
 * 通过chrome.runtime.onMessage与content-script脚本进行通信
 * 通过chrome.runtime.onConnect与devtool进行通信
 */


import {
	log,
	warn
} from './utils.js'

const ports = {};

// 监听来自dev-tool的创建连接事件
chrome.runtime.onConnect.addListener(function (port) {
	/**
	 * @description 监听来自devtool的消息
	 * @param {Object} message 消息内容
	 * @param {Number} message.tabId 消息来源tabId
	 * @param {String} message.name 消息名字
	 */
	function onMessage(message = {}) {
		const { name, tabId } = message;
		if (name === 'cc-devtool: panel-created') {
			ports[tabId] = port;
		} else {
			warn('cc-devtool: Unknown message ', message.name);
		}
	}
	port.onMessage.addListener(onMessage);
	port.onDisconnect.addListener(function (port) {
		port.onMessage.removeListener(onMessage);
		const tabIds = Object.keys(ports);
		for (let i = 0; i < tabIds.length; i++) {
			const tabId = tabIds[i];
			if (ports[tabId] === port) {
				delete ports[tabId];
				break;
			}
		}
	});
});

// 监听来自content-script的事件
chrome.runtime.onMessage.addListener(function (message, sender) {
	if (sender.tab) {
		const tabId = sender.tab.id;
		let not = 'not-';
		if (tabId in ports) {
			ports[tabId].postMessage(message);
		}
		if (message.name === 'cc-devtool: cc-found') {
			not = '';
			chrome.browserAction.setPopup({
				tabId,
				popup: `popups/${not}found.html`
			})
		}
	}
	return true;
});

// 被调试的页面加载完毕
chrome.webNavigation.onCompleted.addListener(function (data) {
	const { tabId } = data;
	console.log('调试的页面已经加载完', tabId);
	if (ports[tabId]) {
		if (data.frameId === 0) {
			ports[tabId].postMessage({
				type: 'cc-devtool: window-loaded'
			});
		}
	}
});