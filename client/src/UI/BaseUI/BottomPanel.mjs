import { getMainInstance } from "../../main.mjs";

export class BottomPanel {
	constructor() {
		const elInner = document.createElement("div");
		elInner.classList.add("baseBottomInner");
		const el = document.createElement("div");
		el.classList.add("baseBottomOuter");
		el.append(elInner);

		this.el = el;
		this.elInner = elInner;
		this.microphoneButton = this.addButton("Microphone", "microphone.svg", function() {
			getMainInstance().baseUI.mediasoup.toggleMicrophone();
		});
		this.cameraButton = this.addButton("Camera", "camera.svg", function() {
			getMainInstance().baseUI.mediasoup.toggleCamera();
		});
		this.screenshareButton = this.addButton("Share screen", "screenshare.svg" , function() {
			getMainInstance().baseUI.mediasoup.toggleScreenshare();
		});
		this.handButton = this.addButton("Raise hand", "hand.svg", function() {
			getMainInstance().networkManager.send("raiseHand");
		});
		this.addButton("Chat", "chat.svg", function() {
			getMainInstance().baseUI.rightPanel.setUIByName("chat");
		});
		this.addButton("Users", "users.svg", function() {
			getMainInstance().baseUI.rightPanel.setUIByName("userlist");
		});
		this.addButton("My boards", "boards.svg", function() {
			getMainInstance().baseUI.rightPanel.boardsUI.switchToUser(getMainInstance().baseUI.userManager.me);
			getMainInstance().baseUI.rightPanel.setUIByName("boards");
		});
		this.addButton("Settings", "settings.svg", function() {
			getMainInstance().baseUI.rightPanel.setUIByName("settings");
		});
		this.addButton("Leave", "leave.svg", function() {
			if (confirm("Are you sure that you want to leave this conference?")) {
				if (getMainInstance().baseUI.userManager.me.isHost && confirm("Would you like to end this conference?")) {
					getMainInstance().networkManager.send("endConf");
				} else {
					getMainInstance().networkManager.leave();
				}
			}
		});
	}
	addButton(name, src, fn) {
		const button = new BottomPanelButton(name, src, fn);
		this.elInner.append(button.el);
		return button;
	}
	setVisible(visible) {
		if (visible) {
			this.el.style.height = "";
		} else {
			this.el.style.height = 0;
		}
	}
}

class BottomPanelButton {
	constructor(name, src, fn) {
		const img = document.createElement("img");
		img.src = `/img/bottom/${src}`;
		img.classList.add("baseBottomImg");
		const span = document.createElement("span");
		span.textContent = name;
		span.classList.add("baseBottomSpan");
		const el = document.createElement("button");
		el.classList.add("baseBottomButton");
		el.append(img, span);
		if (fn) el.addEventListener("click", fn);
		this.el = el;
	}
	setActive(state) {
		this.el.classList.toggle("baseBottomButtonActive", state);
	}
}
