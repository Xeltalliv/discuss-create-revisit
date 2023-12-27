import RightBasePanel from "./RightBasePanel.mjs"

class RightChatPanel extends RightBasePanel {
	constructor(main, baseUI) {
		super(main);
		this.setTitle("Chat");
		const input = document.createElement("input");
		input.classList.add("chatboxInput");
		const sendButton = document.createElement("button");
		sendButton.classList.add("chatboxSend");
		sendButton.textContent = "Send";
		const sendFn = () => {
			if (!input.value) return;
			main.networkManager.send("chat", {"text": input.value});
			input.value = "";
		};
		sendButton.addEventListener("click", sendFn);
		input.addEventListener("keyup", () => {
			if (event.code == "Enter") sendFn();
		})
		const chatbox = document.createElement("div");
		chatbox.append(input, sendButton);
		chatbox.classList.add("chatbox");
		this.el.append(chatbox);

		main.networkManager.addHandler("chat", (op, data) => {
			if (op == "chat") {
				this.addContent([{
					"author": baseUI.userManager.get(data.author).name,
					"text": data.text
				}]);
			}
		});
	}
	getItemType() {
		return ChatMessageElement;
	}
}

class ChatMessageElement {
	constructor(main, data) {
		const author = document.createElement("span");
		author.textContent = data.author;
		author.classList.add("chatMessageAuthor");
		const br = document.createElement("br");
		const content = document.createElement("span");
		content.textContent = data.text;

		const el = document.createElement("div");
		el.append(author, br, content);
		el.classList.add("chatMessage");
		this.el = el;
	}
}

export default RightChatPanel;