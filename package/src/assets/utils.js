import { ignoredComponentProp } from './constants';

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

/**
 * Get components data from given node
 * @param  {cc.Node} n
 * @return {Array} array of property/value
 */
export function getComponentsData(node) {
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
export function hexToRgb(hex) {
	var comps = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return comps ?
		{
			r: parseInt(comps[1], 16),
			g: parseInt(comps[2], 16),
			b: parseInt(comps[3], 16)
		} :
		null;
}
