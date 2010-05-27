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
var DEFAULT_MAX_FETCH = 1500;
var DEFAULT_MIN_FETCH = 75;

AccountAssistant = Class.create({

    initialize: function(params) {
        this.Account = params.Account;
        this.Type = params.Type;
        this.SettingsManager = params.SettingsManager;
        //this.Callback = params.Callback;
    },

    setup: function() {
        /* this function is for setup tasks that have to happen when the scene is first created */
        /* use Mojo.View.render to render view templates and add them to the scene, if needed. */
        /* setup widgets here */
        /* add event handlers to listen to events from widgets */
        Mojo.Log.info("Account assistant activating");

        this.accountTypeModel = {
            value: 0,
            disabled: false
        };

        this.controller.setupWidget("accountScreens", this.attributes = {
            choices: [{
                label: "Login",
                value: 0
            },
            {
                label: "Extras",
                value: 1
            },
            {
                label: "Saved",
                value: 2
            }]
        },
        this.accountTypeModel);

        this.numBuffTypeModel = {
            value: this.Account.NumBuffers,
            disabled: false
        };

        this.controller.setupWidget("num-buffers-selector", this.attributes = {
            labelPlacement: Mojo.Widget.labelPlacementLeft,
            label: "# of Buffers",
            choices: [{
                label: "1",
                value: 1
            },
            {
                label: "2",
                value: 2
            },
            {
                label: "3",
                value: 3
            },
            {
                label: "4",
                value: 4
            },
            {
                label: "5",
                value: 5
            }

            ]
        },
        this.numBuffTypeModel

        );

        this.controller.setupWidget("apache-timeout", this.attributes = {
            //hintText: $L('Type Password')
            charsAllow: this.IsNumeric
        },
        this.model = {
            value: this.Account.ApacheTimeout
        });

        //**********************************************************************************************************************
        //Setup Allow 2G Buffering Toggle
        // Setup toggle widget and  listen  for when it is changed
        this.allow2GAttr = {
            trueLabel: 'On',
            //if the state is true, what to label the toggleButton; default is 'On'
            trueValue: true,
            //if the state is true, what to set the model[property] to; default if not specified is true
            falseLabel: 'Off',
            //if the state is false, what to label the toggleButton; default is Off
            falseValue: false,
            //if the state is false, , what to set the model[property] to; default if not specific is false],
            fieldName: 'toggle' //name of the field; optional
        };
        this.allow2GModel = {
            value: this.Account.Allow2GBuffer,
            // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };

        this.controller.setupWidget('allow-2G-toggle', this.allow2GAttr, this.allow2GModel);

        if (this.Account.ArchivedArtists && (this.Account.ArchivedArtists.numItems !== "")) {
            this.controller.get("delete-artists").innerHTML = "Delete " + this.Account.ArchivedArtists.numItems + " Artists";
        }

        if (this.Account.ArchivedAlbums && (this.Account.ArchivedAlbums.numItems !== "")) {
            this.controller.get("delete-albums").innerHTML = "Delete " + this.Account.ArchivedAlbums.numItems + " Artists";
        }

        //if((this.controller.get("delete-albums").innerHTML.match("No Saved")===false) || (this.controller.get("delete-artists").innerHTML.match("No Saved")===false))
        //{
        //    this.controller.get("delete-all").innerHTML = "Delete All";
        //}

        this.context = this;

        this.controller.setupWidget("AccountNameField", this.attributes = {
            hintText: $L('Account Description')
        },
        this.model = {
            value: this.Account.AccountName
        });

        this.controller.setupWidget("passwordField", this.attributes = {
            hintText: $L('Type Password')
        },
        this.model = {
            value: this.Account.Password
        });

        this.controller.setupWidget("ServerURLField", this.attributes = {
            hintText: $L('Full URL of Server'),
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.model = {
            value: this.Account.ServerURL
        });

        this.controller.setupWidget("userNameField", this.attributes = {
            hintText: $L('Username'),
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.model = {
            value: this.Account.UserName
        });

        this.controller.setupWidget('btnTestConnection', this.atts = {
            type: Mojo.Widget.activityButton
        },
        this.model = {
            buttonLabel: 'Test Connection',
            buttonClass: 'affirmative',
            disabled: false
        });

        Mojo.Event.listen(this.controller.get('btnTestConnection'), Mojo.Event.tap, this.callStartTest.bind(this));

        this.controller.setupWidget('btnAccountHelp', this.atts = {
            //type: Mojo.Widget.button
        },
        this.helpModel = {
            buttonLabel: 'Account Help',
            buttonClass: 'primary',
            disabled: false
        });

        this.controller.listen('btnAccountHelp', Mojo.Event.tap, this.gotoAccountHelp.bind(this));

        this.controller.listen("num-buffers-selector", Mojo.Event.propertyChange, this.numBuffersChanged.bindAsEventListener(this));

        this.controller.listen("AccountNameField", Mojo.Event.propertyChange, this.changeAccountName.bindAsEventListener(this));
        this.controller.listen("ServerURLField", Mojo.Event.propertyChange, this.changeURL.bindAsEventListener(this));
        this.controller.listen("passwordField", Mojo.Event.propertyChange, this.changePassword.bindAsEventListener(this));
        this.controller.listen("userNameField", Mojo.Event.propertyChange, this.changeUserName.bindAsEventListener(this));
        this.controller.listen("apache-timeout", Mojo.Event.propertyChange, this.changeApacheTimeout.bindAsEventListener(this));
        this.controller.listen("allow-2G-toggle", Mojo.Event.propertyChange, this.allow2GChanged.bindAsEventListener(this));

        //*****************************************************************************
        // Fetch Size Setup
        this.attributes = {
            modelProperty: 'value',
            minValue: Math.log(DEFAULT_MIN_FETCH) / Math.log(DEFAULT_MAX_FETCH),
            maxValue: 1,
            //round:         true,
            updateInterval: 0.1
        };

        this.sliderModel = {
            value: Math.log(this.Account.FetchSize) / Math.log(DEFAULT_MAX_FETCH)
            //width: 15
        };

        this.controller.setupWidget('slider', this.attributes, this.sliderModel);
        this.propertyChanged = this.FetchSizeChanged.bindAsEventListener(this);
        this.controller.listen('slider', Mojo.Event.propertyChange, this.propertyChanged);
        $('fetchSize').innerHTML = "Items: " + this.Account.FetchSize;

        //******************************************************************************************************************
        //Setup Album Art Toggle
        this.tattr = {
            trueLabel: 'On',
            //if the state is true, what to label the toggleButton; default is 'On'
            trueValue: true,
            //if the state is true, what to set the model[property] to; default if not specified is true
            falseLabel: 'Off',
            //if the state is false, what to label the toggleButton; default is Off
            falseValue: false,
            //if the state is false, , what to set the model[property] to; default if not specific is false],
            fieldName: 'toggle' //name of the field; optional
        };

        this.tModel = {
            value: this.Account.ExtraCoverArt,
            // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };

        this.controller.setupWidget('art-toggle', this.tattr, this.tModel);
        this.ExtraArtPressedHandler = this.ExtraArtPressed.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('art-toggle'), Mojo.Event.propertyChange, this.ExtraArtPressedHandler);

        //******************************************************************************************************************
        //Setup Stall Recovery Toggle
        this.stall_Model = {
            value: this.Account.StallDetection,
            // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };

        this.controller.setupWidget('stall-toggle', this.tattr, this.stall_Model);
        this.StallPressedHandler = this.StallPressed.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('stall-toggle'), Mojo.Event.propertyChange, this.StallPressedHandler);

        //******************************************************************************************************************
        //Setup Stall Recovery Toggle
        this.spaces_Model = {
            value: this.Account.SpacesWorkAround,
            // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };

        this.controller.setupWidget('spaces-toggle', this.tattr, this.spaces_Model);
        this.SpacesPressedHandler = this.SpacesPressed.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('spaces-toggle'), Mojo.Event.propertyChange, this.SpacesPressedHandler);

        this.screenChangeHandler = this.screenChangeHandler.bind(this);
        Mojo.Event.listen(this.controller.get('accountScreens'), Mojo.Event.propertyChange, this.screenChangeHandler);
        this.screenChangeHandler();

        //this.deleteAllHandler = this.deleteAllHandler.bindAsEventListener(this);
        //this.controller.listen(this.controller.get('deleteAll'), Mojo.Event.tap, this.deleteAllHandler);
        this.deleteArtistsHandler = this.deleteArtistsHandler.bindAsEventListener(this);
        this.controller.listen(this.controller.get('deleteArtists'), Mojo.Event.tap, this.deleteArtistsHandler);

        this.deleteAlbumnHandler = this.deleteAlbumnHandler.bindAsEventListener(this);
        this.controller.listen(this.controller.get('deleteAlbums'), Mojo.Event.tap, this.deleteAlbumnHandler);

    },

    IsNumeric: function(val) {

        if ((val < 48) || (val > 57)) {

            return false;

        }

        return true;

    },

    ValidSettings: function(account) {
        var retVal = true;
        this.FailureReason = "Unknown Failure";
        if ((!account.AccountName) || (account.AccountName === "")) {
            this.FailureReason = "No account name entered ";
            retVal = false;
        }
        if ((!account.ServerURL) || (account.ServerURL === "")) {
            this.FailureReason = "No Server URL entered ";
            retVal = false;
        } else {
            var startOfURL = account.ServerURL.toLowerCase().substring(0, 8);
            if ((!startOfURL.match("http://")) && (!startOfURL.match("https://"))) {
                this.FailureReason = "Server URL requires http://";
                retVal = false;
            }
        }

        if ((!account.UserName) || (account.UserName === "")) {
            this.FailureReason = "No user name entered ";
            retVal = false;
        }
        return retVal;
    },

    StallPressed: function(event) {
        //Display the value of the toggle
        this.Account.StallDetection = event.value;
    },

    SpacesPressed: function(event) {
        //Display the value of the toggle
        this.Account.SpacesWorkAround = event.value;

    },

    ExtraArtPressed: function(event) {
        //Display the value of the toggle
        if (event.value === true) {
            this.Account.ExtraCoverArt = true;
            this.showDialogBox("WARNING", "This feature is disabled by default because it greatly diminishes performance, but it sure looks good");
        } else {
            this.Account.ExtraCoverArt = false;
        }
        this.settingsManager.SaveSettings();
    },

    accountQuestions: function(value) {
        if (value === "delete") {
            this.popAccount(null);
        }
    },

    popAccount: function(account) {
        var params = {
            type: this.Type,
            account: account
        };
        this.controller.stageController.popScene(null);
    },

    handleCommand: function(event) {
        //test for Mojo.Event.back, not Mojo.Event.command..
        if (event.type === Mojo.Event.back) {
            event.preventDefault();
            event.stopPropagation();
            if (!this.ValidSettings(this.Account)) {
                this.controller.showAlertDialog({
                    onChoose: this.accountQuestions,
                    title: $L("Account Incomplete"),
                    message: this.FailureReason,
                    choices: [{
                        label: $L('OK'),
                        value: 'ok',
                        type: 'primary'
                    },
                    {
                        label: $L('Delete Account'),
                        value: 'delete',
                        type: 'negative'
                    }]
                });
            } else {
                if (this.Type === "Add") {
                    this.SettingsManager.AppendAccount(this.Account);
                }
                this.popAccount(this.Account);
            }
        }
    },

    callStartTest: function() {
        //console.log("*** ")
        if (!this.spinning) {
            Mojo.Log.info("Staring Connection Test");
            this.ampacheServer = new AmpacheServer();
            this.ampacheServer.TestConnection(this.Account.ServerURL, this.Account.UserName, this.Account.Password, this.TestCallback.bind(this));
            this.timeoutInterval = setInterval(this.ConnectionTestTimeout.bind(this), 30000);
            Mojo.Log.info("this.timeoutInterval", this.timeoutInterval);
            this.spinning = true;
        } else {
            Mojo.Log.info("Test already started");
        }
    },

    TestCallback: function(connectResult) {
        this.buttonWidget = this.controller.get('btnTestConnection');
        this.buttonWidget.mojo.deactivate();
        this.spinning = false;
        window.clearInterval(this.timeoutInterval);
        var html = false;
        var DisplayMessage = connectResult;
        html = true;
        if (connectResult.toLowerCase() === "acl error") {
            DisplayMessage = "Error: " + connectResult + "<br><br>" + AmpacheMobile.AclErrorHelp;
            html = true;
        }

        if (connectResult.toLowerCase() === "error: empty response") {
            DisplayMessage = connectResult + "<br><br>" + AmpacheMobile.EmptyResponseErrorHelp;
            html = true;
        }

        Mojo.Log.info("Display Alert");
        this.controller.showAlertDialog({
            onChoose: function(value) {},
            title: $L("Connection Test"),
            message: DisplayMessage,
            choices: [{
                label: $L('OK'),
                value: 'ok',
                type: 'color'
            }],
            allowHTMLMessage: html
        });
    },

    ConnectionTestTimeout: function() {
        this.buttonWidget = this.controller.get('btnTestConnection');
        this.buttonWidget.mojo.deactivate();
        this.spinning = false;
        Mojo.Log.info("this.timeoutInterval", this.timeoutInterval);
        window.clearInterval(this.timeoutInterval);
        Mojo.Log.info("Deactivate Spinner");
        Mojo.Log.info(this.testContext);
        Mojo.Log.info("Display Alert");
        this.controller.showAlertDialog({
            onChoose: function(value) {},
            title: $L("Connection Test"),
            message: "Timed out while attempting test",
            choices: [{
                label: $L('OK'),
                value: 'ok',
                type: 'color'
            }]
        });
        /*
         var currentScene = this.ControllerSave.activeScene();
         currentScene.showAlertDialog({
         onChoose: function(value){
         },
         title: "Connection Test",
         message: "Test Failed",
         choices: [{
         label: "OK",
         //value: "failed"
         }]
         });
         */
    },

    numBuffersChanged: function() {
        this.Account.NumBuffers = event.value;
        
        if(Mojo.Environment.DeviceInfo.modelNameAscii==="Pixi")
        {
            if(this.Account.NumBuffers>1)
            {
                this.showDialogBox("Warning", "Buffer Ahead my not work correctly on a Pixi, if you have issues set your buffers 1.");    
            }
        }
        
    },

    //Logarithmic scale for the FetchSize
    FetchSizeChanged: function(event) {
        var value = Math.pow(DEFAULT_MAX_FETCH, this.sliderModel.value);
        value = Math.round(value);
        if (value === 0) {
            value = 1;
        }
        $('fetchSize').innerHTML = "Items: " + value;
        this.Account.FetchSize = value;
    },

    changeAccountName: function(event) {
        Mojo.Log.info("Account Name Changed; value = ", event.value);

        AmpacheMobile.settingsManager.discardSavedData(this.Account);

        this.Account.AccountName = event.value;
        var date = new Date();
        this.Account.uniqueID = this.Account.AccountName + "_" + date.getTime();

    },

    changeURL: function(event) {
        Mojo.Log.info("Server URL Changed; value = ", event.value);
        AmpacheMobile.settingsManager.discardSavedData(this.Account);

        this.Account.ServerURL = event.value;
    },

    changePassword: function(event) {
        Mojo.Log.info("Server Password Changed; value = ", event.value);
        //AmpacheMobile.settingsManager.discardSavedData(this.Account);
        this.Account.Password = event.value;
    },

    changeUserName: function(event) {
        Mojo.Log.info("Server UserName Changed; value = ", event.value);
        AmpacheMobile.settingsManager.discardSavedData(this.Account);

        this.Account.UserName = event.value;
    },

    changeApacheTimeout: function(event) {
        this.Account.ApacheTimeout = Number(event.value);
    },

    allow2GChanged: function(event) {
        this.Account.Allow2GBuffer = event.value;
    },

    activate: function(event) {
        /* put in event handlers here that should only be in effect when this scene is active. For
         example, key handlers that are observing the document */
    },

    deactivate: function(event) {
        /* remove any event handlers you added in activate and do any other cleanup that should happen before
         this scene is popped or another scene is pushed on top */
        this.controller.showAlertDialog({
            onChoose: function(value) {},
            title: $L("Connection Test"),
            message: "Timed out while attempting test",
            choices: [{
                label: $L('OK'),
                value: 'ok',
                type: 'color'
            }]
        });

        Mojo.Event.stopListening(this.controller.get('btnTestConnection'), Mojo.Event.tap, this.callStartTest);
        this.controller.stopListening("AccountNameField", Mojo.Event.propertyChange, this.changeURL);
        this.controller.stopListening("ServerURLField", Mojo.Event.propertyChange, this.changeURL);
        this.controller.stopListening("passwordField", Mojo.Event.propertyChange, this.changePassword);
        this.controller.stopListening("userNameField", Mojo.Event.propertyChange, this.changeUserName);
        this.controller.stopListening("slider", Mojo.Event.propertyChange, this.propertyChanged);
    },

    cleanup: function(event) {
        Mojo.Event.stopListening(this.controller.get('art-toggle'), Mojo.Event.propertyChange, this.ExtraArtPressedHandler);
        Mojo.Event.stopListening(this.controller.get('stall-toggle'), Mojo.Event.propertyChange, this.StallPressedHandler);
        Mojo.Event.stopListening(this.controller.get('accountScreens'), Mojo.Event.propertyChange, this.screenChangeHandler);
        //this.controller.stopListening(this.controller.get('deleteAll'), Mojo.Event.tap, this.deleteAllHandler);
        this.controller.stopListening(this.controller.get('deleteArtists'), Mojo.Event.tap, this.deleteArtistsHandler);
        this.controller.stopListening(this.controller.get('deleteAlbums'), Mojo.Event.tap, this.deleteAlbumnHandler);
        this.controller.stopListening("num-buffers-selector", Mojo.Event.propertyChange, this.numBuffersChanged);
        this.controller.stopListening("apache-timeout", Mojo.Event.propertyChange, this.changeApacheTimeout);
        this.controller.stopListening("allow-2G-toggle", Mojo.Event.propertyChange, this.allow2GChanged.bindAsEventListener(this));
        Mojo.Event.stopListening(this.controller.get('spaces-toggle'), Mojo.Event.propertyChange, this.SpacesPressedHandler);

        this.controller.stopListening('btnAccountHelp', Mojo.Event.tap, this.gotoAccountHelp);

    },

    //deleteAllHandler:function()
    //{
    //    AmpacheMobile.settingsManager.discardSavedData(this.Account);
    //    this.controller.get("delete-artists").innerHTML = "No Saved Artists";
    //    this.controller.get("delete-albums").innerHTML = "No Saved Albums";
    //    //this.controller.get("delete-all").innerHTML = "No Saved Items";
    //},
    deleteArtistsHandler: function() {
        AmpacheMobile.settingsManager.DumpSavedArtists(this.Account);
        this.controller.get("delete-artists").innerHTML = "No Saved Artists";
        //if(this.controller.get("delete-albums").innerHTML.match("No Saved"))
        //{
        //    this.controller.get("delete-all").innerHTML = "No Saved Items";
        //}
    },
    deleteAlbumnHandler: function() {
        AmpacheMobile.settingsManager.DumpSavedAlbums(this.Account);
        this.controller.get("delete-albums").innerHTML = "No Saved Albums";
        //if(this.controller.get("delete-artists").innerHTML.match("No Saved"))
        //{
        //    this.controller.get("delete-all").innerHTML = "No Saved Items";
        //}
    },

    gotoAccountHelp: function() {
        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "new-users"
        },
        {
            type: "account"

        });

    },

    screenChangeHandler: function() {
        switch (this.accountTypeModel.value) {
        case 0:
            this.controller.get('account-settings').style.display = 'block';
            this.controller.get('extra-settings').style.display = 'none';
            this.controller.get('saved-info').style.display = 'none';
            break;
        case 1:
            this.controller.get('account-settings').style.display = 'none';
            this.controller.get('extra-settings').style.display = 'block';
            this.controller.get('saved-info').style.display = 'none';
            this.controller.modelChanged(this.sliderModel);
            break;
        case 2:
            this.controller.get('account-settings').style.display = 'none';
            this.controller.get('extra-settings').style.display = 'none';
            this.controller.get('saved-info').style.display = 'block';
            break;
        }
    },

    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message) {
        this.controller.showAlertDialog({
            onChoose: function(value) {},
            title: title,
            message: message,
            choices: [{
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    }
});