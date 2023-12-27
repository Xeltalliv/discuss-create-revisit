class DisconnectUI {
	constructor(main) {
		const title = document.createElement("h1");
		title.textContent = "Disconnected";
		title.classList.add("mainTitle");

		const buttonBack = document.createElement("button");
		buttonBack.textContent = "Try reconnecting";
		buttonBack.addEventListener("click", function() {
			main.setUI(main.connectUI);
		});

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
		main.networkManager.addHandler("disconnect", (op, data) => {
			if (op == "disconnect") {
				reasonDiv.textContent = "Reason: "+data.reason;
			}
		});
	}
	resetReason() {
		this.reasonEl.textContent = "Unknown reason";
	}
}

export default DisconnectUI;