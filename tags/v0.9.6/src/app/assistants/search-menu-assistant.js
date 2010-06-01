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
SearchMenuAssistant = Class.create({
    initialize: function(params) {
        if(params.key)
        {
            this.sentKey = params.key;
        }
        
    },

    setup: function() {
        //*****************************************************************************************************
        // Setup Menu
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);


        //this.savedSearchModel = {
        //    label: $L('Saved Searches'),
        //    //icon: 'forward',
        //    iconPath: "images/icons/SavedSearch-small.png",
        //    command: 'saved-searches'
        //};
        //this.cmdMenuModel = {
        //    visible: true,
        //    items: [{},
        //    this.savedSearchModel]
        //};
        //this.cmdMenuProps = {
        //    visible: true,
        //    items: [{},
        //    //Left group 
        //    {
        //        label: 'Saved Searches',
        //        command: 'saved-searches'
        //    },
        //    //Center 
        //    {} //Right
        //    ]
        //};
        //this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuProps);

        //this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
        

         this.searchModel = {};
         if(this.sentKey)
         {
            this.searchModel.value = this.sentKey;
         }
        
        this.controller.setupWidget("search-field", {
            autoFocus: true,
            autoReplace: false,
            requiresEnterKey: true,
            //textCase: Mojo.Widget.steModeLowerCase,
            enterSubmits: true
        },
        this.searchModel
        );
        
        this.SearchField = this.controller.get("search-field");

        this.notifyUserBack = this.controller.get("notifyuser-back");

        //*****************************************************************************************************
        // Search Event
        this.searchTextChanged = this.searchTextChanged.bindAsEventListener(this);
        this.controller.listen("search-field", Mojo.Event.propertyChange, this.searchTextChanged);

        this.savedSearchesTapped = this.savedSearchesTapped.bindAsEventListener(this);
        this.controller.listen(this.controller.get("saved-searches"), Mojo.Event.tap, this.savedSearchesTapped);
       

        this.artistSearchHandler = this.searchForArtists.bindAsEventListener(this);
        this.controller.listen(this.controller.get('searchArtists'), Mojo.Event.tap, this.artistSearchHandler);

        this.albumSearchHandler = this.searchForAlbums.bindAsEventListener(this);
        this.controller.listen(this.controller.get('searchAlbums'), Mojo.Event.tap, this.albumSearchHandler);

        this.songsSearchHandler = this.searchForSongs.bindAsEventListener(this);
        this.controller.listen(this.controller.get('searchSongs'), Mojo.Event.tap, this.songsSearchHandler);

        this.plSearchHandler = this.searchForPlaylists.bindAsEventListener(this);
        this.controller.listen(this.controller.get('searchPlaylists'), Mojo.Event.tap, this.plSearchHandler);
        
        this.videoSearchHandler = this.searchForVideos.bindAsEventListener(this);
        this.controller.listen(this.controller.get('searchVideos'), Mojo.Event.tap, this.videoSearchHandler);

        //this.genresSearchHandler = this.searchForGenres.bindAsEventListener(this);
        //this.controller.listen(this.controller.get('searchGenres'), Mojo.Event.tap, this.genresSearchHandler);
        this.globalSearchHandler = this.searchForGlobal.bindAsEventListener(this);
        this.controller.listen(this.controller.get('searchGlobal'), Mojo.Event.tap, this.globalSearchHandler);

        this.keypressHandler = this.handleKeyPressEvent.bindAsEventListener(this);
        this.controller.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keypressHandler);
        this.controller.listen(this.controller.sceneElement, Mojo.Event.keydown, this.keypressHandler);
        
        this.leaveSceneHandler = this.leaveSceneHandler.bindAsEventListener(this);
        this.controller.listen(this.controller.sceneElement, Mojo.Event.keyup, this.leaveSceneHandler);
        
    },

    


    cleanup: function(event) {
        this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keypressHandler);
        this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keydown, this.keypressHandler);
        this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keyup, this.leaveSceneHandler);
        this.controller.stopListening("search-field", Mojo.Event.propertyChange, this.searchTextChanged);
        this.controller.stopListening(this.controller.get('searchArtists'), Mojo.Event.tap, this.artistSearchHandler);
        this.controller.stopListening(this.controller.get('searchAlbums'), Mojo.Event.tap, this.albumSearchHandler);
        this.controller.stopListening(this.controller.get('searchSongs'), Mojo.Event.tap, this.songsSearchHandler);
        this.controller.stopListening(this.controller.get('searchPlaylists'), Mojo.Event.tap, this.plSearchHandler);
        //this.controller.stopListening(this.controller.get('searchGenres'), Mojo.Event.tap, this.genresSearchHandler);
        this.controller.stopListening(this.controller.get('searchGlobal'), Mojo.Event.tap, this.globalSearchHandler);
        this.controller.stopListening(this.controller.get('searchVideos'), Mojo.Event.tap, this.videoSearchHandler);
        this.controller.stopListening(this.controller.get("saved-searches"), Mojo.Event.tap, this.savedSearchesTapped);
    },

    searchText: null,
    searchTextChanged: function(event) {
        Mojo.Log.info("searchText Changed; value = ", event.value);
        this.searchText = event.value;
        if (event.originalEvent.keyCode) {
            if (event.originalEvent.keyCode === 13) {
                switch(AmpacheMobile.settingsManager.settings.SearchType)
                {
                    case SEARCH_ALBUMS:
                        this.searchForAlbums();
                        break;
                    case SEARCH_ARTISTS:
                        this.searchForArtists();
                        break;
                    case SEARCH_SONGS:
                        this.searchForSongs();
                        break;
                    case SEARCH_PLAYLISTS:
                        this.searchForPlaylists();
                        break;
                    case SEARCH_VIDEOS:
                        this.searchForVideos();
                        break;
                    default:
                        this.searchForGlobal();
                        break;
                }
            }
        }
    },

    handleKeyPressEvent: function(event) {
        /*
         var eventModel =
         {
         eventType: event.type,
         eventKeyCode: event.originalEvent.keyCode,
         eventChar: String.fromCharCode(event.originalEvent.keyCode)
         };
         */
        this.SetFocus();
        search = this.controller.get('search-test');
        // var text = this.SearchField.mojo.getValue();
        // text += String.fromCharCode(event.originalEvent.keyCode);
        // his.SearchField.mojo.setValue(text);
        //var content = Mojo.View.render({template: "input/keyPress/evententry", object: eventModel});    
        //this.div.insert(content);
    },

    leaveSceneHandler:function(event)
    {
        if(event.originalEvent.keyCode === Mojo.Char.backspace)
        {
            if(this.SearchField.mojo.getValue() === "")
            {
                this.notifyUserBack.style.display = "inline";
                if(this.exitOnDelete===true)
                {
                    this.controller.stageController.popScene(); 
                }
                this.exitOnDelete = true;
            }
            else
            {
                this.notifyUserBack.style.display = "none";
                this.exitOnDelete = false;
            }
        }
         else
        {
            this.notifyUserBack.style.display = "none";
            this.exitOnDelete = false;
        }
    },

    searchCriteria: function(numChars) {
        var retVal = false;
        if ((this.searchText !== "") && (this.searchText)) {
            if (this.searchText.length >= numChars) {
                retVal = true;
            } else {
                this.showDialogBox("Search", "Please enter at least " + numChars + " characters for your search.");
            }
        } else {
            this.showDialogBox("Search", "Please enter a search string");
        }
        return retVal;
    },

    searchForAlbums: function() {
        if (this.searchCriteria(2)) {
            var numAlbums = parseInt(AmpacheMobile.ampacheServer.albums, 10);
            if (numAlbums !== 0) {
                this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "albums"}, {
                    SceneTitle: "Album Search: " + this.searchText,
                    DisplayArtistInfo: true,
                    ExpectedAlbums: numAlbums,
                    Search: this.searchText === "" ? null: this.searchText
                });
            }
        }
    },

    searchForPlaylists: function() {
        if (this.searchCriteria(2)) {
            var numPlaylists = parseInt(AmpacheMobile.ampacheServer.playlists, 10);
            if (numPlaylists !== 0) {
                this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "playlists"}, {
                    SceneTitle: "Playlist Search: " + this.searchText,
                    Search: this.searchText === "" ? null: this.searchText,
                    ExpectedPlaylists: numPlaylists
                });
            }
        }
    },

    searchForGenres: function() {
        if (this.searchCriteria(2)) {
            var numSongs = parseInt(AmpacheMobile.ampacheServer.songs, 10); //using numsongs because there is no num genres (numsongs is worst case)
            this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "genres"}, {
                SceneTitle: "Genre Search: " + this.searchText,
                Search: this.searchText === "" ? null: this.searchText
            });
        }
    },

    searchForSongs: function() {
        if (this.searchCriteria(2)) {
            var numSongs = parseInt(AmpacheMobile.ampacheServer.songs, 10);
            this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "songs"}, {
                SceneTitle: "Song Search: " + this.searchText,
                Type: "search",
                DisplayArtistInfo: true,
                ExepectedSongs: numSongs,
                Search: this.searchText === "" ? null: this.searchText
            });
        }
    },

    searchForGlobal: function() {
        if (this.searchCriteria(2)) {
            var numSongs = parseInt(AmpacheMobile.ampacheServer.songs, 10);
            this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "songs"}, {
                Type: "search-global",
                SceneTitle: "Global Search: " + this.searchText,
                DisplayArtistInfo: true,
                ExepectedSongs: numSongs,
                Search: this.searchText === "" ? null: this.searchText
            });
        }
    },

    searchForArtists: function() {
        if (this.searchCriteria(2)) {
            var numArtists = parseInt(AmpacheMobile.ampacheServer.artists, 10);
            if (numArtists !== 0) {
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "artists"
                },
                {
                    SceneTitle: "Artist Search: " + this.searchText,
                    ExpectedArtists: numArtists,
                    Search: this.searchText === "" ? null: this.searchText
                });
            }
        }
    },

    searchForVideos: function() {
        if (this.searchCriteria(2)) {
            var numVideos = parseInt(AmpacheMobile.ampacheServer.videos, 10);
            if (numVideos !== 0) {
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "videos"
                },
                {
                    SceneTitle: "Video Search: " + this.searchText,
                    ExpectedVideos: numVideos,
                    Search: this.searchText === "" ? null: this.searchText
                });
            }
        }
    },


    SetFocus: function() {
        this.SearchField.mojo.focus();
    },

    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message) {
        this.controller.showAlertDialog({
            onChoose: this.SetFocus.bind(this),
            title: title,
            message: message,
            choices: [{
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    },

    TurnOnSpinner: function(spinnerText) {
        this.scrim.show();
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
    },

    TurnOffSpinner: function() {
        this.scrim.hide();
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
    },

    activate: function(event) {
        this.controller.get("search-field").mojo.focus();
        // Now Playing Button
        var button = this.controller.get('now-playing-button');
        button.style.display = AmpacheMobile.audioPlayer.hasPlayList ? 'block': 'none';
        this.npTapHandler = this.showNowPlaying.bindAsEventListener(this);
        Mojo.Event.listen(button, Mojo.Event.tap, this.npTapHandler);
        
        //Setup Search Help
        this.controller.get("search-"+SEARCH_TYPES[AmpacheMobile.settingsManager.settings.SearchType]).src = "images/enter.png";
        
    },

     handleCommand: function(event) {
        //test for Mojo.Event.back, not Mojo.Event.command..
        
          if (event.type === Mojo.Event.command) {
            switch (event.command) {
                case "saved-searches":
                     this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "saved-searches"
                },
                {
        
                });
                break;
            }
          }
    },

    savedSearchesTapped:function()
    {
    this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "saved-searches"
                },
                {
        
                });
    },


    deactivate: function(event) {

        Mojo.Event.stopListening(this.controller.get('now-playing-button'), Mojo.Event.tap, this.npTapHandler);
    },

    showNowPlaying: function() {
        Mojo.Controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "now-playing"}, {
            type: "display"
        });
    }

});