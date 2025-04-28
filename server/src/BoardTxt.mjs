import Board from "./Board.mjs";

class BoardTxt extends Board {
	constructor(id, userId, data) {
		super(id, userId, data);
		this.data = data.data ?? [];
		this.editorId = null;
		this.editorTimeout = null;
		this.displayMode = data.displayMode ?? "text";
	}
	getPublicData() {
		return {
			...super.getPublicData(),
			data: this.data,
			editorId: this.editorId,
			displayMode: this.displayMode,
		};
	}
	copyFrom(board) {
		super.copyFrom(board);
		this.data = board.data.slice(0);
	}
	timeout(conference) {
		clearTimeout(this.editorTimeout);
		this.editorTimeout = setTimeout(() => {
			this.setEditorId(conference, null);
		}, 10000);
	}
	setEditorId(conference, editorId) {
		this.editorId = editorId;
		if (editorId == null) {
			clearTimeout(this.editorTimeout);
		} else {
			this.timeout(conference);
		}
		conference.sendToEveryone("setBoardEditorId", {"userId":this.userId, "boardId":this.id, "editorId": editorId});
	}
}

export default BoardTxt;