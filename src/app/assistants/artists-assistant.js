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
ArtistsAssistant = Class.create(
{

    initialize: function (params) {
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
    },
    
    setup: function () {
        
        //**********************************************************************
        // Set title
        var title = this.controller.get('title');
        title.innerHTML = this.SceneTitle;

        
        //*********************************************************************************************************
        //  Setup Filter List
        var attributesFilter = 
        {
            itemTemplate: 'artists/listitem',
            dividerTemplate: 'artists/divider',
            dividerFunction: (this.type==="random") ?null : this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper)
        };
        this.listModel = 
        {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('artistFilterList', attributesFilter, this.listModel);

        
        //*********************************************************************************************************
        // Items Helper
        var sorting = this.Genre_id ? this.sortAlpha.bind(this) : null;
        
        var params = 
        {
            type:"artists",
            controller: this.controller,
            //TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('artistFilterList'),
            getItemsCallback: this.GetArtists.bind(this),
            //listModel: this.listModel,
            //progressModel: this.artistLoadModel,
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
    },
    
    cleanup: function (event) {
        Mojo.Event.stopListening(this.controller.get('artistFilterList'), Mojo.Event.listTap, this.listTapHandler);
        this.itemsHelper.cleanup();
        this.itemsHelper = null;
    },
    
    sortAlpha: function (a, b)
    {
    
        var regExp = /(the|a)\s+/g;
        var a_fixed = a.name.toLowerCase().replace(regExp, '');
        var b_fixed = b.name.toLowerCase().replace(regExp, '');
        
        if (a_fixed === b_fixed) {
            return 0;
        }
        if (a_fixed < b_fixed) {
            return -1;
        }
        else {
            return 1;
        }
        
    },
    
    GetArtists: function (GotItems, offset, limit) {
        if(this.type==="random")
        {
            this.itemsHelper.fetchLimit = 1;
            var random = Math.floor(Math.random()* parseInt(AmpacheMobile.ampacheServer.artists, 10));
            AmpacheMobile.ampacheServer.GetArtists(GotItems, null, random, 1, null);
        }
        else if (!this.Genre_id) {
            AmpacheMobile.ampacheServer.GetArtists(GotItems, null, offset, limit, this.Search);
        }
        else {
            AmpacheMobile.ampacheServer.GetArtists(GotItems, this.Genre_id, offset, limit, this.Search);
        }
    },
    
    IsMatch: function (item, filterString) {
        var matchString = item.name;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) {
            return true;
        }
        return false;
    },
    
    listTapHandler: function (event) {
        Mojo.Log.info("--> listTapHandler", event.item.name);
        this.RequestedArtist = event.item;
        this.controller.stageController.pushScene(
        {
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
        Mojo.Log.info("<-- listTapHandler");
    },
    
    handleCommand: function (event) {
        this.itemsHelper.handleCommand(event);
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
    dividerFunc: function (itemModel) {
        var regExp = /(the|a)\s+/g;
        var dividerText = itemModel.name.toLowerCase().replace(regExp, '');
        if(dividerText[0].match(/[0-9]/))
        {
            return "#";
        }
        return dividerText[0].toUpperCase();
    },
    
    activate: function(event)
    {
        this.itemsHelper.Activate();
    },
    
    deactivate: function(event)
    {
        this.itemsHelper.Deactivate();
    }
    

});
