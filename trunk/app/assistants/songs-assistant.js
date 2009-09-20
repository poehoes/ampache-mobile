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
SongsAssistant = Class.create(
{


    initialize: function(params)
    {
        this.SceneTitle = params.SceneTitle;
        this.Type = params.Type;
        this.Item = params.Item;
        
        if ((this.Type == "playlist") || (this.Type == "all-songs") || (this.Type == "search") || (this.Type == "search-global")) 
        {
            this.DisplayAlbumInfo = true;
        }
        
        
        if (params.Search) 
        {
            this.Search = params.Search;
        }
        
        this.itemsHelper = new ItemsHelper();
    },
    
    setup: function()
    {
    
    
    
    
        //********************************************************************************
        //Setup Loading Progress Pill
        this.PPattr = 
        {
            title: this.SceneTitle,
            image: 'images/songs.png'
        };
        this.songLoadModel = 
        {
            value: 0
        };
        this.controller.setupWidget('songProgressbar', this.PPattr, this.songLoadModel);
        
        
        
        //*********************************************************************************
        //Setup Sort List
        if (this.DisplayAlbumInfo == true) 
        {
            var attributes = 
            {
                filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
                itemTemplate: 'songs/listitem_w_artist'
                //dividerTemplate: 'artist-albums/divider',
                //dividerFunction: this.dividerFunc.bind(this),
            };
        }
        else 
        {
            var attributes = 
            {
                filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
                itemTemplate: 'songs/listitem'
                //dividerTemplate: 'artist-albums/divider',
                //dividerFunction: this.dividerFunc.bind(this),
            };
        }
        this.listModel = 
        {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('songsList', attributes, this.listModel);
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('songsList'), Mojo.Event.listTap, this.listTapHandler);
        
        //******************************************************************************************************
        // Setup Spinner
        this.spinnerLAttrs = 
        {
            spinnerSize: 'large'
        };
        this.spinnerModel = 
        {
            spinning: false
        };
        this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
        
        
        //*********************************************************************************************************
        // Items Helper
        var params = 
        {
            controller: this.controller,
            TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('songsList'),
            getItemsCallback: this.GetSongs.bind(this),
            listModel: this.listModel,
            progressModel: this.songLoadModel,
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: null,
            SortFunction: null,
            MatchFunction: this.IsMatch
        
        };
        this.itemsHelper.setup(params);
        
        
        
        this.controller.get('shuffleAll').observe(Mojo.Event.tap, this.handleShuffleAll.bindAsEventListener(this));
        
        
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        
        this.TurnOnSpinner("Retrieving<br>Songs");
        
        
    },
    
    GetSongs: function(callback, offset, limit)
    {
    
        if (this.Type == "playlist") 
        {
            this.itemsHelper.ExpectedItems = this.Item.items;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, this.Item.id, offset, limit);
        }
        else if (this.Type == "album") 
        {
            this.itemsHelper.ExpectedItems = this.Item.tracks;
            AmpacheMobile.ampacheServer.GetSongs(callback, this.Item.id, null, null, offset, limit);
        }
        else if ((this.Type == "all-songs") || (this.Type == "search")) 
        {
            this.itemsHelper.ExpectedItems = AmpacheMobile.ampacheServer.songs;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, null, offset, limit, this.Search);
        }
        else if (this.Type == "search-global") 
        {
            this.itemsHelper.ExpectedItems = AmpacheMobile.ampacheServer.songs;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, null, offset, limit, this.Search, true);
        }
        
        
        
    },
    
    IsMatch: function(item, filterString)
    {
        var matchString = item.title;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) 
        {
            return true;
        }
        return false;
    },
    
    
    handleShuffleAll: function(event)
    {
        this.controller.stageController.pushScene('now-playing', 
        {
            playList: this.itemsHelper.ItemsList,
            startIndex: 0,
            shuffle: true
        });
        
    },
    
    listTapHandler: function(event)
    {
        Mojo.Log.info("--> listTapHandler");
        
        
        this.controller.stageController.pushScene('now-playing', 
        {
            playList: this.itemsHelper.ItemsList,
            startIndex: event.index,
            shuffle: false
        });
        
        Mojo.Log.info("<-- listTapHandler");
    },
    
    
    dividerFunc: function(itemModel)
    {
        //Mojo.Log.info("--> dividerFunc");
        
        if (itemModel.name.charAt(0).toLowerCase() == "t") 
        {
            if (itemModel.name.substring(0, 3).toLowerCase() == "the") 
            {
                return itemModel.name.charAt(4);
            }
            else 
            {
                return "T";
            }
        }
        else 
        {
            return itemModel.name.charAt(0);
        }
        
        //Mojo.Log.info("--> dividerFunc");
    },
    
    
    
    
    //This function will sort the album list by year and then alphabetically within the year
    sortfunction: function(a, b)
    {
    
        var retvalue = 0;
        return retvalue;
    },
    
    
    activate: function(event)
    {
        this.itemsHelper.Visible = true;
        this.itemsHelper.GetItems();
    },
    
    
    
    
    deactivate: function(event)
    {
        this.itemsHelper.Visible = false;
        ;
    },
    
    
    
    cleanup: function(event)
    {
        /* this function should do any cleanup needed before the scene is destroyed as 
         a result of being popped off the scene stack */
        Mojo.Event.stopListening(this.controller.get('songsList'), Mojo.Event.listTap, this.listTapHandler);
    },
    
    
    
    
    
    
    
    TurnOnSpinner: function(message)
    {
        Mojo.Log.info("--> TurnOnSpinner");
        CenterSpinner($('large-activity-spinner'));
        //this.controller.get('wait-message').innerHTML = message;
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<-- ");
    },
    
    TurnOffSpinner: function()
    {
        Mojo.Log.info("-----> TurnOffSpinner");
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOffSpinner");
    }
    
    
    
    
    
})





