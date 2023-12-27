import BottomPanel from "./BaseUI/BottomPanel.mjs";
import RightPanel from "./BaseUI/RightPanel.mjs";
import VideoArea from "./BaseUI/VideoArea.mjs";
import UserManager from "../Data/UserManager.mjs";
import MediasoupManager from "../Data/MediasoupManager.mjs";

class BaseUI {
	constructor(main) {
		const topMain = new VideoArea(main, this);
		topMain.setUIByName("grid");
		this.topMain = topMain;
		const rightPanel = new RightPanel(main, this);
		rightPanel.setUIByName("userlist");
		this.rightPanel = rightPanel;

		const top = document.createElement("div");
		top.classList.add("baseTop");
		top.append(topMain.el, rightPanel.el);
		const bottomPanel = new BottomPanel(main, this);

		const outer = document.createElement("div");
		outer.classList.add("fullscreen", "baseOuter");
		outer.append(top, bottomPanel.el);
		this.el = outer;

		this.userManager = new UserManager(main, this);
		this.mediasoup = new MediasoupManager(main, this, this.userManager);
	}
	setRightUI(name, force) {
		this.rightPanel.setUIByName(name, force);
	}
	setVideoAreaUI(name) {
		this.topMain.setUIByName(name);
	}
	reset() {
		this.userManager.reset();
		this.rightPanel.resetChat();
	}
	updateUserList(users) {
		for(const user of users) {
			user.isVisible = false;
			user.onMediaUpdate = null;
		}
		const userBuckets = {"handRisen":[], "normal":[]};
		for(const user of users) {
			let bucket = "normal";
			if (user.handRaiseTime > 0) bucket = "handRisen";
			userBuckets[bucket].push(user);
		}
		userBuckets.handRisen.sort((a,b) => a.handRaiseTime-b.handRaiseTime);
		userBuckets.normal.sort((a,b) => a.joinTime-b.joinTime);
		this.rightPanel.userlistUI.setContent([...userBuckets.handRisen, ...userBuckets.normal]);
		this.topMain.setUsers(users);
		this.refreshUserVisibility(users);
	}
	refreshUserVisibility(users) {
		this.mediasoup.refreshUserVisibility(users);
	}
	updateBoardsOf(userId) {
		if (this.rightPanel.boardsUI.userId !== userId) return;
		const user = this.userManager.get(userId);
		if (!user) return;
		const boardsArray = Array.from(user.boards.entries()).sort((a,b) => a[0]-b[0]).map(e => e[1]);
		this.rightPanel.boardsUI.setContent(boardsArray);
	}
	updateBoardText(userId, boardId) {
		const btxt = this.topMain.btxtUI;
		if (btxt.boardId == boardId && btxt.userId == userId) btxt.updateText();
	}
	updateBoardImage(userId, boardId) {
		const bimg = this.topMain.bimgUI;
		if (bimg.boardId == boardId && bimg.userId == userId) bimg.updateImage();
	}
	updateBoardEditor(userId, boardId) {
		const btxt = this.topMain.btxtUI;
		if (btxt.boardId == boardId && btxt.userId == userId) btxt.updateEditor();
	}
	selectBoard(userId, boardId) {
		this.topMain.selectBoard(userId, boardId);
	}
	getDrawOptions() {
		return this.rightPanel.getDrawOptions();
	}
}

export default BaseUI;