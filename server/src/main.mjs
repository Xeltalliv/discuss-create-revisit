#!/bin/env node

import http from "node:http";
import https from "node:https";
import os from "node:os";
import fs from "node:fs";
import { WebSocketServer } from "ws";
import mediasoup from "mediasoup";
import Validator from "./Validator.mjs";
import User from "./User.mjs";
import { getLocalIp } from "./Utils.mjs";

class Main {
	constructor() {
		this.config = JSON.parse(fs.readFileSync("config.json"));
		this.startServers(this.config);

		if (this.config.secret == "change this to a long and secure passowrd") {
			console.log("WARNING: using default secret key. Change it in 'config.json'");
		}
		this.conferences = new Map();
		this.validator = new Validator(this.config.secret);

		this.listenIps = [{ip:"127.0.0.0"}];
		const localIp = getLocalIp(); // TODO: ip v6 support?
		if (localIp && localIp.v4) this.listenIps.push({ip: localIp.v4});

		this.workers = [];
		this.createWorkers(this.config);
	}
	startServers(config) {
		let servers = [];
		if (config.http) {
			servers.push({server: http.createServer(this.httpHandler.bind(this)), port: (config.http.port ?? 8080)});
		}
		if (config.https) {
			try {
				servers.push({server: https.createServer({
					key: fs.readFileSync(config.https.key, "utf-8"),
					cert: fs.readFileSync(config.https.cert, "utf-8")
				}, this.httpHandler.bind(this)), port: (config.https.port ?? 8443)});
			} catch(error) {
				console.log("Failed to start HHTPS server:", error);
			}
		}
		for(const sdata of servers) {
			const wss = new WebSocketServer({ server: sdata.server });
			wss.on("connection", (ws) => {
				new User(this, ws);
			});
			sdata.server.listen(sdata.port);
		}
		return servers;
	}
	httpHandler(request, response) {
		response.writeHead(400);
		response.end("This is WebSocket");
	}
	async createWorkers(config) {
		let cpus = config.multithreading ? os.cpus().length : 1;
		console.log("Threads:", cpus);
		for(let i=0; i<cpus; i++) {
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
			this.workers.splice(this.workers.indexOf(worker), 1);
			console.error(`Mediasoup worker ${pid} has died`, error);
			setTimeout(() => this.createWorker(), 5000);
		});
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