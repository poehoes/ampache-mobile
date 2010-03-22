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
       
        {
            category: $L("bottom"),
            directory: $L("artists"),
            name: $L("Artists"),
            scene: $L("artists"),
            description: $L(AmpacheMobile.ampacheServer.artists.toString()),
            icon: "images/icons/artists.png",
            index:0
        },

        {
            category: $L("bottom"),
            directory: $L("albums"),
            name: $L("Albums"),
            scene: $L("albums"),
            description: $L(AmpacheMobile.ampacheServer.albums.toString()),
            icon: "images/icons/albums.png",
            displayCount: "",
            index:1
        },
        {
            category: $L("bottom"),
            directory: $L("playlists"),
            name: $L("Playlists"),
            scene: "playlists",
            description: $L(AmpacheMobile.ampacheServer.playlists.toString()),
            icon: "images/icons/playlists.png",
            displayCount: "",
            index:2
        },
        {
            category: $L("bottom"),
            directory: $L("genres"),
            name: $L("Genres"),
            scene: "genres",
            description: AmpacheMobile.ampacheServer.tags===null? 0: AmpacheMobile.ampacheServer.tags.toString(),
            icon: "images/icons/genres.png",
            displayCount: AmpacheMobile.ampacheServer.tags===null? "none":"" ,
            index:3
        },
        {
            category: $L("bottom"),
            directory: $L("random"),
            name: $L("Random"),
            scene: "random",
            description: 0,
            icon: "images/icons/random.png",
            displayCount: "none",
            index:4
        },
        {
            category: $L("bottom"),
            directory: $L("recent"),
            name: $L("Recent"),
            scene: "recent",
            description: 0,
            icon: "images/icons/recent.png",
            displayCount: "none",
            index:5
        }
        ];

        this.controller.setupWidget('mainMenuList', {
            itemTemplate: 'mainmenu/listitem'
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
        
        //Key Handler
        this.pushSearch = this.pushSearch.bindAsEventListener(this);
        this.controller.listen(this.controller.sceneElement, Mojo.Event.keydown, this.pushSearch);
        
        //Hold Handler
        this.listHeldHandler = this.listHeldHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('mainMenuList'), Mojo.Event.hold, this.listHeldHandler);

    },

    cleanup: function(event) {

        Mojo.Log.info("--> ArtistsAssistant.prototype.cleanup");
        this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keydown, this.pushSearch);
        
        Mojo.Event.stopListening(this.controller.get('mainMenuList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.controller.get('search'), Mojo.Event.tap, this.searchTapHandler);
        Mojo.Event.stopListening(this.controller.get('mainMenuList'), Mojo.Event.hold, this.listHeldHandler);

        if (AmpacheMobile.audioPlayer.PlayListPending === true) {
                AmpacheMobile.audioPlayer.stop();
                AmpacheMobile.audioPlayer.PlayListPending = false;
        }
        
        
        AmpacheMobile.ampacheServer.disconnect();
        Mojo.Log.info("<-- ArtistsAssistant.prototype.cleanup");
    },    

    pushSearch: function(event) {
        var params ={};
        var searchScene = {transition: AmpacheMobile.Transition, name: "search-menu"};
        
        if(event.type !=="mojo-tap")
        {    
            params.key  = String.fromCharCode(event.originalEvent.keyCode);
            var myRegxp = /([a-zA-Z0-9]+)$/;
            if(myRegxp.test(params.key) === true)
            { 
                this.controller.stageController.pushScene(searchScene, params);
            }
        }
        else
        {
            this.controller.stageController.pushScene(searchScene,params);
        }
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
        case "recent":
            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "recent"
            });
            break;
        case "shuffleAll":
            playlist = AmpacheMobile.ampacheServer.GetRandomSongs(1);
            this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "now-playing"
                },
                {
                    type: "play",
                    playList: playlist,
                    startIndex: 0,
                    shuffle: false,
                    repeat:RepeatModeType.repeat_forever
                });
            break;
        }
        //this.controller.stageController.assistant.showScene(event.item.directory, event.item.scene)
        Mojo.Log.info("<-- listTapHandler");
    },

    listHeldHandler:function(event)
    {
        var node = event.down.target;
        var regex = /row_([0-9+])_main/;
        var index = null;
        
        while(node && (index===null))
        {
            var matches = node.id.match(new RegExp(regex));
            if(matches)
            {
                index = Number(matches[1]);
            }
            else
            {
                node = node.parentNode;
            }
        }
        
        if(index)
        {
            switch(this.mainmenu[index].scene)
            {
                case "recent":
                    
                    
                    var fromDate = new Date();
                    switch (AmpacheMobile.settingsManager.settings.Recent) {
                        case 0:
                        //"Last Update"
                            fromDate = AmpacheMobile.ampacheServer.add.clone();
                            fromDate.addHours( - 2);
                            break;
                        case 1:
                        //"1 Week"
                            fromDate.addDays( - 7);
                            break;
                        case 2:
                        //"1 Month"
                            fromDate.addMonths( - 1);
                            break;
                        case 3:
                        //"3 Months"
                            fromDate.addMonths( - 3);
                            break;
                    }
                    
                    var fromDateStr = "Since " + Mojo.Format.formatDate(fromDate, {
                        date: "short"
                    });
                    
                    this.controller.stageController.pushScene({
                            transition: AmpacheMobile.Transition,
                            name: "songs"
                        },
                        {
                            SceneTitle: "Recent Songs: " + fromDateStr,
                            Type: "recent",
                            DisplayArtistInfo: true,
                            FromDate:fromDate
                        });
                    break;
            }
            
        }
        
        //this.showDialogBox("Held", index);
        event.stop();
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
        
        /*if(AmpacheMobile.ampacheServer.version==="")        {
            this.controller.get('ampache-version').innerHTML = "Requesting Server Version";    
            AmpacheMobile.ampacheServer._ping(this.UpdateServerVersion.bind(this));
        }
        else {
            this.UpdateServerVersion();
        }*/
    },

    UpdateServerVersion:function(){
        if( AmpacheMobile.ampacheServer.version)
        {
            this.controller.get('ampache-version').innerHTML = "Server Version: " + AmpacheMobile.ampacheServer.version;    
        }
        else
        {
              this.controller.get('ampache-version').hide();    
          
        }
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
            
            this.controller.stageController.popScene(null);
        }
    },

    handleCommand: function(event) {
        //test for Mojo.Event.back, not Mojo.Event.command..
        
        if(event.type === Mojo.Event.forward)
        {
            if(AmpacheMobile.audioPlayer.PlayListPending === true)
            {
                this.showNowPlaying();
            }
        }
        else if (event.type === Mojo.Event.back) {
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
                        label: $L('Delete Now Playing'),
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