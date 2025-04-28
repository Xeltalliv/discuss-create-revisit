import { VideoAreaGrid } from "./VideoArea/VideoAreaGrid.mjs";
import { VideoAreaFull } from "./VideoArea/VideoAreaFull.mjs";
import { VideoAreaBoardTxt } from "./VideoArea/VideoAreaBoardTxt.mjs";
import { VideoAreaBoardImg } from "./VideoArea/VideoAreaBoardImg.mjs";
import { getMainInstance } from "../../main.mjs";

export class VideoArea {
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
	init() {
		//this.gridUI.init();
		//this.fullUI.init();
		//this.btxtUI.init();
		//this.bimgUI.init();
	}
	setButtonsVisible(visible) {
		this.gridUI.setButtonsVisible(visible);
		this.fullUI.setButtonsVisible(visible);
		this.btxtUI.setButtonsVisible(visible);
		this.bimgUI.setButtonsVisible(visible);
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
		getMainInstance().baseUI.rightPanel.boardsUI.setIsFullUI(this.selectedUI == this.fullUI);
	}
	setUIByName(name) {
		let lookup = {
			"grid": this.gridUI,
			"full": this.fullUI,
			"btxt": this.btxtUI,
			"bimg": this.bimgUI,
		};
		const ui = lookup[name];
		this.setUI(ui);
	}
	setEditBoard(user, board) {
		if (!this.editingBoard) {
			this.editingBoard = true;
			this.main.networkManager.send("editsBoard", {
				"userId": user.id,
				"boardId": board.id
			});
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
	selectBoard(user, board) {
		if ((this.selectedUI == this.btxtUI || this.selectedUI == this.bimgUI) &&
			this.selectedUI.user == user &&
			this.selectedUI.board == board) {
			this.setUI(this.baseUI.topMain.gridUI);
			this.baseUI.userManager.updateUserList();
		} else {
			let boardUI = null;
			if (board.type == "txt") boardUI = this.btxtUI;
			if (board.type == "img") boardUI = this.bimgUI;
			if (boardUI == null) return;
			boardUI.selectBoard(user, board);
			this.setUI(boardUI);
			this.baseUI.userManager.updateUserList();
		}
	}
}
