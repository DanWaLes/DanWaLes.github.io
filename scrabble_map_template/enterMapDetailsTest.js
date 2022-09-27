(() => {
	const mapId = 35977;
	const mapDetailsForAPI = `{"territories":{"0":{"id":0,"name":"V","x":118.5,"y":137},"1":{"id":1,"name":"I 1","x":118.5,"y":215},"2":{"id":2,"name":"L 1","x":118.5,"y":293},"3":{"id":3,"name":"L 2","x":118.5,"y":371},"4":{"id":4,"name":"A 1","x":118.5,"y":449},"5":{"id":5,"name":"I 2","x":118.5,"y":527},"6":{"id":6,"name":"N 1","x":118.5,"y":605},"18":{"id":18,"name":"I 3","x":196.5,"y":371},"21":{"id":21,"name":"O 1","x":196.5,"y":605},"31":{"id":31,"name":"J","x":274.5,"y":215},"32":{"id":32,"name":"O 2","x":274.5,"y":293},"33":{"id":33,"name":"B","x":274.5,"y":371},"36":{"id":36,"name":"U","x":274.5,"y":605},"46":{"id":46,"name":"A 2","x":352.5,"y":215},"51":{"id":51,"name":"N 2","x":352.5,"y":605},"61":{"id":61,"name":"Y","x":430.5,"y":215}},"bonuses":[{"name":"Jay","color":"#000000","territories":[31,46,61],"value":2},{"name":"Lib","color":"#660000","territories":[3,18,33],"value":2},{"name":"Noun","color":"#CC0000","territories":[6,21,36,51],"value":2},{"name":"Villain","color":"#006600","territories":[0,1,2,3,4,5,6],"value":5},{"name":"Job","color":"#666600","territories":[31,32,33],"value":2},{"name":"Double letter","color":"#00ffff","territories":[3,36],"value":2},{"name":"Triple letter","color":"#0000ff","territories":[],"value":0},{"name":"Double word","color":"#ff6600","territories":[32],"value":1},{"name":"Triple word","color":"#ff0000","territories":[0],"value":1}]}`;

	window.enterMapDetails.setMapDetailsJSONString(mapDetailsForAPI);
	window.enterMapDetails.setMapId(mapId);
	window.enterMapDetails.run();
})();