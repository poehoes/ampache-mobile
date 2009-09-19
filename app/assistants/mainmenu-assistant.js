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
MainmenuAssistant = Class.create(
{

    initialize: function()
    {
        /* this is the creator function for your scene assistant object. It will be passed all the 
         additional parameters (after the scene name) that were passed to pushScene. The reference
         to the scene controller (this.controller) has not be established yet, so any initialization
         that needs the scene controller should be done in the setup function below. */
        this.getPending = false;
        this.ArtistList = null;
        this.AlbumsList = null;
        this.SongsList = null;
        
    },
    
    setup: function()
    {
        Mojo.Log.info("--> setup");
        
        
        
        
        
        this.spinnerAttrs = 
        {
            spinnerSize: 'small'
        }
        
        this.spinnerModel = 
        {
            spinning: false
        }
        
        this.controller.setupWidget('mainmenu-spinner', this.spinnerAttrs, this.spinnerModel);
        
        
        this.mainmenu = [
        
        /*
         {
         category: $L("top"),
         directory: $L("search"),
         name: $L("Search"),
         scene: $L("search"),
         description: null,
         icon: "images/search.png"
         
         },
         */
        {
            category: $L("bottom"),
            directory: $L("artists"),
            name: $L("Artists"),
            scene: $L("artists"),
            description: $L(AmpacheMobile.ampacheServer.artists.toString()),
            icon: "images/artists.png"
        }, 
        {
            category: $L("bottom"),
            directory: $L("albums"),
            name: $L("Albums"),
            scene: $L("albums"),
            description: $L(AmpacheMobile.ampacheServer.albums.toString()),
            icon: "images/albums.png"
        }, 
        /*
         {
         category: $L("bottom"),
         directory: $L("songs"),
         name: $L("Songs"),
         scene: $L("songs"),
         description: $L(AmpacheMobile.ampacheServer.songs.toString())
         },
         */
        {
            category: $L("bottom"),
            directory: $L("playlists"),
            name: $L("Playlists"),
            scene: $L("playlists"),
            description: $L(AmpacheMobile.ampacheServer.playlists.toString()),
            icon: "images/playlists.png"
        }        /*{
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
        
        
        this.controller.setupWidget('mainMenuList', 
        {
            itemTemplate: 'mainmenu/listitem'
            //dividerTemplate: 'mainmenu/divider',
            //dividerFunction: this.dividerFunc.bind(this)
        }, 
        {
            items: this.mainmenu
        });
        
        // Watch for taps on the list items	
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('mainMenuList'), Mojo.Event.listTap, this.listTapHandler);
        
        Mojo.Log.info("<-- setup");
        
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        
        
        //****************************************************************************************************
        // Setup Screen Rotation
        if (AmpacheMobile.settingsManager.settings.AllowRotation == true) 
        {
            /* Allow this stage to rotate */
            if (this.controller.stageController.setWindowOrientation) 
            {
                this.controller.stageController.setWindowOrientation("free");
            }
        }
        else 
        {
            /* Allow this stage to rotate */
            if (this.controller.stageController.setWindowOrientation) 
            {
                this.controller.stageController.setWindowOrientation("up");
            }
        }
    },
    
    
    listTapHandler: function(event)
    {
        Mojo.Log.info("--> listTapHandler: " + event.item.scene);
        
        if (this.getPending == false) 
        {
            this.getPending = true;
            
            switch (event.item.scene)
            {
                case "artists":
                    
                    var numArtists = parseInt(AmpacheMobile.ampacheServer.artists);
                    if (numArtists != 0) 
                    {
                        this.controller.stageController.pushScene("artists", 
                        {
                            ExpectedArtists: numArtists
                        });
                    }
                    this.getPending = false;
                    //this.TurnOffSpinner("Getting Artists");
                    break;
                case "albums":
                    Mojo.Log.info("Pushing Albums");
                    var numAlbums = parseInt(AmpacheMobile.ampacheServer.albums);
                    if (numAlbums != 0) 
                    {
                        this.controller.stageController.pushScene('albums', 
                        {
                            SceneTitle: "Albums",
                            DisplayArtistInfo: true,
                            ExepectedAlbums: numAlbums
                        //AlbumsList: _albumsList,
                        });
                    }
                    this.getPending = false;
                    
                    
                    //this.TurnOffSpinner("Getting Albums");
                    break;
                    
                case "playlists":
                    
                    var numPlaylists = parseInt(AmpacheMobile.ampacheServer.playlists);
                    
                    if (numPlaylists != 0) 
                    {
                        Mojo.Log.info("Pushing Playlists");
                        
                        this.controller.stageController.pushScene('playlists', 
                        {
                            SceneTitle: "Playlists",
                            ExpectedPlaylists: numPlaylists
                        });
                        
                    }
                    this.getPending = false;
                    
                    //this.TurnOffSpinner("Getting Albums");
                    
                    break;
                    
                case "songs":
                    var megaBytes = Math.round((AmpacheMobile.ampacheServer.songs * 223) / (1024 * 1024) * 100) / 100
                    if (megaBytes < 1.3) 
                    {
                    
                    
                        this.TurnOnSpinner("Getting Songs");
                        if (this.AlbumsList == null) 
                        {
                            AmpacheMobile.ampacheServer.GetSongs(this.FinishedGettingSongs.bind(this), null);
                        }
                        else 
                        {
                            this.FinishedGettingSongs(this.SongsList);
                        }
                    }
                    else 
                    {
                        Mojo.Log.info("Display Alert");
                        this.controller.showAlertDialog(
                        {
                            onChoose: function(value)
                            {
                            },
                            title: $L("Songs unavailable"),
                            message: "Sorry but this would result in processing " + megaBytes + "MB of information and would likely lock up your phone.  Please use Artists or Albums instead",
                            choices: [
                            {
                                label: $L('OK'),
                                value: 'ok',
                                type: 'color'
                            }]
                        });
                        this.getPending = false;
                    }
                    break;
                    
                default:
                    this.getPending = false;
                    break;
                    
            }
        }
        //this.controller.stageController.assistant.showScene(event.item.directory, event.item.scene)
        
        
        Mojo.Log.info("<-- listTapHandler");
    },
    
    TurnOnSpinner: function(spinnerText)
    {
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
    },
    
    TurnOffSpinner: function()
    {
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
    },
    
    
    /*
     * This function will push a passed in scene.  The reason we are using a special function here is that
     * for file organization purposes we have put the scene files in sub directories & to load them requires that
     * we use the name and sceneTemplate properties when pushing the scenes.
     */
    showScene: function(sceneName, directory)
    {
        Mojo.Log.info("--> showScene");
        
        this.controller.stageController.pushScene(
        {
            name: sceneName,
            sceneTemplate: directory + "/" + sceneName + "/" + sceneName + "-scene"
        })
        
        Mojo.Log.info("<-- showScene");
    },
    
    
    
    
    FinishedGettingSongs: function(_songsList)
    {
        Mojo.Log.info("--> FinishedGettingSongs");
        
        this.SongsList = _songsList;
        
        this.getPending = false;
        
        this.controller.stageController.pushScene("songs", 
        {
            SceneTitle: "All Songs",
            //DisplayArtistInfo:false,
            SongsList: _songsList
        })
        
        this.TurnOffSpinner();
        Mojo.Log.info("<-- FinishedGettingSongs");
        
    },
    
    /*
     FinishedGettingArtists: function(_artistList){
     Mojo.Log.info("--> FinishedGettingArtists");
     
     this.ArtistList = _artistList;
     
     this.getPending = false;
     
     this.controller.stageController.pushScene("artists", {
     artistList: _artistList
     })
     
     this.TurnOffSpinner();
     Mojo.Log.info("<-- FinishedGettingArtists");
     
     }
     FinishedGettingAlbums: function(_albumsList){
     Mojo.Log.info("--> ArtistsAssistant.prototype.FinishedGettingAlbums");
     
     this.AlbumsList = _albumsList;
     
     //this.GetArtistsPending = false;
     this.getPending = false;
     
     this.controller.stageController.pushScene('albums', {
     SceneTitle: "All Albums",
     DisplayArtistInfo:true,
     AlbumsList: _albumsList,
     });
     this.TurnOffSpinner();
     Mojo.Log.info("<-- ArtistsAssistant.prototype.FinishedGettingAlbums");
     
     }
     */
    activate: function(event)
    {
        /* put in event handlers here that should only be in effect when this scene is active. For
         
         
         
         
         
         
         
         
         
         
         
         example, key handlers that are observing the document */
        //this.ArtistList = null;
        //this.AlbumsList = null;
        //this.SongsList = null;
    
    
    },
    
    
    deactivate: function(event)
    {
        /* remove any event handlers you added in activate and do any other cleanup that should happen before
         
         
         
         this scene is popped or another scene is pushed on top */
    },
    
    cleanup: function(event)
    {
        /* this function should do any cleanup needed before the scene is destroyed as 
         a result of being popped off the scene stack */
        Mojo.Event.stopListening(this.controller.get('mainMenuList'), Mojo.Event.listTap, this.listTapHandler);
        this.ArtistList = null;
        this.AlbumsList = null;
        this.SongsList = null;
        
    },
    
    dividerFunc: function(itemModel)
    {
        return itemModel.category; // We're using the item's category as the divider label.
    }
})
