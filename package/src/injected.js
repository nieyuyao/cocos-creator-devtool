import { SerializeProps, InspectLayerInfo, StatsLayerId } from './assets/constants';
import { getComponentsData, hexToRgb } from './assets/utils';
import Stats from './help/Stats';
const NodesCache = {}; // Node cache which contains cc.Node refs 保存的是节点
const NodesCacheData = {}; // Node data cache 序列化后的节点信息
function initCCDevtool() {
	const ccdevtool = (window.ccdevtool = {
		nodeId: 1,
		stats: null,
		/**
		 * Load tree node data
		 * @return {Object} node data in JSON
		 */
		getTreeNodes() {
			const scene = cc.director.getScene();
			let ret = [];
			this.nodeId = 1;
			// 如果场景已经被加载序列化场景
			try {
				if (scene) {
					const size = cc.view.getCanvasSize();
					this.canvasWidth = size.width;
					this.canvasHeight = size.height;
					if (!scene.name) {
						scene.name = "Scene";
					}
					// 获取场景中的第一个节点 => Canvas节点
					if (scene.children[0]) {
						this.canvasNode = scene.children[0];
					}
					ret = this.serialize(scene, true);
				}
			} catch (err) {
				console.error(err);
			}
			return ret;
		},
		/**
		 * Post message to content script and then forward message to cc-devtool
		 * @param  {String} name, all type are prefixed with ':'
		 * @param  {Any} data
		 */
		postMessage(name = "", data = {}) {
			window.postMessage({
					name,
					data
				},
				"*"
			);
		},
		hasElement(selector) {
			return !!document.querySelector(selector);
		},
		/**
		 * Show/hide given element
		 * @param  {String} selector
		 * @param  {Boolean} val, true fro show, false for hide
		 */
		toggleElement(selector, val) {
			var ele = document.querySelector(selector);
			if (ele) {
				ele.style.display = val ? "" : "none";
			}
		},
		/**
		 * Show/hide given node
		 * @param  {String} selector
		 * @param  {Boolean} val, true fro show, false for hide
		 */
		toggleNode(path, value) {
			const node = cc.find(path);
			if (node) node.active = !!value;
		},
		/**
		 * @description Hide inspect layer
		 */
		hideInspectLayer() {
			this.toggleElement(`#${InspectLayerInfo.id}`, false);
		},
		/**
		 * @description Show inspect layer
		 */
		showInspectLayer() {
			const inspectLayer = document.getElementById(InspectLayerInfo.id);
			if (!inspectLayer) {
				this.createInspectLayer();
			}
			this.toggleElement(`#${InspectLayerInfo.id}`, true);
		},
		/**
		 * @description Create inspect layer
		 */
		createInspectLayer() {
			const ccCanvas = document.getElementById('GameCanvas');
			const inspectLayer = document.createElement('canvas');
			inspectLayer.width = ccCanvas.width;
			inspectLayer.height = ccCanvas.height;
			const {
				x: bx,
				y: by
			} = document.body.getBoundingClientRect();
			const {
				x: ccx,
				y: ccy
			} = ccCanvas.getBoundingClientRect();
			inspectLayer.style.cssText = `
				position: absolute;
				top: ${by - ccy};
				left: ${ccx - bx};
				width: ${ccCanvas.style.width};
				height: ${ccCanvas.style.height};
				z-index: 999999;
				pointer-events: none;
			`;
			inspectLayer.id = InspectLayerInfo.id;
			document.body.appendChild(inspectLayer);
		},
		/**
		 * globalPosition => glPosition => screenPostion
		 * @description 节点的全局坐标
		 * @param {cc.Vec2} globalPosition 节点的全局坐标
		 * @returns {cc.Vec2} 节点的屏幕坐标
		 */
		convertToScreenPosition(globalPosition) {
			if (!globalPosition instanceof cc.Vec2) {
				throw new TypeError('position is not cc.Vec2');
			}
			const { x: px, y: py } = globalPosition;
			const { canvasWidth, canvasHeight } = this;
			const { width: viewWidth, height: viewHeight, anchorX, anchorY } = this.canvasNode;
			const glX = (px - (0.5 - anchorX) * viewWidth/ 2) / (viewWidth / 2);
			const glY = (py - (0.5 - anchorY) * viewHeight  / 2) / (viewHeight / 2);
			return new cc.Vec2(
				(0.5 + glX) * canvasWidth,
				(0.5 - glY) * canvasHeight
			)
		},
		/**
		 * @description 在inspect layer上显示节点
		 * @param {uuid} String 节点的uuid
		 */
		projectNodeToInspectLayer(uuid) {
			const { id, color } = InspectLayerInfo;
			const inspectLayer = document.getElementById(id);
			const ctx = inspectLayer.getContext('2d');
			const node = NodesCacheData[uuid];
			if (node) {
				const screenBound = node.bound.screenBound;
				const { x, y, width, height } = screenBound;
				ctx.clearRect(0, 0, inspectLayer.width, inspectLayer.height);
				// 坐标转换
				ctx.fillStyle = color;
				ctx.rect(x - width / 2, y - height / 2, width, height);
			}
		},
		disableNodeToInspectLayer() {
			const inspectLayer = document.getElementById(id);
			const ctx = inspectLayer.getContext('2d');
			ctx.clearRect(0, 0, inspectLayer.width, inspectLayer.height);
		},
		/**
		 * @description Hide stats panel
		 */
		hideStatsPanel() {
			this.toggleElement(`#${StatsLayerId}`, false);
			cc.director.off(cc.Director.EVENT_BEFORE_UPDATE, this.afterDraw, this);
			cc.director.off(cc.Director.EVENT_AFTER_VISIT, this.afterDraw, this);
			cc.director.off(cc.Director.EVENT_AFTER_DRAW, this.afterDraw, this);
		},
		/**
		 * @description Show stats panel
		 */
		showStatsPanel() {
			const statsPanel = document.getElementById(StatsLayerId);
			if (!statsPanel) {
				this.createStatsPanel();
			}
			this.toggleElement(`#${StatsLayerId}`, true);
			cc.director.on(cc.Director.EVENT_BEFORE_UPDATE, this.beforeUpdate, this);
			cc.director.on(cc.Director.EVENT_AFTER_VISIT, this.afterVisit, this);
			cc.director.on(cc.Director.EVENT_AFTER_DRAW, this.afterDraw, this);
		},
		/**
		 * @description Create stats panel
		 */
		createStatsPanel() {
			// fps = 1s / (frame + 两个frame之间的时间间隔)
			const statsInfo = {
				frame: {
					desc: "Frame time (ms)",
					value: 0,
					before: 0,
					after: 0
				}, // 每帧耗时
				fps: {
					desc: "Framerate (FPS)",
					below: 30,
					value: 0
				}, // 帧率
				draws: {
					desc: "Draw call",
					value: 0
				}, // drawCall次数
				logic: {
					desc: "Game Logic (ms)",
					value: 0,
					before: 0,
					after: 0
				}, // logic js耗时
				render: {
					desc: "Renderer (ms)",
					value: 0,
					before: 0,
					after: 0
				}, // 渲染耗时
				mode: {
					desc: cc._renderType === cc.game.RENDER_TYPE_WEBGL ? "WebGL" : "Canvas",
					min: 1,
					value: cc._renderType === cc.game.RENDER_TYPE_WEBGL ? 0 : 1
				} // 渲染模式
			};
			this.stats = new Stats(500, statsInfo);
		},
		/**
		 * @description 用作计算游戏实时性能参数的一些函数
		 * @function beforeUpdate 场景更新之前的回调函数
		 * @function afterVisit 场景更新完毕
		 * @function afterDraw 场景被绘制到屏幕上
		 */
		beforeUpdate() {
			const now = performance.now();
			const {
				logic,
				frame
			} = this.stats;
			logic.before = now;
			frame.before = now;
		},
		afterVisit() {
			const {
				logic,
				render
			} = this.stats;
			const now = performance.now();
			logic.after = now;
			render.before = now;
		},
		afterDraw() {
			const now = performance.now();
			const {
				logic,
				draws,
				render,
				frame,
				fps
			} = this.stats;
			render.after = now;
			frame.after = now;
			logic.value = logic.after - logic.before;
			render.value = render.after - render.before;
			draws.value = cc.g_NumberOfDraws;
			frame.value = frame.after - frame.before;
			if (fps.before === 0) {
				fps.value = 0;
			} else {
				fps.value = 1000 / (now - fps.before);
			}
			fps.before = now;
			this.stats.tick();
		},
		/**
		 * Set helper variable $n0, $n1
		 * @param  {String} uuid, uuid of node
		 */
		selectNode(uuid) {
			window.$n1 = window.$n0;
			window.$n0 = NodesCache[uuid];
		},
		/**
		 * Update node property
		 * @param  {String} uuid, uuid of node
		 * @param  {String} key, property name
		 * @param  {any} value, property value
		 */
		updateNode(uuid, key, value) {
			const node = NodesCache[uuid];
			const nodeInfo = NodesCacheData[uuid];
			if (!node || !nodeInfo) return;
			const prop = nodeInfo.props.find(p => p.key === key);
			if (prop) {
				prop.value = value;
			}
			if (key === "color") {
				let comp = hexToRgb(value);
				if (comp) {
					return (node[key] = new cc.Color(comp.r, comp.g, comp.b));
				}
			}
			node[key] = value;
		},
		/**
		 * Print comopnent in Console
		 * @param  {String} uuid, uuid of node
		 * @param  {Number} index, index of component
		 */
		inspectComponent(uuid, index) {
			console.trace((window.$c = NodesCache[uuid]._components[index]));
		},
		/**
		 * Print node in Console
		 * @param  {String} uuid, uuid of a node
		 */
		printNode(uuid) {
			console.trace((window.$n = NodesCache[uuid]));
		},
		/**
		 * @description 序列化节点树
		 * @param {cc.Scene|cc.Node} node 节点
		 * @param {Boolean} isScene 是否是场景
		 * @return {Array}
		 */
		serialize: function (node, isScene = false) {
			const props =
				SerializeProps[cc.ENGINE_VERSION >= "2.0.0" ? "2.0.0" : "default"];
			const kv = props.reduce((result, key) => {
				/** case 场景节点不允许获取和修改active属性 在后来的cocos版本中已被废弃 **/
				let value;
				if (isScene && key === "active") {
					value = true;
				} else {
					value = node[key];
				}
				if (key === "color") {
					value = value.toCSS();
				}
				result.push({
					key,
					value
				});
				return result;
			}, []);
			// AABB包围盒
			let bound = {};
			bound.localBound = {};
			bound.globalBound = {};
			bound.screenBound = {};
			if (node.parent) {
				bound.width = node.width;
				bound.height = node.height;
				const globalPosition = node.convertToWorldSpaceAR();
				bound.globalBound.x = globalPosition.x;
				bound.globalBound.y = globalPosition.y;
				//
				const localBound = node.getBoundingBox();
				const {
					anchorX: pAnchorX,
					anchorY: pAnchorY,
					width: pW,
					height: pH
				} = node.parent;
				bound.localBound.top = (1 - pAnchorY) * pH - (localBound.yMin + localBound.height);
				bound.localBound.bottom = localBound.yMin + pAnchorY * pH;
				bound.localBound.left = localBound.xMin + pAnchorX * pW;
				bound.localBound.right = (1 - pAnchorX) * pW - (localBound.xMin + localBound.width);
				//
				const screenPosition = this.convertToScreenPosition(globalPosition);
				bound.screenBound.left = screenPosition.x;
				bound.screenBound.top = screenPosition.y;
			}
			/**
			 * Cache node in some place other than NodesCacheData
			 * pass node reference to devtool will cause `Object reference chain is too long` error
			 */
			NodesCache[node.uuid] = node;
			bound.uuid = node.uuid;
			const ret = (NodesCacheData[node.uuid] = {
				id: this.nodeId++,
				uuid: node.uuid,
				label: node.name,
				props: kv,
				comps: getComponentsData(node),
				bound,
				children: node.children.map(it => ccdevtool.serialize(it))
			});
			return ret;
		}
	});
	/**
	 * Hijack cc.director.loadScene()
	 * when loadScene is called, notify cc-devtool panel to refresh node tree
	 */
	if (cc.director) {
		cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
			ccdevtool.postMessage("cc-devtool: lauch-scene");
		});
	}
	if (cc && cc.game) {
		if (!cc.game.hasEventListener("game_on_show")) {
			cc.game.on("game_on_show", function () {
				ccdevtool.postMessage("cc-devtool: game-show");
			});
		}
		if (!cc.game.hasEventListener("game_on_hide")) {
			cc.game.on("game_on_hide", function () {
				ccdevtool.postMessage("cc-devtool: game-hide");
			});
		}
	}
	/**
	 * print a nice-looking notification if this file injected
	 */
	console.log(
		`%c cc-devtools %c Detected Cocos Creator Game %c`,
		"background:#35495e; padding: 1px; border-radius: 2px 0 0 2px; color: #fff",
		"background:#409EFF; padding: 1px; border-radius: 0 2px 2px 0; color: #fff",
		"background:transparent"
	);
	ccdevtool.postMessage("cc-devtool: cc-found");
	return ccdevtool;
}
window.checkCCDevtool = function() {
	const { ccdevtool, cc } = window;
	if (ccdevtool) {
		return ccdevtool;
	}
	if (cc) {
		return initCCDevtool();
	}
}
checkCCDevtool();