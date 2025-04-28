#!/bin/env node

import { rollup } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonJS from "@rollup/plugin-commonjs";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

const outputDir = path.resolve("../server/static");

async function copy(filePath) {
	await fsp.cp(filePath, path.join(outputDir, filePath), { recursive: true });
}
async function copyAndModify(filePath, modFn) {
	let text = await fsp.readFile(filePath, "UTF-8");
	text = modFn(text);
	await fsp.writeFile(path.join(outputDir, filePath), text, "UTF-8");
}

await fsp.rm(outputDir, { recursive: true, force: true });
await fsp.mkdir(outputDir, { recursive: true });
await copyAndModify("index.html", str => str.replace("src/Main.mjs", "js.mjs"));
await copy("style.css");
await copy("img");

const bundle = await rollup({
	input: "src/Main.mjs",
	plugins: [
		resolve({
			browser: true,
			preferBuiltins: false
		}),
		commonJS({
			include: ["node_modules/**", "config.js"],
		}),
	]
});

await bundle.write({
	file: path.join(outputDir, "js.mjs"),
	format: "es",
});

console.log("Build completed");