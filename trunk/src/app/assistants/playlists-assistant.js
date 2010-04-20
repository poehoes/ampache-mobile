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

var PlayListSortType = {
    "alpha": 0,
    "owner": 1,
    "songs": 2
};

PlaylistsAssistant = Class.create({

    initialize: function(params) {
        this.SceneTitle = params.SceneTitle;
        this.DisplayArtistInfo = params.DisplayArtistInfo;
        this.ExpectedPlaylists = params.ExpectedPlaylists;

        this.Search = null;
        if (params.Search) {
            this.Search = params.Search;
        }

        this.itemsHelper = new ItemsHelper();
        
        this.sortType = PlayListSortType.alpha;
        this.sortOrder = SortOrder.descending;
    },

    setup: function() {

        //*********************************************************************************************************
        //  Setup Filter List
        this.listAttributes = {
            itemTemplate: 'playlists/listitem',
            dividerTemplate: 'playlists/divider',
            dividerFunction: this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
            hasNoWidgets:true
        };
        this.listModel = {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('playlistFilterList', this.listAttributes, this.listModel);

        //*********************************************************************************************************
        // Items Helper
        var params = {
            controller: this.controller,
            //TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('playlistFilterList'),
            getItemsCallback: this.GetPlaylists.bind(this),
            listModel: this.listModel,
            //progressModel: this.playlistLoadModel,
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: this.ExpectedPlaylists,
            SortFunction: null,
            MatchFunction: this.IsMatch

        };
        this.itemsHelper.setup(params);

        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);

        //*********************************************************************************************************
        // Events
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('playlistFilterList'), Mojo.Event.listTap, this.listTapHandler);

        this.header = this.controller.get('header');
        this.sortSelector = this.sortSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.hold, this.sortSelector);
        
        this.jumpSelector = this.jumpSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.tap, this.jumpSelector);

    },

    cleanup: function(event) {

        Mojo.Log.info("--> cleanup");

        Mojo.Event.stopListening(this.controller.get('playlistFilterList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.header, Mojo.Event.hold, this.sortSelector);
        Mojo.Event.stopListening(this.header, Mojo.Event.tap, this.jumpSelector);
        this.itemsHelper.cleanup();
        this.itemsHelper = null;
        Mojo.Log.info("<-- cleanup");

    },

    GetPlaylists: function(GotItems, offset, limit) {
        AmpacheMobile.ampacheServer.GetPlaylists(GotItems, offset, limit, this.Search);
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

    listTapHandler: function(event) {

        this.RequestedPlaylist = event.item;
        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "songs"
        },
        {
            SceneTitle: event.item.name,
            Type: "playlist",
            Playlist_id: event.item.id,
            Item: event.item
        });

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
            filterList = this.controller.get('playlistFilterList');
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
            label: "Alphabet",
            command: "doSort-alpha",
            secondaryIconPath: (this.sortType === PlayListSortType.alpha) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
        commands[1] = {
            label: "Owner",
            command: "doSort-owner",
            secondaryIconPath: (this.sortType === PlayListSortType.owner) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
        commands[2] = {
            label: "Songs",
            command: "doSort-songs",
            secondaryIconPath: (this.sortType === PlayListSortType.songs) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
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
        
        
        this.itemsHelper.SortFunction = this.sortList.bind(this);
        
        
        switch(sort)
        {
        case "doSort-songs":
            if (this.sortType !== PlayListSortType.songs) {
                this.sortType = PlayListSortType.songs;
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
            if (this.sortType !== PlayListSortType.alpha) {
                this.sortType = PlayListSortType.alpha;
                this.sortOrder = SortOrder.descending;
                reSortList = true;
            }
            else
            {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        case "doSort-owner":
            if (this.sortType !== PlayListSortType.owner) {
                this.sortType = PlayListSortType.owner;
                this.sortOrder = SortOrder.descending;
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
        case PlayListSortType.songs:
            return (this.sortAlpha(parseInt(a.items,10), parseInt(b.items,10)) * this.sortOrder);
            //break;
        case PlayListSortType.owner:
            return (this.sortAlpha(a.owner.toLowerCase(), b.owner.toLowerCase()) * this.sortOrder);
            //break;
        case PlayListSortType.alpha:
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