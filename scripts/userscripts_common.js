/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(() => {
	// required internal
	// async/await because validation does everything at once, so need to wait for completion of that before moving on
	const storage = {
		name: "storage",
		storageName: "dans_userscripts",
		_storage: undefined,// only changes when necessary (on storage change), is faster
		usedBy: [],

		setupUserscriptStorage: function(name, validateStorage, importLegacy) {
			this.usedBy.push(name);

			this[name] = {
				validate: async (stored) => {
					// this is storage
					stored = await this.validate(stored);

					if (typeof stored[name] != "object" || !stored[name]) {
						stored[name] = {};
					}

					return await validateStorage(stored);
				},
				get: async () => {
					if (!this._storage || !this._storage[name]) {
						this._storage = await this.validateCorrectingErrors(name);
					}

					return this._storage[name];
				},
				getItem: async (key) => {
					const stored = await this[name].get();

					return stored[key];
				},
				setItem: async (key, value) => {
					const stored = await this[name].get();

					stored[key] = value;

					await this.updateUserscript(name, stored);
				},
				reset: async () => {
					await this.updateUserscript(name, null);// has to be falsey to force a check and give minimal storage data for the userscript to function
				}
			};

			if (isAsyncFunc(importLegacy)) {
				this[name].importLegacy = async (toImport) => {
					await this.updateUserscript(name, await importLegacy(toImport));
				};
			}
		},
		validate: async function(stored, forceValidateEverything) {
			// only do top-level validate
			if (typeof stored != "object" || !stored) {
				throw "storage.validate requires storage input to validate where storage is a truthy object";
			}

			for (let key in stored) {
				if (!(key in dansUserscripts.list)) {
					delete stored[key];
				}
			}

			if (forceValidateEverything) {
				for (let name of this.usedBy) {
					stored = await this[name].validate(stored);
				}
			}

			this._storage = stored;

			return this._storage;
		},
		validateCorrectingErrors: async function(userscriptName) {
			// storage could be tampered with/cleared manually, so validate first
			// if bad or no storage, reset

			const done = () => {
				// finally called before catch ends, so using an equivalent
				// has to be => because plain function uses window
				const ret = JSON.parse(localStorage[this.storageName]);

				this._storage = ret;
				return ret;
			};

			try {
				const stored = JSON.parse(localStorage[this.storageName]);

				localStorage[this.storageName] = JSON.stringify(userscriptName ? await this[userscriptName].validate(stored) : await this.validate(stored));
				return done();
			}
			catch(err) {
				// whole of storage is bad if it can't be parsed
				this.clear();

				const validated = await this[userscriptName].validate({});
				localStorage[this.storageName] = JSON.stringify(validated);
				return done();
			}
		},
		clear: function() {
			this._storage = undefined;

			localStorage.removeItem(this.storageName);
		},
		updateUserscript: async function(name, stored) {
			if (!this._storage) {
				this._storage = await this.validateCorrectingErrors(name);
			}

			this._storage[name] = stored;
			localStorage[this.storageName] = JSON.stringify(this._storage);			
		},
		import: async function(imported) {
			if (typeof imported != "string") {
				throw "storage.import requires imported to be a string";
			}

			try {
				imported = JSON.parse(imported);

				if (!imported[this.storageName]) {
					throw "Cannot import as the import data is bad";
				}

				localStorage[this.storageName] = JSON.stringify(await this.validate(imported[this.storageName], true));
			}
			catch(err) {
				if (err instanceof SyntaxError) {
					throw "Cannot import because of imported data being damaged beyond auto-repair";
				}
				else {
					throw err;
				}
			}
		},
		export: function() {
			const exported = {};
			exported[this.storageName] = this._storage;

			return JSON.stringify(exported);
		}
	};

	async function notifyUsersOfChanges(THIS_USERSCRIPT) {
		const storedUpdateNo = await storage[THIS_USERSCRIPT.NAME].getItem("UPDATE_NO");

		if (storedUpdateNo < THIS_USERSCRIPT.UPDATE_NO) {
			const script = cammelCaseToTitle(THIS_USERSCRIPT.NAME);

			Alert(`
				<h2>${script} update</h2>
				<p>This userscript has been updated to version ${THIS_USERSCRIPT.VERSION}!</p>
				<p>Menu / settings are located under [Your name] > Dan's Userscripts > ${script}.</p>
				<p>Changes:</p>
				<ul>${THIS_USERSCRIPT.VERSION_CHANGES}</ul>`);

			await storage[THIS_USERSCRIPT.NAME].setItem("UPDATE_NO", THIS_USERSCRIPT.UPDATE_NO);
		}
	}

	const dansUserscripts = {
		name: "dansUserscripts",
		list: {
			get_clan_member_idle_time: {
				description: "Allows you to see how active clans are (last seen, points and boot)",
				link: "https://greasyfork.org/en/scripts/40522-get-clan-member-idle-time"
			},
			hide_threads_and_replies_by_poster: {
				description: "Allows you to hide threads and posts by certain players as well as having the ability to hide threads by phases in the thread subject",
				link: "https://greasyfork.org/en/scripts/29925-hide-threads-and-replies-by-poster"
			},
			"UJS-Flash": {
				description: "Attempts to restore Flash features to UJS",
				link: "https://greasyfork.org/en/scripts/376515-warzone-ujs-flash"
			},
			clan_forum_downloader: {
				description: "Allows you to download your clan's forum",
				link: "https://greasyfork.org/en/scripts/46824-clan-forum-downloader"
			},
			community_levels_creator_helper: {
				description: "Makes it easier to create community levels",
				link: "https://greasyfork.org/en/scripts/370158-community-levels-creator-helper"
			},
			troll_hammer: {
				description: "Makes it easier to mass friend and mass block list players, as well as making it easier to share your friends list and your block list",
				link: "https://greasyfork.org/en/scripts/33699-troll-hammer"
			},
			vacations: {
				description: "Automatically makes your leave all of the built in ladders to begin a vacation as well as having the ability to override the vacation symbol",
				link: "https://greasyfork.org/en/scripts/374414-vacations"
			}
		},
		btn: {
			getId: function() {
				return dansUserscripts.name + "Btn";
			},
			get: function() {
				return document.getElementById(this.getId());
			},
			create: function() {
				if (this.get()) {
					return;
				}

				const btn = document.createElement("a");

				btn.id = this.getId();
				btn.className = "dropdown-item";
				btn.href = "#";
				btn.innerText = "Dan's Userscripts";
				btn.onclick = function() {
					dansUserscripts.menu.view();
				};

				document.getElementById("AccountDropDown").nextElementSibling.getElementsByClassName("dropdown-divider")[0].insertAdjacentElement("beforebegin", btn);
			}
		},
		menu: {
			getId: function() {
				// no super and can't access variable that hasn't quite been initialized
				return dansUserscripts.name + "MainMenu";
			},
			get: function() {
				return document.getElementById(this.getId());
			},
			thisUserscript: {
				createMenu: function(THIS_USERSCRIPT, options) {
					/*
					@param options
					{
						useCollapsible: boolean to include a collase button surrounding whole content
						mainContent: string the actual menu for this userscript
						setupMainContentEvents: function for function binding on mainContent
					}
					*/
					const menu = dansUserscripts.menu.get();
					const usList = menu.querySelector("#list");
					const thisArea = usList.querySelector(`#${THIS_USERSCRIPT.NAME}`);
					const install = thisArea.querySelector(".install");

					install.innerHTML += `&nbsp;|&nbsp;<strong>Installed</strong> (v ${THIS_USERSCRIPT.VERSION})`;

					const content = thisArea.querySelector(".content");
					const mainContent = this.makeLegacyImportSettings.HTML(THIS_USERSCRIPT) + `<div>${options.mainContent}</div>`;

					if (options.useCollapsible) {
						this.useCollapsibleMenu(content, mainContent);
					}
					else {
						content.innerHTML = mainContent;
					}

					this.makeLegacyImportSettings.Onclick(THIS_USERSCRIPT, content);

					if (typeof options.setupMainContentEvents == "function") {
						options.setupMainContentEvents(content);
					}
				},
				useCollapsibleMenu: function(content, mainContent) {
					const name = "menu";

					const expandHideSettingsBtn = {
						id: "hideExpand",
						text: "Show " + name,
						get: function() {
							return content.querySelector(`#${this.id}`);
						},
						changeState: function(isShown) {
							const settingsElement = settings.get();
							let display;
							let text;

							if (isShown) {
								display = "block";
								text = "Hide " + name;
							}
							else {
								display = "none";
								text = "Show " + name;
							}

							this.get().value = text;
							settingsElement.style.display = display;
							settings.isBeingShown = !!isShown;

						},
						showHide: function() {
							this.changeState(!settings.isBeingShown);
						}
					};

					const settings = {
						id: "settings",
						get: function() {
							return content.querySelector(`#${this.id}`);
						},
						isBeingShown: false
					};

					content.innerHTML += `<input id="${expandHideSettingsBtn.id}" type="button">
					<div id="${settings.id}">${mainContent}</div>`;

					expandHideSettingsBtn.changeState(false);// to set initial
					expandHideSettingsBtn.get().onclick = function() {
						expandHideSettingsBtn.showHide();
					};
				},
				makeLegacyImportSettings: {
					HTML: function(THIS_USERSCRIPT) {
						if (!storage[THIS_USERSCRIPT.NAME].importLegacy) {
							return "";
						}

						return `<div id="importContainer">
							<input type="button" value="Import pre-2020 settings">
							<div id="importArea" style="display: none;">
								<input type="button" value="Ok">
								<p id="output"></p>
								<textarea></textarea>
							</div>
						</div>\n`;
					},
					Onclick: function(THIS_USERSCRIPT, content) {
						if (!storage[THIS_USERSCRIPT.NAME].importLegacy) {
							return;
						}

						const importContainer = content.querySelector("#importContainer");
						const importArea = importContainer.querySelector("#importArea");
						const importOutput = importArea.querySelector("#output");

						importContainer.querySelector("input").onclick = function() {
							importArea.style.display = "block";
						};

						importArea.querySelector("input").onclick = function() {
							importOutput.className = "";
							importOutput.innerHTML = "";

							storage[THIS_USERSCRIPT.NAME].importLegacy(importArea.querySelector("textarea").value)
								.then(() => {
									importOutput.innerHTML = "Done";
								}, (err) => {
									importOutput.className = "errors";
									importOutput.innerHTML = err.message;
								});
						};
					}
				}
			},
			create: function() {
				if (this.get()) {
					return;
				}

				const style = document.createElement("style");

				style.innerHTML = `/* generic */
				.unmoveable {
					position: fixed;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					width: 100%;
					display: none;
					overflow: auto;
					z-index: 10000;
				}

				.errors {
					color: red;
				}

				/* for threads and replies */
				[data-blocked] {
					display: none;
				}
				`;

				document.head.appendChild(style);

				const menu = document.createElement("div");

				menu.id = this.getId();
				menu.className = "unmoveable BackgroundImage";

				let menuContent = `
				<div style="margin: 5px; text-align: center;">
					<div>
						<h1 style="display: inline">Dan's Userscripts</h1>
						<input id="closeBtn" title="Close settings" type="button" value="X" style="float: right;">
					</div>
					<p>Report bug/request feature - Discord DanWL#2759</p>
					<div>
						<input id="import" type="button" value="Import settings">
						<input id="export" type="button" value="Export settings">
						<input id="reset" type="button" value="Reset settings">
						<div id="importArea" style="display: none;">
							<input type="button" value="Ok">
							<p id="output"></p>
							<input type="text">
						</div>
						<div id="exportArea" style="display: none;">
							<textarea readonly="readonly"></textarea>
							&nbsp;<input type="button" value="Done">
						</div>
					</div>
				</div>
				<div id="list" style="max-width: 2000px;">`;

				for (let key in dansUserscripts.list) {
					const content = dansUserscripts.list[key];

					menuContent += `
					<div id="${key}" style="float: left; max-width: 30%; margin: 5px;">
						<h2>${cammelCaseToTitle(key)}</h2>
						<p>${content.description}</p>
						<p class="install"><a href="${content.link}">View install page</a></p>
						<div class="content"></div>
					</div>`;
				}

				menuContent += "</div>";
				menu.innerHTML = menuContent;

				document.body.appendChild(menu);

				menu.querySelector("#closeBtn").onclick = function() {
					// inline function to not change definition of this in exit to be of the event/window
					dansUserscripts.menu.exit();
				};

				const importArea = menu.querySelector("#importArea");
				const importOutput = importArea.querySelector("#output");
				const exportArea = menu.querySelector("#exportArea");
				const exportOutput = exportArea.querySelector('textarea');

				menu.querySelector("#import").onclick = function() {
					exportArea.style.display = "none";
					importArea.style.display = "block";
				};
				importArea.querySelector("input").onclick = function() {
					importOutput.className = "";
					importOutput.innerHTML = "";

					const settings = importArea.querySelector('input[type="text"]');

					storage.import(settings.value)
						.then(() => {
							importOutput.innerHTML = "Done, refreshing...";

							setTimeout(() => {
								importArea.style.display = "none";
								importOutput.innerHTML = "";
								settings.value = "";
								location.reload();// easy way to make sure correct data is used from storage
							}, 1000);
						}, (err) => {
							importOutput.className = "errors";
							importOutput.innerHTML = err;
						});
				};

				menu.querySelector("#export").onclick = function() {
					importArea.style.display = "none";
					exportOutput.value = storage.export();
					exportArea.style.display = "block";
				};
				exportArea.querySelector("input").onclick = function() {
					exportArea.style.display = "none";
				};

				menu.querySelector("#reset").onclick = function() {
					storage.clear();
					location.reload();
				};
			},
			view: function() {
				window.$(document.getElementById("MainNavBar")).hide();
				this.get().style.display = "block";
			},
			exit: function() {
				this.get().style.display = "none";
				window.window.$(document.getElementById("MainNavBar")).show();
			}
		},
		createEverything: function(THIS_USERSCRIPT, createMenuOptions) {
			try {
				this.btn.create();
				this.menu.create();
				this.menu.thisUserscript.createMenu(THIS_USERSCRIPT, createMenuOptions);
			}
			catch(err) {
				console.log("Can't create settings menu as the account dropdown doesn't exist");
			}
		}
	};

	// util
	function cammelCaseToTitle(str) {
		return str[0].toUpperCase() + str.substring(1, str.length).replace(/_(\w)/g, function(match, p1) {
			return " " + p1.toUpperCase();
		});
	}

	function Alert(message) {
		const overlay = document.createElement("div");
		const alertBox = document.createElement("div");

		overlay.style.position = "fixed";
		overlay.style.top = "0";
		overlay.style.right = "0";
		overlay.style.width = "100%";
		overlay.style.height = "100%";
		overlay.style.backgroundColor = "#fff";
		overlay.style.opacity = "0.5";

		alertBox.className = "BackgroundImage";
		alertBox.style.position = "fixed";
		alertBox.style.top = "50%";
		alertBox.style.right = "50%";
		alertBox.style.borderRadius = "1em";
		alertBox.style.padding = "0.5em";

		alertBox.innerHTML = `<input type="button" value="X" style="float: right;">${message}`;

		document.body.appendChild(overlay);
		document.body.appendChild(alertBox);

		alertBox.querySelector("input").onclick = () => {
			alertBox.remove();
			overlay.remove();
		};

		return alertBox;
	}

	function escapeRegExp(string) {
		return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	const PlayerNumber = {
		name: "PlayerNumber",
		get: (link) => {
			let number = link.match(/https?:\/\/(?:(?:www\.)?(?:warzone\.com)|(?:warlight\.net))\/Profile\?p=(\d+)/i);

			if (number) {
				number = number[1];
			}

			return parseInt(number);
		},
		toUrl: (num) => {
			return "https://www.warzone.com/Profile?p=" + num;
		}
	};
	deepFreeze(PlayerNumber);

	function getPlayerId(link) {
		const number = PlayerNumber.get(link);
		let id = "" + number;

		if (isNaN(number)) {
			return number;
		}

		id = id.substring(2, id.length);
		id = id.substring(0, id.length - 2);

		return parseInt(id);
	}

	function waitForElementsToExist(queryString, queryFrom) {
		// based on https://stackoverflow.com/questions/24928846/get-return-value-from-settimeout
		const main = new Promise((resolve, reject) => {
			const interval = setInterval(() => {
				const elements = queryFrom.querySelectorAll(queryString);

				if (elements.length) {
					clearInterval(interval);
					resolve(elements);
				}
			}, 1000);
		});

		return main;
	}
	function waitForElementToExist(queryString, queryFrom) {
		return waitForElementsToExist(queryString, queryFrom)
			.then((elements) => {
				return elements[0];
			});
	}

	function download(contents, filename, type) {
		const types = {
			"txt": "text/plain",
			"html": "text/html",
			"json": "application/json"
		};

		if (typeof contents != "string") {
			console.exception("contents must be a string");
			return;
		}
		if (typeof filename != "string") {
			console.exception("filename must be a string");
			return;
		}

		const mimeType = types[type];

		if (!mimeType) {
			console.exception(`file type ${type} is unsupported`);
			return;
		}

		const blob = new Blob([contents], {type: mimeType});
		const downloadLink = document.createElement('a');

		downloadLink.download = filename + '.' + type;
		downloadLink.href = window.URL.createObjectURL(blob);
		downloadLink.onclick = function(e) {
			setTimeout(function()
			{
				window.URL.revokeObjectURL(downloadLink.href);
			}, 1500);
		};

		document.body.appendChild(downloadLink);
		downloadLink.click();
		downloadLink.remove();
	}

	function deepFreeze(object) {
		// Retrieve the property names defined on object
		const propNames = Object.getOwnPropertyNames(object);

		// Freeze properties before freezing self

		for (let name of propNames) {
			let value = object[name];

			if (value && typeof value === "object") {
				deepFreeze(value);
			}
		}

		return Object.freeze(object);
	}

	function isAsyncFunc(func) {
		if (typeof func == "function") {
			return func.constructor.name == "AsyncFunction";
		}

		return false;
	}

	class TaskList {
		// everything starts at same time. when completed, run the callback
		// displays progress to user
		// to use taskList = new TaskList(tasks, onAllDone);
		// detect when done using await taskList.run();
		// use await taskList.run2() to use return values without specifying a callback function

		constructor(list, onAllDone) {
			/*
				@param list Array of AsyncFunction
				@param onAllDone AsyncFunction or not a Function
			*/
			this.tasks = [];
			this.numTasks = list.length;
			this.numCompleted = 0;
			this.allDone = onAllDone;
			this.returnValues = {tasks: [], callback: undefined};

			for (let id in list) {
				id = parseInt(id);
	
				this.tasks[id] = {
					id: id,
					task: list[id],
					list: this.tasks
				};
			}
		}

		setOnTaskStart(onTaskStart) {
			this.onTaskStart = onTaskStart;
		}
		setOnTaskCompletion(onTaskCompletion) {
			this.onTaskCompletion = onTaskCompletion;
		}

		async run() {
			const that = this;
			function runTask(task) {
				if (typeof that.onTaskStart == "function") {
					that.onTaskStart(task.id);
				}

				task.task().then((res) => {
					that.returnValues.tasks[task.id] = res;
					that.taskComplete(task.id);
				});
			}

			for (let task of that.tasks) {
				runTask(task);
			}
		}

		async run2() {
			const that = this;

			return await that.run().then(() => {
				return that.returnValues;
			});
		}

		async taskComplete(taskId) {
			this.numCompleted++;

			if (typeof this.onTaskCompletion == "function") {
				this.onTaskCompletion(taskId, this.tasks[taskId]);
			}

			if (this.numCompleted == this.numTasks) {
				if (typeof this.allDone == "function") {
					this.returnValues.callback = await this.allDone(this.returnValues.tasks);
				}
			}
		}
	}

	function TaskVisual(body) {
		this.body = body;
		this.hasNoBody = function() {
			return !(this.body instanceof HTMLElement);
		};
		this.setup = function(tsks) {
			if (this.hasNoBody()) {return;}

			for (let i = 0; i < tsks.length; i++) {
				const tsk = tsks[i];
				const line = document.createElement('div');

				line.id = tsk.name;
				line.innerHTML = `${cammelCaseToTitle(tsk.name)} <span class="progress">Not started</span>`;
				this.body.appendChild(line);
			}
		};
		this.find = function(toFind) {
			if (this.hasNoBody()) {return;}

			return this.body.querySelector(toFind);
		};
		this.setProgress = function(taskName, prog) {
			const item = this.find('#' + taskName + ' .progress');

			if (!item) {
				return;
			}

			item.innerHTML = prog;
		};
	}

	// public - exported to window
	async function createDansUserscriptsCommon(THIS_USERSCRIPT, validateStorage, importLegacy, createMenuOptions) {
		if (!THIS_USERSCRIPT || typeof THIS_USERSCRIPT != "object" || !isAsyncFunc(validateStorage)) {
			return;
		}

		if (localStorage.dans_userscript_user) {
			localStorage.removeItem("dans_userscript_user");
		}

		const shared = [storage, cammelCaseToTitle, Alert, escapeRegExp, PlayerNumber, getPlayerId, waitForElementsToExist, waitForElementToExist, download, deepFreeze, TaskList, TaskVisual];
		const ret = {};

		for (let i = shared.length - 1; i > -1; i--) {
			const func = shared.pop();

			ret[func.name] = func;
		}

		async function vs(is) {
			// can;t redefine using same name because of recursion
			return await validateStorage(is, ret);
		};

		storage.setupUserscriptStorage(THIS_USERSCRIPT.NAME, vs, importLegacy);

		await storage.validateCorrectingErrors(THIS_USERSCRIPT.NAME).then(() => {
			notifyUsersOfChanges(THIS_USERSCRIPT).then(() => {
				dansUserscripts.createEverything(THIS_USERSCRIPT, createMenuOptions);
			}, (err) => {
				console.exception(err);
			});
		});

		return ret;
	}

	window.createDansUserscriptsCommon = createDansUserscriptsCommon;
})();