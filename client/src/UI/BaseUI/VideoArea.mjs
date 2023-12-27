import VideoAreaGrid from "./VideoArea/VideoAreaGrid.mjs"
import VideoAreaFull from "./VideoArea/VideoAreaFull.mjs"
import VideoAreaBoardTxt from "./VideoArea/VideoAreaBoardTxt.mjs"
import VideoAreaBoardImg from "./VideoArea/VideoAreaBoardImg.mjs"

class VideoArea {
	constructor(main, baseUI) {
		const el = document.createElement("div");
		el.classList.add("baseTopLeft");
		this.el = el;

		this.main = main;
		this.baseUI = baseUI;
		this.selectedUI = null;
		this.gridUI = new VideoAreaGrid(main, baseUI, this);
		this.fullUI = new VideoAreaFull(main, baseUI, this);
		this.btxtUI = new VideoAreaBoardTxt(main, baseUI, this);
		this.bimgUI = new VideoAreaBoardImg(main, baseUI, this);
		this.editingBoard = false;
	}
	setUI(ui) {
		if (this.selectedUI) this.selectedUI.el.remove();
		if (ui) {
			this.el.append(ui.el);
			this.el.style.width = "";
		} else {
			this.el.style.width = 0;
		}
		this.selectedUI = ui;
		this.resetEditBoard();
	}
	setUIByName(name) {
		let lookup = {
			"grid": this.gridUI,
			"full": this.fullUI,
			"btxt": this.btxtUI,
			"bimg": this.bimgUI,
		}
		const ui = lookup[name];
		this.setUI(ui);
	}
	setEditBoard(userId, boardId) {
		if (!this.editingBoard) {
			this.editingBoard = true;
			this.main.networkManager.send("editsBoard", {userId, boardId});
		}
	}
	resetEditBoard() {
		if (this.editingBoard) {
			this.editingBoard = false;
			this.main.networkManager.send("editsBoard", null);
		}
	}
	setUsers(users) {
		this.gridUI.setUsers(users, this.selectedUI == this.gridUI);
		this.fullUI.update(this.selectedUI == this.fullUI);
		this.btxtUI.update(this.selectedUI == this.btxtUI);
		this.bimgUI.update(this.selectedUI == this.bimgUI);
	}
	selectBoard(userId, boardId) {
		if ((this.selectedUI == this.btxtUI || this.selectedUI == this.bimgUI) &&
			this.selectedUI.userId == userId &&
			this.selectedUI.boardId == boardId) {
			this.setUI(this.baseUI.topMain.gridUI);
			this.baseUI.userManager.updateUserList();
		} else {
			const user = this.baseUI.userManager.get(userId);
			const board = user.boards.get(boardId);
			let boardUI = board.type == "txt" ? this.btxtUI : this.bimgUI;
			boardUI.selectBoard(userId, boardId);
			this.setUI(boardUI);
			this.baseUI.userManager.updateUserList();
		}
	}
}

export default VideoArea;