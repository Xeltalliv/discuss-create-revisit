const USERS_PER_PAGE = 9;

class VideoAreaGrid {
	constructor(main, baseUI, videoArea) {
		const minis = [];
		const grid = document.createElement("div");
		grid.classList.add("baseLeftGrid");
		for(let i=0; i<USERS_PER_PAGE; i++) {
			const mini = new VideoAreaGridMiniature(baseUI, videoArea);
			minis.push(mini);
			grid.append(mini.el);
		}
		const panel = document.createElement("div");
		panel.classList.add("baseLeftGridPanel");

		const el = document.createElement("div");
		el.append(grid, panel);
		el.classList.add("baseLeftMain");
		this.el = el;
		this.offset = 0;
		this.minis = minis;
		this.grid = grid;
		this.panel = panel;
		this.gridPages = [];
		this.baseUI = baseUI;
	}
	setUsers(users, visible) {
		if (!visible) {
			this.users = null;
			for(let i=0; i<USERS_PER_PAGE; i++) {
				this.minis[i].hide();
			}
			return;
		}
		const maxPageOffset = Math.ceil(users.length / USERS_PER_PAGE - 1) * USERS_PER_PAGE;
		if (this.offset > maxPageOffset) this.offset = maxPageOffset;

		const subUsers = users.slice(this.offset, this.offset + USERS_PER_PAGE);
		const width = Math.ceil(Math.sqrt(Math.min(subUsers.length, USERS_PER_PAGE)));
		this.grid.style["grid-template-columns"] = "1fr ".repeat(width);
		for(let i=0; i<USERS_PER_PAGE; i++) {
			if (i < subUsers.length) {
				this.minis[i].show();
				this.minis[i].update(subUsers[i]);
				subUsers[i].isVisible = true;
			} else {
				this.minis[i].hide();
			}
		}
		
		const pages = this.gridPages;
		const desiredPageCount = Math.ceil(users.length / USERS_PER_PAGE);
		while(pages.length < desiredPageCount) {
			const offset = pages.length * USERS_PER_PAGE;
			const page = document.createElement("button");
			page.classList.add("baseLeftGridPage");
			page.textContent = pages.length + 1;
			page.addEventListener("click", () => {
				this.offset = offset;
				this.baseUI.userManager.updateUserList();
			});
			pages.push(page);
			this.panel.append(page);
		}
		while(pages.length > desiredPageCount) {
			pages.pop().remove();
		}
	}
}

class VideoAreaGridMiniature {
	constructor(baseUI, videoArea) {
		const video = document.createElement("video");
		video.classList.add("baseLeftGridVideo");
		video.autoplay = true;
		this.video = video;

		const name = document.createElement("span");
		name.textContent = "AAA";
		name.classList.add("baseLeftGridName");
		this.name = name;

		const boardIcon = document.createElement("div");
		boardIcon.classList.add("txtBoardIcon", "boardIconGrid");
		boardIcon.addEventListener("click", (event) => {
			event.stopPropagation();
			const edits = baseUI.userManager.get(this.userId).editsBoard;
			if (!edits) return;
			baseUI.selectBoard(edits.userId, edits.boardId);
		});

		const el = document.createElement("div");
		el.append(video, name, boardIcon);
		el.classList.add("baseLeftGridBG", "hidden");
		el.addEventListener("click", () => {
			videoArea.fullUI.selectUser(this.userId);
			videoArea.setUI(videoArea.fullUI);
			baseUI.userManager.updateUserList();
		});
		this.el = el;
		this.boardIcon = boardIcon;
		this.hasVideo = null;
		this.userId = 0;
		this.baseUI = baseUI;
	}
	hide() {
		this.el.classList.add("hidden");
		if (this.hasVideo) {
			this.hasVideo = null;
			this.video.srcObject = null;
		}
	}
	show() {
		this.el.classList.remove("hidden");
	}
	update(user) {
		this.userId = user.id;
		let name = user.name;
		if (user.handRaiseTime > 0) name += " ✋";
		this.name.textContent = name;

		const eb = user.editsBoard;
		if (eb) {
			const boardType = this.baseUI.userManager.get(eb.userId).getBoardType(eb.boardId);
			this.boardIcon.classList.remove("txtBoardIcon", "imgBoardIcon");
			this.boardIcon.classList.add("txtBoardIcon", `${boardType}BoardIcon`);
			this.el.append(this.boardIcon);
		} else {
			this.boardIcon.remove();
		}
		
		if (this.hasVideo !== user.mediaStreamPrimary) {
			this.hasVideo = user.mediaStreamPrimary;
			this.video.srcObject = user.mediaStreamPrimary;
		}
		if (!user.onMediaUpdate) {
			user.onMediaUpdate = () => this.update(user);
		}
	}
}

export default VideoAreaGrid;