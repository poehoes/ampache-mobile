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
GenresAssistant = Class.create(
{

    initialize: function(params)
    {
        this.SceneTitle = params.SceneTitle;
        this.itemsHelper = new ItemsHelper();
        this.type = params.Type;
        if (params.Search) 
        {
            this.Search = params.Search;
        }
    },
    
    setup: function()
    {
        ////******************************************************************************************************
        //// Make scrim
        //this.scrim = $("spinner-scrim");
        //this.scrim.hide();
        //
        ////*********************************************************************************************************
        ////  Setup Spinner
        //this.spinnerLAttrs = 
        //{
        //    spinnerSize: 'large'
        //};
        //this.spinnerModel = 
        //{
        //    spinning: false
        //};
        //this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
        //
        ////*********************************************************************************************************
        ////  Setup Progress Pill
        //this.PPattr = 
        //{
        //    title: this.SceneTitle,
        //    image: 'images/icons/genres.png'
        //};
        //this.listLoadModel = 
        //{
        //    value: 0
        //};
        //this.controller.setupWidget('ProgressBar', this.PPattr, this.listLoadModel);
        
        
        //*********************************************************************************************************
        //  Setup Filter List
        this.listAttributes = 
        {
            itemTemplate: 'genres/listitem',
            dividerTemplate: 'genres/divider',
            dividerFunction: this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper)
        };
        this.listModel = 
        {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('genreFilterList', this.listAttributes, this.listModel);
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('genreFilterList'), Mojo.Event.listTap, this.listTapHandler);
        
        
        //*********************************************************************************************************
        // Items Helper
        var params = 
        {
            controller: this.controller,
            //TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('genreFilterList'),
            getItemsCallback: this.GetTags.bind(this),
            listModel: this.listModel,
            //progressModel: this.listLoadModel,
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: 0,
            SortFunction: null,
            MatchFunction: this.IsMatch
        
        };
        this.itemsHelper.setup(params);
        
        
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        //this.TurnOnSpinner();
        
        
    },
    
    GetTags: function(GotItems, offset, limit)
    {
        AmpacheMobile.ampacheServer.GetTags(GotItems, offset, limit, this.Search);
    },
    
    
    IsMatch: function(item, filterString)
    {
        var matchString = item.name;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) 
        {
            return true;
        }
        return false;
    },
    
    
    handleCommand: function (event) {
        this.itemsHelper.handleCommand(event);
    },
    
    
    
    listTapHandler: function(event)
    {
    
        var item = event.item;
        item._this = this;
        
        var editCmd = [];
        var i = 0;
        
        editCmd[i++] = 
        {
            label: "Songs",
            command: "pushSongs",
            secondaryIconPath: "images/icons/songs.png"
        
        
        };
        
        
        if (event.item.artists !== 0) 
        {
            editCmd[i++] = 
            {
                label: "Artists: " + event.item.artists,
                command: "pushArtists",
                secondaryIconPath: "images/icons/artists.png"
            
            
            };
        }
        
        if (event.item.albums !== 0) 
        {
            editCmd[i++] = 
            {
                label: "Albums: " + event.item.albums,
                command: "pushAlbums",
                secondaryIconPath: "images/icons/albums.png"
            
            
            };
        }
        
        //if (event.item.songs != 0) 
        //{
        
        //}
        
        /*
        if (event.item.playlists != 0) 
        {
            editCmd[i++] = 
            {
                label: "Playlists: " + event.item.albums,
                command: "pushPlaylists",
                secondaryIconPath: "images/icons/playlists.png"
            
            
            };
        }*/
        
        this.controller.popupSubmenu(
        {
            onChoose: this.popupHandler.bind(item),
            placeNear: event.originalEvent.target,
            items: editCmd
        });
        
    },
    
    
    
    popupHandler: function(event)
    {
        var item = this;
        
        
        var controller = item._this.controller;
        Mojo.Log.info(event);
        
        if (event === "pushArtists") 
        {
            controller.stageController.pushScene('artists', 
            {
                SceneTitle: "Genre: " + item.name,
                Genre_id: item.id,
                ExpectedArtists: item.artists
            });
        }
        
        if (event === "pushAlbums") 
        {
            controller.stageController.pushScene('albums', 
            {
                SceneTitle: "Genre: " + item.name,
                Type: "genres",
                Genre_id: item.id,
                ExpectedAlbums: item.albums
            
            });
        }
        
        if (event === "pushSongs") 
        {
            controller.stageController.pushScene('songs', 
            {
                SceneTitle: "Genre: " + item.name,
                Type: "genre",
                Genre_id: item.id
            
            });
        }
        /*
         else if (event === "pushFiltered")
         {
         var playList = item._this.itemsHelper.GetAllMatches(item._this.itemsHelper.filterString);
         var index = item._event.index;
         controller.stageController.pushScene('now-playing',
         {
         
         playList: playList,
         startIndex: index,
         shuffle: false
         });
         
         }
         else if (event === "pushSongs")
         {
         var playList = item._this.itemsHelper.ItemsList;
         var index = item._this.FindIndex(item.id);
         controller.stageController.pushScene('now-playing',
         {
         playList: playList,
         startIndex: index,
         shuffle: false
         });
         
         
         }*/
    },
    
    
    
    dividerFunc: function(itemModel)
    {
        return itemModel.year;
    },
    
    
    activate: function (event) {
        this.itemsHelper.Activate();
    },

    deactivate: function (event) {
        this.itemsHelper.Deactivate();
    },
    
    cleanup: function(event)
    {
    
        Mojo.Log.info("--> cleanup");
        
        
        Mojo.Event.stopListening(this.controller.get('genreFilterList'), Mojo.Event.listTap, this.listTapHandler);
        
        Mojo.Log.info("<-- cleanup");
        
        
    },
    
    TurnOnSpinner: function()
    {
        Mojo.Log.info("--> TurnOnSpinner");
        CenterSpinner($('large-activity-spinner'));
        this.scrim.show();
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<-- TurnOnSpinner");
    },
    
    TurnOffSpinner: function()
    {
        Mojo.Log.info("-----> TurnOffSpinner");
        this.scrim.hide();
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOffSpinner");
    }
    
    
});
