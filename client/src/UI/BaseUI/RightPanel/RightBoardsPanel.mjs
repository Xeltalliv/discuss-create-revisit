import RightBasePanel from "./RightBasePanel.mjs"

class RightBoardsPanel extends RightBasePanel {
	constructor(main, baseUI) {
		super(main);
		this.setTitle("My boards");

		const imgBoardButton = document.createElement("button");
		const txtBoardButton = document.createElement("button");
		imgBoardButton.classList.add("boardsButtonsRowButton");
		txtBoardButton.classList.add("boardsButtonsRowButton");
		imgBoardButton.textContent = "Graphical board";
		txtBoardButton.textContent = "Text board";
		imgBoardButton.addEventListener("click", () => {
			main.networkManager.send("createBoard", {"type":"img"});
		});
		txtBoardButton.addEventListener("click", () => {
			main.networkManager.send("createBoard", {"type":"txt"});
		});
		
		const buttonsrow = document.createElement("div");
		buttonsrow.append(imgBoardButton, txtBoardButton);
		buttonsrow.classList.add("boardsButtonsRow");
		this.el.append(buttonsrow);
		this.buttonsrow = buttonsrow;
		this.baseUI = baseUI;
		this.userId = 0;
	}
	getItemType() {
		return BoardEntryElement;
	}
	switchToUser(user) {
		this.userId = user.id;
		this.baseUI.updateBoardsOf(user.id);
		if (user.isYou) {
			this.setTitle("My boards");
			this.el.append(this.buttonsrow);
		} else {
			this.setTitle(`${user.name}'s boards`);
			this.buttonsrow.remove();
		}
	}
}

class BoardEntryElement {
	constructor(main, data) {
/*
		const name = document.createElement("span");
		name.textContent = `[${data.type}] ${data.name}`;

		const el = document.createElement("div");
		el.append(name);
		el.classList.add("chatMessage");
		el.addEventListener("click", () => {
			main.baseUI.topMain.btxtUI.selectBoard(main.baseUI.rightPanel.boardsUI.userId, data.id);
			main.baseUI.topMain.setUI(main.baseUI.topMain.btxtUI);
			main.baseUI.userManager.updateUserList();
		});
		this.el = el;
	}*/

		const typeImg = document.createElement("div");
		typeImg.classList.add("boardIconRight", `${data.type}BoardIcon`);
		
		const nameContent = document.createElement("div");
		nameContent.classList.add("usernameNameContent");
		nameContent.textContent = data.name;

		const nameRow = document.createElement("div");
		const buttonsRow = document.createElement("div");
		nameRow.append(typeImg, nameContent);
		nameRow.classList.add("usernameNameRow");
		nameRow.addEventListener("click", () => {
			this.toggleMenu();
		});
		buttonsRow.classList.add("usernameButtonsRow");

		const el = document.createElement("div");
		el.append(nameRow);
		el.classList.add("usernameOuter");
		
		this.el = el;
		this.buttonsShown = false;
		this.buttonsRow = buttonsRow;
		this.nameContent = nameContent;

		this.addButton("View", function() {
			main.baseUI.selectBoard(main.baseUI.rightPanel.boardsUI.userId, data.id);
			/*if (main.baseUI.topMain.selectedUI == main.baseUI.topMain.btxtUI && main.baseUI.topMain.btxtUI.boardId == data.id) {
				main.baseUI.topMain.setUI(main.baseUI.topMain.gridUI);
				main.baseUI.userManager.updateUserList();
			} else {
				main.baseUI.topMain.btxtUI.selectBoard(main.baseUI.rightPanel.boardsUI.userId, data.id);
				main.baseUI.topMain.setUI(main.baseUI.topMain.btxtUI);
				main.baseUI.userManager.updateUserList();
			}*/
		});
		this.addButton("Copy", function() {
			main.networkManager.send("createBoard", {"type":"copy", "userId": data.userId, "boardId": data.id});
		});
		if (main.baseUI.userManager.me.isHost || main.baseUI.userManager.me.isYou) {
			this.addButton("Rename", function() {
				const name = prompt("Enter new name", data.name);
				if (!name) return;
				main.networkManager.send("renameBoard", {"userId": data.userId, "boardId": data.id, "newName": name});
			});
			this.addButton("Delete", function() {
				if (!confirm(`Delete ${data.name}?`)) return;
				main.networkManager.send("deleteBoard", {"userId": data.userId, "boardId": data.id});
			});
		}
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
}

export default RightBoardsPanel;