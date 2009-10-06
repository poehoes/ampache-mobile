/*
    Copyright (c) Ampache Mobile
    All rights reserved.

    This file is part of Ampache Mobile.

    Ampache Mobile is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Ampache Mobile is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Ampache Mobile.  If not, see <http://www.gnu.org/licenses/>.
*/


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
	AmpacheMobile.mediaEventsService = new MediaEventsService();
	
	
	
	
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
				
					settingsManager: AmpacheMobile.settingsManager
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

function CenterSpinner(spinner)
{
	spinner.style.left = (window.innerWidth/2-64) + "px";
    spinner.style.top = (window.innerHeight/2-64) + "px";
}



