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
	const onMessage = function (message) {
		log('cc-devtool: Received message ', message);
		if (message.name === "cc-devtool: panelPageCreated") {
			log('cc-devtool: Creating connection for #tab ' + message.tabId);
			ports[message.tabId] = port;
		} else {
			warn('cc-devtool: Unknown message ', message.name);
		}
	}
	port.onMessage.addListener(onMessage);
	port.onDisconnect.addListener(function (port) {
		port.onMessage.removeListener(onMessage);
		// remove the connection from the list
		const port = Object.keys(ports);
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
chrome.runtime.onMessage.addListener(function (request, sender) {
	if (sender.tab) {
		const tabId = sender.tab.id;
		let not = '';
		if (tabId in ports) {
			ports[tabId].postMessage(request);
		} else {
			not = 'not';
			log("cc-devtool: Tab not found in connection list.");
		}
		if (request.type === 'cc-devtool: cc-found') {
			chrome.browserAction.setPopup({
				tabId: sender.tab.id,
				popup: `html/popup${not}-found.html`
			})
		}
	}
	return true;
});

// 被调试的页面加载完毕
chrome.webNavigation.onCompleted.addListener(function (data) {
	const { tabId, frameId } = data;
	if (ports[tabId]) {
		log('cc-devtool: Found connection ', ports[tabId]);
		if (data.frameId === 0) {
			log('cc-devtool: FrameId ', frameId);
			ports[tabId].postMessage({
				type: 'cc-devtool: inspectedWinReloaded'
			});
		}
	}
});