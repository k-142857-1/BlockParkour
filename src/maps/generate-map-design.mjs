import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const mapPath = fileURLToPath(new URL("./map.json", import.meta.url));
const outputPath = fileURLToPath(new URL("./map-design.svg", import.meta.url));
const map = JSON.parse(await readFile(mapPath, "utf8"));

const width = 2400;
const height = 1600;
const plot = { x: 150, y: 120, width: 2040, height: 840 };
const bounds = {
	xMin: map.diagram?.xMin ?? -30,
	xMax: map.diagram?.xMax ?? 38,
	yMin: map.diagram?.yMin ?? -2,
	yMax: map.diagram?.yMax ?? 6,
};
const scaleX = plot.width / (bounds.xMax - bounds.xMin);
const scaleY = plot.height / (bounds.yMax - bounds.yMin);
const xToSvg = (x) => plot.x + (x - bounds.xMin) * scaleX;
const yToSvg = (y) => plot.y + (bounds.yMax - y) * scaleY;
const escapeXml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

const sections = [
	{ key: "blocks", prefix: "B", name: "Block", color: "#64748b" },
	{ key: "gems", prefix: "G", name: "Gem", color: "#ef4444" },
	{ key: "checkpoints", prefix: "C", name: "Checkpoint", color: "#111827" },
	{ key: "hazards", prefix: "H", name: "Hazard", color: "#dc2626" },
	{ key: "ladders", prefix: "L", name: "Ladder", color: "#eab308" },
	{ key: "bounceZones", prefix: "Z", name: "Bounce", color: "#22c55e" },
	{ key: "switches", prefix: "S", name: "Switch", color: "#a855f7" },
	{ key: "doors", prefix: "D", name: "Door", color: "#7e22ce" },
];

const entries = sections.flatMap((section) =>
	(map[section.key] || []).map((item, index) => ({
		...item,
		code: section.prefix + String(index + 1).padStart(2, "0"),
		section,
	})),
);

const svg = [];
svg.push('<?xml version="1.0" encoding="UTF-8"?>');
svg.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '">');
svg.push("<defs>");
svg.push('<pattern id="side-only" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#fed7aa"/><line x1="0" y1="0" x2="0" y2="12" stroke="#f97316" stroke-width="4"/></pattern>');
svg.push('<filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.18"/></filter>');
svg.push("</defs>");
svg.push('<rect width="100%" height="100%" fill="#ffffff"/>');
svg.push('<text x="150" y="58" font-family="Arial, Microsoft YaHei, sans-serif" font-size="34" font-weight="700" fill="#111827">Map 1 Coordinate Design</text>');
svg.push('<text x="150" y="91" font-family="Arial, Microsoft YaHei, sans-serif" font-size="18" fill="#475569">All markers use the center coordinates from src/maps/map.json. Checkpoint respawn coordinates are listed separately.</text>');
svg.push('<rect x="' + plot.x + '" y="' + plot.y + '" width="' + plot.width + '" height="' + plot.height + '" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>');

for (let x = Math.ceil(bounds.xMin / 2) * 2; x <= bounds.xMax; x += 2) {
	const px = xToSvg(x);
	const major = x === 0;
	svg.push('<line x1="' + px + '" y1="' + plot.y + '" x2="' + px + '" y2="' + (plot.y + plot.height) + '" stroke="' + (major ? "#334155" : "#dbe3ec") + '" stroke-width="' + (major ? 2 : 1) + '"/>');
	svg.push('<text x="' + px + '" y="' + (plot.y + plot.height + 26) + '" text-anchor="middle" font-family="Consolas, monospace" font-size="14" fill="#475569">' + x + "</text>");
}
for (let y = Math.ceil(bounds.yMin); y <= bounds.yMax; y += 1) {
	const py = yToSvg(y);
	const major = y === 0;
	svg.push('<line x1="' + plot.x + '" y1="' + py + '" x2="' + (plot.x + plot.width) + '" y2="' + py + '" stroke="' + (major ? "#334155" : "#dbe3ec") + '" stroke-width="' + (major ? 2 : 1) + '"/>');
	svg.push('<text x="' + (plot.x - 18) + '" y="' + (py + 5) + '" text-anchor="end" font-family="Consolas, monospace" font-size="14" fill="#475569">' + y + "</text>");
}

