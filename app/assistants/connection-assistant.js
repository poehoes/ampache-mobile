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
function ConnectionAssistant(params)
{
    Mojo.Log.info("--> ConnectionAssistant Constructor");
    
    this.ConnctionPending = false;
    
    Mojo.Log.info("<-- ConnectionAssistant Constructor");
}

ConnectionAssistant.prototype.setup = function()
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.setup");
    
    //******************************************************************************************************
    // Make scrim
    this.scrim = $("connect-scrim");
    this.scrim.hide();
    
    
    //AmpacheMobile.audioPlayer = new AudioPlayer(this.controller);
    //Mojo.Log.info("Audio Player Created Bitches");
    
    
    AmpacheMobile.settingsManager = new SettingsManager("AmpacheMobileData");
    this.settingsManager = AmpacheMobile.settingsManager;
    
    this.Accounts = new Array();
    
    
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
    }
    
    this.spinnerModel = 
    {
        spinning: true
    }
    
    this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
    
    
    
    /* add event handlers to listen to events from widgets */
    this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
    
    this.settingsManager.GetSettings(this.GotSettings.bind(this));
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.setup");
}


ConnectionAssistant.prototype.TurnOnSpinner = function()
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.TurnOnSpinner");
    CenterSpinner($('large-activity-spinner'));
    this.scrim.show();
	this.spinnerModel.spinning = true;
    this.controller.modelChanged(this.spinnerModel);
    Mojo.Log.info("<-- ConnectionAssistant.prototype.TurnOnSpinner");
}


ConnectionAssistant.prototype.TurnOffSpinner = function()
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.TurnOffSpinner");
    this.scrim.hide();
	this.spinnerModel.spinning = false;
    this.controller.modelChanged(this.spinnerModel);
    Mojo.Log.info("<-- ConnectionAssistant.prototype.TurnOffSpinner");
}


ConnectionAssistant.prototype.listTapHandler = function(event)
{
    this.TurnOnSpinner();
    this.LoadMainMenu(event.item);   
}

ConnectionAssistant.prototype.pushPreferences = function(settingsManager)
{
    var params = 
    {
    
        settingsManager: AmpacheMobile.settingsManager
    }
    this.controller.stageController.pushScene("preferences", params);
}


ConnectionAssistant.prototype.GotSettings = function(settings)
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.GotSettings")
    
    this.TurnOffSpinner();
    
    if (settings == null) 
    {
        Mojo.Log.info("No Settings Case")
        AmpacheMobile.settingsManager.CreateSettings();
        this.pushPreferences(AmpacheMobile.settingsManager);
    }
    else 
    {
    
        AmpacheMobile.Account = AmpacheMobile.settingsManager.GetCurrentAccount(this.controller.stageController);
        
        
        
        if (AmpacheMobile.Account == null) 
        {
            Mojo.Log.info("Updating Accounts List")
            if (AmpacheMobile.settingsManager.settings.Accounts.length == 0) 
            {
                this.pushPreferences(AmpacheMobile.settingsManager);
            }
            else 
            {
                this.PopulateAccountsList(settings.Accounts);
            }
        }
        else 
        {
            this.TurnOnSpinner();
            this.LoadMainMenu(AmpacheMobile.Account);
            
        }
    }
    
    
    this.SetBackground(AmpacheMobile.settingsManager.settings.BackgroundImage, AmpacheMobile.settingsManager.settings.BackgroundColor);
    
    Mojo.Log.info("<-- StageAssistant.prototype.GotSettings")
}

ConnectionAssistant.prototype.PopulateAccountsList = function(Accounts, invalidate)
{

    Mojo.Log.info("--> ConnectionAssistant.prototype.PopulateAccountsList");
    
    var accountsList = this.controller.get('selectorList');
    this.Accounts = Accounts;
    this.accountsModel.items = Accounts
    accountsList.mojo.setLength(Accounts.length);
    accountsList.mojo.noticeUpdatedItems(0, this.accountsModel.items);
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.PopulateAccountsList");
}

ConnectionAssistant.prototype.handleLaunch = function(params)
{

    Mojo.Log.info("--> ConnectionAssistant.prototype.handleLaunch");
    
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.handleLaunch");
}


