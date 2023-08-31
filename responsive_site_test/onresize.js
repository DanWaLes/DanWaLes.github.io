(function() {
	function resized() {
		const body = document.getElementsByTagName('body')[0];
		const bodyStyle = getComputedStyle(body);
		const nav = document.getElementsByTagName('nav')[0];
		const newHeight = window.innerHeight - Number(bodyStyle.marginTop.replace('px', '')) - Number(bodyStyle.marginBottom.replace('px', '')) + 'px';
		const aside = document.getElementsByTagName('aside')[0];

		nav.style.height = newHeight;
		nav.style.width = aside.clientWidth + 'px';

		const navButtons = document.querySelectorAll('nav ul li');

		let biggestBtnSize = 0;

		for (let btn of navButtons) {
			btn.removeAttribute('style');

			if (btn.clientWidth > biggestBtnSize) {
				biggestBtnSize = btn.clientWidth;
			}
		}

		const content = document.getElementById('content');
		const mvContent = document.getElementById('mvContent');
		const header = document.getElementsByTagName('header')[0];
		const footer = document.getElementsByTagName('footer')[0];

		if (window.innerWidth < 600) {
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

	function run() {
		if (document.readyState != 'complete') {
			return;
		}

		window.onresize = resized;
		resized();
	}

	document.onreadystatechange = run;
})();