<template>
	<div class="main">
		<ElHeader>
			<img class="logo" src="../chrome-extension/icons/icon-48.png" alt />
			<h1>
				<a href="https://docs.cocos.com/creator/manual/zh/" target="_blank">Cocos Creator Devtool</a>
			</h1>
			<ElCheckbox v-model="isShowFps">FPS Panel</ElCheckbox>
			<ElCheckbox v-show="hasEruda" v-model="isShowErudaBtn">Eruda Button</ElCheckbox>
			<ElButton
				@click="refreshTree"
				id="refresh-btn"
				type="primary"
				size="mini"
				icon="el-icon-refresh"
			>Refresh Tree</ElButton>
			<ElButton @click="reloadScene" type="primary" icon="el-icon-refresh" size="mini">Reload Scene</ElButton>
			<ElButton @click="compile" type="primary" icon="el-icon-setting" size="mini">Compile</ElButton>
			<ElButton @click="reload" type="primary" icon="el-icon-refresh" size="mini">Reload Extension</ElButton>
		</ElHeader>
		<ElContainer>
			<ElAside>
				<ElInput v-model="filterText" size="mini" clearable placeholder="Node name"></ElInput>
				<ElTree
					ref="tree"
					@node-click="onClickTreeNode"
					:data="treeNode"
					:highlight-current="true"
					:default-expanded-keys="[1, 2]"
					:expand-on-click-node="false"
					:filter-node-method="filterNode"
				></ElTree>
			</ElAside>
			<ElMain>
				<div style="margin-bottom: 1em;">
					<i style="font-size:24px;margin-right: 1em;vertical-align:middle;color:gray;"></i>
					<ElButton @click="inspectNode" type="primary" icon="el-icon-view" size="mini">Inspect</ElButton>
				</div>
				<h2>Components</h2>
				<div v-if="nodeComps">
					<table
						class="el-table comp-table"
						v-for="comp in nodeComps"
						style="width:500px;"
						:key="comp.uuid"
					>
						<colgroup>
							<col style="width: 200px;" />
							<col style="width: 300px;" />
						</colgroup>
						<thead>
							<tr>
								<th v-text="comp.key"></th>
								<th class="inspect-btn">
									<ElButton
										@click="inspectComponent(comp)"
										size="mini"
										type="normal"
										icon="el-icon-view"
									>Inspect</ElButton>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="prop in comp.props" :key="prop.name">
								<td v-text="prop.name"></td>
								<td>
									<component
										v-if="prop.type"
										:is="prop.type"
										:data-raw-type="prop.rawType"
										v-model="prop.value"
										size="mini"
									></component>
									<span v-else-if="!prop.value"></span>
									<span v-else v-text="prop.value"></span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<h2>Properties</h2>
				<ElTable :data="nodeProps" stripe>
					<ElTableColumn prop="key" label="Property" :width="200"></ElTableColumn>
					<ElTableColumn prop="key" label="Value" :width="300">
						<template slot-scope="scope">
							<span v-if="shouldDisplayText(scope.row)">{{scope.row.value}}</span>
							<ElSwitch
								v-else-if="shouldDisplayCheckbox(scope.row)"
								size="mini"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElSwitch>
							<ElSwitch
								v-else-if="shouldDispalyInputNumber(scope.row)"
								size="mini"
								:step="inputNumberStep"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElSwitch>
							<ElColorPicker
								v-else-if="shouldDisplayColorPicker(scope.row)"
								size="mini"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElColorPicker>
							<ElColorPicker
								v-else
								v-model="scope.row.value"
								size="mini"
								@change="onPropChange(scope.row)"
							></ElColorPicker>
						</template>
					</ElTableColumn>
				</ElTable>
			</ElMain>
		</ElContainer>
	</div>
</template>