ConnectionAssistant.prototype.ConnectionCallback = function(connectResult, source)
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.ConnectionCallback");
    Mojo.Log.info("ConnectionCallback Got Connection info", connectResult);
    
    
    this.TurnOffSpinner();
    
    if (connectResult == "connected") 
    {
    
        //Check ampache Version	
        var apiVersion = parseInt(AmpacheMobile.ampacheServer.api)
        if (apiVersion >= 350001) 
        {
        
        
            Mojo.Log.info("Pushing Main Menu", connectResult);
            if (this.controller.stageController != null) 
            {
                this.controller.stageController.pushScene("mainmenu");
            }
            else 
            {
                this.controller.pushScene("mainmenu");
            }
        }
        else // Incorrect API
         {
            var html = true;
            var DisplayMessage = "Error: You are connecting to an incompatible version of Ampache<br><br> You are using API Version: " + AmpacheMobile.ampacheServer.api +
            "<br><br>Ampache Mobile requires at least version 3.5.x of the server"
            
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
    }
    else 
    {
    
        //Mojo.Log.info("Current Context", typeof this);
        
        //var currentScene = this.controller.activeScene();
        var html = false;
        DisplayMessage = connectResult;
        if (connectResult.toLowerCase() == "acl error") 
        {
            DisplayMessage = "Error: " + connectResult + "<br><br>" + AmpacheMobile.AclErrorHelp
            html = true;
        }
        
        if (connectResult.toLowerCase() == "error: empty response") 
        {
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
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.ConnectionCallback")
}

ConnectionAssistant.prototype.AlertOption = function(value)
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.AlertOption value: " + value)
    switch (value)
    {
        case "retry":
            this.LoadMainMenu(AmpacheMobile.Account);
            break;
        case "preferences":
            var params = 
            {
            
                settingsManager: AmpacheMobile.settingsManager
            }
            this.controller.stageController.pushScene("preferences", params);
            break;
    }
    
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.AlertOption")
}

ConnectionAssistant.prototype.LoadMainMenu = function(account)
{
    /* put in event handlers here that should only be in effect when this scene is active. For
     example, key handlers that are observing the document */
    if (account != null) 
    {
    
        if ((account.ServerURL == "") || (account.Password == "") || (account.UserName == "")) 
        {
            Mojo.Log.info("Try to load preferences");
            this.controller.stageController.pushScene("preferences", "connection");
        }
        else 
        {
            Mojo.Log.info("Creating AmpacheServer Object");
            AmpacheMobile.Account = account;
            AmpacheMobile.ampacheServer = null;
            AmpacheMobile.ampacheServer = new AmpacheServer(account.ServerURL, account.UserName, account.Password);
            AmpacheMobile.ampacheServer.connect(this.ConnectionCallback.bind(this), this);
            AmpacheMobile.FetchSize = account.FetchSize;
        }
    }
}


ConnectionAssistant.prototype.activate = function(event)
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.activate");
    
    this.TurnOffSpinner();
    
    if (AmpacheMobile.settingsManager.settings != null) 
    {
        this.PopulateAccountsList(AmpacheMobile.settingsManager.settings.Accounts, true);
        this.SetBackground(AmpacheMobile.settingsManager.settings.BackgroundImage, AmpacheMobile.settingsManager.settings.BackgroundColor);
        
    }
    
    if ((AmpacheMobile.ampacheServer != null) && (AmpacheMobile.ampacheServer.pingTimer != null)) 
    {
        AmpacheMobile.ampacheServer.disconnect();
    }
    
    
    
    
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.activate");
    
}

ConnectionAssistant.prototype.SetBackground = function(image, color)
{
    this.controller.get('body_wallpaper').style.background = "url(" + image + ") no-repeat";
    this.controller.get('body_wallpaper').style.backgroundColor = color;
}


ConnectionAssistant.prototype.deactivate = function(event)
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.deactivate");
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
     this scene is popped or another scene is pushed on top */
    this.TurnOffSpinner();
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.deactivate");
}

ConnectionAssistant.prototype.cleanup = function(event)
{
    Mojo.Log.info("--> ConnectionAssistant.prototype.cleanup");
    /* this function should do any cleanup needed before the scene is destroyed as 
     a result of being popped off the scene stack */
    Mojo.Event.stopListening(this.controller.get('selectorList'), Mojo.Event.listTap, this.listTapHandler);
    
    Mojo.Log.info("<-- ConnectionAssistant.prototype.cleanup");
}
