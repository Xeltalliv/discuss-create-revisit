import Board from "./Board.mjs";

class BoardTxt extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
		this.data = data.data;
		this.editorId = data.editorId;
	}
	getPublicData() {
		return {
			...super.getPublicData(),
			data: this.data,
			editorId: this.editorId
		}
	}
}

export default BoardTxt;