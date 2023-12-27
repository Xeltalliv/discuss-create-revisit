class VideoAreaFull {
	constructor(main, baseUI, videoArea) {
		const video = document.createElement("video");
		video.classList.add("baseLeftFullVideo");
		video.autoplay = true;
		this.video = video;

		const name = document.createElement("span");
		name.textContent = "AAA";
		name.classList.add("baseLeftFullName");
		this.name = name;

		const backButton = document.createElement("button");
		backButton.classList.add("baseLeftFullButton");
		backButton.textContent = "Back";
		backButton.addEventListener("click", () => {
			this.swapped = false;
			videoArea.setUI(videoArea.gridUI);
			baseUI.userManager.updateUserList();
		});

		const buttonsRow = document.createElement("div");
		buttonsRow.classList.add("baseLeftFullButtonsRow");
		buttonsRow.append(backButton);

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

		const el = document.createElement("div");
		el.append(video, name, buttonsRow, miniEl);
		el.classList.add("baseLeftFullBG");
		this.el = el;
		this.name = name;
		this.hasVideo = null;
		this.hasMiniVideo = null;
		this.baseUI = baseUI;
		this.user = null;
		this.userId = 0;
		this.swapped = false;
	}
	selectUser(userId) {
		this.userId = userId;
		this.user = this.baseUI.userManager.get(userId);
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
			 if(this.swapped) mediaStreams = [mediaStreams[1], mediaStreams[0]]
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
}

export default VideoAreaFull;