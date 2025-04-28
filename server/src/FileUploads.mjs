import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

import Busboy from "busboy";

export class FileUploads {
	constructor() {
		this.cwd = process.cwd();
		this.uploadsDir = path.join(this.cwd, "uploads");
		this.activeConferences = new Set();
		if (!fs.existsSync(this.uploadsDir)) fs.mkdirSync(this.uploadsDir);
	}
	init(app) {
		app.post("/uploads/:confid", async (req, res) => {
			const conferenceId = req.params.confid;
			if (!this.activeConferences.has(conferenceId)) {
				res.status(403).send({});
			}
			const conferenceDir = path.join(this.uploadsDir, conferenceId);
			if (!await exists(conferenceDir)) { // TODO: not sync
				await fsp.mkdir(conferenceDir);
			}
			const busboy = Busboy({ headers: req.headers });
			const fileWrites = [];
			const map = [];
			
			busboy.on("file", (fieldname, file, { filename }) => {
				const uuid = crypto.randomUUID();
				const saveTo = path.join(conferenceDir, uuid);
				const writeStream = fs.createWriteStream(saveTo);
				const meta = {filename, uuid, size:0};
				file.on("data", (chunk) => { meta.size += chunk.length;});
				file.pipe(writeStream);
				fileWrites.push(new Promise((resolve, reject) => {
					writeStream.on("finish", resolve);
					writeStream.on("error", reject);
				}));
				map.push(meta);
			});
			busboy.on("finish", () => {
				Promise.all(fileWrites)
					.then(() => {
						res.status(200).send(map);
					})
					.catch(err => {
						console.error("File write error:", err);
						res.status(500).send({});
					});
			});
			req.pipe(busboy);
		});
		app.get("/uploads/:confid/:fileid/:customname", (req, res) => {
			res.sendFile(path.join(this.uploadsDir, path.basename(req.params.confid), path.basename(req.params.fileid)));
		});
	}
	async addConferenceId(conferenceId) {
		this.activeConferences.add(conferenceId);
	}
	async removeConferenceId(conferenceId) {
		this.activeConferences.delete(conferenceId);
		await fsp.rm(path.join(this.uploadsDir, conferenceId), { recursive: true, force: true });
	}
	async cleanup() {
		const files = await fsp.readdir(this.uploadsDir);
		for(const file of files) {
			fsp.rm(path.join(this.uploadsDir, file), { recursive: true, force: true });
		}
	}
}

async function exists(path) {
	try {
		await fsp.stat(path);
		return true;
	} catch {
		return false;
	}
}