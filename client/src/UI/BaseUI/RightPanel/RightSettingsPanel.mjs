import { RightBasePanel } from "./RightBasePanel.mjs";
import { getMainInstance } from "../../../main.mjs";

export class RightSettingsPanel extends RightBasePanel {
	constructor() {
		super();
		this.setTitle("Settings");

		const inputJoinMode = document.createElement("select");
		const optionOpen = document.createElement("option");
		const optionInvite = document.createElement("option");
		const optionClosed = document.createElement("option");
		optionOpen.textContent = "Anyone with a link";
		optionInvite.textContent = "Waiting room";
		optionClosed.textContent = "Joining disabled";
		optionOpen.value = "open";
		optionInvite.value = "invite";
		optionClosed.value = "closed";
		inputJoinMode.append(optionOpen, optionInvite, optionClosed);
		inputJoinMode.addEventListener("change", this.sendSettingsUpdate.bind(this));

		const inputRequireSignin = document.createElement("input");
		inputRequireSignin.type = "checkbox";
		inputRequireSignin.addEventListener("change", this.sendSettingsUpdate.bind(this));

		this.inputJoinMode = inputJoinMode;
		this.inputRequireSignin = inputRequireSignin;
		this.setContent([
			{
				label: "Joining mode",
				input: inputJoinMode
			}, {
				label: "Require signin",
				input: inputRequireSignin
			}
		]);
	}
	init() {
		getMainInstance().networkManager.addHandler("settings", (op, data) => {
			if (op == "conferenceSettings") {
				this.inputJoinMode.value = data.joinMode;
				this.inputRequireSignin.checked = data.requireSignin;
			}
		});
	}
	getItemType() {
		return SettingsOption;
	}
	setMe(me) {
		const disabled = !me.isHost;
		this.inputJoinMode.disabled = disabled;
		this.inputRequireSignin.disabled = disabled;
	}
	sendSettingsUpdate() {
		getMainInstance().networkManager.send("conferenceSettings", {
			joinMode: this.inputJoinMode.value,
			requireSignin: this.inputRequireSignin.checked,
		});
	}
}

class SettingsOption {
	constructor(data) {
		const label = document.createElement("div");
		label.textContent = data.label;
		const el = document.createElement("div");
		el.append(label, data.input);
		el.classList.add("drawOption");
		this.el = el;
	}
}
