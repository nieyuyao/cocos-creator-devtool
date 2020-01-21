const ignoredComponentProp = [
	"_name",
	"_objFlags",
	"node",
	"name",
	"uuid",
	"__scriptAsset",
	"_enabled",
	"enabled",
	"enabledInHierarchy",
	"_isOnLoadCalled"
];
const SerializeProps = {
	default: [
		//identity
		"name",
		"active",
		"uuid",
		//position, dimesion
		"x",
		"y",
		"width",
		"height",
		"zIndex",
		//prepresentation
		"color",
		"opacity",
		//transformation
		"anchorX",
		"anchorY",
		"rotation",
		"scaleX",
		"scaleY"
		// 'skewX', 'skewY'
	],
	"2.0.0": [
		//identity
		"name",
		"active",
		"uuid",
		//position, dimesion
		"x",
		"y",
		"width",
		"height",
		"zIndex",
		//prepresentation
		"color",
		"opacity",
		//transformation
		"anchorX",
		"anchorY",
		"angle",
		"scaleX",
		"scaleY"
		// 'skewX', 'skewY'
	]
};
const StatsStyleText = `
.pstats {
	position: fixed;
	padding: 0px;
	width: 150px;
	height: 72px;
	right: 0px;
	bottom: 0px;
	font-size: 10px;
	font-family: 'Roboto Condensed', tahoma, sans-serif;
	overflow: hidden;
	user-select: none;
	cursor: default;
	background: #222;
	border-radius: 3px;
	z-index: 9999;
}
.pstats-container {
	display: block;
	position: relative;
	color: #888;
	white-space: nowrap;
}
.pstats-item {
	position: absolute;
	width: 250px;
	height: 12px;
	left: 0px;
}
.pstats-label {
	position: absolute;
	width: 150px;
	height: 12px;
	text-align: left;
	transition: background 0.3s;
}
.pstats-label.alarm {
	color: #ccc;
	background: #800;

	transition: background 0s;
}
.pstats-counter-id {
	position: absolute;
	width: 90px;
	left: 0px;
}
.pstats-counter-value {
	position: absolute;
	width: 60px;
	left: 90px;
	text-align: right;
}
.pstats-canvas {
	display: block;
	position: absolute;
	right: 0px;
	top: 1px;
}
.pstats-fraction {
	position: absolute;
	width: 250px;
	left: 0px;
}
.pstats-legend {
	position: absolute;
	width: 150px;
	text-align: right;
}
.pstats-legend > span {
	position: absolute;
	right: 0px;
}
`;
const NodesCache = {}; // Node cache which contains cc.Node refs 保存的是节点
const NodesCacheData = {}; // Node data cache 序列化后的节点信息
const InspectLayerInfo = {
	id: 'cc-devtool-inspect-layer',
	color: 'rgba(0, 126, 255, 0.6)'
}
const StatsLayerId = 'fps';
/**
 * @description 控制游戏参数面板显示的类
 * @param {Number} average 每隔多长时间刷新一次统计面板
 * @param {Object} statsInfo 需要统计的信息
 */
class Stats {
	constructor(average, statsInfo) {
		this.statsInfo = statsInfo;
		this.average = average;
		this.time = performance.now();
		const stats = document.createElement("div");
		stats.id = StatsLayerId;
		const pstats = document.createElement("div");
		pstats.className = "pstats";
		const style = document.createElement("style");
		style.textContent = StatsStyleText;
		document.head.appendChild(style);
		const pstatsCon = document.createElement("div");
		pstatsCon.className = "pstats-container";
		pstats.appendChild(pstatsCon);
		stats.appendChild(pstats);
		document.body.appendChild(stats);
		Object.keys(statsInfo).forEach((key, index) => {
			const row = statsInfo[key];
			const item = document.createElement("div");
			item.className = "pstats-item";
			const label = document.createElement("div");
			label.className = "pstats-label";
			const counter = document.createElement("span");
			counter.className = "pstats-counter-id";
			counter.textContent = row.desc;
			const value = document.createElement("div");
			value.className = "pstats-counter-value";
			label.appendChild(counter);
			label.appendChild(value);
			item.appendChild(label);
			pstatsCon.appendChild(item);
			item.style.top = `${index * 12}px`;
			row.valueNode = value;
			value.innerText = row.value || 0;
			this[key] = row;
		});
	}
	tick() {
		const now = performance.now();
		if (now - this.time < this.average) {
			return;
		}
		this.time = now;
		const statsInfo = this.statsInfo;
		Object.keys(statsInfo).forEach(key => {
			const row = statsInfo[key];
			row.valueNode.innerText = Math.round(row.value * 100) / 100;
		});
	}
}
/**
 * Get components data from given node
 * @param  {cc.Node} n
 * @return {Array} array of property/value
 */
