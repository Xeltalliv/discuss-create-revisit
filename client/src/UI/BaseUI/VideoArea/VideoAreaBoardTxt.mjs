import { VideoAreaBoardBase } from "./VideoAreaBoardBase.mjs";
import { getMainInstance } from "../../../main.mjs";
import { diff } from "../../../Utils/TextDiff.mjs";
import * as marked from "marked";
import DOMPurify from "dompurify";

export class VideoAreaBoardTxt extends VideoAreaBoardBase {
	constructor() {
		super();
		let changed = false;
		let interval = null;
		const markdownEl = document.createElement("div");
		markdownEl.classList.add("baseLeftBoardMarkdown", "hidden");
		const textarea = document.createElement("textarea");
		textarea.classList.add("baseLeftBoardTextarea");
		textarea.addEventListener("input", () => {
			changed = true;
		});
		textarea.addEventListener("focus", () => {
			if (this.mode !== "edit") {
				return;
			}
			if (!this.canEdit) {
				getMainInstance().networkManager.send("requestBoardEdit", {
					userId: this.user.id,
					boardId: this.board.id,
				});
			}
			interval = setInterval(() => {
				if (changed) {
					changed = false;
					this.sendChanges();
				}
			}, 1000);
		});
		textarea.addEventListener("blur", () => {
			this.sendChanges();
			clearInterval(interval);
			if (this.canEdit) {
				getMainInstance().networkManager.send("dropBoardEdit", {
					userId: this.user.id,
					boardId: this.board.id,
				});
			}
		});
		this.editModeButton = this.addButton("Edit mode", () => {
			const baseUI = getMainInstance().baseUI;
			if (baseUI.rightPanel.selectedUI == baseUI.rightPanel.writeUI) {
				this.setMode("view");
				baseUI.rightPanel.setUIByName("boards");
				baseUI.topMain.resetEditBoard();
			} else {
				this.setMode("edit");
				baseUI.rightPanel.setUIByName("write");
				baseUI.topMain.setEditBoard(this.user, this.board);
			}
		});
		this.historyModeButton = this.addButton("History mode", () => {
			const baseUI = getMainInstance().baseUI;
			if (baseUI.rightPanel.selectedUI == baseUI.rightPanel.historyUI) {
				this.setMode("view");
				baseUI.rightPanel.setUIByName("boards");
				baseUI.topMain.resetEditBoard();
			} else {
				this.setMode("history");
				baseUI.rightPanel.setUIByName("history");
				baseUI.topMain.resetEditBoard();
			}
		});
		this.textarea = textarea;
		this.markdownEl = markdownEl;
		this.el.insertBefore(textarea, this.el.firstChild);
		this.el.insertBefore(markdownEl, this.el.firstChild);
		this.previousText = [];
		this.canEdit = false;
		this.mode = "";
		this.setMode("view");
	}
	sendChanges() {
		const newText = this.textarea.value.split("\n");
		const changes = diff(this.board.data, newText);
		//if (this.board.data.length == newText.length && changes.length == 1 && Array.isArray(changes[0])) return;
		this.board.data = newText;
		this.board.transformText(changes);
		getMainInstance().networkManager.send("txtBoardApplyTransform", {
			userId: this.user.id,
			boardId: this.board.id,
			transform: changes
		});
	}
	setMode(mode) {
		this.mode = mode;
		this.textarea.readonly = mode != "edit";
		if (this.board) this.board.goToNow();
		this.updateDisplayMode();
		this.updateMarkdown();
		this.updateTextForced();
		this.editModeButton.classList.toggle("baseLeftFullButtonActive", this.mode == "edit");
		this.historyModeButton.classList.toggle("baseLeftFullButtonActive", this.mode == "history");
	}
	onExit() {
		const baseUI = getMainInstance().baseUI;
		if (baseUI.rightPanel.selectedUI == baseUI.rightPanel.writeUI ||
			baseUI.rightPanel.selectedUI == baseUI.rightPanel.historyUI) {
			baseUI.rightPanel.setUIByName("boards");
		}
		this.setMode("view");
	}
	selectBoard(user, board) {
		super.selectBoard(user, board);
		this.updateText();
		this.updateDisplayMode();
		getMainInstance().baseUI.rightPanel.writeUI.selectBoard(user, board);
		getMainInstance().baseUI.rightPanel.historyUI.selectBoard(this.user, this.board);
	}
	updateDisplayMode() {
		if (this.board == null) return;
		const showMarkdown = this.mode != "edit" && this.board.displayMode == "markdown";
		this.textarea.classList.toggle("hidden", showMarkdown);
		this.markdownEl.classList.toggle("hidden", !showMarkdown);
	}
	updateMarkdown() {
		if (this.board == null) return;
		this.markdownEl.innerHTML = DOMPurify.sanitize(marked.parse(this.board.data.join("\n")));
	}
	updateText() {
		if (this.mode == "edit") return;
		this.updateTextForced();
	}
	updateTextForced() {
		if (this.board == null) return;
		this.previousText = this.board.data;
		this.textarea.value = this.board.data.join("\n");
		this.updateMarkdown();
		this.updateEditor();
	}
	updateEditor() {
		const canEdit = this.board.editorId == getMainInstance().baseUI.userManager.me.id;
		this.canEdit = canEdit;
		if (canEdit) {
			getMainInstance().baseUI.topMain.setEditBoard(this.user, this.board);
			this.textarea.readOnly = false;
			this.textarea.style["background-color"] = "#ccffcc";
			this.hideStatusBar();
		} else {
			this.textarea.readOnly = true;
			this.textarea.style["background-color"] = "#cccccc";
			if (this.board.editorId !== null) {
				const editor = getMainInstance().baseUI.userManager.get(this.board.editorId);
				this.showStatusBar(`${editor.name} is editing this board`);
			} else {
				this.hideStatusBar();
			}
		}
	}
}
