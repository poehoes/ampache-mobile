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
    },

    setup: function() {

        //*********************************************************************************************************
        //  Setup Filter List
        this.listAttributes = {
            itemTemplate: 'playlists/listitem',
            dividerTemplate: 'playlists/divider',
            dividerFunction: this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper)
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

    },

    cleanup: function(event) {

        Mojo.Log.info("--> cleanup");

        Mojo.Event.stopListening(this.controller.get('playlistFilterList'), Mojo.Event.listTap, this.listTapHandler);
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
        this.controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "songs"}, {
            SceneTitle: event.item.name,
            Type: "playlist",
            Playlist_id: event.item.id,
            Item: event.item
        });

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