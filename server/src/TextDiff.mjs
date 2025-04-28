export function diff(a, b) {
	let out = [];
	let same = 0, start = 0, added = [];
	for(let bi=0, ai=0; bi<b.length; bi++, ai++) {
		if (b[bi] == a[ai]) {
			if (added.length) {
				out.push(added);
				added = [];
			}
			same++;
		} else {
			if (same > 0) {
				out.push([start, same]);
				same = 0;
			}
			let ain = a.indexOf(b[bi], ai);
			if (ain == -1) {
				ain = a.indexOf(b[bi]);
			}
			if (ain == -1) {
				added.push(b[bi]);
				start = ai+1;
			} else {
				if (added.length) {
					out.push(added);
					added = [];
				}
				same = 1;
				start = ain;
				ai = ain;
			}
		}
	}
	if (same > 0) out.push([start, same]);
	if (added.length) out.push(added);
	return out;
}

export function apply(a, tr) {
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