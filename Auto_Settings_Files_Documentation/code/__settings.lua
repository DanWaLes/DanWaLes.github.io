require '_settings'
require '_ui'

function getSettings()
	return {
		addSetting('SettingOne', 'setting one desc', 'int', 5, {
			minValue = 1,
			maxValue = 10,
			help = function(parent)
				Label(parent).SetText('enter help here');
			end
		}),
		addSetting('SettingTwo', 'setting two', 'bool', false, {
			labelColor = '#aaccee',
			help = function(parent)
				Label(parent).SetText('this has some subsettings');
			end,
			subsettings = {
				addSetting('SettingTwoss1', 'setting two ss1 desc', 'float', 1.5, {dp = 2, minValue = 0, maxValue = 2, labelColor = '#ff2244'}),
				addSetting('SettingTwoss2', 'setting two ss2 desc', 'bool', true, {
					help = function(parent)
						Label(parent).SetText('if checked this happens');
					end
				})
			}
		}),
		addSettingTemplate('SettingTemplate', 'add new setting template group', nil, function(n)
			return {
				label = 'enable setting template group ' .. n,
				labelColor = '#aaccdd',
				settings = {
					addSetting('ss1', 'ss1', 'int', 5, {minValue = 5, maxValue = 10, labelColor = '#6688aa'}),
					addSetting('ss2', 'ss2', 'float', 5, {dp = 2, minValue = 5, maxValue = 10})
				}
			};
		end);
	};
end