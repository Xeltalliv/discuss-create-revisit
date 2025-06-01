import { Board } from "./Board.mjs";
import { Line } from "./Line.mjs";

export class BoardImg extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
		this.data = new Map();
		this.nextLineId = 0;
		this.backgroundImageSrc = data.backgroundImageSrc ?? null;
		this.width = data.width ?? 1600;
		this.height = data.height ?? 900;
		if (data.data) {
			for(const value of data.data) {
				const line = new Line(value.id, value);
				this.data.set(value.id, line);
				const nextLineId = value.id + 1;
				if (nextLineId > this.nextLineId) this.nextLineId = nextLineId;
			}
		}
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
	copyFrom(board) {
		super.copyFrom(board);
		this.data = new Map(board.data);
		this.nextLineId = board.nextLineId;
		this.backgroundImageSrc = board.backgroundImageSrc;
		this.width = board.width;
		this.height = board.height;
	}
	createLine(data) {
		const id = ++this.nextLineId;
		const line = new Line(id, data);
		this.data.set(id, line);
		return line;
	}
	deleteLine(id) {
		return this.data.delete(id);
	}
}
