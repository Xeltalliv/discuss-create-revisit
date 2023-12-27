import Board from "./Board.mjs";
import Line from "./Line.mjs";

class BoardImg extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
		this.data = new Map();
		this.nextLineId = 0;
	}
	getPublicData() {
		return {
			...super.getPublicData(),
			data: Array.from(this.data.entries()),
		};
	}
	copyFrom(board) {
		super.copyFrom(board);
		this.data = new Map(board.data);
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

export default BoardImg;