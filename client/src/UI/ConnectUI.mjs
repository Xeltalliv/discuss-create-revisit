import { getMainInstance } from "../main.mjs";

export class ConnectUI {
	constructor() {
		const title = document.createElement("h1");
		title.textContent = "Discuss Create Revisit";
		title.classList.add("mainTitle");

		const tabsContainer = document.createElement("div");
		tabsContainer.classList.add("connectTabs");

		const tabJoin = new ConnectUIJoinTab();
		const tabCreate = new ConnectUICreateTab();
		const tabAccount = new ConnectUIAccountTab();
		this.addTab(tabsContainer, tabJoin);
		this.addTab(tabsContainer, tabCreate);
		this.addTab(tabsContainer, tabAccount);

		const list = document.createElement("div");
		list.classList.add("connectList");
		list.append(title, tabsContainer);

		const el = document.createElement("div");
		el.classList.add("fullscreen");
		el.append(list);

		this.el = el;
		this.listEl = list;
		this.selectedTab = null;
		this.tabJoin = tabJoin;
		this.tabCreate = tabCreate;
		this.tabAccount = tabAccount;
		this.selectTab(tabJoin);
	}
	init() {
		this.tabAccount.init();
		getMainInstance().networkManager.addHandler("connect", this.onMessage.bind(this));
	}
	onMessage(op, data) {
		if (op == "confWait") {
			const main = getMainInstance();
			location.hash = data.confToken;
			main.setUI(main.waitingUI);
		}
		if (op == "confJoin") {
			const main = getMainInstance();
			location.hash = data.confToken;
			main.baseUI.reset(data.confToken);
			main.setUI(main.baseUI);
		}
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
	addTab(tabsContainer, tab) {
		tabsContainer.append(tab.tabButton);
		tab.tabButton.addEventListener("click", () => {
			this.selectTab(tab);
		});
	}
}

class ConnectUITab {
	constructor(label) {
		const button = document.createElement("button");
		button.classList.add("connectTab");
		button.textContent = label;
		const el = document.createElement("div");
		el.classList.add("connectTabContent");

		this.tabButton = button;
		this.el = el;
	}
	selectTab() {
		this.tabButton.classList.add("connectTabSelected");
	}
	deselectTab() {
		this.tabButton.classList.remove("connectTabSelected");
	}
}

class ConnectUIJoinTab extends ConnectUITab {
	constructor() {
		super("Join");

		const lastName = localStorage.getItem("lastName") ?? "";
		const defaultConference = location.hash.length > 0 && location.hash.substring(0,3) == "#C." ? location.hash.substring(1) : null;
		const myConferences = JSON.parse(localStorage.getItem("myConferences") ?? "[]");

		this.nameInput = new ConnectUIInput("Name", lastName);
		this.confTokenInput = new ConnectUIInputSelect("Conference id", defaultConference, "myConferences", myConferences);
		this.filler = new ConnectUIFiller();
		this.joinButton = new ConnectUIButton("Join", this.onJoinPressed.bind(this));
		this.el.append(this.nameInput.el, this.confTokenInput.el, this.filler.el, this.joinButton.el);
	}
	async onJoinPressed() {
		const main = getMainInstance();
		const name = this.nameInput.getValue();
		const confToken = this.confTokenInput.getValue();
		if (name.length > 30) return alert("Name is too long. Maximum is 30 charaters");
		if (name.length < 3) return alert("Name is too short. Minimum is 3 charaters");
		localStorage.setItem("lastName", name);
		let reply = await main.networkManager.sendAndWaitForReply("confJoin", { name, confToken });
		if (reply.op == "error") return alert("Error: "+reply.data);
	}
}

class ConnectUICreateTab extends ConnectUITab {
	constructor() {
		super("Create");

		const lastName = localStorage.getItem("lastName") ?? "";

		this.nameInput = new ConnectUIInput("Name", lastName);
		this.createButton = new ConnectUIButton("Create", this.onCreatePressed.bind(this));
		this.filler = new ConnectUIFiller();
		this.el.append(this.nameInput.el, this.filler.el, this.createButton.el);
	}
	async onCreatePressed() {
		const main = getMainInstance();
		const name = this.nameInput.getValue();
		if (name.length > 30) return alert("Name is too long. Maximum is 30 charaters");
		if (name.length < 3) return alert("Name is too short. Minimum is 3 charaters");
		localStorage.setItem("lastName", name);
		const reply1 = await main.networkManager.sendAndWaitForReply("confCreate", { name });
		if (reply1.op == "error") return alert("Error: "+reply1.data);
		this.saveConference(reply1.data.confToken);

		const confToken = reply1.data.confToken;
		const reply2 = await main.networkManager.sendAndWaitForReply("confJoin", { name, confToken });
		if (reply2.op == "error") return alert("Error: "+reply2.data);
	}
	saveConference(conference) {
		const myConferences = JSON.parse(localStorage.getItem("myConferences") ?? "[]");
		myConferences.unshift(conference);
		if (myConferences.length > 10) myConferences.pop();
		localStorage.setItem("myConferences", JSON.stringify(myConferences));
	}
}

class ConnectUIAccountTab extends ConnectUITab {
	constructor() {
		super("Account");
		this.accountTypeInput = new ConnectUIReadonlyInput("Account type", "");
		this.userTokenInput = new ConnectUIReadonlyInput("User ID", "");
		this.filler = new ConnectUIFiller();
		this.signinButton = new ConnectUIButton("Sign in with Google", this.onSigninWithGoogleInPressed.bind(this));
		this.signoutButton = new ConnectUIButton("Sign out", this.onSignoutPressed.bind(this));
		this.el.append(this.accountTypeInput.el, this.userTokenInput.el, this.filler.el, this.signinButton.el, this.signoutButton.el);
		this.signinButton.el.classList.add("connectButtonGoogle");
	}
	init() {
		const auth = getMainInstance().auth;
		auth.onUserTokenChange(this.onUserTokenChange.bind(this));
		this.onUserTokenChange(auth.userToken);
	}
	onSigninWithGoogleInPressed() {
		getMainInstance().auth.signinWithGoogleStart();
	}
	onSignoutPressed() {
		getMainInstance().auth.signout();
	}
	onUserTokenChange(value) {
		const parts = value.split(".");
		this.accountTypeInput.setValue(parts[1]);
		this.userTokenInput.setValue(parts[2]);
		this.signoutButton.setDisabled(parts[1] == "guest");
	}
}

class ConnectUIInput {
	constructor(label, defaultValue) {
		const span = document.createElement("span");
		span.textContent = label;
		span.classList.add("connectOptionLeft");
		const input = document.createElement("input");
		input.classList.add("connectOptionRight");
		input.placeholder = label;
		if (defaultValue) input.value = defaultValue;
		const div = document.createElement("div");
		div.classList.add("connectOptionLeftRight");
		div.append(span, input);
		this.el = div;
		this.input = input;
	}
	setValue(value) {
		this.input.value = value;
	}
	getValue() {
		return this.input.value;
	}
}

class ConnectUIReadonlyInput extends ConnectUIInput {
	constructor(label, defaultValue) {
		super(label, defaultValue);
		this.input.readOnly = true;
	}
}

class ConnectUIInputSelect {
	constructor(label, defaultValue, datalistId, options) {
		const span = document.createElement("span");
		span.textContent = label;
		span.classList.add("connectOptionLeft");
		const input = document.createElement("input");
		input.classList.add("connectOptionRight");
		input.placeholder = label;
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
		button.classList.add("connectButton");
		this.el = button;
	}
	setDisabled(state) {
		this.el.disabled = state;
	}
}

class ConnectUIFiller {
	constructor() {
		const el = document.createElement("div");
		el.classList.add("connectFiller");
		this.el = el;
	}
}