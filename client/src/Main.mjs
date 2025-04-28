import { ConnectUI } from "./UI/ConnectUI.mjs";
import { DisconnectUI } from "./UI/DisconnectUI.mjs";
import { ConnectingUI } from "./UI/ConnectingUI.mjs";
import { WaitingUI } from "./UI/WaitingUI.mjs";
import { BaseUI } from "./UI/BaseUI.mjs";
import { NetworkManager } from "./Data/NetworkManager.mjs";
import { AuthManager } from "./Data/AuthManager.mjs";
import { setMainInstance } from "./main.mjs";

class Main {
	constructor() {
		this.host = `${location.hostname}:${location.protocol == "https:" ? "8443" : "8080"}`;
		this.httpProtocol = location.protocol;
		this.wsProtocol = location.protocol == "https:" ? "wss:" : "ws:";
		this.networkManager = new NetworkManager();
		this.auth = new AuthManager(this.networkManager);
		this.selectedUI = null;
		this.connectUI = new ConnectUI();
		this.disconnectUI = new DisconnectUI();
		this.connectingUI = new ConnectingUI();
		this.waitingUI = new WaitingUI();
		this.baseUI = new BaseUI(this, this.networkManager);
	}
	init() {
		this.auth.init();
		this.connectUI.init();
		this.disconnectUI.init();
		this.baseUI.init();
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
}

setMainInstance(new Main());
