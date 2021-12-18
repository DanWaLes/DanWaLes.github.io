(() => {
	function validateConfig(config) {
		if (!config) return;

		// lichess can check the api token, shouldnt allow it to be in plain sight in the query string of the page therefore posting it like that isnt a feature

		if (!Array.isArray(config.toCheck)) return stdout('config.toCheck is not an array', 'error');
		for (let i = 0; i < config.toCheck.length; i++) {
			if (typeof config.toCheck[i] != 'string') return stdout('config.toCheck>players must be strings', 'error');

			config.toCheck[i] = config.toCheck[i].trim();
		}

		config.since = new Date(config.since);
		config.to = new Date(config.to);

		if (config.since == 'Invalid Date') {
			stdout('config.since is invalid, using default', 'warn');

			config.since = new Date();
		}
		if (config.to == 'Invalid Date') {
			stdout('config.to is invalid, using default', 'warn');

			let d = new Date();
			d.setDate(d.getDate() + 1);

			config.to = d;
		}

		config.since = config.since.getTime();
		config.to = config.to.getTime();

		return config;
	}

	window.validate = (method) => {
		const methods = {
			params: function() {
				// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript#answer-901144
				const urlSearchParams = new URLSearchParams(window.location.search);
				const params = Object.fromEntries(urlSearchParams.entries());

				return validateConfig(JSON.parse(params.config));
			},
			form: function() {
				const htmlConfig = document.forms.config;
				const config = {
					apiToken: htmlConfig.apiToken.value,
					toCheck: htmlConfig.toCheck.value.split(/\n/g),
					since: htmlConfig.since.value,
					to: htmlConfig.since.value
				};

				return validateConfig(config);
			}
		};

		if (!Object.keys(methods).includes(method)) return;

		stdout();// clear log for new run

		const validated = methods[method]();

		// set players - params only
		if (method == 'params') {
			document.forms.config.toCheck.value = validated.toCheck.reduce((a, b) => a + '\n' + b);
		}

		// set the dates
		function toUSDate(date) {
			stdout('was ' + date)
			date = new Date(date);
			ret = date.toISOString().substring(0, 10);
			stdout('now ' + ret);
			return ret;
		}

		console.log(validated);
		stdout('changing since')
		document.forms.config.since.value = toUSDate(validated.since);
		stdout('changing to')
		document.forms.config.to.value = toUSDate(validated.to);

		return validated;
	};
})();