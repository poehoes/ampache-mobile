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

var SEARCH_GLOBAL = 0;
var SEARCH_ARTISTS = 1;
var SEARCH_ALBUMS = 2;
var SEARCH_SONGS = 3;
var SEARCH_PLAYLISTS = 4;
var SEARCH_TYPES = {};
SEARCH_TYPES[0] = "Global";
SEARCH_TYPES[1] = "Artists";
SEARCH_TYPES[2] = "Albums";
SEARCH_TYPES[3] = "Songs";
SEARCH_TYPES[4] = "Playlists";

RECENT_TYPES = ["Last Update", "1 Week", "1 Month", "3 Months"];

var THEME_NONE = 0;
var THEME_DARK = 1;
var THEMES = [];
THEMES[0] = "";
THEMES[1] = "palm-dark";

CUSTOM_COLOR = 0;
CUSTOM_IMAGE = 1;

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
        this.getSize
    },

    dbSuccess: function() {
        console.log("***** depot operation success!");
    },

    dbFailure: function(transaction, result) {
        console.log("***** depot failure: ");
        Mojo.Controller.errorDialog("This is not good!.  Settings database failed to load.  Error Message: ");
    },

    getSize:function()
    {
        this.depot.getBucketSize("defaultbucket", this.gotSize.bind(this), null);
    },

    gotSize:function(size)
    {
        this.depotSize = size;
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

    //**************************************************************************
    //Archived Items Management
    //**************************************************************************

    //Global
    discardSavedData: function(account) {
        this.DumpSavedArtists(account);
        this.DumpSavedAlbums(account);
    },

    //**************************************************************************
    //            Artists
    areArtistsCurrent: function(account, server) {
        var current = false;
        var key = "artists_" + account.uniqueID;
        var currentSignature = server.getServerDataTimeSignature();
        if ((account.ArchivedArtists) && (account.ArchivedArtists.key === key) && (account.ArchivedArtists.archiveSignature === currentSignature) && (server.artists === account.ArchivedArtists.numItems)) {
            current = true;
        } else {
            this.DumpSavedArtists(account, "Artists are not current, erasing");
        }
        return current;
    },

    DumpSavedArtists: function(account, dumpString) {
        var key = "artists_" + account.uniqueID;
        if(!dumpString)
        {
            dumpString = "Saved artists have been erased";
        }


        if (account.ArchivedArtists && account.ArchivedArtists.key !== "") {
            this.depot.discard(account.ArchivedArtists.key, this.bannerMessage.bind(this, dumpString),
            function() {
                Mojo.Controller.errorDialog("Error attempting to erase artists")
            }

            );
            account.ArchivedArtists = new ArchivedItems();
            this.SaveSettings();

        }

    },

    artistsSavePending: false,

    SaveArtists: function(account, artists, signature) {
        var key = "artists_" + account.uniqueID;
        if ((account.ArchivedArtists.archiveSignature !== signature)||(account.ArchivedArtists===null)) {
            this.artistsSavePending = true;
            this.bannerMessage("Saving Artists...");
            this.depot.add(key, artists, this.ArtistsSaved.bind(this, account, key, signature),
            function() {
                Mojo.Controller.errorDialog("Arists Not Saved!");
                AmpacheMobile.settingsManager.artistsSavePending = false;

            });
        }
    },

    ArtistsSaved: function(account, key, signature) {
        account.ArchivedArtists = new ArchivedItems();
        account.ArchivedArtists.archiveSignature = signature;
        account.ArchivedArtists.key = key;
        account.ArchivedArtists.numItems = AmpacheMobile.ampacheServer.artists;
        this.SaveSettings();

        this.bannerMessage(account.ArchivedArtists.numItems + " artists have been saved");
        this.artistsSavePending = false;
    },

    FetchSavedArtists: function(account, server) {
        if (account.ArchivedArtists.key !== "") {
            //Mojo.Controller.errorDialog("Fetching Archived Artists!");
            if (this.artistsSavePending === false) {
                this.depot.get(account.ArchivedArtists.key, server.GetArtistsCallback,
                function() {
                    Mojo.Controller.errorDialog("Failed to Retrieve Saved Artists")
                })
            }

            else {
                Mojo.Controller.errorDialog("Artists Lookup Blocked while artists saving");
            }

        } else {
            Mojo.Controller.errorDialog("Opps!")
        }
    },

    //**************************************************************************
    //            Albums
    areAlbumsCurrent: function(account, server) {
        var current = false;
        var key = "albums_" + account.uniqueID;
        var currentSignature = server.getServerDataTimeSignature();
        if ((account.ArchivedAlbums) && (account.ArchivedAlbums.key === key) && (account.ArchivedAlbums.archiveSignature === currentSignature) && (server.albums === account.ArchivedAlbums.numItems)) {
            current = true;
        } else {
            this.DumpSavedAlbums(account,  "Albums are not current, erasing");
        }
        return current;
    },

    DumpSavedAlbums: function(account, dumpString) {
        var key = "albums_" + account.uniqueID;

        if(!dumpString)
        {
            dumpString = "Saved albums have been erased.";
        }

        if (account.ArchivedAlbums && account.ArchivedAlbums.key !== "") {
            this.depot.discard(account.ArchivedAlbums.key, this.bannerMessage.bind(this, dumpString),
            function() {
                Mojo.Controller.errorDialog("Error dumping albums")
            }

            );
            account.ArchivedAlbums = new ArchivedItems();
            this.SaveSettings();
        }
        //Mojo.Controller.errorDialog("Albums Saved!")

    },

    albumsSavePending: false,

    SaveAlbums: function(account, artists, signature) {
        var key = "albums_" + account.uniqueID;
        if ((account.ArchivedAlbums.archiveSignature !== signature) || (account.ArchivedAlbums===null)) {
            this.albumsSavePending = true;
            this.bannerMessage("Saving Albums...");

            this.depot.add(key, artists, this.AlbumsSaved.bind(this, account, key, signature),
            function() {
                Mojo.Controller.errorDialog("Saving Albums Failed")

            });
        }
    },

    AlbumsSaved: function(account, key, signature) {
        account.ArchivedAlbums = new ArchivedItems();
        account.ArchivedAlbums.archiveSignature = signature;
        account.ArchivedAlbums.key = key;
        account.ArchivedAlbums.numItems = AmpacheMobile.ampacheServer.albums;
        this.SaveSettings();

        this.bannerMessage(account.ArchivedAlbums.numItems + " albums have been saved");
        this.albumsSavePending = false;
    },

    FetchSavedAlbums: function(account, server) {
        var fetched = false;
        if (account.ArchivedAlbums.key !== "") {
            
            //Mojo.Controller.errorDialog("Fetching Archived Albums!");
            if(this.albumsSavePending===false)
            {
            this.depot.get(account.ArchivedAlbums.key, server.GetAlbumsCallback,
            function() {
                Mojo.Controller.errorDialog("Failed to Retrieve Archived Albums")
            })
            }
            fetchched = true;
        } else {
            Mojo.Controller.errorDialog("Opps!")
        }
        return fetched;
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
                this.settings.BackgroundColor = "";
            }
            if (!this.settings.BackgroundImage) {
                this.settings.BackgroundImage = DEFAULT_IMAGE;
                this.settings.BackgroundColor = DEFAULT_COLOR;
            }
            if (!this.settings.StreamDebug) {
                this.settings.StreamDebug = false;
            }
            if (!this.settings.BackgroundMode) {
                this.settings.BackgroundMode = CUSTOM_COLOR;
            }
            if (!this.settings.AlbumsSort) {
                this.settings.AlbumsSort = 0;
            }
            if (!this.settings.AllowRotation) {
                this.settings.AllowRotation = DEFAULT_ROTATION;
            }

            if (!this.settings.npPlayingListView) {
                this.settings.npPlayingListView = false;
            }

            if (!this.settings.SearchType) {
                this.settings.SearchType = SEARCH_GLOBAL;
            }

            if (!this.settings.UseCustomColor) {
                this.settings.UseCustomColor = false;
            }

            if (!this.settings.CustomColor) {
                this.settings.CustomColor = '#FFFFFF';
            }

            if (!this.settings.CSSTheme) {
                this.settings.CSSTheme = THEME_DARK;
            }

            if (!this.settings.Recent) {
                this.settings.Recent = 0;
            }

            //this.settings.Version = Mojo.Controller.appInfo.version;

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

                if (!this.settings.Accounts[i].ArchivedArtists) {
                    this.settings.Accounts[i].ArchivedArtists = new ArchivedItems();
                }

                if (!this.settings.Accounts[i].ArchivedAlbums) {
                    this.settings.Accounts[i].ArchivedAlbums = new ArchivedItems();
                }

                if (!this.settings.Accounts[i].uniqueID) {
                    var date = new Date();
                    this.settings.Accounts[i].uniqueID = this.settings.Accounts[i].AccountName + "_" + date.getTime();
                }
                
                if (!this.settings.Accounts[i].NumBuffers) {    
                    this.settings.Accounts[i].NumBuffers = 2;
                }
                
                if (!this.settings.Accounts[i].ApacheTimeout) {    
                    this.settings.Accounts[i].ApacheTimeout = 120;
                }
                
                

            }
            this.SaveSettings(null, null);
        }
    },

    bannerMessage: function(message) {
        if(Mojo.Host.current === Mojo.Host.browser)
        {
            alert(message);
        }
        else
        {
        Mojo.Controller.getAppController().showBanner(message, {
            source: 'notification'
        });
        }
        //else
        //{
        //    alert(message);
        //}
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
    uniqueID: null,
    UserName: null,
    Password: null,
    ServerURL: null,
    ExtraCoverArt: false,
    StallRecovery: false,
    FetchSize: DEFAULT_FETCH_SIZE,
    ArchivedArtists: null,
    ArchivedAlbums: null,
    NumBuffers:2,
    ApacheTimeout:120,
    
    initialize: function() {
        this.ArchivedArtists = new ArchivedItems();
        this.ArchivedAlbums = new ArchivedItems();
    }
});

ArchivedItems = Class.create({
    archiveSignature: "",
    key: "",
    numItems: 0,
    initialize: function() {
        this.archiveSignature = "";
        this.key = "";
        this.numItems = "";
    }
});

//ArchiveDate = Class.create({
//    add:null,
//    clean:null,
//    update:null
//}),

Settings = Class.create({
    Accounts: null,
    CurrentAccountIndex: null,
    StreamDebug: false,
    Version: "unknown",
    AllowRotation: DEFAULT_ROTATION,
    BackgroundColor: DEFAULT_COLOR,
    BackgroundImage: DEFAULT_IMAGE,
    BackgroundSolid: DEFAULT_IMAGE,
    BackgroundMode: CUSTOM_COLOR,
    BackgroundOverlay: DEFAULT_OVERLAY,
    Recent: 0,
    AlbumsSort: 0,
    npPlayingListView: false,
    SearchType: 0,
    UseCustomColor: false,
    CustomColor: '#FFFFFF',
    /*white*/
    CSSTheme: THEME_DARK
});