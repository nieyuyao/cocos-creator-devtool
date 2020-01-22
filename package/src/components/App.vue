<template>
	<div class="main" id="app">
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
						<ElSwitch v-model="isShowStats"></ElSwitch>
						<ElTooltip effect="dark" content="Show Stats/显示游戏参数" placement="bottom">
							<span>Stats</span>
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
					<!-- Reload Scene -->
					<div class="btn" @click="refreshTree">
						<ElTooltip effect="dark" content="重新加载场景" placement="bottom">
							<div>
								<ElButton type="primary" icon="el-icon-refresh-right" size="small" circle></ElButton>
								<span>Reload Scene</span>
							</div>
						</ElTooltip>
					</div>
					<!-- Reload Extension -->
					<div class="btn" @click="reload">
						<ElTooltip effect="dark" content="重新加载插件" placement="bottom">
							<div>
								<ElButton type="primary" icon="el-icon-files" size="small" circle></ElButton>
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
				<div class="loading" v-if="showLoading">
					<span>
						<i class="el-icon-loading"></i>
					</span>
				</div>
				<ElTree
					v-else
					ref="tree"
					:data="treeNode"
					:highlight-current="true"
					:default-expanded-keys="[1, 2]"
					:expand-on-click-node="false"
					:filter-node-method="filterNode"
					@node-click="onClickTreeNode"
				></ElTree>
				
			</ElAside>
			<ElMain class="main">
				<ElButton @click="printNode" type="primary" icon="el-icon-view" size="mini" round>Print</ElButton>
				<h3 class="title">Components</h3>
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
										round
									>Print</ElButton>
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
				<h3 class="title">Properties</h3>
				<ElTable :data="nodeProps" stripe>
					<ElTableColumn prop="key" label="Property" :width="200"></ElTableColumn>
					<ElTableColumn prop="key" label="Value" :width="300">
						<template slot-scope="scope">
							<!-- string -->
							<span v-if="checkPropValueType(scope.row) === 1">
								{{scope.row.value}}
							</span>
							<!-- number -->
							<ElInputNumber
								v-else-if="checkPropValueType(scope.row) === 2"
								size="mini"
								:step="inputNumberStep"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElInputNumber>
							<!-- color -->
							<ElColorPicker
								v-else-if="checkPropValueType(scope.row) === 3"
								size="mini"
								v-model="scope.row.value"
								@change="onPropChange(scope.row)"
							></ElColorPicker>
							<!-- active -->
							<ElSwitch
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
				<Box :bound="bound" @box-show="projectNodeToInspectLayer" @box-hide="disableNodeToInspectLayer"></Box>
			</ElAside>
		</ElContainer>
	</div>
</template>

