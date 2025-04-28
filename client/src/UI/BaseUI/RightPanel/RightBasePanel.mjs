export class RightBasePanel {
	constructor() {
		const title = document.createElement("h2");
		title.classList.add("baseRightTitle");
		const listEl = document.createElement("div");
		listEl.classList.add("baseRightList");

		const el = document.createElement("div");
		el.classList.add("baseRightMain");
		el.append(title, listEl);
		this.el = el;
		this.listEl = listEl;
		this.title = title;
		this.items = [];
	}
	setContent(data) {
		for(let item of this.items) {
			item.el.remove();
		}
		const type = this.getItemType();
		for(let dataItem of data) {
			const item = new type(dataItem);
			this.listEl.append(item.el);
			this.items.push(item);
		}
	}
	addContent(data) {
		const type = this.getItemType();
		for(let dataItem of data) {
			const item = new type(dataItem);
			this.listEl.append(item.el);
			this.items.push(item);
		}
	}
	setTitle(text) {
		this.title.textContent = text;
	}
	getItemType() {
		throw new Error("RightBasePanel is a base class and doesn't have an item type");
	}
}
