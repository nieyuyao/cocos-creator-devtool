export const ignoredComponentProp = [
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
export const SerializeProps = {
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
export const StatsStyleText = `
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
export const InspectLayerInfo = {
	id: 'cc-devtool-inspect-layer',
    color: 'rgba(0, 126, 255, 0.2)',
    textColor: 'rgba(255, 255, 255, 1)',
    textFont: 'normal bold 36px sans-serif'
}
export const StatsLayerId = 'fps';