<template>
	<div class="main">
		<!-- <ElHeader>
			
		</ElHeader> -->
	</div>
</template>

<script>
import { log, error } from "../utils/logger.js";
import injectedScript from "../injectedScript.js";
import LogImg from "../../img/48.png";
import "element-ui/lib/theme-chalk/index.css";
import { Message } from "element-ui";
import { Notification } from "element-ui";
import ElButton from "element-ui/lib/button";
import ElCheckbox from "element-ui/lib/checkbox";
import ElSwitch from "element-ui/lib/switch";
import ElInput from "element-ui/lib/input";
import ElInputNumber from "element-ui/lib/input-number";
import ElColorPicker from "element-ui/lib/color-picker";
import ElTree from "element-ui/lib/tree";
import ElContainer from "element-ui/lib/container";
import ElHeader from "element-ui/lib/header";
import ElAside from "element-ui/lib/aside";
import ElMain from "element-ui/lib/main";
import ElFooter from "element-ui/lib/footer";
import ElTable from "element-ui/lib/table";
import ElTableColumn from "element-ui/lib/table-column";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";
locale.use(lang);

export default {
	name: 'App',
	// components: {
	// 	ElButton,
	// 	ElCheckbox,
	// 	ElSwitch,
	// 	ElInput,
	// 	ElInputNumber,
	// 	ElColorPicker,
	// 	ElTree,
	// 	ElContainer,
	// 	ElHeader,
	// 	ElAside,
	// 	ElMain,
	// 	ElFooter,
	// 	ElTable,
	// 	ElTableColumn
	// }
}
</script>

<style lang="scss">
</style>