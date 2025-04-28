import { RightUserlistPanel } from "./RightPanel/RightUserlistPanel.mjs";
import { RightChatPanel } from "./RightPanel/RightChatPanel.mjs";
import { RightBoardsPanel } from "./RightPanel/RightBoardsPanel.mjs";
import { RightDrawPanel } from "./RightPanel/RightDrawPanel.mjs";
import { RightWritePanel } from "./RightPanel/RightWritePanel.mjs";
import { RightSettingsPanel } from "./RightPanel/RightSettingsPanel.mjs";
import { RightHistoryPanel } from "./RightPanel/RightHistoryPanel.mjs";
import { getMainInstance } from "../../main.mjs";

export class RightPanel {
	constructor() {
		const el = document.createElement("div");
		el.classList.add("baseTopRight");
		this.el = el;

		this.selectedUI = null;
		this.userlistUI = new RightUserlistPanel();
		this.chatUI = new RightChatPanel();
		this.boardsUI = new RightBoardsPanel();
		this.drawUI = new RightDrawPanel();
		this.writeUI = new RightWritePanel();
		this.settingsUI = new RightSettingsPanel();
		this.historyUI = new RightHistoryPanel();
	}
	init() {
		this.chatUI.init();
		this.settingsUI.init();
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
	}
	setUIByName(name, force) {
		let lookup = {
			"chat": this.chatUI,
			"userlist": this.userlistUI,
			"boards": this.boardsUI,
			"draw": this.drawUI,
			"write": this.writeUI,
			"settings": this.settingsUI,
			"history": this.historyUI,
		};
		const ui = lookup[name];
		if (ui == this.selectedUI && !force) this.setUI(null);
		else this.setUI(ui);
		getMainInstance().baseUI.timer.reset();
	}
	resetChat() {
		this.chatUI.setContent([]);
	}
}
