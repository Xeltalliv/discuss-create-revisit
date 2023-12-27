class VideoAreaBoardBase {
	constructor(main, baseUI, videoArea) {
		const buttonsRow = document.createElement("div");
		buttonsRow.classList.add("baseLeftFullButtonsRow");

		const statusBar = document.createElement("div");
		statusBar.classList.add("baseLeftBoardStatusbar", "hidden");

		const miniVideo = document.createElement("video");
		miniVideo.classList.add("baseLeftFullVideoMini");
		miniVideo.autoplay = true;
		this.miniVideo = miniVideo;

		const miniEl = document.createElement("div");
		miniEl.classList.add("baseLeftFullBGMini");
		miniEl.append(miniVideo);

		const el = document.createElement("div");
		el.append(buttonsRow, miniEl, statusBar);
		el.classList.add("baseLeftFullBG");
		this.el = el;
		this.miniEl = miniEl;
		this.hasMiniVideo = null;
		this.main = main;
		this.baseUI = baseUI;
		this.statusBar = statusBar;
		this.buttonsRow = buttonsRow;
		this.user = null;
		this.userId = 0;
		this.board = null;
		this.boardId = null;

		this.addButton("Back", () => {
			this.onExit();
			videoArea.setUI(videoArea.gridUI);
			baseUI.userManager.updateUserList();
		});
		this.addButton(">", () => {
			this.selectBoardByOffset(1);
		});
		this.addButton("<", () => {
			this.selectBoardByOffset(-1);
		});
	}
	onExit() {
	}
	addButton(label, fn) {
		const button = document.createElement("button");
		button.classList.add("baseLeftFullButton");
		button.textContent = label;
		button.addEventListener("click", fn);
		this.buttonsRow.append(button);
		return button;
	}
	selectBoardByOffset(offset) {
		const boards = Array.from(this.user.boards.entries()).sort((a,b) => a[0]-b[0]);
		for(let i=0; i<boards.length; i++) {
			if (boards[i][0] == this.boardId) {
				if (boards[i+offset]) {
					this.baseUI.topMain.selectBoard(this.userId, boards[i+offset][0]);
					return;
				}
			}
		}
	}
	selectBoard(userId, boardId) {
		this.userId = userId;
		this.user = this.baseUI.userManager.get(userId);
		this.boardId = boardId;
		this.board = this.user.boards.get(boardId);
	}
	showStatusBar(text) {
		this.statusBar.classList.remove("hidden");
		this.statusBar.textContent = text;
	}
	hideStatusBar() {
		this.statusBar.classList.add("hidden");
	}
	update(visible) {
		const user = this.user;
		if (!user) return;
		if (!visible) {
			if (this.hasMiniVideo) {
				this.hasMiniVideo = null;
				this.miniVideo.srcObject = null;
			}
			return;
		}
		user.isVisible = true;
		if (this.hasMiniVideo !== user.mediaStreamPrimary) {
			this.hasMiniVideo = user.mediaStreamPrimary;
			this.miniVideo.srcObject = user.mediaStreamPrimary;
		}
		if (this.hasMiniVideo) {
			this.miniEl.classList.remove("hidden");
		} else {
			this.miniEl.classList.add("hidden");
		}
		if (!user.onMediaUpdate) {
			user.onMediaUpdate = () => this.update(true);
		}
	}
}

export default VideoAreaBoardBase;