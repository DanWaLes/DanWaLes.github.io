/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(() => {
	try {
		// required internal
		// async/await because validation does everything at once, so need to wait for completion of that before moving on
		const storage = {
			name: "dans_userscripts",
			_storage: undefined,// only changes when necessary (on storage change), is faster
			usedBy: [],

			setupUserscriptStorage: function(name, validateStorage, importLegacy) {
				this.usedBy.push(name);

				this[name] = {
					validate: async (stored) => {
						// this is storage
						return await validateStorage(await this.validate(stored));
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
					this[name].importLegacy = importLegacy;
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
						await this.validateCorrectingErrors(name);
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
					const ret = JSON.parse(localStorage[this.name]);

					this._storage = ret;
					return ret;
				};

				try {
					const stored = JSON.parse(localStorage[this.name]);

					localStorage[this.name] = JSON.stringify(userscriptName ? await this[userscriptName].validate(stored) : await this.validate(stored));
					return done();
				}
				catch(err) {
					// whole of storage is bad if it can't be parsed
					this.clear();

					const validated = await this[userscriptName].validate({});
					localStorage[this.name] = JSON.stringify(validated);
					return done();
				}
			},
			clear: function() {
				this._storage = undefined;

				localStorage.removeItem(this.name);
			},
			updateUserscript: async function(name, stored) {
				if (!this._storage) {
					this._storage = await this.validateCorrectingErrors(name);
				}

				this._storage[name] = stored;
				localStorage[this.name] = JSON.stringify(this._storage);			
			},
			import: async function(imported) {
				if (typeof imported != "string") {
					throw "storage.import requires imported to be a string";
				}

				try {
					imported = await this.validate(JSON.parse(imported), true);

					if (!imported[this.name]) {
						throw "Cannot import as the import data is bad";
					}
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
				return `{${this.name}:${JSON.stringify(this._storage)}}`;
			}
		};

		async function notifyUsersOfChanges(THIS_USERSCRIPT) {
			if (await storage[THIS_USERSCRIPT.NAME].getItem("UPDATE_NO") < THIS_USERSCRIPT.UPDATE_NO) {
				const capitalisedName = cammelCaseToTitle(THIS_USERSCRIPT.NAME);

				alert(`${capitalisedName} has been updated to version ${THIS_USERSCRIPT.VERSION}. Changes:\n${THIS_USERSCRIPT.VERSION_CHANGES}`);

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
				id: this.name + "Btn",
				get: function() {
					return document.getElementById(this.id);
				},
				create: function() {
					if (this.get()) {
						return;
					}

					const btn = document.createElement("a");

					btn.id = this.id;
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

						this.makeLegacyImportSettings.Onclick(THIS_USERSCRIPT);

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
					<div style="margin: 5px;">
						<h1 style="display: inline">Dan's Userscripts</h1>
						<input id="closeBtn" title="Close settings" type="button" value="X" style="float: right;">
					</div>
					<a href="https://www.warzone.com/Discussion/SendMail?PlayerID=222685" style="margin: 5px;">Report bug/request feature</a>
					<div>
						<input id="import" type="button" value="Import settings">
						<div id="importArea" style="display: none;">
							<input type="button" value="Ok">
							<p id="output"></p>
							<textarea></textarea>
						</div>
						<input id="export" type="button" value="Export settings">
						<div id="exportArea" style="display: none;">
							<textarea></textarea>
						</div>
					</div>
					<div id="list" style="max-width: 2000px">`;

					for (let key in dansUserscripts.list) {
						const content = dansUserscripts.list[key];
						const capitalisedName = key[0].toUpperCase() + key.substring(1, key.length).replace(/_(\w)/g, function(match, p1) {
							return " " + p1.toUpperCase();
						});

						menuContent += `
						<div id="${key}" style="float: left; max-width: 490px; margin: 5px;">
							<h2>${capitalisedName}</h2>
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
					const exportOutput = importArea.querySelector("#output");

					menu.querySelector("#import").onclick = function() {
						exportArea.style.display = "none";
						importArea.style.display = "block";
					};

					importArea.querySelector("input").onclick = function() {
						importOutput.className = "";
						importOutput.innerHTML = "";

						storage.import(importArea.querySelector("textarea").value)
							.then(() => {
								importOutput.innerHTML = "Done";
							}, (err) => {
								importOutput.className = "errors";
								importOutput.innerHTML = err;
							});
					};

					menu.querySelector("#export").onclick = function() {
						exportOutput.innerHTML = storage.export();

						importArea.style.display = "none";
						exportArea.style.display = "block";
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

			/*
			markAsSubList(mainList, mainTaskId) {
				// add bottom to top to get expected results
				// mainTaskId is the parent task - this would be the sub parts
				for (let id in this.tasks) {
					id = parseInt(id);

					this.tasks[id].isSubListOf = mainList.tasks[mainTaskId];
				}

				mainList.tasks[mainTaskId].hasSubList = this;
				const that = this;
				// const oldRun = mainList.run.bind(mainList);// prevents infinite loop, bind means use provided as this keyword, this would otherwise be undefined

				mainList.run = async () => {
					// oldRun();
					return that.run();
				};

				mainList.run2 = async () => {
					return await mainList.run().then(() => {
						return that.returnValues;
					});
				};
			}*/

			setOnTaskCompletion(onTaskCompletion) {
				this.onTaskCompletion = onTaskCompletion;
			}

			async run() {
				const that = this;
				function runTask(task) {
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

		/*
		class TaskListFactory {
			constructor() {
				this.numTaskLists = 0;
				this.taskLists = [];
			}

			create(list, onAllDone) {
				const taskList = new TaskList(list, onAllDone);
				taskList.id = this.numTaskLists++;

				this.taskLists.push(taskList);
			}

			markSublist(mainListId, mainListTaskId, subListId) {
				const mainList = this.taskLists[mainListId];
				const mainTask = mainList.tasks[mainListTaskId];
				const subTaskList = this.taskLists[subListId];

				subTaskList.isSubListOf = mainTask;
				mainTask.hasSubList = subTaskList;
			}

			addUI(taskListId) {
				function initialize() {
					let html = "";

					function makeMarker(rounds) {
						let marker = "";

						for (let i = 0; i < rounds; i++) {
							marker += "-";
						}

						marker += "> ";

						return marker;
					}

					function main(taskList, rounds) {
						html += `<div id="taskList_${taskList.id}">`;

						for (let task of taskList.tasks) {
							html += `<div id="task_${task.id}">
				<span class="marker">${makeMarker(rounds)}</span><span class="taskName">${cammelCaseToTitle(task.task.name)}</span>
				<span class="taskProgress"><span class="currentProgress">`;

							if (task.hasSubList) {
								html += `0</span>/${task.hasSubList.numTasks}</span>`;
								main(task.hasSubList, rounds + 1);
							}
							else {
								html += `Not started</span></span>`;
							}

							html += `</div>`;
						}

						html += `</div>`;
					}

					main(this.taskLists[taskListId], 0);

					const listContainer = document.createElement("div");

					listContainer.innerHTML = html;
					document.body.appendChild(listContainer);
				}

				function bindTaskComplete() {
					
				}

				initialize();
				bindTaskComplete();
			}
		}

		class TaskListWithUI {
			// shows progress
			constructor() {
				// this.taskLists = [];
				this.id = 0;
			}

			create(taskList, options) {
				// @param taskList the overall taskList, with any subLists included (only 1st supported)

				// this.taskLists.push({id: id, taskList: taskList, options: options});

				taskList.id = this.id;

				const listMenu = document.createElement("div");
				document.body.appendChild(listMenu);
				listMenu.outerHTML = this.generateHtml(taskList, options);

				// this.bindTaskComplete(taskList);
				this.id++;
			}

			generateHtml(taskList, options) {
				let html = `<div id="taskList_${taskList.id}">\n`;

				function indent(indentNo) {
					let tabs = "";

					for (let i = 0; i < indentNo; i++) {
						tabs += "\t";
					}

					return tabs;
				}

				function makeMarker(rounds) {
					let marker = "";

					for (let i = 0; i < rounds; i++) {
						marker += "-";
					}

					marker += "> ";

					return marker;
				}

				function main(currentTaskList, indentNo, roundNo) {
					const indentLevel = indent(indentNo);
					const marker = makeMarker(roundNo);

					for (let taskName in currentTaskList.tasks) {
						const task = currentTaskList.tasks[taskName];

						html += `\t${indentLevel}<div id="${task.name}">
			${indentLevel}<span class="marker">${marker}</span><span class="taskName">${cammelCaseToTitle(task.name)}</span>
			${indentLevel}<span class="taskProgress"><span class="currentProgress">`;

						if (task.hasSubList) {
							html += `0</span>/${task.hasSubList.numTasks}</span>
			${indentLevel}<div class="subList">\n`;

							main(task.hasSubList, indentNo + 2, roundNo + 1);// start is 1, then add 1
							html += `\t\t`;
						}
						else {
							html += `Not started</span></span>\n\t`;
						}

						html += `${indentLevel}</div>\n`;
					}
				}

				main(taskList, 0, 0);

				html += `</div>`;
				return html;
			}

			bindTaskComplete(taskList) {
				function taskComplete(name, theTask) {
					const html = document.getElementById(`taskList_${taskList.id}`);
					const taskArea = html.querySelector(`${getPath(theTask)}`);
				}
				function getPath(theTask) {
					let path = `#${theTask.name}`;

					while (theTask.isSubListOf) {
						path += `#${theTask.isSubListOf.name} .subList ${path}`;
						theTask = theTask.isSubListOf;
					}

					return path;
				}

				function main(currentTaskList) {
					for (let taskName in currentTaskList.tasks) {
						currentTaskList.setOnTaskCompletion(taskComplete);
					}
				}
				
			}
		}
		*/

		// public - exported to window
		async function createDansUserscriptsCommon(THIS_USERSCRIPT, validateStorage, importLegacy, createMenuOptions) {
			if (!THIS_USERSCRIPT || typeof THIS_USERSCRIPT != "object" || !isAsyncFunc(validateStorage)) {
				return;
			}

			storage.setupUserscriptStorage(THIS_USERSCRIPT.NAME, validateStorage, importLegacy);

			await storage.validateCorrectingErrors(THIS_USERSCRIPT.NAME).then(() => {
				notifyUsersOfChanges(THIS_USERSCRIPT).then(() => {
					dansUserscripts.createEverything(THIS_USERSCRIPT, createMenuOptions);	
				}, (err) => {
					console.exception(err);
				});
			});

			const shared = [storage, cammelCaseToTitle, escapeRegExp, PlayerNumber, getPlayerId, deepFreeze, TaskList];
			const ret = {};

			for (let i = shared.length - 1; i > -1; i--) {
				const func = shared.pop();

				ret[func.name] = func;
			}

			return ret;
		}

		window.createDansUserscriptsCommon = createDansUserscriptsCommon;
	}
	catch(err) {
		if (err instanceof Error) {
			console.exception(`${err.name} ${err.message}\n${err.stack}`);
		}
		else {
			console.exception(err);
		}
	}
})();