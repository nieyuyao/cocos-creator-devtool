<template>
	<div class="main">
		<!-- 顶部 -->
		<ElHeader class="header">
			<div class="title">
				<img class="logo" src="../../icons/icon-128.png" />
				<a href="https://docs.cocos.com/creator/manual/zh/" target="_blank">Cocos Creator Inpsector</a>
			</div>
			<!-- 功能按钮等 -->
			<div class="features">
				<div class="switchs">
					<div class="switch">
						<ElSwitch v-model="isShowFps"></ElSwitch>
						<ElTooltip effect="dark" content="Show FPS/显示FPS" placement="bottom">
							<span>FPS</span>
						</ElTooltip>
					</div>
					<div class="switch">
						<ElSwitch v-model="isShowInspectLayer"></ElSwitch>
						<ElTooltip effect="dark" content="Show Inspect Layer/显示调试层" placement="bottom">
							<span>Inspect</span>
						</ElTooltip>
					</div>
				</div>
				<div class="buttons">
					<!-- Refresh Tree -->
					<div class="btn" @click="refreshTree">
						<ElTooltip effect="dark" content="刷新节点树" placement="bottom">
							<div>
								<span>
									<i class="el-icon-refresh"></i>
								</span>
								<span>Refresh Tree</span>
							</div>
						</ElTooltip>
					</div>
					<!-- Reload Scene -->
					<div class="btn" @click="reloadScene">
						<ElTooltip effect="dark" content="重新加载场景" placement="bottom">
							<div>
								<span >
									<i class="el-icon-refresh-right"></i>
								</span>
								<span>Reload Scene</span>
							</div>
						</ElTooltip>
					</div>
					<!-- Reload Extension -->
					<div class="btn" @click="reloadScene">
						<ElTooltip effect="dark" content="重新加载插件" placement="bottom">
							<div>
								<span>
									<i class="el-icon-files"></i>
								</span>
								<span>Reload Extension</span>
							</div>
							
						</ElTooltip>
					</div>
				</div>
			</div>
		</ElHeader>
		<ElContainer class="container">
			<!-- 左边栏 -->
			<ElAside class="left">
				<ElInput v-model="filterText" size="mini" clearable placeholder="Node name" prefix-icon="el-icon-search"></ElInput>
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
			<ElMain class="main">
				<ElButton @click="inspectNode" type="primary" icon="el-icon-view" size="mini" round>Print</ElButton>
				<p>Components</p>
				<div v-if="nodeComps">
					<table
						class="el-table comp-table"
						v-for="comp in nodeComps"
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
				<p>Properties</p>
				<ElTable :data="nodeProps" stripe>
					<ElTableColumn prop="key" label="Property" :width="200"></ElTableColumn>
					<ElTableColumn prop="key" label="Value" :width="300">
						<template slot-scope="scope">
							<!-- string -->
							<span v-if="checkPropValueType(scope.row) === 1">{{scope.row.value}}</span>
							<!-- number -->
							<ElInputNumber>
								v-else-if="checkPropValueType(scope.row) === 2"
								size="mini"
								:step="inputNumberStep"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElInputNumber>
							<!-- color -->
							<ElColorPicker>
								v-else-if="checkPropValueType(scope.row) === 3"
								size="mini"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElColorPicker>
							<!-- active -->
							<ElSwitch>
								v-else-if="checkPropValueType(scope.row) === 4"
								size="mini"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElSwitch>
						</template>
					</ElTableColumn>
				</ElTable>
			</ElMain>
			<ElAside class="right">
			</ElAside>
		</ElContainer>
	</div>