<script>
import injectedScript from '../injected';
export default {
	name: "App",
	mixins: [],
	data() {
		return {
			isShowDebugLayer: false,
			isShowFps: true,
			isShowErudaBtn: true,
			treeNode: [],
			nodeProps: [],
			nodeComps: [],
			filterText: "",
			inputNumberStep: 1
		};
	},
	mounted() {
		if (localStorage.getItem("showTip") !== "true") {
			Notification.info({
				duration: 0,
				message:
					"Tip: You can use Cmd/Ctrl/Shift to alter step when click +/- buttons",
				onClose() {
					localStorage.setItem("showTip", true);
				}
			});
		}
		window.app = this;
		this.inspectedWindow = chrome.devtools.inspectedWindow;
		const tabId = chrome.devtools.inspectedWindow.tabId;
		const conn = chrome.runtime.connect({
			name: "" + tabId
		});
		conn.postMessage({
			name: "cc-devtool:panelPageCreated",
			tabId
		});
		log(`Connecting to window #${tabId}`);
		conn.onMessage.addListener(message => {
			if (!message) return;
			log(message);
			switch (message.type) {
				case "cc-devtool:inspectedWinReloaded":
					location.reload();
					break;
				case "cc-devtool:gameOnShow":
				case "cc-devtool:loadScene":
					this.init();
					break;
			}
		});
		// TODO: 此时直接执行，有可能场景还未加载完
		this.init();
	},
	watch: {
		filterText(val) {
			this.$refs.tree.filter(val);
		},
		isShowDebugLayer(val) {
			this.ccdevtool.toggleElement("#cc-devtool-debug", val);
			if (val) this.ccdevtool.getTreeNodes();
		},
		isShowFps(val) {
			this.ccdevtool.toggleElement("#fps", val);
			this.ccdevtool.toggleNode("PROFILER-NODE", val);
		},
		hasEruda() {
			return this.ccdevtool.hasElement(".eruda-entry-btn");
		},
		isShowErudaBtn(val) {
			this.ccdevtool.toggleElement(".eruda-entry-btn", val);
		}
	},
	methods: {
		init() {
			this.injectScript().then(() => {
				this.loadTreeNodes();
			});
		},
		eval(code) {
			return new Promise((resolve, reject) => {
				try {
					this.inspectedWindow.eval(code, res => {
						if (res) log(res);
						resolve(res);
					});
				} catch (e) {
					log(e);
					reject(e);
				}
			});
		},
		reload() {
			location.reload();
		},
		shouldDisplayText(row) {
			return ["uuid", "name"].indexOf(row.key) >= 0;
		},
		shouldDisplayCheckbox(row) {
			return row.key === "active";
		},
		shouldDispalyInputNumber(row) {
			return (
				[
					"x",
					"y",
					"width",
					"height",
					"zIndex",
					"opacity",
					"anchorX",
					"anchorY",
					"rotation",
					"rotationX",
					"rotationY",
					"scale",
					"scaleX",
					"scaleY",
					"skewX",
					"skewY"
				].indexOf(row.key) >= 0
			);
		},
		shouldDisplayColorPicker(row) {
			return row.key === "color";
		},
		loadTreeNodes() {
			return this.ccdevtool.getTreeNodes().then(treeNode => {
				this.ccdevtool.createDebugLayer();
				if (!treeNode) {
					error("Get Tree Nodes information failed!");
					Message.warning({
						message:
							"You may need to click the refresh button to reload the node tree!"
					});
				} else {
					this.treeNode = [treeNode];
					this.nodeProps = treeNode.props;
					this.nodeComps = treeNode.comps;
				}
				if (!this.isShowDebugLayer) {
					this.ccdevtool.hideDebugLayer();
				}
			});
		},
		compile() {
			this.ccdevtool.compile();
		},
		filterNode(value, data) {
			if (!value) return true;
			return data.label.toLowerCase().indexOf(value) >= 0;
		},
		onClickTreeNode(node) {
			this.selectedNode = node;
			this.nodeProps = node.props;
			this.nodeComps = node.comps;
			this.ccdevtool.selectNode(node.uuid);
		},
		onPropChange(row) {
			if (!this.selectedNode) return;
			this.ccdevtool.updateNode(this.selectedNode.uuid, row.key, row.value);
		},
		onHidden() {
			this.ccdevtool.hideDebugLayer();
		},
		onMouseDown(e) {
			var step = 1;
			if (e.metaKey || e.ctrlKey) {
				step = 10;
			}
			if (e.altKey) {
				step = 100;
			}
			if (e.shiftKey) {
				step = 0.1;
			}
			this.inputNumberStep = step;
		},
		onMouseUp(e) {
			this.inputNumberStep = 1;
		},
		refreshTree() {
			this.loadTreeNodes();
		},
		inspectNode() {
			if (this.selectedNode) this.ccdevtool.inspectNode(this.selectedNode.uuid);
		},
		reloadScene() {
			this.ccdevtool.reloadScene();
		},
		inspectComponent(row) {
			this.ccdevtool.inspectComponent(row.uuid, row.index);
		},
		injectScript() {
			// inject ccdevtool
			const fn = injectedScript.toString();
			const js = `(${fn})();`;
			this.eval(js).then(_ => log("ccdevtool injected!"));
			var tryTimes = 60;
			const vm = this;
			const doEval = function() {
				vm.eval("ccdevtool").then(ccdevtool => {
					vm.ccdevtool = {};
					for (let name in ccdevtool) {
						vm.ccdevtool[name] = function(...args) {
							args = JSON.stringify(args).slice(1, -1);
							return vm.eval(`ccdevtool.${name}(${args})`);
						};
					}
				});
			};
			return new Promise((rs, rj) => {
				// TODO:使用setTimeout实现
				var timer = setInterval(() => {
					doEval();
					tryTimes -= 1;
					if (
						tryTimes <= 0 ||
						(vm.ccdevtool && Object.keys(vm.ccdevtool).length > 0)
					) {
						clearInterval(timer);
						rs();
					}
				}, 1000);
			});
		}
	}
};
</script>

<style lang="scss">
.main {
	input,
	button {
		border-radius: 2px;
	}
	h1 {
		font-size: 14px;
		display: inline;
		margin: 0 1em 0 0;
	}
	.logo {
		width: 24px;
		height: 24px;
		vertical-align: top;
		margin-right: 1em;
	}
	a {
		color: black;
		text-decoration: none;
	}
	.comp-table {
		border-collapse: collapse;
		.inspect-btn {
			text-align: right;
		}
		th,
		td {
			padding: 0.5em 1em !important;
		}
	}
	.el-table {
		margin-bottom: 1em;
		&::before {
			display: none;
		}
		td {
			padding: 2px;
		}
		th {
			background-color: #efefef;
		}
	}
	.el-input-number--mini {
		line-height: 22px;
	}

	.el-tree-node.is-current {
		position: relative;
		&::before {
			content: "$n0";
			position: absolute;
			top: 0.5em;
			right: 4px;
			color: #b7b7b7;
		}
	}
}
</style>