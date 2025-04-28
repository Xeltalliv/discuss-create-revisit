import { getMainInstance } from "../../../main.mjs";
import { VideoAreaBase } from "./VideoAreaBase.mjs";

const USERS_PER_PAGE = 9;

export class VideoAreaGrid extends VideoAreaBase {
	constructor() {
		super();
		const minis = [];
		const grid = document.createElement("div");
		grid.classList.add("baseLeftGrid");
		for(let i=0; i<USERS_PER_PAGE; i++) {
			const mini = new VideoAreaGridMiniature();
			minis.push(mini);
			grid.append(mini.el);
		}
		const panel = document.createElement("div");
		panel.classList.add("baseLeftGridPanel");

		this.el.append(grid, panel);
		this.el.classList.add("baseLeftMain");
		this.offset = 0;
		this.minis = minis;
		this.grid = grid;
		this.panel = panel;
		this.gridPages = [];
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
				getMainInstance().baseUI.userManager.updateUserList();
			});
			pages.push(page);
			this.panel.append(page);
		}
		while(pages.length > desiredPageCount) {
			pages.pop().remove();
		}
		this.panel.classList.toggle("hidden", desiredPageCount < 2);
	}
}

class VideoAreaGridMiniature {
	constructor() {
		const video = document.createElement("video");
		video.classList.add("baseLeftGridVideo");
		video.autoplay = true;
		this.video = video;

		const name = document.createElement("span");
		name.classList.add("baseLeftGridName");
		this.name = name;

		const boardIcon = document.createElement("div");
		boardIcon.classList.add("txtBoardIcon", "boardIconGrid");
		boardIcon.addEventListener("click", (event) => {
			event.stopPropagation();
			const userManager = getMainInstance().baseUI.userManager;
			const edits = this.user.editsBoard;
			if (!edits) return;
			const user = userManager.get(edits.userId);
			const board = user.boards.get(edits.boardId);
			getMainInstance().baseUI.topMain.selectBoard(user, board);
		});

		const el = document.createElement("div");
		el.append(video, name, boardIcon);
		el.classList.add("baseLeftGridBG", "hidden");
		el.addEventListener("click", () => {
			const topMain = getMainInstance().baseUI.topMain;
			topMain.fullUI.selectUser(this.user);
			topMain.setUI(topMain.fullUI);
			getMainInstance().baseUI.userManager.updateUserList();
		});
		this.el = el;
		this.boardIcon = boardIcon;
		this.hasVideo = null;
		this.user = null;
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
		this.user = user;
		let name = user.name;
		if (user.handRaiseTime > 0) name += " ✋";
		this.name.textContent = name;

		const eb = user.editsBoard;
		if (eb) {
			const boardType = getMainInstance().baseUI.userManager.get(eb.userId).getBoardType(eb.boardId);
			this.boardIcon.classList.remove("txtBoardIcon", "imgBoardIcon");
			this.boardIcon.classList.add(`${boardType}BoardIcon`);
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
