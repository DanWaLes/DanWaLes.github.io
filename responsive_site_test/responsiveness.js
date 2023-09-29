/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(function() {
	function resized() {
		const body = document.getElementsByTagName('body')[0];
		const bodyStyle = getComputedStyle(body);
		const aside = document.getElementsByTagName('aside')[0];
		const nav = document.getElementsByTagName('nav')[0];
		const navButtons = document.querySelectorAll('nav a');
		const swapNavBtn = document.getElementById('swapNavBtn');
		const swapNavBtnStyle = getComputedStyle(swapNavBtn);
		const content = document.getElementById('content');
		const mvContent = document.getElementById('mvContent');
		const mvContentStyle = getComputedStyle(mvContent);
		const header = document.getElementsByTagName('header')[0];
		const footer = document.getElementsByTagName('footer')[0];

		nav.style.height = window.innerHeight - (Number(bodyStyle.marginTop.replace('px', '')) * 2) - (Number(swapNavBtnStyle.paddingTop.replace('px', '')) * 4) + 'px';
		nav.style.width = aside.clientWidth + 'px';

		let biggestBtnSize = 0;

		for (let btn of navButtons) {
			btn.removeAttribute('style');

			if (btn.clientWidth > biggestBtnSize) {
				biggestBtnSize = btn.clientWidth;
			}
		}

		swapNavBtn.style.width = Number(getComputedStyle(aside).width.replace('px', '')) - Number(swapNavBtnStyle.paddingRight.replace('px', '') * 2) + 'px';
		mvContent.removeAttribute('style');

		if (window.innerWidth < 600) {
			mvContent.style.maxWidth = (window.innerWidth - (Number(bodyStyle.marginLeft.replace('px', '')) * 3) - nav.clientWidth) + 'px';

			if (header.nextElementSibling == content) {
				mvContent.insertAdjacentElement('afterbegin', header);
			}
			if (footer.parentNode == body) {
				mvContent.appendChild(footer);
			}
		}
		else {
			if (header.nextElementSibling != content) {
				content.insertAdjacentElement('beforebegin', header);
			}
			if (footer.parentNode != body) {
				body.appendChild(footer);
			}

			for (let btn of navButtons) {
				btn.style.width = biggestBtnSize + 'px';
			}
		}
	}

	function setupSwapNavBtn() {
		const swapNavBtn = document.getElementById('swapNavBtn');
		swapNavBtn.onclick = function() {
			const prefs = window.utils.preferences.getPrefs();

			window.utils.preferences.setPref('usingRightSideNav', !prefs.usingRightSideNav);
		};
	}

	document.addEventListener('readystatechange', function() {
		if (document.readyState != 'complete') {
			return;
		}

		setupSwapNavBtn();
		window.onresize = resized;
		resized();
	});
})();