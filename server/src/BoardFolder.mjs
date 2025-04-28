import Board from "./Board.mjs";

class BoardFolder extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
	}
	getPublicData() {
		return {
			...super.getPublicData(),
		};
	}
	copyFrom(board) {
		super.copyFrom(board);
	}
}

export default BoardFolder;