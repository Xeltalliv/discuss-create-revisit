import { RightBasePanel } from "./RightBasePanel.mjs";
import { getMainInstance } from "../../../main.mjs";

export class RightWritePanel extends RightBasePanel {
	constructor() {
		super();
		this.setTitle("Write options");

		const inputDisplayMode = document.createElement("select");
		const optionText = document.createElement("option");
		const optionMarkdown = document.createElement("option");
		optionText.value = "text";
		optionMarkdown.value = "markdown";
		optionText.textContent = "Text";
		optionMarkdown.textContent = "Markdown";
		inputDisplayMode.append(optionText, optionMarkdown);
		inputDisplayMode.addEventListener("change", () => {
			this.board.displayMode = inputDisplayMode.value;
			getMainInstance().baseUI.topMain.btxtUI.updateDisplayMode();
			getMainInstance().baseUI.topMain.btxtUI.updateMarkdown();
			getMainInstance().networkManager.send("txtBoardSetDisplayMode", {
				"displayMode": inputDisplayMode.value,
				"userId": this.user.id,
				"boardId": this.board.id,
			});
		});

		this.setContent([
			{
				label: "Display as",
				input: inputDisplayMode
			}
		]);
		this.inputDisplayMode = inputDisplayMode;
		this.user = null;
		this.board = null;
	}
	getItemType() {
		return WriteOption;
	}
	selectBoard(user, board) {
		this.user = user;
		this.board = board;
		this.updateDisplayMode();
	}
	updateDisplayMode() {
		this.inputDisplayMode.value = this.board.displayMode;
	}
}

class WriteOption {
	constructor(data) {
		const label = document.createElement("div");
		label.textContent = data.label;
		const el = document.createElement("div");
		el.append(label, data.input);
		el.classList.add("drawOption");
		this.el = el;
	}
}
