import { diff, apply } from "../src/Utils/TextDiff.mjs";

// https://stackoverflow.com/a/47593316
function mulberry32(seed) {
	return function() {
		let t = seed += 0x6D2B79F5;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

function randString(rand, length) {
	const chars = "qwertyuiopasdfghjklzxcvbnm\n ";
	let out = 0;
	for(let i=0; i<length; i++) {
		out += chars[Math.floor(rand() * chars.length)];
	}
	return out;
}

test("diff edit", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"if",
		"diff",
		"function",
		"works",
	];
	const data3 = [[0,2],["diff"],[3,2]];
	expect(diff(data1, data2)).toStrictEqual(data3);
});

test("diff add", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"if",
		"this",
		"function",
		"for",
		"finding differences",
		"works",
	];
	const data3 = [
		[0, 4],
		["for", "finding differences"],
		[4,	1]
	];
	expect(diff(data1, data2)).toStrictEqual(data3);
});

test("diff remove", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"if",
		"works",
	];
	const data3 = [
		[0, 2],
		[4, 1]
	];
	expect(diff(data1, data2)).toStrictEqual(data3);
});

test("diff reuse", () => {
	const data1 = [
		"testing",
		"testing",
		"testing",
	];
	const data2 = [
		"testing",
		"this",
		"testing",
		"testing",
		"testing",
		"testing",
	];
	const data3 = [
		[0, 1],
		["this"],
		[2, 1],
		[0, 3],
	];
	expect(diff(data1, data2)).toStrictEqual(data3);
});

test("diff combined", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"this thing",
		"if",
		"diffing function",
		"works",
		"well",
		"or not",
	];
	const data3 = [
		[0, 1],
		["this thing"],
		[1, 1],
		["diffing function"],
		[4, 1],
		["well", "or not"]
	];
	expect(diff(data1, data2)).toStrictEqual(data3);
});

test("apply edit", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"if",
		"diff",
		"function",
		"works",
	];
	const data3 = [[0,2],["diff"],[3,2]];
	expect(apply(data1, data3)).toStrictEqual(data2);
});

test("apply add", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"if",
		"this",
		"function",
		"for",
		"finding differences",
		"works",
	];
	const data3 = [
		[0, 4],
		["for", "finding differences"],
		[4,	1]
	];
	expect(apply(data1, data3)).toStrictEqual(data2);
});

test("apply remove", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"if",
		"works",
	];
	const data3 = [
		[0, 2],
		[4, 1]
	];
	expect(apply(data1, data3)).toStrictEqual(data2);
});

test("apply reuse", () => {
	const data1 = [
		"testing",
		"testing",
		"testing",
	];
	const data2 = [
		"testing",
		"this",
		"testing",
		"testing",
		"testing",
		"testing",
	];
	const data3 = [
		[0, 1],
		["this"],
		[2, 1],
		[0, 3],
	];
	expect(apply(data1, data3)).toStrictEqual(data2);
});

test("apply combined", () => {
	const data1 = [
		"testing",
		"if",
		"this",
		"function",
		"works",
	];
	const data2 = [
		"testing",
		"this thing",
		"if",
		"diffing function",
		"works",
		"well",
		"or not",
	];
	const data3 = [
		[0, 1],
		["this thing"],
		[1, 1],
		["diffing function"],
		[4, 1],
		["well", "or not"]
	];
	expect(apply(data1, data3)).toStrictEqual(data2);
});

test("1000 pseudorandom edits", () => {
	const rand = mulberry32(123456);
	let stringSrc = "just a test string\nthat will undergo a lot of\nrandom transformations";
	let stringDst = stringSrc;
	let splitStringDst = stringDst.split("\n")
	for(let i=0; i<1000; i++) {
		const lastSplitStringSrc = stringSrc.split("\n")
		const repeat = rand() > 0.9 ? Math.floor(Math.sqrt(rand() * 15)) + 1 : 1;
		for(let j=0; j<repeat; j++) {
			const op = Math.floor(rand() * 3);
			if (op == 0) { // Insert
				const splitPos = Math.floor(rand() * stringSrc.length);
				const part1 = stringSrc.slice(0, splitPos);
				const part2 = stringSrc.slice(splitPos);
				stringSrc = part1 + randString(rand, rand() * 20) + part2;
			} else if (op == 1) { // Remove
				const splitPos1 = Math.floor(rand() * stringSrc.length);
				const splitPos2 = Math.floor(rand() * stringSrc.length);
				const part1 = stringSrc.slice(0, Math.min(splitPos1, splitPos2));
				const part2 = stringSrc.slice(Math.max(splitPos1, splitPos2));
				stringSrc = part1 + part2;
			} else if (op == 2) { // Edit
				const splitPos1 = Math.floor(rand() * stringSrc.length);
				const splitPos2 = Math.floor(rand() * stringSrc.length);
				const part1 = stringSrc.slice(0, Math.min(splitPos1, splitPos2));
				const part2 = stringSrc.slice(Math.max(splitPos1, splitPos2));
				stringSrc = part1 + randString(rand, rand() * 20) + part2;
			}
		}
		const splitStringSrc = stringSrc.split("\n")
		const changes = diff(lastSplitStringSrc, splitStringSrc);
		splitStringDst = apply(splitStringDst, changes);
	}
	stringDst = splitStringDst.join("\n");
	expect(stringSrc).toStrictEqual(stringDst);
});
