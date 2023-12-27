import ConnectUI from "./UI/ConnectUI.mjs";
import DisconnectUI from "./UI/DisconnectUI.mjs";
import ConnectingUI from "./UI/ConnectingUI.mjs";
import BaseUI from "./UI/BaseUI.mjs";
import NetworkManager from "./Data/NetworkManager.mjs";

class Main {
	constructor() {
		this.networkManager = new NetworkManager(this);
		this.selectedUI = null;
		this.connectUI = new ConnectUI(this);
		this.disconnectUI = new DisconnectUI(this);
		this.connectingUI = new ConnectingUI(this);
		this.baseUI = new BaseUI(this);
		this.setUI(this.connectUI);
	}
	setUI(ui) {
		if (this.selectedUI == ui) return;
		if (this.selectedUI) this.selectedUI.el.remove();
		if (ui !== this.disconnectUI && this.networkManager.isBroken()) {
			this.networkManager.reconnectAndSetUI(ui);
			ui = this.connectingUI;
		}
		document.body.append(ui.el);
		this.selectedUI = ui;
	}
	resetBaseUI() {
		this.baseUI.setRightUI("userlist", true);
		this.baseUI.setVideoAreaUI("grid");
		this.baseUI.reset();
	}
}
const main = new Main();