import { RightBasePanel } from "./RightBasePanel.mjs";
import { getMainInstance } from "../../../main.mjs";

export class RightBoardsPanel extends RightBasePanel {
	constructor() {
		super();
		this.setTitle("My boards");

		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.addEventListener("change", () => {
			const files = fileInput.files;
			if (files.length != 1) return;
			this.onFilePicked(files[0]);
			fileInput.value = "";
		});

		const folderButtonsColumn = new BoardsButtonsColumn(null);
		const folderButtonsRow = folderButtonsColumn.addButtonsRow();
		folderButtonsRow.addIcon("boardsButtonsRowFolderIcon");
		const folderNameEl = folderButtonsRow.addFolderName();
		folderButtonsRow.addFixedButton("Back", () => {
			if (this.folderId == -1) return;
			const currentFolder = this.user.boards.get(this.folderId);
			const prevFolder = currentFolder ? this.user.boards.get(currentFolder.folderId) : null;
			this.selectFolder(prevFolder);
		});

		const createButtonsColumn = new BoardsButtonsColumn("Create");
		const selectionButtonsColumn = new BoardsButtonsColumn("Selection");
		const buttonsrow1 = createButtonsColumn.addButtonsRow();
		buttonsrow1.addFillButton("Empty image board", () => {
			getMainInstance().networkManager.send("createBoard", {
				type: "img",
				folderId: this.folderId,
				width: 1600,
				height: 900,
			});
		});
		buttonsrow1.addFillButton("Image board from file", () => {
			this.onFilePicked = this.createImageBoardFromFile;
			fileInput.click();
		});

		const imgBoardFromVideoButton = buttonsrow1.addFillButton("Image board from video", async () => {
			const topMain = getMainInstance().baseUI.topMain;
			if (topMain.selectedUI != topMain.fullUI) return;
			const file = await topMain.fullUI.captureFrame();
			if (!file) return;
			this.createImageBoardFromFile(file);
		});
		const buttonsrow2 = createButtonsColumn.addButtonsRow();
		buttonsrow2.addFillButton("Text board", () => {
			getMainInstance().networkManager.send("createBoard", {
				type: "txt",
				folderId: this.folderId
			});
		});
		buttonsrow2.addFillButton("Folder", () => {
			getMainInstance().networkManager.send("createBoard", {
				type:"folder",
				folderId: this.folderId
			});
		});
		buttonsrow2.addFillButton("Import", () => {
			this.onFilePicked = this.importBoardsFromFile;
			fileInput.click();
		});
		const buttonsrow3 = selectionButtonsColumn.addButtonsRow();
		buttonsrow3.addFillButton("Move here", () => {
			if (this.user == null) return;
			let here = this.folderId;
			while (here > -1) {
				const board = this.user.boards.get(here);
				board.selected = false;
				here = board.folderId;
			}
			const boardIds = this.getSelectedBoardIds();
			this.unselectBoards();
			this.updateBoards();
			getMainInstance().networkManager.send("moveBoards", {
				userId: this.user.id,
				boardIds: boardIds,
				folderId: this.folderId
			});
		});
		buttonsrow3.addFillButton("Delete", () => {
			const boardIds = this.getSelectedBoardIds();
			if (!confirm(`Delete ${boardIds.length} boards?`)) return;
			this.unselectBoards();
			const nm = getMainInstance().networkManager;
			for(let boardId of boardIds) {
				nm.send("deleteBoard", {
					userId: this.user.id,
					boardId: boardId
				});
			}
		});
		buttonsrow3.addFillButton("Export", async () => {
			const boards = this.getSelectedBoards();
			this.unselectBoards();
			this.updateBoards();
			const boardData = await Promise.all(boards.map(board => board.getExportData()));
			this.download(JSON.stringify(boardData), "boards.json", "application/json");
		});
		this.el.append(createButtonsColumn.el, selectionButtonsColumn.el);
		this.el.insertBefore(folderButtonsColumn.el, this.listEl);
		this.createButtonsColumn = createButtonsColumn;
		this.selectionButtonsColumn = selectionButtonsColumn;
		this.folderButtonsColumn = folderButtonsColumn;
		this.imgBoardFromVideoButton = imgBoardFromVideoButton;
		this.user = null;
		this.folderId = -1;
		this.folderNameEl = folderNameEl;
		this.onFilePicked = null;
		this.updateSelected();
		this.selectFolder(null);
	}
	download(data, name, type) {
		const blob = new Blob([data], {type: type});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("download", name);
		link.href = url;
		document.body.append(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	}
	async createImageBoardFromFile(file) {
		const main = getMainInstance();
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await fetch(`${main.httpProtocol}//${main.host}/uploads/${main.baseUI.confId}`, {
				method: "POST",
				body: formData
			});
			const outFiles = await res.json();
			if (outFiles.length == 0) return;
			const outFile = outFiles[0];
			const url = `${main.httpProtocol}//${main.host}/uploads/${main.baseUI.confId}/${outFile.uuid}/${outFile.filename}`;

			const img = new Image();
			img.src = url;
			img.onload = () => {
				main.networkManager.send("createBoard", {
					type: "img",
					folderId: this.folderId,
					backgroundImageSrc: url,
					width: img.width,
					height: img.height,
				});
			};
			img.onerror = (err) => {
				throw err;
			};
		} catch (err) {
			alert(err);
			return;
		}
	}
	importBoardsFromFile(file) {
		const reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = () => {
			this.importBoardsFromArray(JSON.parse(reader.result));
		};
		reader.onerror = (event) => {
			alert(event);
		};
	}
	async importBoardsFromArray(boards) {
		let hasBackgrounds = false;
		const main = getMainInstance();
		const formData = new FormData();
		for(const board of boards) {
			if (board.type == "img" && board.backgroundImageSrc) {
				const dataURL = board.backgroundImageSrc;
				const [mimePart, dataPart] = dataURL.split(",");
				const mime = mimePart.match(/:(.*?);/)[1];
				const binaryString = atob(dataPart);
				const u8Array = new Uint8Array(binaryString.length);
				for(let i=0; i<binaryString.length; i++) {
					u8Array[i] = binaryString.charCodeAt(i);
				}
				const blob = new Blob([u8Array], {type: mime});
				const filename = "background"+Date.now();
				formData.append("file", blob, filename);
				hasBackgrounds = true;
				board.backgroundImageSrc = filename;
			}
		}
		if (hasBackgrounds) {
			try {
				const res = await fetch(`${main.httpProtocol}//${main.host}/uploads/${main.baseUI.confId}`, {
					method: "POST",
					body: formData
				});
				const outFiles = await res.json();
				if (outFiles.length == 0) return;
				for(const board of boards) {
					if (board.type == "img" && board.backgroundImageSrc) {
						const filename = board.backgroundImageSrc;
						const outFile = outFiles.find(outFile => outFile.filename == filename);
						if (outFile) {
							board.backgroundImageSrc = `${main.httpProtocol}//${main.host}/uploads/${main.baseUI.confId}/${outFile.uuid}/${outFile.filename}`;
						} else {
							board.backgroundImageSrc = null;
						}
					}
				}
			} catch(e) {
				alert(e);
				return;
			}
		}
		for (const board of boards) {
			getMainInstance().networkManager.send("createBoard", {
				...board,
				folderId: this.folderId
			});
		}
	}
	setIsFullUI(state) {
		this.imgBoardFromVideoButton.disabled = !state;
	}
	updateBoards() {
		if (!this.user) return;
		const boardsArray = Array.from(this.user.boards.entries())
			.filter(e => e[1].folderId == this.folderId)
			.sort((a,b) => a[0]-b[0])
			.map(e => e[1]);
		this.setContent(boardsArray);
	}
	getItemType() {
		return BoardEntryElement;
	}
	switchToUser(user) {
		this.user = user;
		this.folderId = -1;
		this.updateBoards();
		if (user.isYou) {
			this.setTitle("My boards");
			this.createButtonsColumn.setVisible(true);
		} else {
			this.setTitle(`${user.name}'s boards`);
			this.createButtonsColumn.setVisible(false);
		}
	}
	selectFolder(folder) {
		if (folder == null) {
			this.folderId = -1;
			this.folderButtonsColumn.el.classList.add("hidden");
		} else {
			this.folderId = folder.id;
			this.folderButtonsColumn.el.classList.remove("hidden");
			this.folderNameEl.textContent = folder.name;
		}
		this.updateBoards();
	}
	updateSelected() {
		let selectedCount = this.getSelectedBoards().length;
		this.selectionButtonsColumn.labelEl.textContent = `Selection (${selectedCount})`;
		this.selectionButtonsColumn.setVisible(selectedCount > 0);
	}
	getSelectedBoards() {
		const boards = [];
		if (this.user) {
			for (const [_id, board] of this.user.boards) {
				if (!board.selected) continue;
				boards.push(board);
			}
		}
		return boards;
	}
	getSelectedBoardIds() {
		const boardIds = [];
		if (this.user) {
			for (const [id, board] of this.user.boards) {
				if (!board.selected) continue;
				boardIds.push(id);
			}
		}
		return boardIds;
	}
	unselectBoards() {
		for (const [_id, board] of this.user.boards) {
			board.selected = false;
		}
	}
}

