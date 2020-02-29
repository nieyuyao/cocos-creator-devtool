import {
	SerializeProps,
	InspectLayerInfo,
	StatsLayerId
} from "./assets/constants";
import {
	getComponentsData,
	hexToRgb
} from "./assets/utils";
import Stats from "./help/Stats";
const NodesCache = {}; // Node cache which contains cc.Node refs 保存的是节点
const NodesCacheData = {}; // Node data cache 序列化后的节点信息
const timelines = [];
const now = +new Date();
timelines.push({
	time: 0,
	desc: "Start"
});
/**
 * @description 注册事件
 */
function registerEvents() {
	cc.director.on(
		cc.Director.EVENT_AFTER_SCENE_LAUNCH,
		ccdevtool.onLauchScene,
		ccdevtool
	);
	cc.director.on(cc.Director.EVENT_BEFORE_SCENE_LOADING, () => {
		timelines.push({
			time: +new Date() - now,
			desc: "开始加载场景"
		});
	});
	cc.director.on(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
		timelines.push({
			time: +new Date() - now,
			desc: "开始运行场景"
		});
	});
}
/**
 * @description 初始化ccdevtool
 */
function initCCDevtool() {
	let canvasWidth = 0;
	let canvasHeight = 0;
	let canvasNodeWidth = 0;
	let canvasNodeHeight = 0;
	const ccdevtool = {
		nodeId: 1,
		stats: null,
		onLauchScene() {
			timelines.push({
				time: +new Date() - now,
				desc: "场景已经启动"
			});
			this.postMessage("cc-devtool: lauch-scene", timelines);
		},
		onGameShow() {
			this.postMessage("cc-devtool: game-show");
		},
		onGameHide() {
			this.postMessage("cc-devtool: game-hide");
		},
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
					canvasWidth = size.width;
					canvasHeight = size.height;
					if (!scene.name) {
						scene.name = "Scene";
					}
					// 获取场景中的第一个节点 => Canvas节点
					if (scene.children[0]) {
						canvasNodeWidth = scene.children[0].width;
						canvasNodeHeight = scene.children[0].height;
					}
					ret = this.serialize(scene, true);
				} else {
					// 此时场景还未加载完全
					const afterSceneCbs =
						cc.director._bubblingListeners._callbackTable[
							cc.Director.EVENT_AFTER_SCENE_LAUNCH
						].callbacks;
					if (
						afterSceneCbs &&
						afterSceneCbs.indexOf(this.onLauchScene) === -1
					) {
						cc.director.on(
							cc.Director.EVENT_AFTER_SCENE_LAUNCH,
							this.onLauchScene,
							this
						);
					}
				}
			} catch (err) {
				console.log(err);
			}
			return ret;
		},
		/**
		 * @description 
		 */
		getCaches() {
			const caches = [];
			if (cc.loader && cc.loader._cache) {
				for (let key in cc.loader._cache) {
					const item = cc.loader._cache[key];
					if (/(jpg|jpeg|png)/.test(item.type)) {
						continue;
					}
					let itemName = '-';
					let itemSize = '-';
					let itemType = '-';
					let preview = '';
					if (item.type === 'js' || item.type === 'json') {
						const splits = item.url.split('/');
						if (splits && splits.length) {
							itemName = splits[splits.length - 1];
						}
						itemType = item.type;
					} else if (item.type === 'uuid') {
						const content = item.content;
						itemType = content.__classname__;
						itemName = content.name;
						if (itemType === 'cc.Texture2D') {
							itemName = item._owner.name;
							const img = content._image;
							const { width, height } = img;
							const ratio = img.src.indexOf('.jpg') === 'jpg' ? 3 : 4;
							const size = width * height * ratio;
							if (size > 1024) {
								itemSize = Math.round(size / 1024) + 'KB';
							} else {
								itemSize = size + 'B';
							}
							preview = img.src;
						}
					}
					caches.push({
						type: itemType,
						name: itemName,
						size: itemSize,
						preview
					})
				}
			}
			return caches;
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
			const ccCanvas = document.getElementById("GameCanvas");
			const inspectLayer = document.createElement("canvas");
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
		 * @description 根据节点在Canvas节点中的坐标转换至屏幕坐标
		 * @param {cc.Node} node 节点
		 */
		getScreenPosition(node) {
			const {
				anchorX,
				anchorY
			} = node;
			const worldPosition = node.convertToWorldSpaceAR();
			// 左上角
			const leftTop = this.convertWorldToScreen(
				new cc.Vec2(
					worldPosition.x - node.width * anchorX,
					worldPosition.y + node.height * (1 - anchorY)
				)
			);
			// 右上角
			const rightTop = this.convertWorldToScreen(
				new cc.Vec2(
					worldPosition.x + node.width * (1 - anchorX),
					worldPosition.y + node.height * (1 - anchorY)
				)
			);
			// 左下角
			const leftBottom = this.convertWorldToScreen(
				new cc.Vec2(
					worldPosition.x - node.width * anchorX,
					worldPosition.y - node.height * anchorY
				)
			);
			// 右下角
			const rightBottom = this.convertWorldToScreen(
				new cc.Vec2(
					worldPosition.x + node.width * (1 - anchorX),
					worldPosition.y - node.height * anchorY
				)
			);
			return {
				leftTop,
				rightTop,
				leftBottom,
				rightBottom
			};
		},
		/**
		 * worldPosition => screenPostion
		 * @description 节点的world坐标转化为全局屏幕坐标
		 * @param {cc.Vec2} vec2 world坐标 [中心为坐标原点]
		 */
		convertWorldToScreen(vec2) {
			const designSize = cc.view.getDesignResolutionSize();
			const x = vec2.x - canvasNodeWidth / 2 - (designSize.width - canvasNodeWidth) / 2;
			const y = vec2.y - canvasNodeHeight / 2 - (designSize.height - canvasNodeHeight) / 2;
			const glX = x / (canvasNodeWidth / 2);
			const glY = y / (canvasNodeHeight / 2);
			return new cc.Vec2(
				((1 + glX) * canvasWidth) / 2,
				((1 - glY) * canvasHeight) / 2
			);
		},
		/**
		 * @description 在inspect layer上显示节点
		 * @param {uuid} String 节点的uuid
		 */
		projectNodeToInspectLayer(uuid) {
			const {
				id,
				color,
				textColor,
				textFont
			} = InspectLayerInfo;
			const inspectLayer = document.getElementById(id);
			const ctx = inspectLayer.getContext("2d");
			const node = NodesCacheData[uuid];
			if (node) {
				const screenBound = node.bound.screenBound;
				ctx.clearRect(0, 0, inspectLayer.width, inspectLayer.height);
				const {
					leftTop,
					rightTop,
					leftBottom,
					rightBottom
				} = screenBound;
				ctx.beginPath();
				ctx.moveTo(leftTop.x, leftTop.y);
				ctx.lineTo(rightTop.x, rightTop.y);
				ctx.lineTo(rightBottom.x, rightBottom.y);
				ctx.lineTo(leftBottom.x, leftBottom.y);
				ctx.closePath();
				ctx.fillStyle = color;
				ctx.fill();
				ctx.fillStyle = textColor;
				ctx.font = textFont;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(
					node.name,
					(leftTop.x + rightTop.x) / 2,
					(leftTop.y + leftBottom.y) / 2
				);
			}
		},
		disableNodeToInspectLayer() {
			const id = InspectLayerInfo.id;
			const inspectLayer = document.getElementById(id);
			const ctx = inspectLayer.getContext("2d");
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
			if (this.stats) {
				cc.director.on(
					cc.Director.EVENT_BEFORE_UPDATE,
					this.beforeUpdate,
					this
				);
				cc.director.on(cc.Director.EVENT_AFTER_VISIT, this.afterVisit, this);
				cc.director.on(cc.Director.EVENT_AFTER_DRAW, this.afterDraw, this);
			}
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
				// 全局坐标
				const globalPosition = node.convertToWorldSpaceAR();
				bound.globalBound.x = globalPosition.x;
				bound.globalBound.y = globalPosition.y;
				// 局部坐标
				const localBound = node.getBoundingBox();
				const {
					anchorX: pAnchorX,
					anchorY: pAnchorY,
					width: pW,
					height: pH
				} = node.parent;
				bound.localBound.top =
					(1 - pAnchorY) * pH - (localBound.yMin + localBound.height);
				bound.localBound.bottom = localBound.yMin + pAnchorY * pH;
				bound.localBound.left = localBound.xMin + pAnchorX * pW;
				bound.localBound.right =
					(1 - pAnchorX) * pW - (localBound.xMin + localBound.width);
				// 屏幕位置
				bound.screenBound = this.getScreenPosition(node);
			} else {
				// 场景
				bound.screenBound = {
					leftTop: this.convertWorldToScreen(new cc.Vec2(0, canvasNodeHeight)),
					rightTop: this.convertWorldToScreen(
						new cc.Vec2(canvasNodeWidth, canvasNodeHeight)
					),
					leftBottom: this.convertWorldToScreen(new cc.Vec2(0, 0)),
					rightBottom: this.convertWorldToScreen(
						new cc.Vec2(canvasNodeWidth, 0)
					)
				};
			}
			/**
			 * Cache node in some place other than NodesCacheData
			 * pass node reference to devtool will cause `Object reference chain is too long` error
			 */
			NodesCache[node.uuid] = node;
			bound.uuid = node.uuid;
			const ret = (NodesCacheData[node.uuid] = {
				name: node.name || "Anonymous",
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
	};
	window.ccdevtool = ccdevtool;
	if (cc.director) {
		registerEvents();
	} else {
		let _director = cc.director;
		Object.defineProperty(cc, 'director', {
			set(val) {
				_director = val;
				console.log('注册');
				registerEvents();
			},
			get () {
				return _director;
			}
		})
	}
	if (cc.game) {
		cc.game.on(cc.game.EVENT_GAME_INITED, () => {
			timelines.push({
				time: +new Date() - now,
				desc: "初始化游戏配置"
			});
		});
		if (!cc.game.hasEventListener("game_on_show")) {
			cc.game.on("game_on_show", ccdevtool.onGameShow, ccdevtool);
		}
		if (!cc.game.hasEventListener("game_on_hide")) {
			cc.game.on("game_on_hide", ccdevtool.onGameHide, ccdevtool);
		}
	}
	ccdevtool.postMessage("cc-devtool: cc-found");
	console.log(
		`%c cc-devtools %c Detected Cocos Creator Game %c`,
		"background:#35495e; padding: 1px; border-radius: 2px 0 0 2px; color: #fff",
		"background:#409EFF; padding: 1px; border-radius: 0 2px 2px 0; color: #fff",
		"background:transparent"
	);
	return ccdevtool;
}
/**
 * @description 全局检测ccdevtool变量
 */
window.checkCCDevtool = function () {
	const {
		ccdevtool,
		cc
	} = window;
	if (ccdevtool) {
		return ccdevtool;
	}
	if (cc) {
		return initCCDevtool();
	}
};
checkCCDevtool();