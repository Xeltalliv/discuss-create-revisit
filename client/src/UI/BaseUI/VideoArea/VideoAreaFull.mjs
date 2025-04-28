import { getMainInstance } from "../../../main.mjs";
import { VideoAreaBase } from "./VideoAreaBase.mjs";

export class VideoAreaFull extends VideoAreaBase {
	constructor() {
		super();
		const video = document.createElement("video");
		video.classList.add("baseLeftFullVideo");
		video.autoplay = true;
		this.video = video;

		const name = document.createElement("span");
		name.classList.add("baseLeftFullName");
		this.name = name;

		this.addButton("Back", () => {
			this.swapped = false;
			const baseUI = getMainInstance().baseUI;
			baseUI.topMain.setUI(baseUI.topMain.gridUI);
			baseUI.userManager.updateUserList();
		});

		const fullscreenButton = this.addButton("Enter fullscreen", () => {
			if (!document.fullscreenElement) {
				document.body.requestFullscreen();
			} else {
				document.exitFullscreen();
			}
		});
		document.addEventListener("fullscreenchange", () => {
			if (!document.fullscreenElement) {
				fullscreenButton.textContent = "Enter fullscreen";
			} else {
				fullscreenButton.textContent = "Exit fullscreen";
			}
		});

		const miniVideo = document.createElement("video");
		miniVideo.classList.add("baseLeftFullVideoMini");
		miniVideo.autoplay = true;
		miniVideo.addEventListener("click", () => {
			this.swapped = !this.swapped;
			this.update(true);
		});
		this.miniVideo = miniVideo;

		const miniEl = document.createElement("div");
		miniEl.classList.add("baseLeftFullBGMini");
		miniEl.append(miniVideo);

		this.el.append(video, name, miniEl);
		this.el.classList.add("baseLeftFullBG");
		this.name = name;
		this.hasVideo = null;
		this.hasMiniVideo = null;
		this.user = null;
		this.swapped = false;
	}
	selectUser(user) {
		this.user = user;
	}
	update(visible) {
		const user = this.user;
		if (!user) return;
		if (!visible) {
			if (this.hasVideo) {
				this.hasVideo = null;
				this.video.srcObject = null;
			}
			if (this.hasMiniVideo) {
				this.hasMiniVideo = null;
				this.miniVideo.srcObject = null;
			}
			return;
		}
		user.isVisible = true;

		let name = user.name;
		if (user.handRaiseTime > 0) name += " ✋";
		this.name.textContent = name;

		let mediaStreams = [user.mediaStreamPrimary, user.mediaStreamSecondary];
		if (mediaStreams[1]) {
			if (this.swapped) mediaStreams = [mediaStreams[1], mediaStreams[0]];
		} else {
			this.swapped = false;
		}
		
		if (this.hasVideo !== mediaStreams[0]) {
			this.hasVideo = mediaStreams[0];
			this.video.srcObject = mediaStreams[0];
		}
		if (this.hasMiniVideo !== mediaStreams[1]) {
			this.hasMiniVideo = mediaStreams[1];
			this.miniVideo.srcObject = mediaStreams[1];
		}
		if (!user.onMediaUpdate) {
			user.onMediaUpdate = () => this.update(true);
		}
	}
	captureFrame() {
		return new Promise((res) => {
			const canvas = document.createElement("canvas");
			canvas.width = this.video.videoWidth;
			canvas.height = this.video.videoHeight;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(this.video, 0, 0);
			canvas.toBlob(blob => {
				if (!blob) return res(null);
				res(new File([blob], "frame.jpg", {
					type: "image/jpeg"
				}));
			}, "image/jpeg");
		});
	}
}
