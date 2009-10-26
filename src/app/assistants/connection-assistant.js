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
ConnectionAssistant = Class.create(
{
    initialize: function(params) {
        Mojo.Log.info("--> ConnectionAssistant Constructor");
        this.ConnctionPending = false;
        AmpacheMobile.Transition = Mojo.Transition.none;
        Mojo.Log.info("<-- ConnectionAssistant Constructor");
    },
    
    setup: function(){
        Mojo.Log.info("--> setup");
        
        AmpacheMobile.audioPlayer = new AudioPlayer(this.controller);
        //AmpacheMobile.mediaEventsService = new MediaEventsService();
        //AmpacheMobile.mediaEventsService.markAppForeground();
        
        //******************************************************************************************************
        // Make scrim
        this.scrim = $("connect-scrim");
        this.scrim.hide();
        
        //*******************************************************************************************************
        // Command Menu
        this.cmdMenuProps = 
        {
            visible: false,
            items: [{}, //Left group 
             {
                label: 'Cancel Connect',
                command: 'cmdCancel'
            }, //Center 
            {} //Right
            ]
        };
        this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuProps);
        
        AmpacheMobile.settingsManager = new SettingsManager("AmpacheMobileData");
        this.settingsManager = AmpacheMobile.settingsManager;
        this.Accounts = [];
        this.accountsModel = 
        {
            listTitle: $L('Accounts'),
            items: this.Accounts
        
        };
        this.innerListAttrs = 
        {
            listTemplate: 'connection/listContainer',
            itemTemplate: 'connection/listItem'
            //addItemLabel: $L("Account..."),
            //swipeToDelete: true,
            //autoconfirmDelete: false,
            //deletedProperty: 'swiped',
        };
        this.controller.setupWidget('selectorList', this.innerListAttrs, this.accountsModel);
        this.controller.listen('selectorList', Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
        /* use Mojo.View.render to render view templates and add them to the scene, if needed. */
        /* setup widgets here */
        this.spinnerLAttrs = 
        {
            spinnerSize: 'large'
        };
        
        this.spinnerModel = 
        {
            spinning: true
        };
        this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
        
        /* add event handlers to listen to events from widgets */
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        this.settingsManager.GetSettings(this.GotSettings.bind(this));
        Mojo.Log.info("<-- setup");
    },
    
    TurnOnSpinner: function(){
        Mojo.Log.info("--> TurnOnSpinner");
        CenterSpinner($('large-activity-spinner'));
        this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
        this.scrim.show();
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<-- TurnOnSpinner");
    },
    
    TurnOffSpinner: function(){
        Mojo.Log.info("--> TurnOffSpinner");
        this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
        this.scrim.hide();
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<-- TurnOffSpinner");
    },
    
    listTapHandler: function(event){
        this.TurnOnSpinner();
        this.LoadMainMenu(event.item);
    },
    
    pushPreferences: function(settingsManager){
        var params = 
        {
            settingsManager: AmpacheMobile.settingsManager
        };
        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "preferences"
        }, params);
    },
    
    GotSettings: function(settings){
        Mojo.Log.info("--> GotSettings");
        this.TurnOffSpinner();
        if (!settings){
            Mojo.Log.info("No Settings Case");
            AmpacheMobile.settingsManager.CreateSettings();
            this.pushPreferences(AmpacheMobile.settingsManager);
        }else{
            AmpacheMobile.Account = AmpacheMobile.settingsManager.GetCurrentAccount(this.controller.stageController);
            if (!AmpacheMobile.Account){
                Mojo.Log.info("Updating Accounts List");
                if (AmpacheMobile.settingsManager.settings.Accounts.length === 0){
                    this.pushPreferences(AmpacheMobile.settingsManager);
                }else{
                    this.PopulateAccountsList(settings.Accounts);
                }
            }else{
                this.PopulateAccountsList(settings.Accounts);
                this.TurnOnSpinner();
                this.LoadMainMenu(AmpacheMobile.Account);
            }
        }
        this.SetBackground(AmpacheMobile.settingsManager.settings.BackgroundImage, AmpacheMobile.settingsManager.settings.BackgroundColor);
        Mojo.Log.info("<-- StageAssistant.prototype.GotSettings");
    },
    
    PopulateAccountsList: function(Accounts, invalidate){
        Mojo.Log.info("--> PopulateAccountsList");
        var accountsList = this.controller.get('selectorList');
        this.Accounts = Accounts;
        this.accountsModel.items = Accounts;
        accountsList.mojo.setLength(Accounts.length);
        accountsList.mojo.noticeUpdatedItems(0, this.accountsModel.items);
        Mojo.Log.info("<-- PopulateAccountsList");
    },
    
    handleLaunch: function(params){
        Mojo.Log.info("--> handleLaunch");
        Mojo.Log.info("<-- handleLaunch");
    },
    
    pushMainMenu:function()
    {
        if (this.controller.stageController){
            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "mainmenu"
            });
        }
        else{
            this.controller.pushScene({
                transition: AmpacheMobile.Transition,
                name: "mainmenu"
            });
        }
        
    },
    
    
    ConnectionCallback: function(connectResult, source){
        Mojo.Log.info("--> ConnectionCallback");
        Mojo.Log.info("ConnectionCallback Got Connection info", connectResult);
        this.TurnOffSpinner();
        var html;
        var DisplayMessage;
        if (connectResult === "connected"){
            //Check ampache Version 
            var apiVersion = parseInt(AmpacheMobile.ampacheServer.api,10);
            if (apiVersion >= 350001){
                Mojo.Log.info("Pushing Main Menu", connectResult);
                this.pushMainMenu();
            }else{//Incorrect API
                html = true;
                DisplayMessage = "Error: You are connecting to an incompatible version of Ampache<br><br> You are using API Version: " + AmpacheMobile.ampacheServer.api +
                "<br><br>Ampache Mobile requires at least version 3.5.x of the server";
                
                this.controller.showAlertDialog(
                {
                    onChoose: this.AlertOption.bind(this),
                    title: $L("Connection Error"),
                    message: DisplayMessage,
                    choices: [
                    {
                        label: $L('Retry'),
                        value: "retry",
                        type: 'primary'
                    }, 
                    {
                        label: $L('Preferences'),
                        value: "preferences",
                        type: 'secondary'
                    }],
                    allowHTMLMessage: html
                
                });
            }
        }else{
            //Mojo.Log.info("Current Context", typeof this);
            //var currentScene = this.controller.activeScene();
            html = false;
            DisplayMessage = connectResult;
            if (connectResult.toLowerCase() === "acl error"){
                DisplayMessage = "Error: " + connectResult + "<br><br>" + AmpacheMobile.AclErrorHelp;
                html = true;
            }
            
            if (connectResult.toLowerCase() === "error: empty response"){
                DisplayMessage = connectResult + "<br><br>" + AmpacheMobile.EmptyResponseErrorHelp;
                html = true;
            }
            
            Mojo.Log.info("Display Alert");
            this.controller.showAlertDialog(
            {
                onChoose: this.AlertOption.bind(this),
                title: $L("Connection Error"),
                message: DisplayMessage,
                choices: [
                {
                    label: $L('Retry'),
                    value: "retry",
                    type: 'primary'
                }, 
                {
                    label: $L('Preferences'),
                    value: "preferences",
                    type: 'secondary'
                }],
                allowHTMLMessage: html
            
            });
        }
        
        Mojo.Log.info("<-- ConnectionCallback");
    },
    
    AlertOption: function(value){
        Mojo.Log.info("--> AlertOption value: " + value);
        switch (value){
            case "retry":
                this.LoadMainMenu(AmpacheMobile.Account);
                break;
            case "preferences":
                var params = 
                {
                    settingsManager: AmpacheMobile.settingsManager
                };
                this.controller.stageController.pushScene("preferences", params);
                break;
        }
        Mojo.Log.info("<-- AlertOption");
    },
    
    LoadMainMenu: function(account){
        /* put in event handlers here that should only be in effect when this scene is active. For
         example, key handlers that are observing the document */
        if (account){
        
            if ((account.ServerURL === "") || (account.Password === "") || (account.UserName === "")){
                Mojo.Log.info("Try to load preferences");
                this.controller.stageController.pushScene("preferences", "connection");
            }else{
                Mojo.Log.info("Creating AmpacheServer Object");
                AmpacheMobile.Account = account;
                AmpacheMobile.ampacheServer = null;
                AmpacheMobile.ampacheServer = new AmpacheServer(account.ServerURL, account.UserName, account.Password);
                AmpacheMobile.ampacheServer.connect(this.ConnectionCallback.bind(this), this);
                AmpacheMobile.FetchSize = account.FetchSize;
            }
        }
    },
    
    activate: function(event){
        Mojo.Log.info("--> activate");
        this.TurnOffSpinner();
        
        if (AmpacheMobile.settingsManager.settings){
            this.PopulateAccountsList(AmpacheMobile.settingsManager.settings.Accounts, true);
            this.SetBackground(AmpacheMobile.settingsManager.settings.BackgroundImage, AmpacheMobile.settingsManager.settings.BackgroundColor);
        }
        
        if ((AmpacheMobile.ampacheServer) && (AmpacheMobile.ampacheServer.pingTimer)){
            AmpacheMobile.ampacheServer.disconnect();
        }
        Mojo.Log.info("<-- activate");
    },
    
    SetBackground: function(image, color){
        this.controller.get('body_wallpaper').style.background = "url(" + image + ") no-repeat";
        this.controller.get('body_wallpaper').style.backgroundColor = color;
    },
    
    
    deactivate: function(event){
        Mojo.Log.info("--> deactivate");
        /* remove any event handlers you added in activate and do any other cleanup that should happen before
         this scene is popped or another scene is pushed on top */
        this.TurnOffSpinner();
        Mojo.Log.info("<-- deactivate");
    },
    
    cleanup: function(event){
        Mojo.Log.info("--> cleanup");
        /* this function should do any cleanup needed before the scene is destroyed as 
         a result of being popped off the scene stack */
        Mojo.Event.stopListening(this.controller.get('selectorList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Log.info("<-- cleanup");
    },
    
    handleCommand: function(event){
        if (event.command === "cmdCancel") {
                AmpacheMobile.ampacheServer.ConnectCancel();
                this.TurnOffSpinner();
        }
        
        /*switch (event.command){
            case "cmdCancel":
                AmpacheMobile.ampacheServer.ConnectCancel();
                this.TurnOffSpinner();
                break;
        }*/
    }
});
