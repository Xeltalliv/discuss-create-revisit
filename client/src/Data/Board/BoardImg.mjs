import Board from "./Board.mjs";
import Line from "./Line.mjs"

class BoardImg extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
		this.data = new Map(data.data.map(ent => [ent[0], new Line(ent[1])]));
		this.unconfirmedData = new Set();
	}
	getPublicData() {
		return {
			...super.getPublicData(),
			data: Array.from(this.data.entries),
		}
	}
	addPoints(lineId, points) {
		const line = this.data.get(lineId);
		if (!line) return;
		line.addPoints(points);
	}
	addLineFromWS(data) {
		const line = new Line(data);
		this.data.set(data.id, line);
	}
	deleteLine(id) {
		return this.data.delete(id);
	}
}

export default BoardImg;