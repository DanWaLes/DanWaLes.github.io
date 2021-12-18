function stdout(...params) {
	const output = document.getElementById('output');

	function msg() {
		const msg = params[0];
		const level = params[1];
		const p = document.createElement('p');

		switch (level) {
			case 'error':
				p.style.color = 'red';
				p.innerText = 'Error: ';
				break;
			case 'warn':
				p.style.color = 'orange';
				p.innerText = 'Warning: ';
		}

		p.innerText += msg;

		output.appendChild(p);
	}

	function clear() {
		output.innerHTML = '';
	}

	if (!params.length) {
		clear();
	}
	else {
		msg();
	}
}