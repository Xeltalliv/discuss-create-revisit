import RightUserlistPanel from "./RightPanel/RightUserlistPanel.mjs";
import RightChatPanel from "./RightPanel/RightChatPanel.mjs";
import RightBoardsPanel from "./RightPanel/RightBoardsPanel.mjs";
import RightDrawPanel from "./RightPanel/RightDrawPanel.mjs";

class RightPanel {
	constructor(main, baseUI) {
		const el = document.createElement("div");
		el.classList.add("baseTopRight");
		this.el = el;

		this.selectedUI = null;
		this.userlistUI = new RightUserlistPanel(main, baseUI);
		this.chatUI = new RightChatPanel(main, baseUI);
		this.boardsUI = new RightBoardsPanel(main, baseUI);
		this.drawUI = new RightDrawPanel(main, baseUI);
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
		}
		const ui = lookup[name];
		if (ui == this.selectedUI && !force) this.setUI(null);
		else this.setUI(ui);
	}
	getDrawOptions() {
		return this.drawUI.getDrawOptions();
	}
	resetChat() {
		this.chatUI.setContent([]);
	}
}

export default RightPanel;