class BoardEntryElement {
	constructor(data) {
		const typeImg = document.createElement("div");
		typeImg.classList.add("boardIconRight", `${data.type}BoardIcon`);
		
		const nameContent = document.createElement("div");
		nameContent.classList.add("boardName");
		nameContent.textContent = data.name;

		const nameRow = document.createElement("div");
		const buttonsRow = document.createElement("div");
		nameRow.append(typeImg, nameContent);
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
		this.buttonsRow = buttonsRow;
		this.nameContent = nameContent;
		this.data = data;
		this.selectButton = null;

		const me = getMainInstance().baseUI.userManager.me;
		this.addButton("View", this.onViewPressed.bind(this));
		this.addButton("Copy", this.onCopyPressed.bind(this));
		if (me.isHost || me.id == data.userId) {
			this.selectButton = this.addButton("Select", this.onSelectPressed.bind(this));
			this.addButton("Rename", this.onRenamePressed.bind(this));
			this.addButton("Delete", this.onDeletePressed.bind(this));
		}
		this.updateSelected();
	}
	onViewPressed() {
		const baseUI = getMainInstance().baseUI;
		if (this.data.type == "folder") {
			baseUI.rightPanel.boardsUI.selectFolder(this.data);
		} else {
			baseUI.topMain.selectBoard(baseUI.rightPanel.boardsUI.user, this.data);
		}
	}
	onCopyPressed() {
		const networkManager = getMainInstance().networkManager;
		networkManager.send("createBoard", {
			"type": "copy",
			"userId": this.data.userId,
			"boardId": this.data.id
		});
	}
	onSelectPressed() {
		this.data.selected = !this.data.selected;
		this.updateSelected();
		getMainInstance().baseUI.rightPanel.boardsUI.updateSelected();
	}
	updateSelected() {
		this.el.classList.toggle("usernameOuterSelected", this.data.selected);
		if (this.selectButton) this.selectButton.textContent = this.data.selected ? "Unselect" : "Select";
	}
	onRenamePressed() {
		const networkManager = getMainInstance().networkManager;
		const name = prompt("Enter new name", this.data.name);
		if (!name) return;
		networkManager.send("renameBoard", {
			"userId": this.data.userId,
			"boardId": this.data.id,
			"newName": name
		});
	}
	onDeletePressed() {
		if (!confirm(`Delete ${this.data.name}?`)) return;
		getMainInstance().networkManager.send("deleteBoard", {"userId": this.data.userId, "boardId": this.data.id});
	}
	addButton(label, fn) {
		const button = document.createElement("button");
		button.classList.add("usernameNameButton");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.buttonsRow.append(button);
		return button;
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
}

class BoardsButtonsColumn {
	constructor(labelText) {
		const el = document.createElement("div");
		el.classList.add("boardsButtonsColumn");
		this.el = el;
		this.labelEl = labelText ? this.addLabel(labelText) : null;
	}
	addButtonsRow() {
		const buttonsrow = new BoardsButtonsRow();
		this.el.append(buttonsrow.el);
		return buttonsrow;
	}
	addLabel(labelText) {
		const labelEl = document.createElement("div");
		labelEl.textContent = labelText;
		labelEl.classList.add("boardsButtonsLabel");
		this.el.append(labelEl);
		return labelEl;
	}
	setVisible(visible) {
		this.el.classList.toggle("hidden", !visible);
	}
}

class BoardsButtonsRow {
	constructor() {
		const el = document.createElement("div");
		el.classList.add("boardsButtonsRow");
		this.el = el;
	}
	addFillButton(label, fn) {
		const button = document.createElement("button");
		button.classList.add("boardsButtonsRowButton", "boardsButtonsRowButtonFill");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.el.append(button);
		return button;
	}
	addFixedButton(label, fn) {
		const button = document.createElement("button");
		button.classList.add("boardsButtonsRowButton", "boardsButtonsRowButtonFixed");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.el.append(button);
		return button;
	}
	addFolderName() {
		const folderName = document.createElement("div");
		folderName.classList.add("boardsFolderPath");
		this.el.append(folderName);
		return folderName;
	}
	addIcon(...classes) {
		const icon = document.createElement("div");
		icon.classList.add(...classes);
		this.el.append(icon);
		return icon;
	}
}