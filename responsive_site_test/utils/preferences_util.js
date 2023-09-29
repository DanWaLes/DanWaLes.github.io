/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(function() {
	// so that other scripts can use the preferences utils defined here
	// no way to completely prevent window variables from being changed using browser console/other scripts

	if (!(window.utils && typeof window.utils == 'object')) {
		window.utils = {};
	}

	window.utils.preferences = {
		getPrefs: getPrefs,
		setPref: setPref2
	};

	// main

	const prefItems = {
		usingDarkTheme: 'boolean',
		usingRightSideNav: 'boolean'
	};

	function getPrefs() {
		let p = {};

		try {
			p = JSON.parse(localStorage.preferences);
		}
		finally {
			return p;
		}
	}

	function hasPrefs(prefs) {
		return prefs && typeof prefs == 'object' && !Array.isArray(prefs);
	}

	function hasPref(prefs, prefName) {
		if (!hasPrefs(prefs)) {
			return false;
		}

		return typeof prefs[prefName] == prefItems[prefName];
	}

	function setPref(prefs, prefName, value) {
		if (!hasPrefs(prefs)) {
			prefs = {};
		}

		prefs[prefName] = value;
		return prefs;
	}

	function setPref2(prefName, value) {
		localStorage.preferences = JSON.stringify(setPref(getPrefs(), prefName, value));
		applyPreferences();
	}

	function checkPrefs() {
		let prefs = getPrefs();

		for (let prefName of Object.keys(prefItems)) {
			prefs = setPref(prefs, prefName, !!prefs[prefName]);
		}

		localStorage.preferences = JSON.stringify(prefs);
		applyPreferences();
	}

	function applyPreferences() {
		const prefs = getPrefs();

		function setTheme() {
			if (prefs.usingDarkTheme) {
				if (document.body.className.match(/\blight\b/)) {
					document.body.className = document.body.className.replace(/\blight\b/, 'dark');
				}
				else if (!document.body.className.match(/ dark\b/)) {
					document.body.className += ' dark';
				}
			}
			else {
				if (document.body.className.match(/\bdark\b/)) {
					document.body.className = document.body.className.replace(/\bdark\b/, 'light');
				}
				else if (!document.body.className.match(/ light\b/)) {
					document.body.className += ' light';
				}
			}
		}

		function setNavDir() {
			const swapNavBtn = document.getElementById('swapNavBtn');
			const aside = document.getElementsByTagName('aside')[0];
			const mvContent = document.getElementById('mvContent');
			const prefInput = location.href.match(/\/accessibility.html$/) && document.getElementById('usingRightSideNav');

			if (prefs.usingRightSideNav) {
				swapNavBtn.innerText = '←';
				aside.className = 'right';
				mvContent.className = 'left';
			}
			else {
				swapNavBtn.innerText = '→';
				aside.removeAttribute('class');
				mvContent.removeAttribute('class'); 
			}

			if (prefInput) {
				const val = JSON.stringify(prefs.usingRightSideNav);

				for (let option of prefInput.children) {
					if (option.value === val) {
						option.selected = true;
						break;
					}
				}
			}
		}

		setNavDir();
		setTheme();
	}

	document.addEventListener('readystatechange', function() {
		if (document.readyState != 'complete') {
			return;
		}

		checkPrefs();
	});
})();