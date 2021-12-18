function ndjsonToJSON (ndjsonStr) {
	const json = [];
	const lines = ndjsonStr.trim().split(/$\n^/gm);

	for (let line of lines) {
		json.push(JSON.parse(line));
	}

	return json;
}