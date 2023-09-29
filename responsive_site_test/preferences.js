/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(function() {
	function autofill() {
		// fills out current preferences
		const prefs = window.utils.preferences.getPrefs();

		for (let prefName of Object.keys(prefs)) {
			const prefValue = (function() {
				if (typeof prefs[prefName] == 'string') {
					return prefs[prefName];
				}

				return JSON.stringify(prefs[prefName]);
			})();
			const input = document.getElementById(prefName);

			if (input.tagName == 'SELECT') {
				for (let option of input.children) {
					if (option.value === prefValue) {
						option.selected = true;
						break;
					}
				}
			}
			else {
				input.value = prefValue;
			}
		}
	}

	function setupEvents() {
		const prefNames = Object.keys(window.utils.preferences.getPrefs());

		for (let prefName of prefNames) {
			const name = prefName;
			const input = document.getElementById(name);

			input.onchange = function() {
				let val;

				try {
					// convert number of boolean string to correct type
					val = JSON.parse(input.value);
				}
				catch(err) {
					// is a string
					val = input.value;
				}
				finally {
					window.utils.preferences.setPref(name, val);
				}
			};
		}
	}

	document.addEventListener('readystatechange', function() {
		if (document.readyState != 'complete') {
			return;
		}

		autofill();
		setupEvents();
	});
})();