function drawMarker(entry, offsetY = 0) {
	const cx = xToSvg(entry.x);
	const cy = yToSvg(entry.y) + offsetY;
	svg.push('<circle cx="' + cx + '" cy="' + cy + '" r="15" fill="#0f172a" stroke="#ffffff" stroke-width="2"/>');
	svg.push('<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-family="Consolas, monospace" font-size="11" font-weight="700" fill="#ffffff">' + entry.code + "</text>");
}

function drawRect(entry, fill, stroke, opacity = 1) {
	const x = xToSvg(entry.x - entry.w / 2);
	const y = yToSvg(entry.y + entry.h / 2);
	const w = entry.w * scaleX;
	const h = entry.h * scaleY;
	svg.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2" opacity="' + opacity + '" filter="url(#shadow)"/>');
}

entries.forEach((entry) => {
	if (entry.section.key === "blocks") {
		drawRect(entry, entry.collisionView === "side" ? "url(#side-only)" : "#94a3b8", "#475569");
		drawMarker(entry);
		return;
	}
	if (entry.section.key === "hazards") {
		const count = Math.max(2, Math.round(entry.w / 0.55));
		const left = entry.x - entry.w / 2;
		for (let index = 0; index < count; index += 1) {
			const x1 = xToSvg(left + (entry.w / count) * index);
			const x2 = xToSvg(left + (entry.w / count) * (index + 1));
			const peak = xToSvg(left + (entry.w / count) * (index + 0.5));
			svg.push('<path d="M ' + x1 + " " + yToSvg(entry.y - entry.h / 2) + " L " + peak + " " + yToSvg(entry.y + entry.h / 2) + " L " + x2 + " " + yToSvg(entry.y - entry.h / 2) + ' Z" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>');
		}
		drawMarker(entry, -24);
		return;
	}
	if (entry.section.key === "ladders") {
		const left = xToSvg(entry.x - entry.w / 2);
		const right = xToSvg(entry.x + entry.w / 2);
		const top = yToSvg(entry.y + entry.h / 2);
		const bottom = yToSvg(entry.y - entry.h / 2);
		svg.push('<line x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + bottom + '" stroke="#eab308" stroke-width="7"/>');
		svg.push('<line x1="' + right + '" y1="' + top + '" x2="' + right + '" y2="' + bottom + '" stroke="#eab308" stroke-width="7"/>');
		for (let rung = 1; rung < 8; rung += 1) {
			const y = top + ((bottom - top) * rung) / 8;
			svg.push('<line x1="' + left + '" y1="' + y + '" x2="' + right + '" y2="' + y + '" stroke="#eab308" stroke-width="5"/>');
		}
		drawMarker(entry);
		return;
	}
	if (entry.section.key === "gems") {
		const cx = xToSvg(entry.x);
		const cy = yToSvg(entry.y);
		const fill = entry.type === "sideToTop" ? "#ef4444" : "#0ea5e9";
		svg.push('<path d="M ' + cx + " " + (cy - 22) + " L " + (cx + 18) + " " + cy + " L " + cx + " " + (cy + 22) + " L " + (cx - 18) + " " + cy + ' Z" fill="' + fill + '" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>');
		drawMarker(entry, -34);
		return;
	}
	if (entry.section.key === "checkpoints") {
		const cx = xToSvg(entry.x);
		const cy = yToSvg(entry.y);
		svg.push('<line x1="' + cx + '" y1="' + (cy + 26) + '" x2="' + cx + '" y2="' + (cy - 28) + '" stroke="#111827" stroke-width="5"/>');
		svg.push('<path d="M ' + cx + " " + (cy - 28) + " L " + (cx + 34) + " " + (cy - 15) + " L " + cx + " " + (cy - 2) + ' Z" fill="#f8fafc" stroke="#111827" stroke-width="4"/>');
		const respawn = entry.respawn || { x: entry.x, y: entry.y };
		const rx = xToSvg(respawn.x);
		const ry = yToSvg(respawn.y);
		svg.push('<circle cx="' + rx + '" cy="' + ry + '" r="9" fill="none" stroke="#06b6d4" stroke-width="4"/>');
		drawMarker(entry, -45);
		return;
	}
	if (entry.section.key === "bounceZones") {
		drawRect(entry, "#22c55e", "#15803d", 0.72);
		drawMarker(entry, -22);
		return;
	}
	if (entry.section.key === "switches") {
		drawRect(entry, "#c084fc", "#7e22ce");
		drawMarker(entry, -22);
		return;
	}
	if (entry.section.key === "doors") {
		drawRect(entry, "#a855f7", "#581c87", 0.82);
		drawMarker(entry);
	}
});

const spawnX = xToSvg(map.spawn.x);
const spawnY = yToSvg(map.spawn.y);
svg.push('<circle cx="' + spawnX + '" cy="' + spawnY + '" r="18" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>');
svg.push('<text x="' + spawnX + '" y="' + (spawnY + 6) + '" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700">P</text>');

const legendY = 1025;
svg.push('<text x="150" y="' + legendY + '" font-family="Arial, Microsoft YaHei, sans-serif" font-size="26" font-weight="700" fill="#111827">Coordinate ledger</text>');
svg.push('<text x="420" y="' + legendY + '" font-family="Arial, Microsoft YaHei, sans-serif" font-size="16" fill="#475569">Orange hatch = side-view-only collision. Cyan ring = checkpoint respawn center.</text>');

function formatNumber(value) {
	return Number.isInteger(value) ? String(value) : String(value);
}

function formatEntry(entry) {
	let details = entry.code + "  " + entry.id + "  x=" + formatNumber(entry.x) + " y=" + formatNumber(entry.y);
	if (Number.isFinite(entry.w) && Number.isFinite(entry.h)) {
		details += " w=" + formatNumber(entry.w) + " h=" + formatNumber(entry.h);
	}
	if (entry.type) {
		details += " type=" + entry.type;
	}
	if (entry.collisionView) {
		details += " collision=" + entry.collisionView;
	}
	if (entry.respawn) {
		details += " respawn=(" + entry.respawn.x + "," + entry.respawn.y + "," + entry.respawn.viewMode + ")";
	}
	if (Number.isFinite(entry.openDuration)) {
		details += " timer=" + entry.openDuration + "s";
	}
	return details;
}

const rowsPerColumn = Math.ceil(entries.length / 3);
const columnWidth = 750;
entries.forEach((entry, index) => {
	const column = Math.floor(index / rowsPerColumn);
	const row = index % rowsPerColumn;
	const x = 150 + column * columnWidth;
	const y = 1070 + row * 45;
	svg.push('<circle cx="' + (x + 12) + '" cy="' + (y - 5) + '" r="8" fill="' + entry.section.color + '"/>');
	svg.push('<text x="' + (x + 30) + '" y="' + y + '" font-family="Consolas, Microsoft YaHei, monospace" font-size="15" fill="#1e293b">' + escapeXml(formatEntry(entry)) + "</text>");
});

svg.push('<text x="150" y="1555" font-family="Consolas, monospace" font-size="16" fill="#475569">Spawn P: x=' + map.spawn.x + " y=" + map.spawn.y + " view=" + map.spawn.viewMode + "</text>");
svg.push('<text x="2250" y="1555" text-anchor="end" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Generated from map.json</text>');
svg.push("</svg>");

await writeFile(outputPath, svg.join(String.fromCharCode(10)) + String.fromCharCode(10), "utf8");
console.log("Generated " + outputPath);
