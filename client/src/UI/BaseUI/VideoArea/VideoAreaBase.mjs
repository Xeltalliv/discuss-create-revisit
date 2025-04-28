export class VideoAreaBase {
	constructor() {
		const buttonsRow = document.createElement("div");
		buttonsRow.classList.add("baseLeftFullButtonsRow");

		const statusBar = document.createElement("div");
		statusBar.classList.add("baseLeftBoardStatusbar", "hidden");

		const el = document.createElement("div");
		el.append(buttonsRow, statusBar);

		this.el = el;
		this.statusBar = statusBar;
		this.buttonsRow = buttonsRow;
	}
	addButton(label, fn) {
		const button = document.createElement("button");
		button.classList.add("baseLeftFullButton");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.buttonsRow.append(button);
		return button;
	}
	showStatusBar(text) {
		this.statusBar.classList.remove("hidden");
		this.statusBar.textContent = text;
	}
	hideStatusBar() {
		this.statusBar.classList.add("hidden");
	}
	setButtonsVisible(visible) {
		this.buttonsRow.classList.toggle("hidden", !visible);
	}
}
