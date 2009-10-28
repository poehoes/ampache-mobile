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
MainmenuAssistant = Class.create({
    initialize: function() {
        /* this is the creator function for your scene assistant object. It will be passed all the 
         additional parameters (after the scene name) that were passed to pushScene. The reference
         to the scene controller (this.controller) has not be established yet, so any initialization
         that needs the scene controller should be done in the setup function below. */
        this.getPending = false;
        this.ArtistList = null;
        this.AlbumsList = null;
        this.SongsList = null;
    },

    setup: function() {
        Mojo.Log.info("--> setup");

        var title = this.controller.get('title');
        title.innerHTML = AmpacheMobile.Account.AccountName;

        this.spinnerAttrs = {
            spinnerSize: 'small'
        };
        this.spinnerModel = {
            spinning: false
        };
        this.controller.setupWidget('mainmenu-spinner', this.spinnerAttrs, this.spinnerModel);
        this.mainmenu = [
        /*
         {
         category: $L("top"),
         directory: $L("search"),
         name: $L("Search"),
         scene: $L("search"),
         description: null,
         icon: "images/icons/search.png"
         
         },
         */
        {
            category: $L("bottom"),
            directory: $L("artists"),
            name: $L("Artists"),
            scene: $L("artists"),
            description: $L(AmpacheMobile.ampacheServer.artists.toString()),
            icon: "images/icons/artists.png"
        },

        {
            category: $L("bottom"),
            directory: $L("albums"),
            name: $L("Albums"),
            scene: $L("albums"),
            description: $L(AmpacheMobile.ampacheServer.albums.toString()),
            icon: "images/icons/albums.png",
            displayCount: ""
        },

        /*
         {
         category: $L("bottom"),
         directory: $L("songs"),
         name: $L("Songs"),
         scene: $L("songs"),
         icon: "images/songs.png",
         description: $L(AmpacheMobile.ampacheServer.songs.toString())
         },*/
        {
            category: $L("bottom"),
            directory: $L("playlists"),
            name: $L("Playlists"),
            scene: $L("playlists"),
            description: $L(AmpacheMobile.ampacheServer.playlists.toString()),
            icon: "images/icons/playlists.png",
            displayCount: ""
        },

        {
            category: $L("bottom"),
            directory: $L("genres"),
            name: $L("Genres"),
            scene: $L("genres"),
            description: 0,
            icon: "images/icons/genres.png",
            displayCount: "none"
        },
        {
            category: $L("bottom"),
            directory: $L("random"),
            name: $L("Random"),
            scene: $L("random"),
            description: 0,
            icon: "images/icons/random.png",
            displayCount: "none"
        }

        /*{
         category: $L("bottom"),
         directory: $L("preferences"),
         name: $L("Preferences"),
         scene: $L("preferences"),
         //description: $L(AmpacheMobile.ampacheServer.playlists.toString()),
         icon: "images/settings.png"
         },*/
        /* 
         {
         category: $L("bottom"),
         directory: $L("genre"),
         name: $L("Genre"),
         scene: $L("genre"),
         description: ""
         }, */
        ];

        this.controller.setupWidget('mainMenuList', {
            itemTemplate: 'mainmenu/listitem'
            //dividerTemplate: 'mainmenu/divider',
            //dividerFunction: this.dividerFunc.bind(this)
        },
        {
            items: this.mainmenu
        });

        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);

        //****************************************************************************************************
        // Setup Screen Rotation
        if (AmpacheMobile.settingsManager.settings.AllowRotation === true) {
            /* Allow this stage to rotate */
            if (this.controller.stageController.setWindowOrientation) {
                this.controller.stageController.setWindowOrientation("free");
            }
        } else {
            /* Allow this stage to rotate */
            if (this.controller.stageController.setWindowOrientation) {
                this.controller.stageController.setWindowOrientation("up");
            }
        }

        // Menu Tap Event
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('mainMenuList'), Mojo.Event.listTap, this.listTapHandler);

        //*****************************************************************************************************
        // Search Event
        this.searchTapHandler = this.pushSearch.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('search'), Mojo.Event.tap, this.searchTapHandler);

    },

    cleanup: function(event) {
        /* this function should do any cleanup needed before the scene is destroyed as 
         a result of being popped off the scene stack */
        Mojo.Log.info("--> ArtistsAssistant.prototype.cleanup");
        Mojo.Event.stopListening(this.controller.get('mainMenuList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.controller.get('search'), Mojo.Event.tap, this.searchTapHandler);

        AmpacheMobile.audioPlayer.PlayListPending = false;
        AmpacheMobile.ampacheServer.StopPing();
        Mojo.Log.info("<-- ArtistsAssistant.prototype.cleanup");
    },

    pushSearch: function() {
        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "search-menu"
        });
    },

    listTapHandler: function(event) {
        Mojo.Log.info("--> listTapHandler: " + event.item.scene);
        switch (event.item.scene) {
        case "artists":
            var numArtists = parseInt(AmpacheMobile.ampacheServer.artists, 10);
            if (numArtists !== 0) {
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "artists"
                },
                {
                    SceneTitle: "Artists",
                    ExpectedArtists: numArtists
                });
            }
            this.getPending = false;
            //this.TurnOffSpinner("Getting Artists");
            break;
        case "albums":
            Mojo.Log.info("Pushing Albums");
            var numAlbums = parseInt(AmpacheMobile.ampacheServer.albums, 10);
            if (numAlbums !== 0) {
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "albums"
                },
                {
                    SceneTitle: "Albums",
                    DisplayArtistInfo: true,
                    ExpectedAlbums: numAlbums
                    //AlbumsList: _albumsList,
                });
            }
            this.getPending = false;
            //this.TurnOffSpinner("Getting Albums");
            break;
        case "playlists":
            var numPlaylists = parseInt(AmpacheMobile.ampacheServer.playlists, 10);
            if (numPlaylists !== 0) {
                Mojo.Log.info("Pushing Playlists");
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "playlists"
                },
                {
                    SceneTitle: "Playlists",
                    ExpectedPlaylists: numPlaylists
                });
            }
            this.getPending = false;
            //this.TurnOffSpinner("Getting Albums");
            break;
        case "songs":
            this.controller.stageController.pushScene({
                transition:
                AmpacheMobile.Transition,
                name: "songs"
            },
            {

                SceneTitle: "Songs",
                Type: "all-songs",
                Item: event.item

            });
            break;
        case "genres":
            this.controller.stageController.pushScene({
                transition:
                AmpacheMobile.Transition,
                name: "genres"
            },
            {
                SceneTitle: "Genres",
                Type: "all-genres"
            });
            break;
        case "random":
            this.controller.stageController.pushScene({
                transition:
                AmpacheMobile.Transition,
                name: "random"
            },
            {
                SceneTitle: "Random",
                Type: "all-genres"
            });
            break;
        }
        //this.controller.stageController.assistant.showScene(event.item.directory, event.item.scene)
        Mojo.Log.info("<-- listTapHandler");
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
    },

    TurnOnSpinner: function(spinnerText) {
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
    },

    TurnOffSpinner: function() {
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
    },

    /*
     * This function will push a passed in scene.  The reason we are using a special function here is that
     * for file organization purposes we have put the scene files in sub directories & to load them requires that
     * we use the name and sceneTemplate properties when pushing the scenes.
     */
    showScene: function(sceneName, directory) {
        Mojo.Log.info("--> showScene");
        this.controller.stageController.pushScene({
            name: sceneName,
            sceneTemplate: directory + "/" + sceneName + "/" + sceneName + "-scene"
        });
        Mojo.Log.info("<-- showScene");
    },

    activate: function(event) {
        // Now Playing Button
        var button = this.controller.get('now-playing-button');
        button.style.display = AmpacheMobile.audioPlayer.PlayListPending ? 'block': 'none';
        this.npTapHandler = this.showNowPlaying.bindAsEventListener(this);
        Mojo.Event.listen(button, Mojo.Event.tap, this.npTapHandler);
    },

    deactivate: function(event) {

        Mojo.Log.info("--> ArtistsAssistant.prototype.deactivate");
        Mojo.Event.stopListening(this.controller.get('now-playing-button'), Mojo.Event.tap, this.npTapHandler);
        Mojo.Log.info("<-- ArtistsAssistant.prototype.deactivate");
    },

    showNowPlaying: function() {
        Mojo.Controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "now-playing"
        },
        {
            type: "display"
        });
    },

    stopMusic: function(value) {

        if (value === "stopMusic") {
            if (AmpacheMobile.audioPlayer.PlayListPending === true) {
                AmpacheMobile.audioPlayer.stop();
            }
            this.controller.stageController.popScene(null);
        }
    },

    handleCommand: function(event) {
        //test for Mojo.Event.back, not Mojo.Event.command..
        if (event.type === Mojo.Event.back) {
            if (AmpacheMobile.audioPlayer.PlayListPending === true) {
                event.preventDefault();
                event.stopPropagation();
                this.controller.showAlertDialog({
                    onChoose: this.stopMusic,
                    title: $L("Are you sure?"),
                    message: "Going back will close your current now playing list and stop your music.",
                    choices: [{
                        label: $L('Cancel'),
                        value: 'ok',
                        type: 'primary'
                    },
                    {
                        label: $L('Stop Music'),
                        value: 'stopMusic',
                        type: 'negative'
                    }]
                });
            }
        }
    },

    dividerFunc: function(itemModel) {
        return itemModel.category; // We're using the item's category as the divider label.
    }
});