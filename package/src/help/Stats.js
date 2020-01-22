import { StatsStyleText, StatsLayerId } from '../assets/constants';

/**
 * @description 控制游戏参数面板显示的类
 * @param {Number} average 每隔多长时间刷新一次统计面板
 * @param {Object} statsInfo 需要统计的信息
 */
export default class Stats {
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