import mediasoupClient from "mediasoup-client";
import { getMainInstance } from "../main.mjs";

// https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerOptions
// https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
const params = {
/*	encodings: [
		{
			rid: 'r0',
			maxBitrate: 100000,
			scalabilityMode: 'S1T3',
		},
		{
			rid: 'r1',
			maxBitrate: 300000,
			scalabilityMode: 'S1T3',
		},
		{
			rid: 'r2',
			maxBitrate: 900000,
			scalabilityMode: 'S1T3',
		},
	],*/
	// https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
	codecOptions: {
		videoGoogleStartBitrate: 1000
	}
};

export class MediasoupManager {
	constructor(networkManager, userManager) {
		this.networkManager = networkManager; // new
		this.userManager = userManager;// new
		this.users = userManager.users;
		this.device = null;

		this.creatingProducerTransport = null;
		this.producerTransport = null;
		this.producers = {
			microphone: null,
			camera: null,
			schreenshareVideo: null,
			schreenshareAudio: null,
		};

		this.userMediaAudio = null;
		this.userMediaVideo = null;
		this.userMediaScreen = null;
	}
	init() {
		this.networkManager.addHandler("mediasoup", this.onMessage.bind(this));
	}
	onMessage(op, data) {
		if (op == "rtpCapabilities") {
			this.createDevice(data);
		}
		if (op == "setProducerId") {
			const user = this.users.get(data.userId);
//			console.log("DEBUG", user.media, data.type, user.media[data.type]);
			user.media[data.type].producerId = data.producerId;
			this.refreshOneIfVisible(user);
		}
		if (op == "clearProducer") {
			for(const [_userId, user] of this.users) {
				for(let name in user.media) {
					if (user.media[name].producerId == data) {
						user.media[name].producerId = null;
//						console.log("closeProducer cleared producer with id", data);
						return;
					}
				}
			}
//			console.log("clearProducer didn't find producer with id", data);
		}
		if (op == "closeConsumer") {
			for(const [_userId, user] of this.users) {
				for(let name in user.media) {
					if (user.media[name].consumer &&
						user.media[name].consumer.id == data) {
						user.media[name].consumer.close();
						user.media[name].consumer = null;
						user.media[name].track = null;
						user.media[name].visible = false;
//						console.log("closeConsumer closed consumer with id", data);
						user.mediaUpdate(this);
						return;
					}
				}
			}
//			console.log("closeConsumer didn't find consumer with id", data);
		}
		if (op == "closeConsumerTransport") {
			const ct = this.users.get(data);
			ct.consumerTransport.close();
			ct.consumerTransport = null;
		}
	}
	async toggleMicrophone() {
		const nm = this.networkManager;
		if (!this.userMediaAudio) {
			this.userMediaAudio = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
			await this.createProducerTransportIfNeeded();
			const audioTrack = this.userMediaAudio.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.onTrackEnded = async () => {
					this.userMediaAudio.removeTrack(audioTrack);
					const micProducer = this.producers.microphone;
					if (micProducer) {
						nm.send("closeProducer", micProducer.id);
						micProducer.close();
						this.producers.microphone = null;
						getMainInstance().baseUI.bottomPanel.microphoneButton.setActive(false);
					}
					if (this.userMediaAudio.getTracks().length == 0) {
						this.userMediaAudio = null;
						this.userManager.me.mediaUpdate(this);
						await this.closeProducerTransportIfNotNeeded();
					}
				};
				audioTrack.addEventListener("ended", audioTrack.onTrackEnded);
				await this.createProducer(audioTrack, "microphone");
				getMainInstance().baseUI.bottomPanel.microphoneButton.setActive(true);
			}
		} else {
			this.userMediaAudio.getTracks().forEach(track => {
				track.stop();
				if (track.onTrackEnded) track.onTrackEnded();
			});
		}
	}
	async toggleCamera() {
		const nm = this.networkManager;
		if (!this.userMediaVideo) {
			this.userMediaVideo = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
			await this.createProducerTransportIfNeeded();
			const videoTrack = this.userMediaVideo.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.onTrackEnded = async () => {
					this.userMediaVideo.removeTrack(videoTrack);
					const camProducer = this.producers.camera;
					if (camProducer) {
//						console.log(camProducer, camProducer.id);
						nm.send("closeProducer", camProducer.id);
						camProducer.close();
						this.producers.camera = null;
						getMainInstance().baseUI.bottomPanel.cameraButton.setActive(false);
					}
					if (this.userMediaVideo.getTracks().length == 0) {
						this.userMediaVideo = null;
						this.userManager.me.mediaUpdate(this);
						await this.closeProducerTransportIfNotNeeded();
					}
				};
				videoTrack.addEventListener("ended", videoTrack.onTrackEnded);
				await this.createProducer(videoTrack, "camera");
				getMainInstance().baseUI.bottomPanel.cameraButton.setActive(true);
			}
		} else {
			this.userMediaVideo.getTracks().forEach(track => {
				track.stop();
				if (track.onTrackEnded) track.onTrackEnded();
			});
		}
	}
	async toggleScreenshare() {
		const nm = this.networkManager;
		if (!this.userMediaScreen) {
			this.userMediaScreen = await navigator.mediaDevices.getDisplayMedia({ video: {displaySurface: "monitor"}, audio: true });
			await this.createProducerTransportIfNeeded();
			const videoTrack = this.userMediaScreen.getVideoTracks()[0];
			const audioTrack = this.userMediaScreen.getAudioTracks()[0];
			if (!videoTrack && !audioTrack) return;
			if (videoTrack) {
				videoTrack.onTrackEnded = async () => {
					this.userMediaScreen.removeTrack(videoTrack);
					const scvProducer = this.producers.screenshareVideo;
					if (scvProducer) {
						nm.send("closeProducer", scvProducer.id);
						scvProducer.close();
						this.producers.screenshareVideo = null;
						if (this.producers.screenshareVideo == null && this.producers.screenshareAudio == null) {
							getMainInstance().baseUI.bottomPanel.screenshareButton.setActive(false);
						}
					}
					if (this.userMediaScreen.getTracks().length == 0) {
						this.userMediaScreen = null;
						this.userManager.me.mediaUpdate(this);
						await this.closeProducerTransportIfNotNeeded();
					}
				};
				videoTrack.addEventListener("ended", videoTrack.onTrackEnded);
				await this.createProducer(videoTrack, "screenshareVideo");
				getMainInstance().baseUI.bottomPanel.screenshareButton.setActive(true);
			}
			if (audioTrack) {
				audioTrack.onTrackEnded = async () => {
					this.userMediaScreen.removeTrack(audioTrack);
					const scaProducer = this.producers.screenshareAudio;
					if (scaProducer) {
						nm.send("closeProducer", scaProducer.id);
						scaProducer.close();
						this.producers.screenshareAudio = null;
						if (this.producers.screenshareVideo == null && this.producers.screenshareAudio == null) {
							getMainInstance().baseUI.bottomPanel.screenshareButton.setActive(false);
						}
					}
					if (this.userMediaScreen.getTracks().length == 0) {
						this.userMediaScreen = null;
						this.userManager.me.mediaUpdate(this);
						await this.closeProducerTransportIfNotNeeded();
					}
				};
				audioTrack.addEventListener("ended", audioTrack.onTrackEnded);
				await this.createProducer(audioTrack, "screenshareAudio");
				getMainInstance().baseUI.bottomPanel.screenshareButton.setActive(true);
			}
		} else {
			this.userMediaScreen.getTracks().forEach(track => {
				track.stop();
				if (track.onTrackEnded) track.onTrackEnded();
			});
		}
	}
	async createProducerTransportIfNeeded() {
		if (this.creatingProducerTransport) {
			await this.creatingProducerTransport;
			return;
		}
		const senders = this.userMediaAudio || this.userMediaVideo || this.userMediaScreen;
		if (senders && !this.producerTransport && !this.creatingProducerTransport) {
			this.creatingProducerTransport = this.createProducerTransport();
			await this.creatingProducerTransport;
			this.creatingProducerTransport = null;
		}
	}
	async closeProducerTransportIfNotNeeded() {
		const nm = this.networkManager;
		const senders = this.userMediaAudio || this.userMediaVideo || this.userMediaScreen;
		if (!senders && this.producerTransport) {
			this.producerTransport.close();
			this.producerTransport = null;
			nm.send("closeProducerTransport");
		}
	}
	refreshUserVisibility() {
		for(const [_userId, user] of this.users) {
			this.attachConsumers(user);
		}
	}
	refreshOneIfVisible(user) {
		this.attachConsumers(user);
	}
	async attachConsumers(user) {
		const nm = this.networkManager;
		if (user.isYou) {
			user.mediaUpdate(this);
			return;
		}
		let producers = !!user.media.microphone.producerId;
		if (user.isVisible) {
			producers ||= !!user.media.camera.producerId;
			producers ||= !!user.media.screenshareVideo.producerId;
			producers ||= !!user.media.screenshareAudio.producerId;
		}
		if (!producers) {
			if (user.consumerTransport) {
				user.consumerTransport.close();
				user.consumerTransport = null;
				nm.send("closeConsumerTransport", user.id);
			}
			return;
		}
		if (!user.consumerTransport) await this.createReceiverTransport(user);
		if (user.isVisible) {
			this.attachConsumer(user, "microphone");
			this.attachConsumer(user, "camera");
			this.attachConsumer(user, "screenshareVideo");
			this.attachConsumer(user, "screenshareAudio");
		} else {
			this.attachConsumer(user, "microphone");
			this.detachConsumer(user, "camera");
			this.detachConsumer(user, "screenshareVideo");
			this.detachConsumer(user, "screenshareAudio");
		}
	}
	async attachConsumer(user, media) {
		const target = user.media[media];
		if (target.producerId && !target.visible) {
			target.visible = true;
			await this.createConsumer(user, target);
		}
	}
	async detachConsumer(user, media) {
		const target = user.media[media];
		if (target.producerId && target.visible) {
			target.consumer.close();
			target.consumer = null;
			target.track = null;
			target.visible = false;
			user.mediaUpdate(this);
		}
	}
	async createProducer(track, mediaType) {
//		console.log("creatingProducer");
		const producer = await this.producerTransport.produce(Object.assign({track, appData: {mediaType}}, params));
		producer.on("trackended", () => {
			this.producers[mediaType] = null;
//			console.log("track ended");
			producer.close();
		});
		producer.on("transportclose", () => {
//			console.log("transport closed");
		});
		this.producers[mediaType] = producer;
	}
	async createConsumer(user, target) {
		const nm = this.networkManager;
		const reply = await nm.sendAndWaitForReply("consume", {
			rtpCapabilities: this.device.rtpCapabilities,
			producerId: target.producerId,
			userId: user.id,
		});
		const transport = user.consumerTransport;
		const consumer = await transport.consume({
			id: reply.data.id,
			producerId: reply.data.producerId,
			kind: reply.data.kind,
			rtpParameters: reply.data.rtpParameters,
		});
		target.consumer = consumer;
		target.track = consumer.track;
		user.mediaUpdate(this);
		nm.send("consumerResume", consumer.id);
	}
	async createProducerTransport() {
		const nm = this.networkManager;
		const reply = await nm.sendAndWaitForReply("createTransport", {type: "producer"});
		if (reply.op == "error") throw new Error("Error from server: "+reply.data);
		const transport = this.device.createSendTransport(reply.data);
		transport.on("connect", async (parameters, callback, errback) => {
			try {
				nm.send("producerTransportConnect", {
					//transportId: transport.id,
					dtlsParameters: parameters.dtlsParameters,
				});
				callback();
			} catch(e) {
				errback(e);
			}
		});
		transport.on("produce", async (parameters, callback, errback) => {
//			console.log("on produce", parameters);
			try {
				const producerId = await nm.sendAndWaitForReply("producerTransportProduce", {
					//transportId: transport.id,
					kind: parameters.kind,
					rtpParameters: parameters.rtpParameters,
					appData: parameters.appData,
				});
				if (producerId.op == "error") errback(reply.data);
				callback({id: producerId.data});
			} catch(e) {
				errback(e);
			}
		});
		this.producerTransport = transport;
	}
	async createReceiverTransport(user) {
		const nm = this.networkManager;
		const reply = await nm.sendAndWaitForReply("createTransport", {type: "receiver", userId: user.id});
		if (reply.op == "error") return;

//		console.log(reply.data);
		const transport = this.device.createRecvTransport(reply.data);
		transport.on("connect", async (parameters, callback, errback) => {
			try {
				nm.send("consumerTransportConnect", {
					//transportId: transport.id,
					dtlsParameters: parameters.dtlsParameters,
					userId: user.id,
				});
				callback();
			} catch(e) {
				errback(e);
			}
		});
		user.consumerTransport = transport;
	}
	async createDevice(rtpCapabilities) {
		if (this.device) return;
		try {
			const device = new mediasoupClient.Device();
			await device.load({
				routerRtpCapabilities: rtpCapabilities
			});
			this.device = device;
//			console.log(device);
		} catch(e) {
			console.error(e);
		}
	}
	clear() {
		if (this.producerTransport) {
			this.producerTransport.close();
			this.producerTransport = null;
		}
		if (this.userMediaAudio) {
			this.userMediaAudio.getTracks().forEach(track => {
				track.stop();
				track.dispatchEvent(new Event("ended"));
			});
			this.userMediaAudio = null;
		}
		if (this.userMediaVideo) {
			this.userMediaVideo.getTracks().forEach(track => {
				track.stop();
				track.dispatchEvent(new Event("ended"));
			});
			this.userMediaVideo = null;
		}
		if (this.userMediaScreen) {
			this.userMediaScreen.getTracks().forEach(track => {
				track.stop();
				track.dispatchEvent(new Event("ended"));
			});
			this.userMediaScreen = null;
		}
		for(const [_userId, user] of this.users) {
			for(const media in user.media) {
				const consumer = user.media[media].consumer;
				if (consumer) consumer.close();
			}
		}
		this.users.clear();
	}
	destroy() {
	}
}
