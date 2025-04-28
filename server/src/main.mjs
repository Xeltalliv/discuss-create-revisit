#!/bin/env node

import http from "node:http";
import https from "node:https";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

import { WebSocketServer } from "ws";
import mediasoup from "mediasoup";
import express from "express";
import cors from "cors";
import Busboy from "busboy";

import Validator from "./Validator.mjs";
import User from "./User.mjs";
import { getLocalIp } from "./Utils.mjs";
import { FileUploads } from "./FileUploads.mjs";

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
		server.on('upgrade', (request, socket, head) => {
			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit('connection', ws, request);
			});
		});
	}
	startServers(config) {
		const app = express();
		if (config.disableCors) app.use(cors());
		this.uploads.init(app);
		app.use(express.static("static"));
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