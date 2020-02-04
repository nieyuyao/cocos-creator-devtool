const tabTitle = "Cocos Creator Devtool";
const icon = "icons/icon-32.png";
const html = "devtools.html";

function onPanelShown() {
	try {
		chrome.runtime.sendMessage({
			name: 'cc-devtool: panel-shown'
		});
	} catch(e) {}
}

function onPanelHidden() {
	try {
		chrome.runtime.sendMessage({
			name: 'cc-devtool: panel-hidden'
		});
	} catch(e) {}
}

function createCocosCreatorDevtoolPanel() {
	chrome.devtools.panels.create(
		tabTitle,
		icon,
		html, 
		panel => {
			panel.onShown.addListener(onPanelShown);
			panel.onHidden.addListener(onPanelHidden);
		}
	);
}

chrome.devtools.inspectedWindow.eval(
	'!!window.cc && !!window.cc.game',
	hasCC => {
		if (hasCC) createCocosCreatorDevtoolPanel();
	}
);