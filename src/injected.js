export default function () {
	if (!window.cc) {
		return;
	}
	// 需要忽略掉的组件属性
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
					cc.js.getset(
						ret,
						"value",
						() => {
							return valueOf(comp[name]);
						},
						str => {
							comp[name] = fromString(type.rawType, str);
						},
						true,
						true
					);
					return ret;
				});
			result.push({
				key: comp.__classname__,
				index: i,
				uuid: node.uuid,
				value: "<<inspect>>",
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
	function rgba2color(str) {
		const vec = str.replace(/ /g, "").replace(/^rgba?/, "");
		const comps = str2array(vec);
		return cc.color.apply(cc, comps);
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
		let c = "";
		switch (raw) {
			case "string":
				c = "ElInput";
				break;
			case "number":
				c = "ElInputNumber";
				break;
			case "boolean":
				c = "ElSwitch";
				break;
		}
		if (!c && val && val.constructor) {
			raw = val.constructor.name;
			switch (raw) {
				case "Color":
					c = "ElColorPicker";
					break;
				case "Vec2":
				case "Vec3":
				case "Size":
					c = "ElInput";
					break;
			}
		}
		return {
			raw,
			component: c
		};
	}
	function fromString(rawType, str) {
		switch (rawType) {
			case "null":
			case "undefined":
			case "string":
				return str;
			case "number":
				return str.indexOf(".") >= 0 ? parseFloat(str) : parseInt(str, 10);
			case "boolean":
				return str === "true";
			case "Vec2":
			case "Vec3":
				return str2vec(str);
			case "Size":
				return str2size(str);
			case "Color":
				return str2color(str);
			default:
				return str;
		}
	}
	function str2array(str) {
		return str
			.replace(/[()]/, "")
			.split(",")
			.map(n => parseInt(n.trim(), 10));
	}
	function str2size(str) {
		const vec = str2array(str);
		return cc.size.apply(cc, vec);
	}
	function str2vec(str) {
		const vec = str2array(str);
		return vec.length === 3 ? cc.v3.apply(cc, vec) : cc.v2.apply(cc, vec);
	}
	function str2color(str) {
		let c = hexToRgb(str);
		if (!c) {
			return cc.color(c.r, c.g, c.b, 255);
		}
		return rgba2color(str);
	}
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
	const NodesCache = {}; // Node cache which contains cc.Node refs
	const NodesCacheData = {}; // Node data cache
	const InspectLayerId = "cc-devtool-inspect-layer";
	const ccdevtool = (window.ccdevtool = {
		nodeId: 1,
		NodesCacheData,
		/**
		 * Load tree node data
		 * @return {Object} node data in JSON
		 */
		getTreeNodes() {
			const scene = cc.director.getScene();
			let ret = [];
			this.nodeId = 1;
			// 如果场景已经被加载序列化场景
			if (scene) {
				ret = this.serialize(scene, true);
			}
			return ret;
		},
		compile() {
			setTimeout(location.reload, 2000);
		},
		/**
		 * Post message to content script and then forward message to cc-devtool
		 * @param  {String} name, all type are prefixed with ':'
		 * @param  {Any} data
		 */
		postMessage(name = '', data = {}) {
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
			if (!ele) return false;
			ele.style.display = val ? "" : "none";
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
		 * Hide inspect layer
		 */
		hideInspectLayer() {
			this.toggleElement(`#${InspectLayerId}`, false);
		},
		showInspectLayer() {
			var inspectLayer = document.getElementById(InspectLayerId);
			if (!inspectLayer) {
				this.createInspectLayer();
			}
			this.toggleElement(`#${InspectLayerId}`, true);
		},
		/**
		 * Create inspect layer
		 */
		createInspectLayer() {
			const inspectLayer = document.createElement("canvas");
			const ccCanvas = document.getElementById("GameCanvas");
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
			inspectLayer.id = InspectLayerId;
			document.body.appendChild(inspectLayer);
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
		inspectNode(uuid) {
			console.trace((window.$n = NodesCache[uuid]));
		},
		reloadScene() {
			try {
				const s = cc.director.getScene();
				cc.director.loadScene(s.name);
			} catch (e) {}
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
				if (isScene && key === 'active') {
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
			let box = null;
			if (node.parent) {
				box = node.getBoundingBoxToWorld();
				box.left = box.x / 2;
				box.bottom = box.y / 2;
				box.width = node.width / 2;
				box.height = node.height / 2;
			}
			/**
			 * Cache node in some place other than NodesCacheData
			 * pass node reference to devtool will cause `Object reference chain is too long` error
			 */
			NodesCache[node.uuid] = node;
			const ret = (NodesCacheData[node.uuid] = {
				id: this.nodeId++,
				uuid: node.uuid,
				label: node.name,
				props: kv,
				comps: getComponentsData(node),
				box,
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
		cc.director.on(cc.director.EVENT_AFTER_SCENE_LAUNCH, () => {
			this.postMessage("cc-devtool: lauch-scene");
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
}