class BottomPanel {
	constructor(main, baseUI) {
		const el = document.createElement("div");
		el.classList.add("baseBottom");
		this.el = el;
		this.addButton("Microphone", function() {
			baseUI.mediasoup.toggleMicrophone();
		});
		this.addButton("Camera", function() {
			baseUI.mediasoup.toggleCamera();
		});
		this.addButton("Share screen", function() {
			baseUI.mediasoup.toggleScreenshare();
		});
		this.addButton("Raise hand", function() {
			main.networkManager.send("raiseHand");
		});
		this.addButton("Chat", function() {
			baseUI.setRightUI("chat");
		});
		this.addButton("Users", function() {
			baseUI.setRightUI("userlist");
		});
		this.addButton("My boards", function() {
			baseUI.rightPanel.boardsUI.switchToUser(baseUI.userManager.me);
			baseUI.setRightUI("boards");
		});
		this.addButton("Leave", function() {
			if (confirm("Are you sure that you want to leave this conference?")) {
				main.networkManager.leave();
			}
		});
	}
	addButton(name, fn) {
		const button = new BottomPanelButton(name, fn);
		this.el.append(button.el);
	}
}

class BottomPanelButton {
	constructor(name, fn) {
		const el = document.createElement("button");
		el.textContent = name;
		el.classList.add("baseBottomButton");
		if (fn) el.addEventListener("click", fn);
		this.el = el;
	}
}

export default BottomPanel;