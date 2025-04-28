export class ConnectingUI {
	constructor() {
		const title = document.createElement("h1");
		title.textContent = "Connecting";
		title.classList.add("mainTitle");

		const list = document.createElement("div");
		list.classList.add("connectList");
		list.append(title);

		const el = document.createElement("div");
		el.classList.add("fullscreen");
		el.append(list);

		this.el = el;
	}
}
