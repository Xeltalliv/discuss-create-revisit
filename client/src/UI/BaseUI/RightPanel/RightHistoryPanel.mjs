import { RightBasePanel } from "./RightBasePanel.mjs";
import { getMainInstance } from "../../../main.mjs";

export class RightHistoryPanel extends RightBasePanel {
	constructor() {
		super();
		this.setTitle("Change history");
		
		this.user = null;
		this.board = null;
	}
	selectBoard(user, board) {
		this.user = user;
		this.board = board;
		this.updateHistory();
	}
	updateHistory() {
		this.setContent(this.board.history);
	}
	getItemType() {
		return BoardHistoryElement;
	}
}

class BoardHistoryElement {
	constructor(data) {
		const typeImg = document.createElement("div");
		typeImg.classList.add("boardIconRight", data.getIconClass());
		
		const actionName = document.createElement("div");
		actionName.classList.add("actionTime");
		actionName.textContent = data.getName();
		const actionTime = document.createElement("div");
		actionTime.classList.add("actionName");
		actionTime.textContent = new Date(data.time).toLocaleTimeString();
		const nameContent = document.createElement("div");
		nameContent.classList.add("actionDesc");
		nameContent.append(actionName, actionTime);

		const nameRow = document.createElement("div");
		const buttonsRow = document.createElement("div");
		nameRow.append(typeImg, nameContent);
		nameRow.classList.add("usernameNameRow");
		buttonsRow.classList.add("usernameButtonsRow");

		const el = document.createElement("div");
		el.append(nameRow);
		el.classList.add("usernameOuter");
		el.addEventListener("mouseenter", () => {
			this.toggleMenu(true);
		});
		el.addEventListener("mouseleave", () => {
			this.toggleMenu(false);
		});
		
		this.el = el;
		this.buttonsShown = false;
		this.buttonsRow = buttonsRow;
		this.nameContent = nameContent;
		this.data = data;

		this.addButton("View", this.onViewPressed.bind(this));
	}
	onViewPressed() {
		const board = getMainInstance().baseUI.rightPanel.historyUI.board;
		board.goToAction(this.data.id);
		const topMain = getMainInstance().baseUI.topMain;
		if (topMain.selectedUI == topMain.btxtUI) {
			getMainInstance().baseUI.topMain.btxtUI.updateText();
		}
		if (topMain.selectedUI == topMain.bimgUI) {
			getMainInstance().baseUI.topMain.bimgUI.updateImage();
		}
	}
	addButton(label, fn) {
		const button = document.createElement("button");
		button.classList.add("usernameNameButton");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.buttonsRow.append(button);
	}
	toggleMenu(state) {
		if (state ?? !this.buttonsShown) {
			this.buttonsShown = true;
			this.el.append(this.buttonsRow);
		} else {
			this.buttonsShown = false;
			this.buttonsRow.remove();
		}
	}
}
