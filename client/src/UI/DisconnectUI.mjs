import { getMainInstance } from "../main.mjs";

export class DisconnectUI {
	constructor() {
		const title = document.createElement("h1");
		title.textContent = "Disconnected";
		title.classList.add("mainTitle");

		const buttonBack = document.createElement("button");
		buttonBack.classList.add("disconnectButton");
		buttonBack.textContent = "Try reconnecting";
		buttonBack.addEventListener("click", this.tryReconnecting.bind(this));

		const reasonDiv = document.createElement("div");
		reasonDiv.classList.add("disconnectReason");
		reasonDiv.textContent = "Unknown reason";
		const buttonsDiv = document.createElement("div");
		buttonsDiv.classList.add("disconnectButtons");
		buttonsDiv.append(buttonBack);

		const list = document.createElement("div");
		list.classList.add("connectList");
		list.append(title, reasonDiv, buttonsDiv);

		const el = document.createElement("div");
		el.classList.add("fullscreen");
		el.append(list);

		this.el = el;
		this.reasonEl = reasonDiv;
	}
	init() {
		getMainInstance().networkManager.addHandler("disconnect", this.onMessage.bind(this));
	}
	onMessage(op, data) {
		if (op == "disconnect") {
			this.reasonEl.textContent = "Reason: "+data.reason;
		}
	}
	tryReconnecting() {
		const main = getMainInstance();
		main.setUI(main.connectUI);
	}
	resetReason() {
		this.reasonEl.textContent = "Unknown reason";
	}
}