function getComponentsData(node) {
	const comps = node._components;
	return comps.reduce((result, comp, i) => {
		const props = comp.constructor.__props__
			.filter(prop => {
				return ignoredComponentProp.indexOf(prop) < 0 && prop[0] != "_";
			})
			.map(name => {
				const type = typeOf(comp[name]);
				const ret = {
					name,
					type: type.component,
					rawType: type.raw
				};
				ret.value = valueOf(comp[name]);
				return ret;
			});
		result.push({
			key: comp.__classname__,
			index: i,
			uuid: node.uuid,
			value: "<<Inspect>>",
			props
		});
		return result;
	}, []);
}
/**
 * Convert CSS Color from hex string to color components
 * @param  {String} hex
 * @return {Object} {r,g,b}
 */
function hexToRgb(hex) {
	var comps = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return comps ?
		{
			r: parseInt(comps[1], 16),
			g: parseInt(comps[2], 16),
			b: parseInt(comps[3], 16)
		} :
		null;
}
function valueOf(val) {
	const t = typeof val;
	if (
		t === "undefined" ||
		t === "string" ||
		t === "number" ||
		t === "boolean"
	) {
		return val;
	}
	if (val === null) return "null";
	switch (val.constructor.name) {
		case "Color":
		case "Size":
		case "Vec2":
		case "Vec3":
			return val.toString();
	}
	if (val && val.constructor) return `<${val.constructor.name}>`;
	return "<unknown>";
}
function typeOf(val) {
	let raw = typeof val;
	let component = "";
	switch (raw) {
		case "string":
			component = "ElInput";
			break;
		case "number":
			component = "ElInputNumber";
			break;
		case "boolean":
			component = "ElSwitch";
			break;
	}
	if (!component && val && val.constructor) {
		raw = val.constructor.name;
		if (raw === "Color") {
			component = "ElColorPicker";
		}
	}
	return {
		raw,
		component
	};
}
function initCCDevtool() {
	const ccCanvas = document.getElementById('GameCanvas');
	const ccdevtool = (window.ccdevtool = {
		ccWidth: ccCanvas.width,
		ccHeight: ccCanvas.height,
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
					if (!scene.name) {
						scene.name = "Scene";
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
			const inspectLayer = document.createElement('canvas');
			inspectLayer.width = this.width;
			inspectLayer.height = this.height;
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
		 * @description 在inspect layer上显示节点
		 * @param {uuid} String 节点的uuid
		 */
		convertNodeToInspectLayer(uuid) {
			const { id, color } = InspectLayerInfo;
			const inspectLayer = document.getElementById(id);
			const ctx = inspectLayer.getContext('2d');
			const node = NodesCacheData[uuid];
			if (node) {
				const { globalBound } = node.bound;
				const { x, y, width, height } = globalBound;
				ctx.clearRect(0, 0, inspectLayer.width, inspectLayer.height);
				// 坐标转换
				ctx.fillStyle = color;
				ctx.rect(x, y, width, height);
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
			if (prop) prop.value = value;
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
				const globalBound = node.getBoundingBoxToWorld();
				const localBound = node.getBoundingBox();
				//
				const {
					anchorX,
					anchorY
				} = node;
				bound.globalBound.x = globalBound.xMin * (1 - anchorX) + globalBound.xMax * anchorX;
				bound.globalBound.y = globalBound.yMin * (1 - anchorY) + globalBound.yMax * anchorY;
				bound.globalBound.width = node.width;
				bound.globalBound.height = node.height;
				const {
					anchorX: pAnchorX,
					anchorY: pAnchorY,
					width: pW,
					height: pH
				} = node.parent;
				//
				bound.localBound.width = localBound.width;
				bound.localBound.height = localBound.height;
				bound.localBound.top = (1 - pAnchorY) * pH - (localBound.yMin + localBound.height);
				bound.localBound.bottom = localBound.yMin + pAnchorY * pH;
				bound.localBound.left = localBound.xMin + pAnchorX * pW;
				bound.localBound.right = (1 - pAnchorX) * pW - (localBound.xMin + localBound.width);
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