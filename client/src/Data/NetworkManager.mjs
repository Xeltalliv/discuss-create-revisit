class NetworkManager {
	constructor(main) {
		this.main = main;
		this.userToken = null;
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
		this.main.disconnectUI.resetReason();
		this.userToken = localStorage.getItem("userToken");
		this.ws = new WebSocket(`ws://${location.hostname}:8080`);
		this.ws.addEventListener("open", () => {
			this.send("userToken", this.userToken ?? null);
			if (ui) this.main.setUI(ui);
		});
		this.ws.addEventListener("error", () => {
			this.main.setUI(this.main.disconnectUI);
			this.main.baseUI.mediasoup.clear();
		});
		this.ws.addEventListener("close", () => {
			this.main.setUI(this.main.disconnectUI);
			this.main.baseUI.mediasoup.clear();
		});
		this.ws.addEventListener("message", this.handle.bind(this));
		this.addHandler("userTokens", (op, data) => {
			if (op == "setUserToken") {
				localStorage.setItem("userToken", data);
			}
		});
	}
	handle(message) {
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
		this.ws.close();
		setTimeout(() => this.main.setUI(this.main.connectUI), 100);
	}
}

export default NetworkManager;