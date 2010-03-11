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

/*
//  ---------------------------------------------------------------
//  GLOBALS
//  ---------------------------------------------------------------
*/

//  AmpacheMobile namespace
AmpacheMobile = {};
AmpacheMobile.versionString = "0.01";
AmpacheMobile.Account = null;
AmpacheMobile.ampacheServer = null;
AmpacheMobile.appController = null;
AmpacheMobile.settingsManager = null;
AmpacheMobile.loadingPreferences = false;
AmpacheMobile.AclErrorHelp = "You are so close! You likely need to configure an ACL rule to allow Remote Program Control (RPC).  You can do this thru the Ampache web interface";
AmpacheMobile.EmptyResponseErrorHelp = "Phone not connecting to Ampache." + "<br>" + "<ul>" + "<li>Can you connect to Ampache with a PC?</li>" + "<li>Server URL (Must include http://)</li>" + "<li>Firewall Port Forwarding</li>" + "<li>DNS or IP Address (192.168.x.x will not work on EVDO)</li>" + "<li>Does your ISP  block port 80?</li>" + "</ul>";

function StageAssistant(stageController) {
    //AmpacheMobile.stageController = stageController;
    //AmpacheMobile.audioPlayer = new AudioPlayer(stageController);
    //AmpacheMobile.mediaEventsService = new MediaEventsService();
}

StageAssistant.appMenuAttr = {
    omitDefaultItems: true
};
StageAssistant.appMenuModel = {
    visible: true,
    items: [
    //{label: "Test Connection", command: "doTest-cmd"},
    {
        label: "Preferences...",
        command: "doPref-cmd"
    },
    {
        label: "Delete Now Playing",
        disabled: true,
        command: "delete-np-cmd"
    },
    {
        label: "About...",
        command: "about-cmd"
    }]
};

StageAssistant.prototype.setup = function() {
    Mojo.Log.info("--> StageAssistant.prototype.setup");
    this.controller.pushScene({
        transition: AmpacheMobile.Transition,
        name: "connection"
    });
};

GotoPreferences = function() {
    AmpacheMobile.loadingPreferences = true;
    var controller = Mojo.Controller.getAppController().getFocusedStageController();
    var scenes = controller.getScenes();
            
    for (var i = (scenes.length - 1); i !== 0; i--) {
        controller.popScene(scenes[i]);
    }
    var params = {
        settingsManager: AmpacheMobile.settingsManager
    };
    
    controller.pushScene({
        transition: AmpacheMobile.Transition,
        name: "preferences"
        },
        params);
};

StageAssistant.prototype.confirmGotoPrefs = function(value) {
    if (value === "stopMusic") {
        GotoPreferences();
    }
};



StageAssistant.prototype.handleCommand = function(event) {
    Mojo.Log.info("<-- StageAssistant.prototype.handleCommand");
    Mojo.Log.info("*** StageAssistant.prototype.handleCommand", event.type);
    var currentScene = this.controller.activeScene();
    if (event.type === Mojo.Event.command) {
        switch (event.command) {
        case "doPref-cmd":
            
            if (AmpacheMobile.audioPlayer.PlayListPending === true) {
                event.preventDefault();
                event.stopPropagation();
                
                var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
                
                controller.showAlertDialog({
                    onChoose: this.confirmGotoPrefs,
                    title: $L("Are you sure?"),
                    message: "Going to preferences will close your current now playing list and stop your music.",
                    choices: [{
                        label: $L('Cancel'),
                        value: 'ok',
                        type: 'primary'
                    },
                    {
                        label: $L('Delete Now Playing'),
                        value: 'stopMusic',
                        type: 'negative'
                    }]
                });
            }
            else
            {
                GotoPreferences();
            }
            break;
        case 'mojo-back':
        case "about-cmd":
            currentScene.showAlertDialog({
                onChoose:
                function(value) {},
                title: "Ampache Mobile - v" + Mojo.Controller.appInfo.version,
                message: "Copyright 2009-2010, Bryce Geiser",
                choices: [{
                    label: "OK",
                    value: ""
                }]
            });
            break;
        case "delete-np-cmd":
            if (AmpacheMobile.audioPlayer.PlayListPending === true) {
                AmpacheMobile.audioPlayer.stop();
                AmpacheMobile.audioPlayer.PlayListPending = false;
                var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
                var button = controller.get('now-playing-button');
                button.style.display = 'none';
                StageAssistant.appMenuModel.items[1].disabled = true;

            }
            break;
        }
    }
    else if(event.type === Mojo.Event.forward)
    {
        if(AmpacheMobile.audioPlayer.PlayListPending === true)
        {
            Mojo.Controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "now-playing"
            },
            {
                type: "display"
            });
        }
    }
    Mojo.Log.info("--> StageAssistant.prototype.handleCommand");
};


function CenterSpinner(spinner) {
    spinner.style.left = (window.innerWidth / 2 - 64) + "px";
    spinner.style.top = (window.innerHeight / 2 - 64) + "px";
}