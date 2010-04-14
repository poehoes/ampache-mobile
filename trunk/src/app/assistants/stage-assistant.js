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


//AmpacheMobile.vibrate = function()
//{
//    //Mojo.Controller.getAppController().playSoundNotification("vibrate", "", 1);
//};



function StageAssistant(stageController) {
    //AmpacheMobile.stageController = stageController;
    //AmpacheMobile.audioPlayer = new AudioPlayer(stageController);
    //AmpacheMobile.mediaEventsService = new MediaEventsService();
}

StageAssistant.appMenuAttr = {
    omitDefaultItems: true
};

StageAssistant.aboutApp = {
        label: "About",
        command: "about-cmd"
    };

StageAssistant.helpMenu = {
        label: "Help",
        command: "help-cmd"
    };

StageAssistant.nowPlayingMenu = {
        label: "Now Playing",
        items: [{
            label: "Delete Now Playing",
            disabled: true,
            command: "delete-np-cmd",
            shortcut: "d"
        },
        {
            label: "Goto Now Playing",
            disabled: true,
            command: "push-np-cmd",
            shortcut: "n"
        },
        
        //{
        //    label: "Next Track",
        //    disabled: true,
        //    command: "push-np-next",
        //    shortcut: "."
        //},
        //{
        //    label: "Previous Track",
        //    disabled: true,
        //    command: "push-np-prev",
        //    shortcut: Mojo.Char.sym
        //},
        {
            label: "Play/Pause [Space]",
            disabled: true,
            command: "push-np-playPause",
            shortcut: " "
        }
        ],
        disabled: true
    };

StageAssistant.preferencesMenu = {
        label: "Preferences",
        command: "doPref-cmd",
        shortcut: "p"
    };




StageAssistant.appMenuModel = {
    visible: true,

    items: [
    //{label: "Test Connection", command: "doTest-cmd"},
    StageAssistant.preferencesMenu,
    StageAssistant.nowPlayingMenu,
    StageAssistant.helpMenu,
    StageAssistant.aboutApp
    ]
};

StageAssistant.prototype.onBlurHandler = function() {
    if (this.foregroundVolumeMarker) {
        this.foregroundVolumeMarker.cancel();
        this.foregroundVolumeMarker = null;
    }
    AmpacheMobile.focus = false;
};

StageAssistant.prototype.onFocusHandler = function() {
    try {
        if (!this.foregroundVolumeMarker) {

            var parameters = {};
            parameters.subscribe = true;
            parameters.foregroundApp = true;

            this.foregroundVolumeMarker = new Mojo.Service.Request("palm://com.palm.audio/media", {
                method: 'lockVolumeKeys',
                onSuccess: this.lockVolumeKeys,
                parameters: parameters
            });
        }
    } catch(ex) {}
    
    AmpacheMobile.focus = true;
};

StageAssistant.prototype.lockVolumeKeys = function(event) {

};

