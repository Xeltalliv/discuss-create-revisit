import { getMainInstance } from "../../../main.mjs";
import { VideoAreaBase } from "./VideoAreaBase.mjs";

export class VideoAreaBoardBase extends VideoAreaBase {
	constructor() {
		super();
		const miniVideo = document.createElement("video");
		miniVideo.classList.add("baseLeftFullVideoMini");
		miniVideo.autoplay = true;

		const miniEl = document.createElement("div");
		miniEl.classList.add("baseLeftFullBGMini");
		miniEl.append(miniVideo);

		this.el.append(miniEl);
		this.el.classList.add("baseLeftFullBG");
		this.miniEl = miniEl;
		this.miniVideo = miniVideo;
		this.hasMiniVideo = null;
		this.user = null;
		this.board = null;

		this.addButton("Back", () => {
			this.onExit();
			const baseUI = getMainInstance().baseUI;
			baseUI.topMain.setUI(baseUI.topMain.gridUI);
			baseUI.userManager.updateUserList();
		});
		this.addButton("━▶", () => {
			this.selectBoardByOffset(1);
		});
		this.addButton("◀━", () => {
			this.selectBoardByOffset(-1);
		});
	}
	selectBoardByOffset(offset) {
		const boards = Array.from(this.user.boards.entries()).sort((a,b) => a[0]-b[0]);
		for(let i=0; i<boards.length; i++) {
			if (boards[i][1] == this.board) {
				if (boards[i+offset]) {
					getMainInstance().baseUI.topMain.selectBoard(this.user, boards[i+offset][1]);
					return;
				}
			}
		}
	}
	selectBoard(user, board) {
		this.user = user;
		this.board = board;
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
