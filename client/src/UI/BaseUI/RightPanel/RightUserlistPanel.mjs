import { RightBasePanel } from "./RightBasePanel.mjs";
import { getMainInstance } from "../../../main.mjs";

export class RightUserlistPanel extends RightBasePanel {
	constructor() {
		super();
		this.setTitle("User list");
	}
	getItemType() {
		return UserElement;
	}
	setUsers(users, waitingUsers) {
		const handRisen = [];
		const normal = [];
		for(const user of users) {
			let bucket = normal;
			if (user.handRaiseTime > 0) bucket = handRisen;
			bucket.push(user);
		}
		handRisen.sort((a,b) => a.handRaiseTime-b.handRaiseTime);
		normal.sort((a,b) => a.joinTime-b.joinTime);
		waitingUsers.sort((a,b) => a.joinTime-b.joinTime);
		this.setContent([...waitingUsers, ...handRisen, ...normal]);
	}
}

class UserElement {
	constructor(data) {
		const nameSpan = document.createElement("span");
		nameSpan.textContent = data.name;
		nameSpan.classList.add("usernameNameSpan");
		nameSpan.addEventListener("click", this.toggleMenu.bind(this));

		const nameContent = document.createElement("div");
		const nameStatus = document.createElement("div");
		nameContent.append(nameSpan);
		nameContent.classList.add("usernameNameContent");
		nameStatus.classList.add("usernameNameStatus");

		const nameRow = document.createElement("div");
		const buttonsRow = document.createElement("div");
		nameRow.append(nameContent, nameStatus);
		nameRow.classList.add("usernameNameRow");
		buttonsRow.classList.add("usernameButtonsRow");

		const el = document.createElement("div");
		el.append(nameRow);
		el.classList.add("usernameOuter");
		el.addEventListener("mouseenter", () => {
			this.toggleMenu(true);
		});
		el.addEventListener("mouseleave", () => {
			this.toggleMenu(false);
		});
		
		this.el = el;
		this.buttonsShown = false;
		this.nameStatus = nameStatus;
		this.buttonsRow = buttonsRow;
		this.nameContent = nameContent;
		this.extras = [];
		this.data = data;

		const me = getMainInstance().baseUI.userManager.me;
		if (data.isWaiting) {
			this.addButton("Accept", this.onAcceptPressed.bind(this));
			this.addButton("Decline", this.onDeclinePressed.bind(this));
		} else {
			this.addButton("Boards", this.onBoardsPressed.bind(this));
			if (me.isHost || me.isYou) {
				this.addButton("Rename", this.onRenamePressed.bind(this));
			}
			if (me.isHost) {
				this.addButton("Block", this.onBlockPressed.bind(this));
				this.addButton("Kick", this.onKickPressed.bind(this));
			}
		}

		const extras = [];
		if (data.isYou) extras.push("You");
		if (data.isHost) extras.push("Host");
		this.setExtras(extras);
		if (data.handRaiseTime > 0) this.setStatus("✋");
	}
	addButton(label, fn) {
		const button = document.createElement("button");
		button.classList.add("usernameNameButton");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.buttonsRow.append(button);
	}
	onBoardsPressed() {
		const main = getMainInstance();
		main.baseUI.rightPanel.boardsUI.switchToUser(this.data);
		main.baseUI.rightPanel.setUIByName("boards");
	}
	onRenamePressed() {
		const main = getMainInstance();
		const name = prompt("Enter new name", main.baseUI.userManager.me.name);
		if (!name) return;
		main.networkManager.send("renameUser", {"userId": this.data.id, "newName": name});
	}
	onBlockPressed() {
		const main = getMainInstance();
		if (!confirm(`Are you sure you want to ban "${this.data.name}"?`)) return;
		main.networkManager.send("banUser", {"userId": this.data.id});
	}
	onKickPressed() {
		const main = getMainInstance();
		if (!confirm(`Are you sure you want to kick "${this.data.name}"?`)) return;
		main.networkManager.send("kickUser", {"userId": this.data.id});
	}
	onDeclinePressed() {
		const main = getMainInstance();
		main.networkManager.send("declineWaitingUser", {"userId": this.data.id});
	}
	onAcceptPressed() {
		const main = getMainInstance();
		main.networkManager.send("acceptWaitingUser", {"userId": this.data.id});
	}
	toggleMenu(state) {
		if (state ?? !this.buttonsShown) {
			this.buttonsShown = true;
			this.el.append(this.buttonsRow);
		} else {
			this.buttonsShown = false;
			this.buttonsRow.remove();
		}
	}
	setExtras(extras) {
		for(const extra of this.extras) {
			extra.remove();
		}
		this.extras = [];
		for(const extraLabel of extras) {
			const extra = document.createElement("span");
			extra.textContent = extraLabel;
			extra.classList.add("usernameNameExtra");
			this.extras.push(extra);
			this.nameContent.append(extra);
		}
	}
	setStatus(status) {
		this.nameStatus.textContent = status;
	}
}
