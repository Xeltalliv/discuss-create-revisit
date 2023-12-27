class Board {
	constructor(id, userId, data) {
		this.id = id;
		this.userId = userId;
		this.name = `Board ${id}`;
		this.type = data.type;
	}
	getPublicData() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
		};
	}
	copyFrom(board) {
		this.name = board.name + " Copy";
		this.type = board.type;
	}
}

export default Board;