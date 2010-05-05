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

var GenreSortType = {
    "alpha": 0,
    "albums": 1,
    "songs": 2,
    "artists": 3
};

GenresAssistant = Class.create({

    initialize: function(params) {
        this.SceneTitle = params.SceneTitle;
        this.itemsHelper = new ItemsHelper();
        this.type = params.Type;
        if (params.Search) {
            this.Search = params.Search;
        }
        
        this.sortType = GenreSortType.songs;
        this.sortOrder = SortOrder.ascending;
    },

    setup: function() {

        //*********************************************************************************************************
        //  Setup Filter List
        this.listAttributes = {
            itemTemplate: 'genres/listitem',
            dividerTemplate: 'genres/divider',
            dividerFunction: this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
            hasNoWidgets:true
        };
        this.listModel = {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('genreFilterList', this.listAttributes, this.listModel);

        //*********************************************************************************************************
        // Items Helper
        var params = {
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

        //*********************************************************************************************************
        // Events
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('genreFilterList'), Mojo.Event.listTap, this.listTapHandler);
        
        this.header = this.controller.get('header');
        this.sortSelector = this.sortSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.hold, this.sortSelector);
        
        this.jumpSelector = this.jumpSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.tap, this.jumpSelector);
    
    },

    cleanup: function(event) {

        Mojo.Log.info("--> cleanup");
        Mojo.Event.stopListening(this.controller.get('genreFilterList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.header, Mojo.Event.hold, this.sortSelector);
        Mojo.Event.stopListeningd(this.header, Mojo.Event.tap, this.jumpSelector);
        this.itemsHelper.cleanup();
        this.itemsHelper = null;
        Mojo.Log.info("<-- cleanup");

    },

    GetTags: function(GotItems, offset, limit) {
        AmpacheMobile.ampacheServer.GetTags(GotItems, offset, limit, this.Search);
    },

    IsMatch: function(item, filterString) {
        var matchString = item.name;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) {
            return true;
        }
        return false;
    },

    handleCommand: function(event) {
        this.itemsHelper.handleCommand(event);
    },

    sortAlphaGenre: function(a, b) {

        var regExp = /(the|a)\s+/g;
        var a_fixed = a.name.toLowerCase().replace(regExp, '');
        var b_fixed = b.name.toLowerCase().replace(regExp, '');

        if (a_fixed === b_fixed) {
            return 0;
        }
        if (a_fixed < b_fixed) {
            return - 1;
        } else {
            return 1;
        }

    },
    
    
     //**************************************************************************
    // List Jump Functions
    //**************************************************************************
    jumpSelect:function(event)
    {
        var commands = [];
       
        commands[0] = {
            label: "Top",
            command: "jumpTo-top"
        };
        
        commands[1] = {
            label: "Bottom",
            command: "jumpTo-bottom"
        };
        
        this.controller.popupSubmenu({
            onChoose: this.jumpHandler.bindAsEventListener(this),
            placeNear: this.header,
            items: commands
        });
    },

    jumpHandler:function(event)
    {
        if(Object.isString(event) && event.match("jumpTo"))
        {
            filterList = this.controller.get('genreFilterList');
            var list = filterList.mojo.getList();
            
            if(event === "jumpTo-top")
            {
                list.mojo.revealItem(0, false);
            }
            else if(event === "jumpTo-bottom")
            {
                list.mojo.revealItem(list.mojo.getLength()-1, false);
            }  
        }
    },
    
    
    //**************************************************************************
    // Sorting Functions
    //**************************************************************************
    imgEmpty: "images/player/empty.png",
    imgUp: "images/up.png",
    imgDown: "images/down.png",

    sortSelect:function(event)
    {
        var commands = [];
        
        commands[0] = {
            label: "Alpha",
            command: "doSort-alpha",
            secondaryIconPath: (this.sortType === GenreSortType.alpha) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
        commands[1] = {
            label: "# Albums",
            command: "doSort-albums",
            secondaryIconPath: (this.sortType === GenreSortType.albums) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
        commands[2] = {
            label: "# Songs",
            command: "doSort-songs",
            secondaryIconPath: (this.sortType === GenreSortType.songs) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
         commands[3] = {
            label: "# Artists",
            command: "doSort-artists",
            secondaryIconPath: (this.sortType === GenreSortType.artists) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
        this.controller.popupSubmenu({
            onChoose: this.doSort.bindAsEventListener(this),
            placeNear: this.header,
            items: commands
        });
        
        event.stop();
        event.stopPropagation();
    },
    
    doSort:function(sort)
    {
        var reSortList = false;
        
        if(this.itemsHelper.SortFunction === null)
        {
            this.itemsHelper.SortFunction = this.sortList.bind(this);
        }
        
        switch(sort)
        {
        case "doSort-songs":
            if (this.sortType !== GenreSortType.songs) {
                this.sortType = GenreSortType.songs;
                this.sortOrder = SortOrder.ascending;
                reSortList = true;
            }
            else
            {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        case "doSort-alpha":
            if (this.sortType !== GenreSortType.alpha) {
                this.sortType = GenreSortType.alpha;
                this.sortOrder = SortOrder.descending;
                reSortList = true;
            }
            else
            {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        case "doSort-albums":
            if (this.sortType !== GenreSortType.albums) {
                this.sortType = GenreSortType.albums;
                this.sortOrder = SortOrder.ascending;
                reSortList = true;
            }
            else
            {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        case "doSort-artists":
            if (this.sortType !== GenreSortType.artists) {
                this.sortType = GenreSortType.artists;
                this.sortOrder = SortOrder.ascending;
                reSortList = true;
            }
            else
            {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        }
        
        
        if (reSortList)
        {
            this.itemsHelper.ReSortList();
        }
    },

    sortList: function(a, b) {
        switch (this.sortType) {
        case GenreSortType.songs:
            return (this.sortAlpha(parseInt(a.songs,10), parseInt(b.songs,10)) * this.sortOrder);
            //break;
        case GenreSortType.albums:
            return (this.sortAlpha(parseInt(a.albums,10), parseInt(b.albums,10)) * this.sortOrder);
            //break;
        case GenreSortType.artists:
            return (this.sortAlpha(parseInt(a.artists,10), parseInt(b.artists,10)) * this.sortOrder);
            //break;
        case GenreSortType.alpha:
            return (this.sortAlpha(a.name.toLowerCase(), b.name.toLowerCase()) * this.sortOrder);
            //break;
        }
        return 0;
    },

    sortAlpha: function(a, b) {
        if (a === b) {
            return 0;
        }

        if (a < b) {
            return - 1;
        } else {
            return 1;
        }
    },
    
    

    listTapHandler: function(event) {

        var item = event.item;
        item._this = this;

        var editCmd = [];
        var i = 0;

        editCmd[i++] = {
            label: "Songs: " + event.item.songs,
            command: "pushSongs",
            secondaryIconPath: "images/icons/songs.png"

        };

        if (event.item.artists !== 0) {
            editCmd[i++] = {
                label: "Artists: " + event.item.artists,
                command: "pushArtists",
                secondaryIconPath: "images/icons/artists.png"

            };
        }

        if (event.item.albums !== 0) {
            editCmd[i++] = {
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

        this.controller.popupSubmenu({
            onChoose: this.popupHandler.bind(item),
            placeNear: event.originalEvent.target,
            items: editCmd
        });

    },

    popupHandler: function(event) {
        var item = this;

        var controller = item._this.controller;
        Mojo.Log.info(event);

        if (event === "pushArtists") {
            controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "artists"
            },
            {
                SceneTitle: "Genre: " + item.name,
                Genre_id: item.id,
                ExpectedArtists: item.artists
            });
        }

        if (event === "pushAlbums") {
            controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "albums"
            },
            {
                SceneTitle: "Genre: " + item.name,
                Type: "genres",
                Genre_id: item.id,
                ExpectedAlbums: item.albums

            });
        }

        if (event === "pushSongs") {
            controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "songs"
            },
            {
                SceneTitle: "Genre: " + item.name,
                Type: "genre",
                Genre_id: item.id,
                Expected_items: item.songs

            });
        }
        /*
         else if (event === "pushFiltered")
         {
         var playList = item._this.itemsHelper.GetAllMatches(item._this.itemsHelper.filterString);
         var index = item._event.index;
         controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "now-playing"},
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
         controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "now-playing"},
         {
         playList: playList,
         startIndex: index,
         shuffle: false
         });
         
         
         }*/
    },

    dividerFunc: function(itemModel) {
        return itemModel.year;
    },

    activate: function(event) {
        this.itemsHelper.Activate();
    },

    deactivate: function(event) {
        this.itemsHelper.Deactivate();
    }

});