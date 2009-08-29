
//  ---------------------------------------------------------------
//    GLOBALS
//  ---------------------------------------------------------------

//  AmpacheMobile namespace
AmpacheMobile = {};

AmpacheMobile.versionString = "0.01";

AmpacheMobile.Account = null;

AmpacheMobile.ampacheServer = null;
AmpacheMobile.appController = null;

AmpacheMobile.settingsManager=null;

AmpacheMobile.loadingPreferences = false;



AmpacheMobile.AclErrorHelp = "You are so close! You likely need to configure an ACL rule to allow Remote Program Control (RPC).  "
			+ "You can do this thru the Ampache web interface"
		
AmpacheMobile.EmptyResponseErrorHelp ="Phone not connecting to Ampache." +
			"<br>"+
			"<ul>"+
			"<li>Can you connect to Ampache with a PC?</li>"+
			"<li>Server URL (Must include http://)</li>"+
			"<li>Firewall Port Forwarding</li>"+
			"<li>DNS or IP Address (192.168.x.x will not work on EVDO)</li>" +
			"<li>Does your ISP  block port 80?</li>" +
			"</ul>";
		





function StageAssistant(stageController) {
	
	//AmpacheMobile.stageController = stageController;
	//AmpacheMobile.audioPlayer = new AudioPlayer(stageController);
	
}

StageAssistant.appMenuAttr = {omitDefaultItems: true};
StageAssistant.appMenuModel = {
	visible: true,
	items: [
		//{label: "Test Connection", command: "doTest-cmd"},
		{label: "Preferences...",  command: "doPref-cmd" },
		{label: "About...", command: "about-cmd"}
	]
};










StageAssistant.prototype.setup = function() {
	Mojo.Log.info("--> StageAssistant.prototype.setup")
	
	

	this.controller.pushScene("connection");
	
};




StageAssistant.prototype.handleCommand = function(event){
	Mojo.Log.info("<-- StageAssistant.prototype.handleCommand")
	
	Mojo.Log.info("*** StageAssistant.prototype.handleCommand", event.type)
	
	
	
	var currentScene = this.controller.activeScene();
	if (event.type === Mojo.Event.command) {
		switch (event.command) {
			case "doPref-cmd":
				
				AmpacheMobile.loadingPreferences = true;
				
				var scenes = this.controller.getScenes();
				for (var i = 0; i < scenes.length-1; i++) {
					this.controller.popScene(scenes[i]);
				}
				;				var params = {
				
					settingsManager: AmpacheMobile.settingsManager,
				}
				this.controller.pushScene("preferences", params);
				break;
				
			//case "doTest-cmd":
			//	Mojo.Log.info("Test Connection");
			//	this.TestConnection();
			//	break;
			
			case 'mojo-back':
				
				
			case "about-cmd":
				currentScene.showAlertDialog({
					onChoose: function(value){
					},
					title: "Ampache Mobile - v" + Mojo.Controller.appInfo.version,
					message: "Copyright 2009, Bryce Geiser",
					choices: [{
						label: "OK",
						value: ""
					}]
				});
				break;
				
		}
	}
	


	
	
	Mojo.Log.info("--> StageAssistant.prototype.handleCommand")
	
}




