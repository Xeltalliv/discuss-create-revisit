class ConnectUI {
	constructor(main) {
		const lastName = localStorage.getItem("lastName") ?? "";
		const defaultConference = location.hash.length > 0 ? location.hash.substring(1) : null;
		const myConferences = JSON.parse(localStorage.getItem("myConferences") ?? "[]");

		const title = document.createElement("h1");
		title.textContent = "Discuss Create Revisit";
		title.classList.add("mainTitle");

		const tabsContainer = document.createElement("div");
		tabsContainer.classList.add("connectTabs");
		const tabJoin = new ConnectUITab(this, "Join");
		const tabCreate = new ConnectUITab(this, "Create");
		tabJoin.addInput("Name", "name", lastName);
		tabJoin.addInputSelect("Conference id", "confToken", defaultConference, "myConferences", myConferences);
		tabJoin.addButton("Join", async () => {
			const inputs = tabJoin.getInputs();
			if (inputs.name.length > 30) return alert("Name is too long. Maximum is 30 charaters");
			if (inputs.name.length < 3) return alert("Name is too short. Minimum is 3 charaters");
			const reply = await main.networkManager.sendAndWaitForReply("confJoin", inputs);
			if (reply.op == "error") return alert("Error: "+reply.data);

			this.saveName(inputs.name);

			location.hash = reply.data.confToken;
			main.resetBaseUI();
			main.setUI(main.baseUI);
		});
		tabCreate.addInput("Name", "name", lastName);
		tabCreate.addButton("Create", async () => {
			const inputs = tabCreate.getInputs();
			if (inputs.name.length > 30) return alert("Name is too long. Maximum is 30 charaters");
			if (inputs.name.length < 3) return alert("Name is too short. Minimum is 3 charaters");
			const reply1 = await main.networkManager.sendAndWaitForReply("confCreate", inputs);
			if (reply1.op == "error") return alert("Error: "+reply1.data);
			this.saveConference(reply1.data.confToken);

			inputs.confToken = reply1.data.confToken;
			const reply2 = await main.networkManager.sendAndWaitForReply("confJoin", inputs);
			if (reply2.op == "error") return alert("Error: "+reply2.data);

			this.saveName(inputs.name);

			location.hash = reply2.data.confToken;
			main.resetBaseUI();
			main.setUI(main.baseUI);
		});
		tabsContainer.append(tabJoin.tabButton, tabCreate.tabButton);

		const list = document.createElement("div");
		list.classList.add("connectList");
		list.append(title, tabsContainer);

		const el = document.createElement("div");
		el.classList.add("fullscreen");
		el.append(list);

		this.el = el;
		this.listEl = list;
		this.selectedTab = null;
		this.selectTab(tabJoin);
	}
	selectTab(tab) {
		if (this.selectedTab) {
			this.selectedTab.deselectTab();
			this.selectedTab.el.remove();
		}
		this.listEl.append(tab.el);
		this.selectedTab = tab;
		tab.selectTab();
	}
	saveName(name) {
		localStorage.setItem("lastName", name);
	}
	saveConference(conference) {
		const myConferences = JSON.parse(localStorage.getItem("myConferences") ?? "[]");
		myConferences.unshift(conference);
		if (myConferences.length > 10) myConferences.pop();
		localStorage.setItem("myConferences", JSON.stringify(myConferences));
	}
}

class ConnectUITab {
	constructor(connectUI, label) {
		const button = document.createElement("button");
		button.classList.add("connectTab");
		button.textContent = label;
		button.addEventListener("click", () => {
			connectUI.selectTab(this);
		});
		const el = document.createElement("div");
		el.classList.add("connectTabContent");

		this.inputs = [];
		this.tabButton = button;
		this.el = el;
	}
	addInput(label, id, defaultValue) {
		const input = new ConnectUIInput(label, id, defaultValue);
		this.el.append(input.el);
		this.inputs.push(input);
	}
	addInputSelect(label, id, defaultValue, datalistId, options) {
		const input = new ConnectUIInputSelect(label, id, defaultValue, datalistId, options);
		this.el.append(input.el);
		this.inputs.push(input);
	}
	addButton(label, fn) {
		const button = new ConnectUIButton(label, fn);
		this.el.append(button.el);
	}
	getInputs() {
		let data = {};
		for(const input of this.inputs) {
			data[input.id] = input.getValue();
		}
		return data;
	}
	selectTab() {
		this.tabButton.classList.add("connectTabSelected");
	}
	deselectTab() {
		this.tabButton.classList.remove("connectTabSelected");
	}
}

class ConnectUIInput {
	constructor(label, id, defaultValue) {
		const span = document.createElement("span");
		span.textContent = label;
		span.classList.add("connectOptionLeft");
		const input = document.createElement("input");
		input.classList.add("connectOptionRight");
		if (defaultValue) input.value = defaultValue;
		const div = document.createElement("div");
		div.classList.add("connectOptionLeftRight");
		div.append(span, input);
		this.el = div;
		this.input = input;
		this.id = id;
	}
	getValue() {
		return this.input.value;
	}
}

class ConnectUIInputSelect {
	constructor(label, id, defaultValue, datalistId, options) {
		const span = document.createElement("span");
		span.textContent = label;
		span.classList.add("connectOptionLeft");
		const input = document.createElement("input");
		input.classList.add("connectOptionRight");
		if (defaultValue) input.value = defaultValue;

		const datalist = document.createElement("datalist");
		datalist.setAttribute("id", datalistId);
		input.setAttribute("list", datalistId);
		for(let value of options) {
			const option = document.createElement("option");
			option.value = value;
			datalist.append(option);
		}
		const div = document.createElement("div");
		div.classList.add("connectOptionLeftRight");
		div.append(span, input, datalist);
		this.el = div;
		this.input = input;
		this.id = id;
	}
	getValue() {
		return this.input.value;
	}
}

class ConnectUIButton {
	constructor(label, fn) {
		const button = document.createElement("button");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.el = button;
	}
}

export default ConnectUI;