</template>
<style lang="scss">
%column {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	height: 70px;
	padding: 10px;
	box-sizing: border-box;
	&:hover {
		cursor: pointer;
		background-color: #d9ecff;
	}
}
.main {
	height: 100%;
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 70px !important;
		padding: 0;
		box-shadow: 0 0 8px rgba(0,0,0,0.15);
		.title {
			display: flex;
			align-items: center;
			height: 70px;
			.logo {
				width: 48px;
				height: 48px;
				margin-right: 1em;
			}
		}
		.features {
			display: flex;
			padding: 10px 0 10px 10px;
			.switchs {
				display: flex;
			}
			.switch {
				@extend %column;
				span {
					font-size: 14px;
				}
			}
			.buttons {
				display: flex;
				justify-content: center;
				align-items: center;
				.btn {
					.el-tooltip {
						@extend %column;
					}
					> span {
						font-size: 14px;
					}
				}
				i[class^=el-icon-] {
					font-size: 24px;
				}
			}
		}
	}
	.container {
		height: calc(100% - 70px);
		.left, .right {
			display: flex;
			flex-direction: column;
			padding: 10px 10px 0 10px;
			.el-input {
				flex-shrink: 0;
			}
			.el-tree {
				flex-grow: 1;
				overflow: scroll;
			}
		}
		.left {
			flex-grow: 0;
			flex-shrink: 0;
			border-right: 1px solid rgba(0,0,0,0.15);
			box-sizing: border-box;
		}
		.right {
			flex: 1;
		}
		.el-main {
			width: 540px;
			flex-grow: 0;
			flex-shrink: 0;
			border-right: 1px solid rgba(0,0,0,0.15);
			box-sizing: border-box;
			overflow: scroll;
		}
	}
	.comp-table {
		border-collapse: collapse;
		.inspect-btn {
			text-align: right;
		}
		th, td {
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

<script>
import injectedScript from '../injected';
import { log } from '../utils';
export default {
	name: "App",
	mixins: [],
	data() {
		return {
			isShowInspectLayer: false,
			isShowFps: true,
			treeNode: [],
			nodeProps: [],
			nodeComps: [],
			filterText: "",
			inputNumberStep: 1
		};
	},
	mounted() {
		this.connect();
		this.init();
	},
	watch: {
		filterText(val) {
			this.$refs.tree.filter(val);
		},
		isShowInspectLayer(val) {
			this.ccdevtool.toggleElement("#cc-devtool-inspect-layer", val);
		},
		isShowFps(val) {
			this.ccdevtool.toggleElement("#fps", val);
		}
	},
	methods: {
		connect() {
			this.inspectedWindow = chrome.devtools.inspectedWindow;
			this.tabId = chrome.devtools.inspectedWindow.tabId;
			this.conn = chrome.runtime.connect({
				name: `${this.tabId}`
			});
			log(`Connecting to window ${this.tabId}`);
			this.conn.onMessage.addListener(message => {
				if (!message) return;
				log(message);
				switch (message.name) {
					case "cc-devtool: panel-shown":
						this.onPanelShown();
						break;
					case "cc-devtool: panel-hidden":
						this.onPanelHidden();
						break;
					case "cc-devtool: window-loaded":
						location.reload();
						break;
					case "cc-devtool: game-show":
					case 'cc-devtool: lauch-scene':
						this.injectPromise
							.then(() => {
								this.loadTreeNodes();
							});
						break;
				}
			});
			this.postMessage('cc-devtool: panel-created');
		},
		postMessage(messageName) {
			const { conn, tabId } = this;
			conn.postMessage({
				name: messageName,
				tabId
			});
		},
		init() {
			this.injectPromise = this.injectScript();
			this.injectPromise
				.then(() => {
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
		checkPropValueType(row) {
			let res = 0;
			const key = row.key;
			if (["uuid", "name"].indexOf(key) > 0) {
				return 1;
			} else if ([
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
			].indexOf(key) !== -1) {
				return 2;
			} else if (key === 'color') {
				return 3;
			} else if (key === 'active') {
				return 4;
			}
		},
		loadTreeNodes() {
			return this.ccdevtool.getTreeNodes()
			.then(treeNode => {
				if (treeNode) {
					this.treeNode = [treeNode];
					this.nodeProps = treeNode.props;
					this.nodeComps = treeNode.comps;
				}
			});
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
			this.eval(js)
				.then(() => log("ccdevtool injected!"));
			let tryTimes = 60;
			const vm = this;
			const doEval = function() {
				vm.eval("ccdevtool")
					.then(ccdevtool => {
						if (vm.ccdevtool) {
							return;
						}
						vm.ccdevtool = {};
						for (let name in ccdevtool) {
							vm.ccdevtool[name] = function(...args) {
								args = JSON.stringify(args).slice(1, -1);
								return vm.eval(`ccdevtool.${name}(${args})`);
							};
						}
					});
			};
			return new Promise((resolve, reject) => {
				let timer = 0;
				const checkCCDevtool = () => {
					doEval();
					tryTimes -= 1;
					if (tryTimes <= 0 || (vm.ccdevtool && Object.keys(vm.ccdevtool).length > 0)) {
						timer && clearTimeout(timer);
						resolve();
					} else {
						timer = setTimeout(checkCCDevtool, 1000);
					}
				}
				checkCCDevtool();
			});
		},
		// shown
		onPanelHidden() {
			this.isShowInspectLayer = false;
		},
		// hidden
		onPanelShown() {
			this.isShowInspectLayer = true;
		}
	}
};
</script>