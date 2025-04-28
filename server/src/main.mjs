#!/bin/env node

import http from "node:http";
import https from "node:https";
import os from "node:os";
import fs from "node:fs";

import { WebSocketServer } from "ws";
import mediasoup from "mediasoup";
import express from "express";
import cors from "cors";

import Validator from "./Validator.mjs";
import User from "./User.mjs";
import { getLocalIp } from "./Utils.mjs";
import { FileUploads } from "./FileUploads.mjs";

if (!fs.existsSync("config.json")) {
	fs.writeFileSync("config.json", `{
	"http": {
		"enabled": true,
		"port": 8080
	},
	"https": {
		"enabled": false,
		"port": 8443,
		"key": "ssl/your.key",
		"cert": "ssl/your.cert"
	},
	"auth": {
		"google": {
			"clientId": "012345678901-0123456789abcdefghijklmnopqrstuv.apps.googleusercontent.com"
		}
	},
	"staticFiles": {
		"enabled": true,
		"path": "static"
	},
	"disableCors": false,
	"workers": "auto",
	"secret": "change this to a long and secure passowrd"
}
`, "utf8");
}

class Main {
	constructor() {
		this.config = JSON.parse(fs.readFileSync("config.json"));
		this.uploads = new FileUploads();

		if (this.config.secret == "change this to a long and secure passowrd") {
			console.log("WARNING: using default secret key. Change it in 'config.json'");
		}
		this.conferences = new Map();
		this.validator = new Validator(this.config.secret);

		this.listenIps = [{ip:"127.0.0.0"}];
		const localIp = getLocalIp(); // TODO: ip v6 support?
		if (localIp && localIp.v4) this.listenIps.push({ip: localIp.v4});

		this.uploads.cleanup();
		this.workers = [];
		this.createWorkers(this.config);
		this.startServers(this.config);
	}
	handleUpgrade(server, wss) {
		server.on("upgrade", (request, socket, head) => {
			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit("connection", ws, request);
			});
		});
	}
	startServers(config) {
		const app = express();
		if (config.disableCors) app.use(cors());
		app.use((req, res, next) => {
			res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'sha256-g2Iw1INxyxx6FejtktsVHBYsUIG6e00y1WO2peJJhxU='; style-src 'self'");
			next();
		});
		this.uploads.init(app);
		if (config.staticFiles.enabled) {
			app.use(express.static(config.staticFiles.path));
		}
		const wss = new WebSocketServer({ noServer: true });
		wss.on("connection", (ws) => {
			new User(this, ws);
		});
		if (config.http.enabled) {
			this.httpServer = http.createServer(app);
			this.handleUpgrade(this.httpServer, wss);
			this.httpServer.listen(config.http.port ?? 8080);
		}
		if (config.https.enabled) {
			const key = fs.readFileSync(config.https.key, "utf-8");
			const cert = fs.readFileSync(config.https.cert, "utf-8");
			this.httpsServer = https.createServer({key, cert}, app);
			this.handleUpgrade(this.httpsServer, wss);
			this.httpsServer.listen(config.https.port ?? 8443);
		}
	}
	httpHandler(request, response) {
		response.writeHead(400);
		response.end("This is WebSocket");
	}
	async createWorkers(config) {
		let workers = config.workers;
		if (workers == "auto") workers = os.cpus().length;
		workers = +workers;
		if (!isFinite(workers) || workers < 1 || workers > 100) workers = 1;
		console.log("Threads:", workers);
		for(let i=0; i<workers; i++) {
			this.createWorker();
		}
	}
	async createWorker() {
		const worker = await mediasoup.createWorker({
			rtcMinPort: 2000,
			rtcMaxPort: 2020,
		});
		const pid = worker.pid;
		console.log("Mediasoup worker PID:", pid);
		this.workers.push(worker);
		worker.on("died", (error) => {
			this.closeConferencesOfWorker(worker);
			this.workers.splice(this.workers.indexOf(worker), 1);
			console.error(`Mediasoup worker ${pid} has died`, error);
			setTimeout(() => this.createWorker(), 5000);
		});
	}
	async closeConferencesOfWorker(worker) {
		for(const [_id, conference] of this.conferences) {
			if (conference.worker == worker) {
				conference.onWorkerStopped();
			}
		}
	}
	async getWorker() {
		let lowestTime = Infinity;
		let lowestWorker = null;
		let resourceUsagePromises = [];
		for(const worker of this.workers) {
			resourceUsagePromises.push((async () => {
				const time = (await worker.getResourceUsage()).ru_utime;
				if (time < lowestTime) {
					lowestTime = time;
					lowestWorker = worker;
				}
			})());
		}
		await Promise.all(resourceUsagePromises);
		return lowestWorker;
	}
}

const _main = new Main();