StageAssistant.prototype.setup = function() {
    Mojo.Log.info("--> StageAssistant.prototype.setup");
    this.controller.pushScene({
        transition: AmpacheMobile.Transition,
        name: "connection"
    });

    window.document.addEventListener(Mojo.Event.deactivate, this.onBlurHandler.bind(this));
    window.document.addEventListener(Mojo.Event.activate, this.onFocusHandler.bind(this));
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

            if (AmpacheMobile.audioPlayer.hasPlayList === true) {
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
            } else {
                GotoPreferences();
            }
            break;
        case 'help-cmd':
            Mojo.Controller.stageController.pushAppSupportInfoScene();
            break;
        case "about-cmd":


                
            serverinfo = "<div class='about'><BR><B>Server Info</B><div class='about-details'>";
            if ((AmpacheMobile.ampacheServer) && (AmpacheMobile.ampacheServer.Connected === true)) {
                serverinfo += "Version: <font class='about-details-data'>" + AmpacheMobile.ampacheServer.version + "</font>";
                serverinfo += "<BR>Link: <a class='about-details-data' href=" + AmpacheMobile.ampacheServer.URL + ">" + AmpacheMobile.Account.AccountName + "</a>";
                
                serverinfo += "<BR>Update:<font class='about-details-data'>" + Mojo.Format.formatDate(AmpacheMobile.ampacheServer.update, "medium") + "</font>";
                serverinfo += "<BR>Add:<font class='about-details-data'>" + Mojo.Format.formatDate(AmpacheMobile.ampacheServer.add, "medium") + "</font>";
                serverinfo += "<BR>Clean:<font class='about-details-data'>" + Mojo.Format.formatDate(AmpacheMobile.ampacheServer.clean, "medium") + "</font>";
            } else {
                serverinfo += "Not Connected";
            }
            serverinfo += "<br><br>webOS Build: " + Mojo.Environment.build;
            serverinfo += "<br><br><a href='https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=RZKZ3GCDQUWY8&lc=US&item_name=Ampache%20Mobile&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted'><img src='images/donate.gif' /></a>";
            
            serverinfo += "</div></div>";

            currentScene.showAlertDialog({
                onChoose: function(value) {},
                title: "Ampache Mobile - v" + Mojo.Controller.appInfo.version,
                message: "Copyright 2009-2010, Bryce Geiser <br><a style='font-size:small;' onclick='WhatsNew(\"Release Notes\");'>Release Notes</a>" + serverinfo,
                choices: [{
                    label: "OK",
                    value: ""
                }],
                allowHTMLMessage: true
            });
            break;
        case "push-np-prev":
             if (AmpacheMobile.audioPlayer.hasPlayList === true) {
                AmpacheMobile.audioPlayer.previous();
             }
             break;
        case "push-np-next":
            if (AmpacheMobile.audioPlayer.hasPlayList === true) {
                AmpacheMobile.audioPlayer.next();
             }
             break;
            
        case "push-np-playPause":
            
            
       if (AmpacheMobile.audioPlayer.hasPlayList === true) {
        if (!AmpacheMobile.audioPlayer.player.paused) {
            AmpacheMobile.audioPlayer.pause();
        } else {
            AmpacheMobile.audioPlayer.play();
        }
       }
    
            break;
        case "doDiscard-cmd":
            if(AmpacheMobile.Account!==null)
            {
                AmpacheMobile.settingsManager.discardSavedData(AmpacheMobile.Account);
            }
            break;
        
        
        case "delete-np-cmd":
            if (AmpacheMobile.audioPlayer.hasPlayList === true) {
                AmpacheMobile.audioPlayer.stop();
                AmpacheMobile.audioPlayer.hasPlayList = false;
                var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
                var button = controller.get('now-playing-button');
                button.style.display = 'none';
                
                for(var j=0;j<StageAssistant.nowPlayingMenu.items.length;j++)
                {
                    StageAssistant.nowPlayingMenu.items[j].disabled = true;
                }
            }
            break;
        case "mojo-up":
        case "push-np-cmd":
            this.pushNowPlaying();
            break;
        }
    }

    Mojo.Log.info("--> StageAssistant.prototype.handleCommand");
};

StageAssistant.prototype.pushNowPlaying = function() {
    if ((AmpacheMobile.audioPlayer) && (AmpacheMobile.audioPlayer.hasPlayList === true)) {
        Mojo.Controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "now-playing"
        },
        {
            type: "display"
        });
    }
};

function CenterSpinner(spinner) {
    spinner.style.left = (window.innerWidth / 2 - 64) + "px";
    spinner.style.top = (window.innerHeight / 2 - 64) + "px";
};

function SetExistingCSSColor(serachRule, newColor) {
    var rule = this.GetCSSRule(serachRule);
    if (rule) {
        rule.style.color = newColor;
    }
};

function GetCSSRule(searchRule) {
    var sheets = document.styleSheets;
    for (j = 0; j < sheets.length; j++) {
        var rules = sheets[j].cssRules;
        for (i = 0; i < rules.length; i++) {
            var rule = rules[i];

            if (rule.selectorText) {
                //Mojo.Log.info("Sheet[" + j + "].Rule[" + i + "]=" + rule.selectorText);
                if (rule.selectorText.toLowerCase() == searchRule) {
                    return rule;
                }
            }
        }
    }
    return null;
};

function SetBackground(controller, image, color) {

    controller.get('body_wallpaper').style.background = "url(" + image + ") no-repeat";
    controller.get('body_wallpaper').style.backgroundColor = color;

};

function SetText(isCustomColor, Color, Theme) {
    var rowName = (Number(Theme) === THEME_DARK) ? ".palm-dark .palm-row": ".palm-row";

    var rowRule = GetCSSRule(rowName);
    var sceneRule = GetCSSRule('.ampache-mobile-scene');

    if (isCustomColor) {
        rowRule.style.color = Color;
        sceneRule.style.color = Color;
    } else {
        rowRule.style.color = null;
        sceneRule.style.color = null;
    }

};

function SetCSSTheme(controller, themeIndex) {
    var body = controller.get('body_wallpaper');
    var numThemes = THEMES.length;
    for (var i = 1; i < numThemes; i++) {
        body.removeClassName(THEMES[i]);
    }

    if (themeIndex !== THEME_NONE) {
        body.addClassName(THEMES[themeIndex]);
    }
};

function WhatsNew(type) {
    Mojo.Controller.stageController.pushScene({
        transition: AmpacheMobile.Transition,
        name: "whatsnew"
    },
    {
        label:type
    }
    );
};