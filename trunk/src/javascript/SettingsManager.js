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
var DEFAULT_COLOR = "#384438";
var DEFAULT_IMAGE = "images/backgrounds/solids/background1.jpg";
var DEFAULT_FETCH_SIZE = 300;
var DEFAULT_OVERLAY = "images/backgrounds/overlay/overlay1.png";
var DEFAULT_ROTATION = false;

SettingsManager = Class.create({
    settings: null,
    depot: null,

    initialize: function(DataBaseName) {
        var options = {
            name: "AmpacheMobileData",
            //Name used for the HTML5 database name. (required)
            version: 1,
            //Version number used for the HTML5 database. (optional, defaults to 1)	
            //displayName: "demoDB", //Name that would be used in user interface that the user sees regarding this database. Not currently used. (optional, defaults to name)
            //estimatedSize: 200000, //Estimated size for this database. (optional, no default)
            replace: false // open an existing depot
        };
        //Create a database when the scene is generated
        this.depot = new Mojo.Depot(options, this.dbSuccess, this.dbFailure);
    },

    dbSuccess: function() {
        console.log("***** depot operation success!");
    },

    dbFailure: function(transaction, result) {
        console.log("***** depot failure: ");
        Mojo.Controller.errorDialog("This is not good!.  Settings database failed to load.  Error Message: ");
    },

    CreateSettings: function() {
        this.settings = new Settings();
        this.settings.Accounts = [];
        this.settings.CurrentAccountIndex = 0;
    },

    CreateEmptyAccount: function() {
        var index = this.settings.Accounts.length;
        this.settings.Accounts[index] = new Account();
        return this.settings.Accounts[index];
    },

    GetCurrentAccount: function() {
        var settings = this.settings;
        if ((settings.CurrentAccountIndex >= 0) && (settings.CurrentAccountIndex < settings.Accounts.length)) {
            return settings.Accounts[settings.CurrentAccountIndex];
        } else {
            return null;
        }
    },

    AppendAccount: function(account) {
        var index = this.settings.Accounts.length;
        this.settings.Accounts[index] = account;
    },

    AddAccount: function(AccountName, username, password, url) {
        var index = this.settings.Accounts.length;
        this.settings.Accounts[index] = new Account();
        this.settings.Accounts[index].UserName = username;
        this.settings.Accounts[index].Password = password;
        this.settings.Accounts[index].ServerURL = url;
        return this.settings.Accounts[index];
    },

    RemoveAccount: function(index) {
        this.settings.Accounts.splice(index, 1);
    },

    GetSettings: function(OnSuccess, OnFailure) {
        GetSettingsSuccessCallback = OnSuccess;
        GetSettingsFailureCallback = OnFailure;
        this.depot.get("AppSettings", this.GetSettingsSuccess.bind(this), this.GetSettingsFailure.bind(this));
    },

    GetSettingsSuccessCallback: null,
    GetSettingsSuccess: function(settings) {
        console.log("***************Success Get Happened");
        this.settings = settings;
        this.PopulateMissingDefaults();
        if (GetSettingsSuccessCallback) {
            GetSettingsSuccessCallback(this.settings);
        }
        GetSettingsSuccessCallback = null;
    },

    PopulateMissingDefaults: function() {
        if (this.settings) {
            if (!this.settings.BackgroundColor) {
                this.settings.BackgroundColor = DEFAULT_COLOR;
            }
            if (!this.settings.BackgroundImage) {
                this.settings.BackgroundImage = DEFAULT_IMAGE;
            }
            if (!this.settings.StreamDebug) {
                this.settings.StreamDebug = false;
            }
            if (!this.settings.BackgroundMode) {
                this.settings.BackgroundMode = 0;
            }
            if (!this.settings.AlbumsSort) {
                this.settings.AlbumsSort = 0;
            }
            if (!this.settings.AllowRotation) {
                this.settings.AllowRotation = DEFAULT_ROTATION;
            }
            this.settings.Version = Mojo.Controller.appInfo.version;

            for (i = 0; i < this.settings.Accounts.length; i++) {
                if (!this.settings.Accounts[i].FetchSize) {
                    this.settings.Accounts[i].FetchSize = DEFAULT_FETCH_SIZE;
                }

                if (!this.settings.Accounts[i].ExtraCoverArt) {
                    this.settings.Accounts[i].ExtraCoverArt = false;
                }
                
                if (!this.settings.Accounts[i].StallRecovery) {
                    this.settings.Accounts[i].StallRecovery = false;
                }
            }
            this.SaveSettings(null, null);
        }
    },

    GetSettingsFailureCallback: null,
    GetSettingsFailure: function() {
        console.log("***************Failure Get Happened");
        if (GetSettingsFailureCallback) {
            GetSettingsFailureCallback();
        }
        GetSettingsFailureCallback = null;
    },

    SaveSettings: function(OnSuccess, OnFailure) {
        this.depot.add("AppSettings", this.settings,
        function() {
            console.log("***************Success SaveSettings Happened");
            if (OnSuccess) {
                OnSuccess();
            }
        },
        function() {
            console.log("***************Failure SaveSettings Happened");
            if (OnFailure) {
                OnFailure();
            }
        });
    }
});

Account = Class.create({
    AccountName: null,
    UserName: null,
    Password: null,
    ServerURL: null,
    ExtraCoverArt: false,
    StallRecovery:false,
    FetchSize: DEFAULT_FETCH_SIZE
});

Settings = Class.create({
    Accounts: null,
    CurrentAccountIndex: null,
    StreamDebug: false,
    Version: "0.0.5",
    AllowRotation: DEFAULT_ROTATION,
    BackgroundColor: DEFAULT_COLOR,
    BackgroundImage: DEFAULT_IMAGE,
    BackgroundSolid: DEFAULT_IMAGE,
    BackgroundMode: this.CUSTOM_COLOR,
    BackgroundOverlay: DEFAULT_OVERLAY,
    CUSTOM_COLOR: 0,
    CUSTOM_IMAGE: 1,
    AlbumsSort: 0
});