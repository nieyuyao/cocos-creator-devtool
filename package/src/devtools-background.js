const tabTitle = "Cocos Creator Devtool";
const icon = "icons/icon-32.png";
const html = "devtools.html";

function onPanelShown() {
	chrome.runtime.sendMessage({
		name: 'cc-devtool: panel-shown'
	});
}

function onPanelHidden() {
	chrome.runtime.sendMessage({
		name: 'cc-devtool: panel-hidden'
	});
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