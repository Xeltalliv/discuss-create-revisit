import { BottomPanel } from "./BaseUI/BottomPanel.mjs";
import { RightPanel } from "./BaseUI/RightPanel.mjs";
import { VideoArea } from "./BaseUI/VideoArea.mjs";
import { UserManager } from "../Data/UserManager.mjs";
import { MediasoupManager } from "../Data/MediasoupManager.mjs";

export class BaseUI {
	constructor(main, networkManager) {
		this.userManager = new UserManager(networkManager, this);
		this.mediasoup = new MediasoupManager(networkManager, this.userManager);

		const topMain = new VideoArea(main, this);
		const rightPanel = new RightPanel();
		const bottomPanel = new BottomPanel();

		const top = document.createElement("div");
		top.classList.add("baseTop");
		top.append(topMain.el, rightPanel.el);

		const outer = document.createElement("div");
		outer.classList.add("fullscreen", "baseOuter");
		outer.append(top, bottomPanel.el);

		this.el = outer;
		this.topMain = topMain;
		this.rightPanel = rightPanel;
		this.bottomPanel = bottomPanel;
		this.timer = new IdleTimer(5, () => {
			return this.rightPanel.selectedUI === null;
		}, () => {
			this.bottomPanel.setVisible(false);
			this.topMain.setButtonsVisible(false);
		}, () => {
			this.bottomPanel.setVisible(true);
			this.topMain.setButtonsVisible(true);
		});
	}
	init() {
		this.userManager.init();
		this.mediasoup.init();
		this.rightPanel.init();
		this.rightPanel.setUIByName("userlist");
		this.topMain.setUIByName("grid");
	}
	reset(confToken) {
		this.confToken = confToken;
		this.confId = confToken.split(".")[1];
		this.rightPanel.setUIByName("userlist", true);
		this.topMain.setUIByName("grid");
		this.userManager.reset();
		this.rightPanel.resetChat();
	}
}

class IdleTimer {
	constructor(delay, allowFn, idleFn, awakeFn) {
		this.delay = delay;
		this.value = delay;
		this.interval = -1;
		this.allowFn = allowFn;
		this.idleFn = idleFn;
		this.awakeFn = awakeFn;
		document.body.addEventListener("mousemove", this.reset.bind(this));
	}
	reset() {
		if (this.value == 0) this.awakeFn();
		if (this.allowFn()) {
			this.value = this.delay;
			if (this.interval === -1) {
				this.interval = setInterval(this.decrement.bind(this), 1000);
			}
		} else {
			if (this.interval !== -1) {
				clearInterval(this.interval);
				this.interval = -1;
			}
		}
	}
	decrement() {
		this.value--;
		if (this.value == 0) {
			clearInterval(this.interval);
			this.interval = -1;
			this.idleFn();
		}
	}
}