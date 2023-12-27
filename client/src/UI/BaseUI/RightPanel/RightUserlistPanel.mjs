import RightBasePanel from "./RightBasePanel.mjs"

class RightUserlistPanel extends RightBasePanel {
	constructor(main) {
		super(main);
		this.setTitle("User list");
	}
	getItemType() {
		return UserElement;
	}
	setUsers(users) {
		this.setContent(users);
	}
}

class UserElement {
	constructor(main, data) {
		let name = data.name;
		const nameSpan = document.createElement("span");
		nameSpan.textContent = name;
		nameSpan.addEventListener("click", () => {
			this.toggleMenu();
		});

		const nameContent = document.createElement("div");
		const nameStatus = document.createElement("div");
		//const banButton = document.createElement("button");
		//const kickButton = document.createElement("button");
		nameContent.append(nameSpan);
		nameContent.classList.add("usernameNameContent");
		nameStatus.classList.add("usernameNameStatus");
		//banButton.textContent = "Block";
		//banButton.addEventListener("click", );
		//kickButton.textContent = "Kick";
		//kickButton.addEventListener("click", );

		const nameRow = document.createElement("div");
		const buttonsRow = document.createElement("div");
		nameRow.append(nameContent, nameStatus);
		nameRow.classList.add("usernameNameRow");
		//buttonsRow.append(banButton, kickButton);
		buttonsRow.classList.add("usernameButtonsRow");

		const el = document.createElement("div");
		el.append(nameRow);
		el.classList.add("usernameOuter");
		
		this.el = el;
		this.buttonsShown = false;
		this.nameStatus = nameStatus;
		this.buttonsRow = buttonsRow;
		this.nameContent = nameContent;
		this.extras = [];

		this.addButton("Boards", function() {
			main.baseUI.rightPanel.boardsUI.switchToUser(data);
			main.baseUI.setRightUI("boards");
		});
		if (main.baseUI.userManager.me.isHost || main.baseUI.userManager.me.isYou) {
			this.addButton("Rename", function() {
				const name = prompt("Enter new name", main.baseUI.userManager.me.name);
				if (!name) return;
				main.networkManager.send("renameUser", {"userId": data.id, "newName": name});
			});
		}
		if (main.baseUI.userManager.me.isHost) {
			this.addButton("Block", function() {
				if (!confirm(`Are you sure you want to ban "${data.name}"?`)) return;
				main.networkManager.send("banUser", {"userId": data.id});
			});
			this.addButton("Kick", function() {
				if (!confirm(`Are you sure you want to kick "${data.name}"?`)) return;
				main.networkManager.send("kickUser", {"userId": data.id});
			});
		}

		const extras = [];
		if (data.isYou) extras.push("You");
		if (data.isHost) extras.push("Host");
		this.setExtras(extras);
		if (data.handRaiseTime > 0) this.setStatus("✋");
	}
	addButton(label, fn) {
		const button = document.createElement("button");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.buttonsRow.append(button);
	}
	toggleMenu() {
		if (this.buttonsShown) {
			this.buttonsShown = false;
			this.buttonsRow.remove();
		} else {
			this.buttonsShown = true;
			this.el.append(this.buttonsRow);
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

export default RightUserlistPanel;