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

var SearchSortType = {
    "alpha": 0,
    "albums": 1,
    "songs": 2,
    "artists": 3
};

SavedSearchesAssistant = Class.create({

    initialize: function(params) {
        //this.itemsHelper = new ItemsHelper();
       
    },

   


    setup: function() {

         //*****************************************************************************************************
        // Setup Menu
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);

        

        //this.indexSearches();

         //**********************************************************************
        // Setup Accounts
        this.searchesModel = {
            //listTitle: $L('Saved Searches'),
            items: AmpacheMobile.Account.SavedSearches
        };
        this.innerListAttrs = {
            listTemplate: 'saved-searches/listContainer',
            itemTemplate: 'saved-searches/listItem',
            addItemLabel: $L("Add New Search..."),
            swipeToDelete: true,
            autoconfirmDelete: false,
            deletedProperty: 'swiped',
            onItemRendered:this.renderSearchItem,
            reorderable:true
//            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper)

        };
        this.controller.setupWidget('saved-searches-list', this.innerListAttrs, this.searchesModel);

        
        //this.listHeldFunction = this.listHeldHandler.bindAsEventListener(this);
        //Mojo.Event.listen(this.controller.get('saved-searches-list'), Mojo.Event.hold, this.listHeldFunction);

        this.listAddFunction = this.listAddHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('saved-searches-list'), Mojo.Event.listAdd, this.listAddFunction);

        this.listTapFunction = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('saved-searches-list'), Mojo.Event.listTap, this.listTapFunction);

        this.listDeleteFunction = this.listDeleteHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('saved-searches-list'), Mojo.Event.listDelete, this.listDeleteFunction);

        this.listReorderFunction = this.listReorderFunction.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('saved-searches-list'), Mojo.Event.listReorder, this.listReorderFunction);

        //
        ////*********************************************************************************************************
        ////  Setup Filter List
        //this.listAttributes = {
        //    itemTemplate: 'genres/listitem',
        //    dividerTemplate: 'genres/divider',
        //    dividerFunction: this.dividerFunc.bind(this),
        //    filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
        //    hasNoWidgets:true
        //};
        //this.listModel = {
        //    disabled: false,
        //    items: this.itemsHelper.ItemsList
        //};
        //this.controller.setupWidget('genreFilterList', this.listAttributes, this.listModel);
        //
        //*********************************************************************************************************
        // Items Helper
        //var params = {
        //    controller: this.controller,
        //    //TurnOffSpinner: this.TurnOffSpinner.bind(this),
        //    filterList: this.controller.get('saved-searches-list'),
        //    getItemsCallback: this.GetSearches.bind(this),
        //    listModel: this.listModel,
        //    //progressModel: this.listLoadModel,
        //    //fetchLimit: AmpacheMobile.FetchSize,
        //    ExpectedItems: AmpacheMobile.Account.SavedSearches.length,
        //    SortFunction: null,
        //    MatchFunction: this.IsMatch
        //
        //};
        //this.itemsHelper.setup(params);
        //
        //this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        //
        ////*********************************************************************************************************
        //// Events
        //this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        //Mojo.Event.listen(this.controller.get('genreFilterList'), Mojo.Event.listTap, this.listTapHandler);
        //
        //this.header = this.controller.get('header');
        //this.sortSelector = this.sortSelect.bindAsEventListener(this);
        //Mojo.Event.listen(this.header, Mojo.Event.hold, this.sortSelector);
        //
        //this.jumpSelector = this.jumpSelect.bindAsEventListener(this);
        //Mojo.Event.listen(this.header, Mojo.Event.tap, this.jumpSelector);
    
    },

    cleanup: function(event) {

        Mojo.Event.stopListening(this.controller.get('saved-searches-list'), Mojo.Event.listAdd, this.listAddFunction);
        //Mojo.Event.stopListening(this.controller.get('saved-searches-list'), Mojo.Event.hold, this.listHeldFunction);
        Mojo.Event.stopListening(this.controller.get('saved-searches-list'), Mojo.Event.listTap, this.listTapFunction);
        Mojo.Event.stopListening(this.controller.get('saved-searches-list'), Mojo.Event.listDelete, this.listDeleteFunction);
        Mojo.Event.stopListening(this.controller.get('saved-searches-list'), Mojo.Event.listReorder, this.listReorderFunction);


    },

    renderSearchItem:function(listWidget, itemModel, itemNode){
        
        
        itemNode.getElementsByClassName("mainMenuIcon")[0].src =  SEARCH_ICONS[itemModel.type]
        
    },
    

    GetSearches: function(GotItems, offset, limit) {
        GotItems(AmpacheMobile.Account.SavedSearches);
        //AmpacheMobile.ampacheServer.GetTags(GotItems, offset, limit, this.Search);
    },

    IsMatch: function(item, filterString) {
        //var matchString = item.name;
        //if (matchString.toLowerCase().include(filterString.toLowerCase())) {
        //    return true;
        //}
        //return false;
    },

    handleCommand: function(event) {
        //this.itemsHelper.handleCommand(event);
    },



    searchForAlbums: function(params) {
            var numAlbums = parseInt(AmpacheMobile.ampacheServer.albums, 10);
            if (numAlbums !== 0) {
                
                var _params = {
                    SceneTitle: params.title,
                    DisplayArtistInfo: true,
                    ExpectedAlbums: numAlbums,
                    Search: this.searchText === "" ? null: params.searchText,
                    FromDate: params.FromDate,
                    ToDate: params.ToDate
                }
                
                
                this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "albums"}, _params);
            }
        
    },

    searchForPlaylists: function(params) {
            var numPlaylists = parseInt(AmpacheMobile.ampacheServer.playlists, 10);
            if (numPlaylists !== 0) {
                this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "playlists"}, {
                    SceneTitle: params.title,
                    Search: this.searchText === "" ? null: params.searchText,
                    ExpectedPlaylists: numPlaylists,
                    FromDate: params.FromDate
                });
            }
        
    },

    searchForGenres: function(params) {
            var numSongs = parseInt(AmpacheMobile.ampacheServer.songs, 10); //using numsongs because there is no num genres (numsongs is worst case)
            this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "genres"}, {
                SceneTitle: params.title,
                Search: this.searchText === "" ? null: params.searchText
            });
        
    },

    searchForSongs: function(params) {
            var numSongs = parseInt(AmpacheMobile.ampacheServer.songs, 10);
            this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "songs"}, {
                SceneTitle: params.title,
                Type: "search",
                DisplayArtistInfo: true,
                ExepectedSongs: numSongs,
                Search: this.searchText === "" ? null: params.searchText,
                FromDate: params.FromDate,
                ToDate:params.ToDate
            });
        
    },

    searchForGlobal: function(params) {
            var numSongs = parseInt(AmpacheMobile.ampacheServer.songs, 10);
            this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "songs"}, {
                Type: "search-global",
                SceneTitle: params.title,
                DisplayArtistInfo: true,
                ExepectedSongs: numSongs,
                Search: this.searchText === "" ? null: params.searchText
            
            });
        
    },

    searchForArtists: function(params) {
            var numArtists = parseInt(AmpacheMobile.ampacheServer.artists, 10);
            if (numArtists !== 0) {
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "artists"
                },
                {
                    SceneTitle: params.title,
                    ExpectedArtists: numArtists,
                    Search: this.searchText === "" ? null: params.searchText,
                    FromDate: params.FromDate,
                    ToDate: params.ToDate
                });
            }
        
    },

    searchForVideos: function(params) {
            var numVideos = parseInt(AmpacheMobile.ampacheServer.videos, 10);
            if (numVideos !== 0) {
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "videos"
                },
                {
                    SceneTitle: params.title,
                    ExpectedVideos: numVideos,
                    Search: this.searchText === "" ? null: params.searchText
                });
            }
        
    },


    findSearchId: function(event) {
        var element = event.srcElement;
        i = 0;
        while ((!element.id.match("search_")) && i < 100) {
            element = element.parentElement;
            i++;
        }
        if (i === 100) {
            return - 1;
        }

        var idStr = element.id.split("_")[1];
        var id = parseInt(idStr, 10);
        return id;
    },

    //listHeldHandler: function(event) {
    //    this.heldPending = true;
    //    var id = this.findSearchId(event);
    //    if (id === -1) {
    //        return;
    //    }
    //    
    //    this.editSearch = AmpacheMobile.Account.SavedSearches[id];
    //    
    //    this.controller.stageController.pushScene({
    //        transition: AmpacheMobile.Transition,
    //        name: "search-builder"
    //    },
    //    {
    //        Type: "Edit",
    //        SettingsManager: AmpacheMobile.settingsManager,
    //        Search: this.editSearch
    //
    //    });
    //    event.stop();
    //},

    

    listTapHandler:function(event)
    {
        
        params ={}
        params.searchText = event.item.searchString;
        params.title = event.item.name;
        
        
        var click_id = event.originalEvent.target.id;
        var item;
        if (click_id === "editItem") {
            this.editSearch = event.item;
            
            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "search-builder"
            },
            {
                Type: "Edit",
                SettingsManager: AmpacheMobile.settingsManager,
                Search: this.editSearch
    
            });
        }
        else
        {
        
        
        if(event.item.useDate === true)
        {
            if(event.item.fromDate)
            {
                params.FromDate = new Date(event.item.fromDate);
            }
            //if(event.item.toDate)
            //{
            //    params.ToDate = new Date(event.item.toDate);
            //}
        }
        
        switch(parseInt(event.item.type,10))
        {
            
            
            case SEARCH_ALBUMS:
                        this.searchForAlbums(params);
                        break;
                    case SEARCH_ARTISTS:
                        this.searchForArtists(params);
                        break;
                    case SEARCH_SONGS:
                        this.searchForSongs(params);
                        break;
                    case SEARCH_PLAYLISTS:
                        this.searchForPlaylists(params);
                        break;
                    case SEARCH_VIDEOS:
                        this.searchForVideos(params);
                        break;
                    default:
                        this.searchForGlobal(params);
                        break;
        }
        }
        
    },
  
    listAddHandler:function(event)
    {
        this.newSearch = new SavedSearch();
        this.newSearch.index = AmpacheMobile.Account.SavedSearches.length;

        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "search-builder"
        },
        {
            Type: "Add",
            SettingsManager: AmpacheMobile.settingsManager,
            Search: this.newSearch
        });
        
    },
  

    listDeleteHandler: function(event) {
        event.model.items.splice(event.model.items.indexOf(event.item), 1); //Remove from items list
        AmpacheMobile.settingsManager.SaveSettings();
    },
    
    listReorderFunction:function(event)
    {
        
       event.model.items.splice(event.fromIndex,1);
       event.model.items.splice(event.toIndex,0,event.item);
        
       AmpacheMobile.settingsManager.SaveSettings();
    },


    activate: function(event) {
        
        if (this.newSearch || this.editSearch) {
            this.controller.modelChanged(this.searchesModel, this);
            AmpacheMobile.settingsManager.SaveSettings();
            this.newSearch = null;
        }
        
        
        var button = this.controller.get('now-playing-button');
        button.style.display = AmpacheMobile.audioPlayer.hasPlayList ? 'block': 'none';
        this.npTapHandler = this.showNowPlaying.bindAsEventListener(this);
        Mojo.Event.listen(button, Mojo.Event.tap, this.npTapHandler);
    },

    deactivate: function(event) {
        //this.itemsHelper.Deactivate();
        Mojo.Event.stopListening(this.controller.get('now-playing-button'), Mojo.Event.tap, this.npTapHandler);
    },
    
    showNowPlaying: function() {
        Mojo.Controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "now-playing"}, {
            type: "display"
        });
    }

});


