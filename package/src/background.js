/**
 * 背景脚本
 * 通过chrome.runtime.onMessage与content-script脚本进行通信
 * 通过chrome.runtime.onConnect与devtool进行通信
 */

const ports = {};

// 监听来自devtool的创建连接事件
chrome.runtime.onConnect.addListener(port => {
	/**
	 * @description 监听来自devtool的消息
	 * @param {Object} message 消息内容
	 * @param {Number} message.tabId 消息来源tabId
	 * @param {String} message.name 消息名字
	 */
	function onMessage(message = {}) {
		const { name, tabId, source } = message;
		if (source === 'devtool') {
			ports[tabId] = port;
			if (name === 'cc-devtool: check-ccid') {
				chrome.runtime.sendMessage(message);
			}
		}
	}
	port.onMessage.addListener(onMessage);
	port.onDisconnect.addListener(port => {
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
chrome.runtime.onMessage.addListener((message, sender) => {
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
chrome.webNavigation.onCompleted.addListener(data => {
	const { tabId } = data;
	if (ports[tabId]) {
		if (data.frameId === 0) {
			ports[tabId].postMessage({
				type: 'cc-devtool: window-loaded'
			});
		}
	}
});