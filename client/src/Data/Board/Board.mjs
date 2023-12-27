class Board {
	constructor(id, userId, data) {
		this.id = id;
		this.userId = userId;
		this.name = data.name;
		this.type = data.type;
	}
	getPublicData() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			data: this.data,
		}
	}
}

export default Board;