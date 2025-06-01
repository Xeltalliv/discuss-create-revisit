export class Board {
	constructor(id, userId, data) {
		this.id = id;
		this.userId = userId;
		this.name = `Board ${id}`;
		this.type = data.type;
		this.folderId = data.folderId;
	}
	getPublicData() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			folderId: this.folderId,
		};
	}
	copyFrom(board) {
		this.name = board.name + " Copy";
		this.type = board.type;
		this.folderId = board.folderId;
	}
}
