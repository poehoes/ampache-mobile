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

var ArtistSortType = {
    "alpha": 0,
    "albums": 1,
    "songs": 2
};


ArtistsAssistant = Class.create({

    initialize: function(params) {
        if(params.CanSave)
        {
            this.CanSave = true;
        }
        else
        {
            this.CanSave = false;
        }
        
        this.SceneTitle = params.SceneTitle;
        this.ExpectedArtists = params.ExpectedArtists;
        this.itemsHelper = new ItemsHelper();
        this.type = params.type;

        if (params.Genre_id) {
            this.Genre_id = params.Genre_id;
        }

        if (params.Search) {
            this.Search = params.Search;
        }
        
        if(params.FromDate)
        {
            this.FromDate = params.FromDate;
        }
        
        this.sortType = ArtistSortType.alpha;
        this.sortOrder = SortOrder.descending;
        
    },

    


    setup: function() {

        //**********************************************************************
        // Set title
        var title = this.controller.get('title');
        title.innerHTML = this.SceneTitle;

        //*********************************************************************
        // Setup Header Tap
        this.header = this.controller.get('header');
        this.divSelector = this.dividerSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.tap, this.divSelector);

        this.sortSelector = this.sortSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.hold, this.sortSelector);

        


        //*********************************************************************************************************
        //  Setup Filter List
        var attributesFilter = {
            itemTemplate: 'artists/listitem',
            dividerTemplate: 'artists/divider',
            dividerFunction: (this.type === "random") ? null: this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
            hasNoWidgets:true
        };
        this.listModel = {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('artistFilterList', attributesFilter, this.listModel);

        //*********************************************************************************************************
        // Items Helper
        var sorting = this.Genre_id ? this.sortGenreAlpha.bind(this) : null;

        var params = {
            type: "artists",
            controller: this.controller,
            //TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('artistFilterList'),
            getItemsCallback: this.GetArtists.bind(this),
            //listModel: this.listModel,
            //progressModel: this.artistLoadModel,
            onLoadingFinished:this.artistLoadingFinished.bind(this),
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: this.ExpectedArtists,
            SortFunction: sorting,
            MatchFunction: this.IsMatch
        };
        this.itemsHelper.setup(params);

        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);

        //***************************************************************************************
        //Events
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('artistFilterList'), Mojo.Event.listTap, this.listTapHandler);
    
        //Hold Handler
        this.listHeldHandler = this.listHeldHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('artistFilterList'), Mojo.Event.hold, this.listHeldHandler);
    },

    imgEmpty: "images/player/empty.png",
    imgUp: "images/up.png",
    imgDown: "images/down.png",

    sortSelect:function(event)
    {
        var commands = [];
        
        commands[0] = {
            label: "Alphabet",
            command: "doSort-alpha",
            secondaryIconPath: (this.sortType === ArtistSortType.alpha) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
        commands[1] = {
            label: "Albums",
            command: "doSort-albums",
            secondaryIconPath: (this.sortType === ArtistSortType.albums) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
        };
        
        commands[2] = {
            label: "Songs",
            command: "doSort-songs",
            secondaryIconPath: (this.sortType === ArtistSortType.songs) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp:this.imgDown) : this.imgEmpty 
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
            if (this.sortType !== ArtistSortType.songs) {
                this.sortType = ArtistSortType.songs;
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
            if (this.sortType !== ArtistSortType.alpha) {
                this.sortType = ArtistSortType.alpha;
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
            if (this.sortType !== ArtistSortType.albums) {
                this.sortType = ArtistSortType.albums;
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
        
        
        if (reSortList) // && this.itemsHelper.LoadingFinished)
        {
            //AmpacheMobile.settingsManager.settings.AlbumsSort = this.sortType;
            //AmpacheMobile.settingsManager.SaveSettings();
            this.itemsHelper.ReSortList();
        }
    },

    sortList: function(a, b) {
        switch (this.sortType) {
        case ArtistSortType.songs:
            return (this.sortAlpha(parseInt(a.songs,10), parseInt(b.songs,10)) * this.sortOrder);
            //break;
        case ArtistSortType.albums:
            return (this.sortAlpha(parseInt(a.albums,10), parseInt(b.albums,10)) * this.sortOrder);
            //break;
        case ArtistSortType.alpha:
            return (this.sortAlpha(this.dividerFunc(a), this.dividerFunc(b)) * this.sortOrder);
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


    cleanup: function(event) {
        Mojo.Event.stopListening(this.controller.get('artistFilterList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.controller.get('artistFilterList'), Mojo.Event.hold, this.listHeldHandler);
        Mojo.Event.stopListening(this.header, Mojo.Event.tap, this.divSelector);
        Mojo.Event.stopListening(this.header, Mojo.Event.hold, this.sortSelector);
        this.itemsHelper.cleanup();
        this.itemsHelper = null;
    },

    dividerSelect:function(event)
    {
        var commands = [];
        previousLetter = null;
        j=0;
        if(this.itemsHelper.IsFiltered())
        {
            list = this.itemsHelper.GetAllMatches(this.itemsHelper.filterString);
        }
        else
        {
            list = this.itemsHelper.ItemsList;
        }
        for(i=0;i<list.length;i++)
        {
            letter = this.dividerFunc(list[i]);
            if(letter !== previousLetter)
            {
                commands[j++] = {
                    label: letter,
                    command: "jumpTo-"+ i
                };
                previousLetter = letter;
            }
        }
        
        this.controller.popupSubmenu({
            onChoose: this.popupHandler.bindAsEventListener(this),
            placeNear: this.header,
            items: commands
        });
    },

    popupHandler:function(event)
    {
        if(Object.isString(event) && event.match("jumpTo"))
        {
            console.log(event);
            filterList = this.controller.get('artistFilterList');
            list = filterList.mojo.getList();
            i = parseInt(event.split("-")[1],10);
            list.mojo.revealItem(i, false);
        }
    },

    listHeldHandler:function(event)
    {
        var node = event.down.target;
        var regex = /artist_([0-9]+)/;
        var id = null;
        
        while(node && (id===null))
        {
            var matches = node.id.match(new RegExp(regex));
            if(matches)
            {
                id = Number(matches[1]);
            }
            else
            {
                node = node.parentNode;
            }
        }
        
        
        
        if(id)
        {
            var item = null;
            var index =0;
            for(var i =0; i< this.itemsHelper.ItemsList.length; i++)
            {
                if(Number(this.itemsHelper.ItemsList[i].id)===id)
                {
                    item = this.itemsHelper.ItemsList[i];
                    i = this.itemsHelper.ItemsList.length;
                }
            }
            
            
            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "songs"
            },
            {
                SceneTitle: "All Songs: " + item.name,
                Type: "artist-songs",
                Artist_id: item.id,
                Expected_items: item.songs
            //Item: event.item
            }
            );
        }
       
        event.stop();
    },

    sortGenreAlpha: function(a, b) {
    
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

    GetArtists: function(callback, offset, limit) {
        
        var params = {};
        params.CallBack = callback;
        params.offset = offset;
        params.limit = limit;
        params.FromDate = this.FromDate;
        params.CheckSaved = this.CanSave;
        
        
        
        if (this.type === "random") {
            this.itemsHelper.fetchLimit = 1;
            var random = Math.floor(Math.random() * parseInt(AmpacheMobile.ampacheServer.artists, 10));
            params.offset = random;
            params.limit = 1;
        } else if (!this.Genre_id) {
            params.search = this.Search;
        } else {
            params.TagID = this.Genre_id;
        }
        AmpacheMobile.ampacheServer.GetArtists(params);
        
    },

    IsMatch: function(item, filterString) {
        var matchString = item.name;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) {
            return true;
        }
        return false;
    },

    artistLoadingFinished:function()
    {
        if(this.CanSave)
        {
            AmpacheMobile.settingsManager.SaveArtists(AmpacheMobile.Account, this.itemsHelper.ItemsList, AmpacheMobile.ampacheServer.getServerDataTimeSignature());
        }
    },


    listTapHandler: function(event) {
        Mojo.Log.info("--> listTapHandler", event.item.name);
        this.RequestedArtist = event.item;
        if(Number(event.item.albums) ===1)
        {
            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "songs"
            },
            {
                SceneTitle: event.item.name,
                Type: "artist-songs-single-album",
                Artist_id: event.item.id,
                Expected_items: event.item.songs,
                SingleAlbum:true
            //Item: event.item
            }
            );
        }
        else{
        
        
        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "albums"
        },
        {
            SceneTitle: this.RequestedArtist.name,
            DisplayArtistInfo: false,
            Artist_id: event.item.id,
            numSongs: event.item.songs,
            //Artist: this.RequestedArtist,
            ExpectedAlbums: this.RequestedArtist.albums
        });
        }
        Mojo.Log.info("<-- listTapHandler");
    },

    handleCommand: function(event) {
        this.itemsHelper.handleCommand(event);
        
        if (event.type === Mojo.Event.back) {
            if(AmpacheMobile.settingsManager.artistsSavePending===true)
            {
                event.preventDefault();
                event.stopPropagation();
                this.controller.showAlertDialog({
                    title: $L("Save Pending..."),
                    message: "Please wait until the pending save of artists is complete.",
                    choices: [{
                        label: $L('OK'),
                        value: 'ok',
                        type: 'primary'
                    }]
                });
            }
        }
        
    },
    /*
    TurnOnSpinner: function () {
        Mojo.Log.info("-----> TurnOnSpinner");
        CenterSpinner($('large-activity-spinner'));
        this.scrim.show();
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOnSpinner");
    },
    
    TurnOffSpinner: function () {
        Mojo.Log.info("-----> TurnOffSpinner");
        this.scrim.hide();
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOffSpinner");
    },
*/
    dividerFunc: function(itemModel) {
        if(this.sortType === ArtistSortType.alpha)
        {
            var regExp = /(the|a)\s+/g;
            var dividerText = itemModel.name.toLowerCase().replace(regExp, '');
            if (dividerText[0].match(/[0-9]/)) {
                return "#";
            }
            else if(!dividerText[0].match(/[0-9a-zA-Z]/))
            {
                return "@";
            }
            return dividerText[0].toUpperCase();
        }
        else if(this.sortType === ArtistSortType.albums){
            return itemModel.albums;
        }
        //else if(this.sortType === ArtistSortType.songs){
        //    return itemModel.songs;
        //}
        
       return "";
    },

    activate: function(event) {
        this.itemsHelper.Activate();
    },

    deactivate: function(event) {
        this.itemsHelper.Deactivate();
    }

});