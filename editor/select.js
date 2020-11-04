// custom selects so that they can be opened programmatically

(() => {
	function run() {
		if (document.readyState != 'complete') {
			return setTimeout(run, 100);
		}

		const selects = document.getElementsByClassName('select');

		function doSelect(select) {
			const current = select.getElementsByClassName('selectedOption')[0];
			const optionsContainer = select.getElementsByClassName('options')[0];
			const options = optionsContainer.getElementsByClassName('option');
			let expanded = false;
			let optionNo = 0;

			current.innerText = options[0].innerText;
			current.dataset.val = options[0].dataset.val;

			function collapse() {
				if (!expanded) {
					return;
				}

				expanded = false;
				window.HOTKEYS_DISABLED = false;

				optionsContainer.style.display = 'none';
				document.body.style.position = 'static';
				select.style.position = 'static';
				current.style.display = 'inline';
			}

			function expand() {
				if (expanded) {
					return;
				}

				expanded = true;
				window.HOTKEYS_DISABLED = true;

				current.style.display = 'none';
				select.style.position = 'relative';
				select.style.top = options.length + 'em';
				document.body.style.position = 'relative';
				document.body.style.top = '-' + options.length + 'em';
				optionsContainer.style.display = 'block';
			}

			current.onclick = expand;

			function doOption(option, i) {
				function clicked() {
					current.innerText = option.innerText;
					current.dataset.val = option.dataset.val;
					options.className = option.className.replace(' hover', '');
					optionNo = i;
					collapse();

					if (typeof window.inputChanged == 'function') {
						window.inputChanged();
					}
				}

				option.onclick = clicked;
			}

			for (let i in options) {
				doOption(options[i], i);
			}

			// prevent typing while selecting from select
			let lastHovered;

			function getActiveOption() {
				return options[(optionNo + options.length) % options.length];
			}
			function hoverOnOption() {
				const active = getActiveOption();

				if (lastHovered) {
					lastHovered.className = lastHovered.className.replace(' hover', '');
				}

				active.className += ' hover';
				lastHovered = active;
			}

			window.onkeydown = (e) => {
				if (!expanded) {return;}

				e.preventDefault();
				// only listen to up and down arrows, as well as enter
				if (e.key == 'ArrowDown') {
					optionNo = (optionNo + 1) % options.length;
					hoverOnOption();
				}
				else if (e.key == 'ArrowUp') {
					optionNo = (optionNo - 1) % options.length;
					hoverOnOption();
				}
				else if (e.key == 'Enter') {
					getActiveOption().click();
				}
			};
		}

		for (let select of selects) {
			doSelect(select);
		}
	}

	run();
})();