function convertTime(time) {
	const h12Match = time.match(/^(\d{1,2})\s*(?:\.\s*(\d{2}))?\s*([ap]m)$/i), h24Match = time.match(/^(\d{2})\s*:\s*(\d{2})$/);

	if (h12Match) {
		let mins = h12Match[2] || '';

		if (mins) {
			mins = '' + (parseInt(mins) % 60);
		}
		while (mins.length < 2) {
			mins = '0' + mins; 
		}

		const tod = h12Match[3].toLowerCase();
		let hours = parseInt(h12Match[1]) % 12;
		if (tod == 'pm') {
			hours += 12;
		}

		hours = '' + hours;
		while (hours.length < 2) {
			hours = 0 + hours; 
		}

		return hours + ':' + mins;
	}
	else if (h24Match) {
		const mins = (() => {
			let m = parseInt(h24Match[2]) % 60;
			if (!m) {
				return '';
			}
			m = '' + m;
			while (m.length < 2) {
				m = '0' + m; 
			}
			return '.' + m;
		})();

		let hours = parseInt(h24Match[1]) % 24, tod = 'am';
		if (hours === 0) {
			hours += 12;
		}
		if (hours >= 12) {
			tod = 'pm';

			while (hours > 12) {
				hours -= 12;
			}
		}

		return hours + mins + ' ' + tod;
	}

	return '';
}

function doConversion() {
	const output = document.getElementById('output');
	const converted = convertTime(document.getElementById('input').value);

	if (converted) {
		output.innerHTML = converted;
	}
	else {
		output.innerHTML = 'This is not a 12 hour or 24 hour time';
	}
}