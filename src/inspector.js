/**
 * 注入页面的脚本
 */

export default function() {
    if (window.cc) {
        return;
    }
    /**
	 * print a nice-looking notification if this file injected
	 */
	console.log(
		`%c cc-devtools %c Detected Cocos Creator Game %c`,
		"background:#35495e ; padding: 1px; border-radius: 2px 0 0 2px;  color: #fff",
		"background:#409EFF ; padding: 1px; border-radius: 0 2px 2px 0;  color: #fff",
		"background:transparent"
    );
    window.ccdevtools = {
        // 获取节点树
        getTreeNodes() {

        },
        // 通信
        postMessage() {

        },
        // 高亮某个节点
        highLight() {

        },
        // 关闭拾取功能
        closePickUp() {

        },
        // 开启拾取功能
        openPickUp() {

        },
        // 选取某个节点
        selectNode() {

        },
        // 更新某个节点
        updateNode() {

        },
        // 重新加载
        reloadScene() {

        },
        // 序列化
        serialize() {

        },
        // 显示开关
        toggleElement() {

        }
    }
    if (cc.director && typeof cc.director.loadScene === "function") {
		let loadScene = cc.director.loadScene;
		cc.director.loadScene = function () {
			ccdevtool.postMessage("cc-devtool:loadScene");
			return loadScene.apply(cc.director, arguments);
		};
	}
	if (cc && cc.game) {
		if (!cc.game.hasEventListener("game_on_show")) {
			cc.game.on("game_on_show", function () {
				ccdevtool.postMessage("cc-devtool:gameOnShow");
			});
		}
		if (!cc.game.hasEventListener("game_on_hide")) {
			cc.game.on("game_on_hide", function () {
				ccdevtool.postMessage("cc-devtool:gameOnHide");
			});
		}
	}
}