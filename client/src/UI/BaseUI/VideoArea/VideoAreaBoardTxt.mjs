import VideoAreaBoardBase from "./VideoAreaBoardBase.mjs";
import { diff } from "../../../Utils/TextDiff.mjs"

class VideoAreaBoardTxt extends VideoAreaBoardBase {
	constructor(main, baseUI, videoArea) {
		super(main, baseUI, videoArea);
		let changed = false;
		let interval = null;
		const textarea = document.createElement("textarea");
		textarea.classList.add("baseLeftBoardTextarea");
		textarea.addEventListener("input", () => {
			changed = true;
		});
		textarea.addEventListener("focus", () => {
			if (!this.canEdit) {
				main.networkManager.send("requestBoardEdit", {
					userId: this.userId,
					boardId: this.boardId,
				});
			}
			interval = setInterval(() => {
				if (changed) {
					changed = false;
					const newText = textarea.value.split("\n");
					const changes = diff(this.board.data, newText);
					this.board.data = newText;
					main.networkManager.send("txtBoardApplyTransform", {
						userId: this.userId,
						boardId: this.boardId,
						transform: changes
					});
				}
			}, 1000);
		});
		textarea.addEventListener("blur", () => {
			clearInterval(interval);
			if (this.canEdit) {
				main.networkManager.send("dropBoardEdit", {
					userId: this.userId,
					boardId: this.boardId,
				});
			}
		});
		this.textarea = textarea;
		this.el.insertBefore(textarea, this.el.firstChild);
		this.previousText = [];
		this.canEdit = false;
	}
	selectBoard(userId, boardId) {
		super.selectBoard(userId, boardId);
		this.updateText();
	}
	updateText() {
		this.previousText = this.board.data;
		this.textarea.value = this.board.data.join("\n");
		this.updateEditor();
	}
	updateEditor() {
		const canEdit = this.board.editorId == this.baseUI.userManager.me.id;
		this.canEdit = canEdit;
		if (canEdit) {
			this.baseUI.topMain.setEditBoard(this.userId, this.boardId);
			this.textarea.readOnly = false;
			this.textarea.style["background-color"] = "#ccffcc";
			this.hideStatusBar();
		} else {
			this.textarea.readOnly = true;
			this.textarea.style["background-color"] = "#cccccc";
			if (this.board.editorId !== null) {
				this.showStatusBar(`${this.baseUI.userManager.get(this.board.editorId).name} is editing this board`);
			} else {
				this.hideStatusBar();
			}
		}
	}
}

export default VideoAreaBoardTxt;