<script>
import Box from './Box.vue';
import { log, error, warn } from '../assets/utils';
export default {
	name: "App",
	mixins: [],
	components: {
		Box
	},
	data() {
		return {
			isShowInspectLayer: false,
			isShowStats: true,
			treeNode: [],
			nodeProps: [],
			nodeComps: [],
			filterText: "",
			inputNumberStep: 1,
			showLoading: false, // 显示loading
			timer: 0,
			bound: {}
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
			val ? this.ccdevtool.showInspectLayer() : this.ccdevtool.hideInspectLayer();
		},
		isShowStats(val) {
			val ? this.ccdevtool.showStatsPanel() : this.ccdevtool.hideStatsPanel();
		}
	},
	methods: {
		// 创建与background.js的连接
		connect() {
			this.inspectedWindow = chrome.devtools.inspectedWindow;
			this.tabId = chrome.devtools.inspectedWindow.tabId;
			this.conn = chrome.runtime.connect({
				name: `${this.tabId}`
			});
			log(`Connecting to window ${this.tabId}`);
			this.conn.onMessage.addListener(message => {
				if (!message) return;
				switch (message.name) {
					case 'cc-devtool: panel-shown':
						this.onPanelShown();
						break;
					case 'cc-devtool: panel-hidden':
						this.onPanelHidden();
						break;
					case 'cc-devtool: window-loaded':
						location.reload();
						break;
					case 'cc-devtool: game-show':
					case 'cc-devtool: lauch-scene':
						this.initCCDevtool()
							.then(() => {
								this.loadTreeNodes();
							});
						break;
				}
			});
			this.postMessage('cc-devtool: panel-created');
		},
		// 断开与background.js的连接
		disconnect() {
			const conn = this.conn;
			conn.disconnect();
		},
		// 发送消息
		postMessage(messageName) {
			const { conn, tabId } = this;
			conn.postMessage({
				source: 'devtool',
				name: messageName,
				tabId
			});
		},
		// 初始化ccdevtool
		init() {
			this.initCCDevtoolPromise = this.initCCDevtool();
			this.initCCDevtoolPromise
				.then(() => {
					this.loadTreeNodes();
				});
		},
		/**
		 * @description 执行代码块
		 * @param {String} code 代码片段
		 */
		eval(code) {
			return new Promise((resolve, reject) => {
				try {
					this.inspectedWindow.eval(code, (res, err) => {
						err ? reject(err) : resolve(res);
					});
				} catch (e) {
					error(e);
					reject(e);
				}
			});
		},
		// 重新加载插件
		reload() {
			location.reload();
		},
		/**
		 * @description 判断节点属性类型
		 * @param {String} key 属性名
		 */
		checkPropValueType({ key = '' }) {
			if (['uuid', 'name'].indexOf(key) > -1) {
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
			return 0;
		},
		// 加载节点
		loadTreeNodes() {
			this.showLoading = true;
			return this.ccdevtool.getTreeNodes()
			.then(treeNode => {
				if (treeNode) {
					this.treeNode = [treeNode];
					this.nodeProps = treeNode.props;
					this.nodeComps = treeNode.comps;
				}
				this.showLoading = false;
				// 5s后认为超时
				clearTimeout(this.timer);
			});
			clearTimeout(this.timer);
			this.timer = setTimeout(() => {
				this.showLoading = false;
			}, 5000);
		},
		// 过滤节点
		filterNode(value, data) {
			if (!value) return true;
			return data.label.toLowerCase().indexOf(value) >= 0;
		},
		// 点击节点
		onClickTreeNode(node) {
			this.selectedNode = node;
			this.nodeProps = node.props;
			this.nodeComps = node.comps;
			this.ccdevtool.selectNode(node.uuid);
			this.bound = node.bound;
		},
		// 监听节点属性变化
		onPropChange(row) {
			if (!this.selectedNode) return;
			this.ccdevtool.updateNode(this.selectedNode.uuid, row.key, row.value);
		},
		// 刷新节点树
		refreshTree() {
			this.loadTreeNodes();
		},
		// 调试节点
		printNode() {
			if (this.selectedNode) {
				this.ccdevtool.printNode(this.selectedNode.uuid);
			}
		},
		// 调试组件
		inspectComponent(row) {
			this.ccdevtool.inspectComponent(row.uuid, row.index);
		},
		initCCDevtool() {
			let tryTimes = 60;
			const vm = this;
			const doEval = function() {
				vm.eval('checkCCDevtool()')
					.then(ccdevtool => {
						if (ccdevtool) {
							vm.ccdevtool = {};
							for (let name in ccdevtool) {
								vm.ccdevtool[name] = function(...args) {
									args = JSON.stringify(args).slice(1, -1);
									return vm.eval(`ccdevtool.${name}(${args})`);
								};
							}
						}
					})
					.catch(err => {
						error(err);
					});
			};
			return new Promise((resolve, reject) => {
				this.timer = 0;
				const checkCCDevtool = () => {
					doEval();
					tryTimes -= 1;
					if (tryTimes <= 0 || vm.ccdevtool) {
						this.timer && clearTimeout(this.timer);
						resolve();
					} else {
						this.timer = setTimeout(checkCCDevtool, 1000);
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
		},
		beforeDestoryed() {
			this.disconnect();
			clearTimeout(this.timer);
		},
		/**
		 * @description 在inspect layer上显示节点
		 * @param {uuid} String 节点的uuid
		 */
		projectNodeToInspectLayer(uuid = '') {
			if (uuid && this.isShowInspectLayer) {
				this.ccdevtool.projectNodeToInspectLayer(uuid);
			}
		},
		disableNodeToInspectLayer(uuid = '') {
			if (uuid && this.isShowInspectLayer) {
				this.ccdevtool.disableNodeToInspectLayer(uuid);
			}
		}
	}
};
</script>

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
	.title {
		color: #409EFF;
	}
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
					span {
						font-size: 14px;
					}
				}
				i[class^=el-icon-] {
					font-size: 14px;
				}
				.el-button--small.is-circle {
					padding: 6px;
				}
			}
		}
	}
	.container {
		height: calc(100vh - 70px);
		.left, .right {
			display: flex;
			flex-direction: column;
			height: 100%;
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
		}
		.right {
			flex-grow: 1;
		}
		.left {
			position: relative;
			border-right: 1px solid rgba(0,0,0,0.15);
			box-sizing: border-box;
			.loading {
				font-size: 36px;
				position: absolute;
				top: 200px;
				left: 138px;
			}
		}
		.main {
			width: 540px;
			height: 100%;
			flex-grow: 0;
			flex-shrink: 0;
			border-right: 1px solid rgba(0,0,0,0.15);
			box-sizing: border-box;
			overflow: scroll;
		}
	}
	.el-input-number > span[role="button"]:first-child{
		margin: 1px 0 0 1px;
	}
	.el-color-picker__color-inner {
		top: 1px;
		left: 1px;
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