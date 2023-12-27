function diff(a, b) {
	let out = [];
	let same = 0, start = 0, added = [];
	for(let bi=0, ai=0; bi<b.length; bi++) {
		if (b[bi] == a[ai]) {
			if (added.length) {
				out.push(added);
				added = [];
			}
			if (same == 0) start = ai;
			same++;
			ai++;
		} else {
			let ain = a.indexOf(b[bi], ai);
			if (ain == -1) {
				if (same) out.push([start, same]);
				same = 0;
				ain = a.indexOf(b[bi]);
			}
			if (ain == -1) {
				if (same) out.push([start, same]);
				same = 0;
				added.push(b[bi]);
			} else {
				if (added.length) {
					out.push(added);
					added = [];
				}
				if (same == 0) start = ain;
				same++;
				ai = ain+1;
			}
		}
	}
	if (same) out.push([start, same]);
	if (added.length) out.push(added);
	return out;
}

function apply(a, tr) {
	let out = [];
	for(let t of tr) {
		if(typeof t[0] == "string") {
			out.push(t);
		} else {
			out.push(a.slice(t[0], t[0]+t[1]));
		}
	}
	return out.flat();
}

export {diff, apply};