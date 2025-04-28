import { pointToLineDistance } from "../Utils/LineDistance.mjs";
import { diff, apply } from "../Utils/TextDiff.mjs";
import { getMainInstance } from "../main.mjs";

export class Line {
	constructor(data={}) {
		this.id = data.id ?? 0;
		this.color = data.color ?? "#000000";
		this.size = data.size ?? 10;
		this.points = data.points ?? [];
		this.pointsSent = 0;
	}
	draw(ctx) {
		const points = this.points;
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.size;
		ctx.beginPath();
		ctx.moveTo(points[0], points[1]);
		for(let i=2; i<points.length; i+=2) {
			ctx.lineTo(points[i], points[i+1]);
		}
		ctx.stroke();
	}
	addPoint(ctx, x, y) {
		const l = this.points.length;
		this.points.push(x, y);
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.size;
		ctx.beginPath();
		ctx.moveTo(this.points[l-2], this.points[l-1]);
		ctx.lineTo(x, y);
		ctx.stroke();
	}
	getCreationData() {
		return {
			color: this.color,
			size: this.size,
		};
	}
	getPointsData() {
		const pointData = this.points.slice(this.pointsSent);
		this.pointsSent = this.points.length;
		return pointData;
	}
	addPoints(points) {
		this.points.push(...points);
	}
	touches(x, y, size) {
		const points = this.points;
		const touchDistance = (size + this.size) / 2;
		for(let i=3; i<points.length; i+=2) {
			const distance = pointToLineDistance(x, y, points[i-3], points[i-2], points[i-1], points[i]);
			if (distance < touchDistance) return true;
		}
		return false;
	}
}

class Board {
	constructor(id, userId, data) {
		this.id = id;
		this.userId = userId;
		this.name = data.name;
		this.type = data.type;
		this.folderId = data.folderId;
		this.data = null;
		this.initialData = null;
		this.history = [];
		this.upToDate = true;
		this.selected = false;
	}
	getPublicData() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			data: this.data,
			folderId: this.folderId,
		};
	}
	getExportData() {
		return {
			name: this.name,
			type: this.type,
			data: this.data,
		};
	}
	addAction(action) {
		this.history.push(action);
		const historyUI = getMainInstance().baseUI.rightPanel.historyUI;
		if (this == historyUI.board) {
			historyUI.addContent([action]);
		}
	}
	goToAction(actionIndex) {
		this.upToDate = false;
		let currentActionIndex = 0;
		this.restoreData();
		while(currentActionIndex <= actionIndex) {
			this.history[currentActionIndex].apply(this);
			currentActionIndex++;
		}
	}
	goToNow() {
		this.upToDate = true;
		this.data = this.latestData;
	}
	restoreData() {
		throw new Error("Board.restoreData() is not implemented for base class");
	}
}

export class BoardImg extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
		const data2 = new Map(data.data.map(ent => [ent[0], new Line(ent[1])]));
		this.data = data2;
		this.latestData = data2;
		this.initialData = new Map(data2);
		this.unconfirmedData = new Set();
		this.backgroundImageSrc = data.backgroundImageSrc ?? null;
		this.backgroundImage = null;
		this.width = data.width ?? 1600;
		this.height = data.height ?? 900;
		this.backgroundImageLoading = false;
	}
	initImage(redraw) {
		if (this.backgroundImageLoading) return;
		this.backgroundImageLoading = true;
		const img = new Image();
		img.src = this.backgroundImageSrc;
		img.onload = () => {
			this.backgroundImage = img;
			redraw();
		};
	}
	getPublicData() {
		return {
			...super.getPublicData(),
			data: Array.from(this.data.entries()),
			backgroundImageSrc: this.backgroundImageSrc,
			width: this.width,
			height: this.height,
		};
	}
	async getExportData() {
		let dataURI = null;
		if (this.backgroundImageSrc) {
			const res = await fetch(this.backgroundImageSrc);
			const blob = await res.blob();
			dataURI = await new Promise((res) => {
				const reader = new FileReader();
				reader.onload = function() {
					res(this.result);
				};
				reader.readAsDataURL(blob);
			});
		}
		return {
			...super.getExportData(),
			data: Array.from(this.data.values()),
			backgroundImageSrc: dataURI,
			width: this.width,
			height: this.height,
		};
	}
	restoreData() {
		this.data = new Map(this.initialData);
	}
	addPoints(lineId, points) {
		const line = this.latestData.get(lineId);
		if (!line) return;
		line.addPoints(points);
	}
	addLineFromWS(data) {
		const line = new Line(data);
		this.latestData.set(data.id, line);
		this.addAction(new AddLineAction(this.history.length, data.id, line));
	}
	deleteLine(id) {
		const ret = this.latestData.delete(id);
		this.addAction(new RemoveLineAction(this.history.length, id));
		return ret;
	}
	deleteLinePredicted(id) {
		return this.latestData.delete(id);
	}
	drawBackgroundImage(ctx, redraw) {
		if (!this.backgroundImageSrc) return;
		if (!this.backgroundImage) {
			this.initImage(redraw);
			return;
		}
		ctx.drawImage(this.backgroundImage, 0, 0);
	}
}

export class BoardTxt extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
		this.data = data.data;
		this.latestData = data.data;
		this.initialData = data.data;
		this.lastBackupData = data.data;
		this.lastBackupTime = 0;
		this.editorId = data.editorId;
		this.displayMode = data.displayMode;
	}
	getPublicData() {
		return {
			...super.getPublicData(),
			data: this.data,
			editorId: this.editorId,
			displayMode: this.displayMode,
		};
	}
	getExportData() {
		return {
			...super.getExportData(),
			data: this.data,
			displayMode: this.displayMode,
		};
	}
	restoreData() {
		this.data = this.initialData;
	}
	transformText(transform) {
		this.latestData = apply(this.latestData, transform);
		if (this.upToDate) {
			this.data = this.latestData;
		}
		const now = Date.now();
		if (now - this.lastBackupTime > 1000) {
			const changes = diff(this.lastBackupData, this.latestData);
			this.lastBackupData = this.data;
			this.lastBackupTime = now;
			this.addAction(new TransformTextAction(this.history.length, changes));
		}
	}
}

export class BoardFolder extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
	}
	getPublicData() {
		return {
			...super.getPublicData(),
		};
	}
}

class Action {
	constructor(id) {
		this.id = id;
		this.time = Date.now();
	}
	apply(_board) {
		throw new Error("Action.apply() not implemented for base class");
	}
}

class AddLineAction extends Action {
	constructor(id, lineId, line) {
		super(id);
		this.lineId = lineId;
		this.line = line;
	}
	apply(board) {
		board.data.set(this.lineId, this.line);
	}
	getName() {
		return "Line added #"+this.id;
	}
	getIconClass() {
		return "imgLineAddHistoryIcon";
	}
}

class RemoveLineAction extends Action {
	constructor(id, lineId) {
		super(id);
		this.lineId = lineId;
	}
	apply(board) {
		board.data.delete(this.lineId);
	}
	getName() {
		return "Line removed #"+this.id;
	}
	getIconClass() {
		return "imgLineRemoveHistoryIcon";
	}
}

class TransformTextAction extends Action {
	constructor(id, transform) {
		super(id);
		this.transform = transform;
	}
	apply(board) {
		board.data = apply(board.data, this.transform);
	}
	getName() {
		return "Text changed #"+this.id;
	}
	getIconClass() {
		return "txtEditHistoryIcon";
	}
}