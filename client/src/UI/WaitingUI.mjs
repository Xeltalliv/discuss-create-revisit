export class WaitingUI {
	constructor() {
		const title = document.createElement("h1");
		title.textContent = "Waiting for host to accept";
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
