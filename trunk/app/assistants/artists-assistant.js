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

    initialize: function(params)
    {
    
        this.ExpectedArtists = params.ExpectedArtists;
        
        this.itemsHelper = new ItemsHelper();
        
    },
    
    setup: function()
    {
    
        this.ArtistList = new Array();
        
        
        /* setup widgets here */
        this.spinnerLAttrs = 
        {
            spinnerSize: 'large'
        }
        
        this.spinnerModel = 
        {
            spinning: false
        }
        
        this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
        
        
        this.PPattr = 
        {
            title: "Artists",
            image: 'images/artists.png'
        };
        this.artistLoadModel = 
        {
            value: 0
        };
        this.controller.setupWidget('artistProgressbar', this.PPattr, this.artistLoadModel);
        
        
        
        /*
         var attributes = {
         itemTemplate: 'artists/listitem',
         dividerTemplate: 'artists/divider',
         dividerFunction: this.dividerFunc.bind(this),
         };*/
        var attributesFilter = 
        {
            itemTemplate: 'artists/listitem',
            dividerTemplate: 'artists/divider',
            dividerFunction: this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper)
        };
        this.listModel = 
        {
            disabled: false,
            items: this.ArtistList
        };
        
        this.ArtistsController = this.controller;
        
        this.GetArtistsPending = false;
        
        //this.controller.setupWidget('artistList', attributes, this.listModel);
        this.controller.setupWidget('artistFilterList', attributesFilter, this.listModel);
        
        
        
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        //Mojo.Event.listen(this.controller.get('artistList'), Mojo.Event.listTap, this.listTapHandler);
        
        Mojo.Event.listen(this.controller.get('artistFilterList'), Mojo.Event.listTap, this.listTapHandler);
        
        this.gotFilter = this.searchFilter.bind(this);
        Mojo.Event.listen(this.controller.get('artistFilterList'), Mojo.Event.filter, this.gotFilter, true);
        
        
        
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        
        
        var params = 
        {
            controller: this.controller,
            TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('artistFilterList'),
            getItemsCallback: this.GetArtists.bind(this),
            listModel: this.listModel,
            progressModel: this.artistLoadModel,
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: this.ExpectedArtists,
            SortFunction: null,
            MatchFunction: this.IsMatch
        
        }
        
        this.itemsHelper.setup(params);
        
        
        
        this.TurnOnSpinner();
        
    },
    
    GetArtists: function(GotItems, offset, limit)
    {
        AmpacheMobile.ampacheServer.GetArtists(GotItems, offset, limit)   
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
    
    
    
    
    
    
    listTapHandler: function(event)
    {
        Mojo.Log.info("--> listTapHandler", event.item.name);
        
     
        this.RequestedArtist = event.item;
        this.controller.stageController.pushScene('albums', 
        {
            SceneTitle: this.RequestedArtist.name,
            DisplayArtistInfo: false,
            //AlbumsList:_artistAlbumsList,
            Artist: this.RequestedArtist,
            ExepectedAlbums: this.RequestedArtist.albums
        });
        
        Mojo.Log.info("<-- listTapHandler");
    },
    
    
   
    TurnOnSpinner: function()
    {
        Mojo.Log.info("-----> TurnOnSpinner");
        CenterSpinner($('large-activity-spinner'));
        this.spinnerModel.spinning = true;
        this.ArtistsController.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOnSpinner");
    },
    
    TurnOffSpinner: function()
    {
        Mojo.Log.info("-----> TurnOffSpinner");
        this.spinnerModel.spinning = false;
        this.ArtistsController.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOffSpinner");
    },
    
    
    
    dividerFunc: function(itemModel)
    {
        //Mojo.Log.info("--> dividerFunc");
        
        if (itemModel.name.charAt(0).toLowerCase() == "t") 
        {
            if (itemModel.name.substring(0, 4).toLowerCase() == "the ") 
            {
            
            
                var regExp = /\s+/g;
                var name = itemModel.name.toLowerCase().replace(regExp, '');
                
                return name[3].toUpperCase();
            }
            else 
            {
                return "T";
            }
        }
        else if (itemModel.name.charAt(0).toLowerCase() == "a") 
        {
            if (itemModel.name.substring(0, 2).toLowerCase() == "a ") 
            {
                var regExp = /\s+/g;
                var name = itemModel.name.toLowerCase().replace(regExp, '');
                return name[1].toUpperCase();
            }
            else 
            {
                return "A";
            }
            
        }
        else 
        {
            return itemModel.name.charAt(0).toUpperCase();
        }
        
        //Mojo.Log.info("--> dividerFunc");
    },
    
    
    
    activate: function(event)
    {
    
        Mojo.Log.info("--> activate");
        
        this.itemsHelper.Visible = true;
        this.itemsHelper.GetItems();
        
        Mojo.Log.info("<-- activate");
    },
    
    
    
    
    deactivate: function(event)
    {
        Mojo.Log.info("--> deactivate");
        this.TurnOffSpinner();
        this.itemsHelper.Visible = false;
        Mojo.Log.info("<-- deactivate");
    },
    
    cleanup: function(event)
    {
        /* this function should do any cleanup needed before the scene is destroyed as 
         a result of being popped off the scene stack */
        //Mojo.Event.stopListening(this.controller.get('artistList'),Mojo.Event.listTap, this.listTapHandler); 
        Mojo.Event.stopListening(this.controller.get('artistFilterList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.controller.get('artistFilterList'), Mojo.Event.filter, this.gotFilter);
    },
    
    searchFilter: function(event)
    {
        Mojo.Log.info("--> searchFilter filterString:", event.filterString);
        
        
        
        Mojo.Log.info("<-- searchFilter filterString:", event.filterString);
    }
    
    
    
    
})


