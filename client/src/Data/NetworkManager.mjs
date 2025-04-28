import { getMainInstance } from "../main.mjs";

export class NetworkManager {
	constructor() {
		this.ws = null;
		this.wsid = 0;
		this.replyHandlers = new Map();
		this.extraHandlers = new Map();
	}
	isBroken() {
		return this.ws == null || this.ws.readyState == WebSocket.CLOSED;
	}
	reconnectAndSetUI(ui) {
		this.setupWebsocket(ui);
	}
	setupWebsocket(ui) {
		const main = getMainInstance();
		this.uiAfterConnect = ui;
		main.disconnectUI.resetReason();
		this.ws = new WebSocket(`${main.wsProtocol}//${main.host}`);
		this.ws.addEventListener("open", this.onOpen.bind(this));
		this.ws.addEventListener("error", this.onClose.bind(this));
		this.ws.addEventListener("close", this.onClose.bind(this));
		this.ws.addEventListener("message", this.onMessage.bind(this));
	}
	onOpen() {
		const main = getMainInstance();
		main.auth.onConnect();
		if (this.uiAfterConnect) main.setUI(this.uiAfterConnect);
	}
	onClose() {
		const main = getMainInstance();
		main.setUI(main.disconnectUI);
		main.baseUI.mediasoup.clear();
	}
	onMessage(message) {
		let raw = JSON.parse(message.data);
		if (raw.reply) {
			let rh = this.replyHandlers.get(raw.reply);
			if (rh) rh(raw);
		}
		for(let [_name, fn] of this.extraHandlers) {
			fn(raw.op, raw.data, raw.id);
		}
	}
	send(op, json={}, reply) {
		const all = {
			"op": op,
			"id": this.wsid++,
			"data": json
		};
		if (reply) all.reply = reply;
		this.ws.send(JSON.stringify(all));
	}
	sendAndWaitForReply(op, json) {
		const replyId = this.wsid;
		this.send(op, json);
		return new Promise((res, rej) => {
			const timeout = setTimeout(() => {
				this.replyHandlers.delete(replyId);
				rej("WS reply timeout");
			}, 10000);
			this.replyHandlers.set(replyId, (raw) => {
				this.replyHandlers.delete(replyId);
				clearTimeout(timeout);
				res(raw);
			});
		});
	}
	addHandler(name, fn) {
		this.extraHandlers.set(name, fn);
	}
	removeHandler(name) {
		this.extraHandlers.delete(name);
	}
	leave() {
		const main = getMainInstance();
		this.ws.close();
		setTimeout(() => main.setUI(main.connectUI), 100);
	}
}
