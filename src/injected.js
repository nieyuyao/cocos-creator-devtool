export default function () {
	if (!window.cc) return;
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
			"eulerAngles",
			"scaleX",
			"scaleY"
			// 'skewX', 'skewY'
		]
	};
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
	const DebugLayerCss = `
    .debug-layer.show-all .debug-box,
    .debug-box:hover,
    .debug-box.selected {
      outline: 1px dashed rgba(255,0,0,.8);
    }
    #cc-devtool-debug {
      background-color: rgba(0,0,0,0.1);
    }`;
	const noop = new Function();
	const NodesCache = {}; // Node cache which contains cc.Node refs
	const NodesCacheData = {}; // Node data cache
	const DebugLayerId = "cc-devtool-debug";
	const DebugLayerStyleId = "cc-devtool-style";
	const ccdevtool = (window.ccdevtool = {
		nodeId: 1,
		NodesCacheData,
		/**
		 * Load tree node data
		 * @return {Object} node data in JSON
		 */
		getTreeNodes() {
			const scene = cc.director.getScene();
			var ret = [];
			const bak = cc.error;
			try {
				// suppress deprecation error
				cc.error = noop;
				this.nodeId = 1;
				ret = this.serialize(scene);
			} catch (e) {
				console.error(e);
			} finally {
				// restore cc.error
				cc.error = bak;
			}
			return ret;
		},
		compile() {
			fetch("/update-db");
			setTimeout(location.reload, 2000);
		},
		/**
		 * Post message to content script and then forward message to cc-devtool
		 * @param  {String} type, all type are prefixed with ':'
		 * @param  {any} data
		 */
		postMessage(type, data) {
			window.postMessage({
				type,
				data
			}, "*");
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
		 * Hide debugging div
		 */
		hideDebugLayer() {
			this.toggleElement(`#${DebugLayerId}`, false);
		},
		/**
		 * Create debugging div
		 */
		createDebugLayer() {
			var debugLayer = document.getElementById(DebugLayerId);
			if (debugLayer) {
				debugLayer.parentNode.removeChild(debugLayer);
			}
			debugLayer = document.createElement("div");
			debugLayer.id = DebugLayerId;
			debugLayer.classList.add("cc-devtool");
			debugLayer.classList.add("debug-layer");
			const s = debugLayer.style;
			s.position = "absolute";
			s.top = s.bottom = s.left = s.right = 0;

			const ctn = document.querySelector("#Cocos2dGameContainer");
			ctn.position = "relative";
			ctn.appendChild(debugLayer);

			// style
			var style = document.getElementById(DebugLayerStyleId);
			if (!style) style = document.createElement("style");
			style.id = DebugLayerStyleId;
			style.innerHTML = DebugLayerCss;
			document.body.appendChild(style);
		},
		/**
		 * Create debugging box for given node on debug layer
		 * @param  {cc.Node} n
		 * @param  {Number} zIndex
		 */
		createDebugBox(n, zIndex) {
			const nodeInfo = NodesCacheData[n.uuid];
			if (!nodeInfo || !nodeInfo.box) return;
			var div = document.getElementById(n.uuid);
			if (div) {
				div.parentNode.removeChild(div);
			}
			const hratio = 1,
				vratio = 1;

			const box = nodeInfo.box;
			div = document.createElement("div");
			n.debugBox = div;
			div.id = n.uuid;
			div.classList.add("cc-devtool");
			div.classList.add("debug-box");

			const s = div.style;
			s.position = "absolute";
			s.width = box.width / hratio + "px";
			s.height = box.height / vratio + "px";
			s.bottom = box.bottom / vratio + "px";
			s.left = box.left / hratio + "px";
			// s.outline = '1px solid #eee';
			s.outlineOffset = "0px";
			s.zIndex = zIndex;
			s.innerText = nodeInfo.label;
			div.dataset.name = nodeInfo.label;

			const debugLayer = document.getElementById(DebugLayerId);
			debugLayer.appendChild(div);
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
			} else if (key === "eulerAngles") {
				try {
					let xyz = value
						.replace(/[()]/, "")
						.split(", ")
						.map(parseFloat);
					return (node[key] = cc.v3.apply(cc.v3, xyz));
				} catch (e) {
					console.error(`Can not convert ${value} to cc.v3`);
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
			console.trace(window.$c = NodesCache[uuid]._components[index]);
		},
		/**
		 * Print node in Console
		 * @param  {String} uuid, uuid of a node
		 */
		inspectNode(uuid) {
			console.trace(window.$n = NodesCache[uuid]);
		},
		reloadScene() {
			try {
				const s = cc.director.getScene();
				cc.director.loadScene(s.name);
			} catch (e) {}
		},
		/**
		 * Serialize node info/props into plain objects
		 * @param  {cc.Scene|cc.Node} n
		 * @param  {Number} zIndex
		 * @return {Object}
		 */
		serialize: function (n, zIndex = 0) {
			const props =
				SerializeProps[cc.ENGINE_VERSION >= "2.0.0" ? "2.0.0" : "default"];
			const kv = props.reduce((result, key) => {
				var value = n[key];
				if (key === "color") value = value.toCSS();
				if (key === "eulerAngles") value = value.toString();
				result.push({
					key,
					value
				});
				return result;
			}, []);

			// box for make debugging div box
			var box = null;
			if (n.parent) {
				box = n.getBoundingBoxToWorld();
				box.left = box.x / 2;
				box.bottom = box.y / 2;
				box.width = n.width / 2;
				box.height = n.height / 2;
			}
			/**
			 * Cache node in some place other than NodesCacheData
			 * pass node reference to devtool will cause `Object reference chain is too long` error
			 */
			NodesCache[n.uuid] = n;

			const ret = (NodesCacheData[n.uuid] = {
				// node: n, // this will cause `Object reference chain is too long` error
				id: this.nodeId++,
				uuid: n.uuid,
				label: n.name,
				props: kv,
				comps: getComponentsData(n),
				box,
				children: n.children.map(it => ccdevtool.serialize(it, zIndex + 1))
			});
			return ret;
		}
	});
	/**
	 * Hijack cc.director.loadScene()
	 * when loadScene is called, notify cc-devtool panel to refresh node tree
	 */
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

	/**
	 * print a nice-looking notification if this file injected
	 */
	console.log(
		`%c cc-devtools %c Detected Cocos Creator Game %c`,
		"background:#35495e ; padding: 1px; border-radius: 2px 0 0 2px;  color: #fff",
		"background:#409EFF ; padding: 1px; border-radius: 0 2px 2px 0;  color: #fff",
		"background:transparent"
	);

	ccdevtool.postMessage(":cc-found", true);

	/**
	 * Get components data from given node
	 * @param  {cc.Node} n
	 * @return {Array} array of property/value
	 */
	function getComponentsData(n) {
		const comps = n._components;
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
				key: comp.constructor.name,
				index: i,
				uuid: n.uuid,
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
}