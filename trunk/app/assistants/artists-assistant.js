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
        this.SceneTitle = params.SceneTitle;
        this.ExpectedArtists = params.ExpectedArtists;
        this.itemsHelper = new ItemsHelper();
        
        if (params.Genre_id) 
        {
            this.Genre_id = params.Genre_id;
        }
        
        if (params.Search) 
        {
            this.Search = params.Search;
        }
    },
    
    setup: function()
    {
        //******************************************************************************************************
        // Make scrim
        this.scrim = $("spinner-scrim");
        this.scrim.hide();
        
        //*********************************************************************************************************
        //  Setup Spinner
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
        //  Setup Progress Pill
        this.PPattr = 
        {
            title: this.SceneTitle,
            image: 'images/icons/artists.png'
        };
        this.artistLoadModel = 
        {
            value: 0
        };
        this.controller.setupWidget('artistProgressbar', this.PPattr, this.artistLoadModel);
        
        //*********************************************************************************************************
        //  Setup Filter List
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
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('artistFilterList', attributesFilter, this.listModel);
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('artistFilterList'), Mojo.Event.listTap, this.listTapHandler);
        
        //*********************************************************************************************************
        // Items Helper
		var sorting = this.Genre_id ? this.sortAlpha.bind(this) : null;
		
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
            SortFunction: sorting,
            MatchFunction: this.IsMatch
        };
        this.itemsHelper.setup(params);
        this.TurnOnSpinner();
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
    },
    
	
	sortAlpha: function(a, b)
    {
        
			var regExp = /(the|a)\s+/g;
			var a_fixed = a.name.toLowerCase().replace(regExp, '');;
			var b_fixed = b.name.toLowerCase().replace(regExp, '');;
			
			if (a_fixed == b_fixed) 
				return 0;
			
			if (a_fixed < b_fixed) 
				return -1;
			else 
				return 1
		
    },
	
	
    GetArtists: function(GotItems, offset, limit)
    {
        if (!this.Genre_id) 
        {
            AmpacheMobile.ampacheServer.GetArtists(GotItems, null, offset, limit, this.Search)
        }
        else 
        {
            AmpacheMobile.ampacheServer.GetArtists(GotItems, this.Genre_id, offset, limit, this.Search)
        }
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
            Artist_id: event.item.id,
            //Artist: this.RequestedArtist,
            ExpectedAlbums: this.RequestedArtist.albums
        });
        Mojo.Log.info("<-- listTapHandler");
    },
    
    TurnOnSpinner: function()
    {
        Mojo.Log.info("-----> TurnOnSpinner");
        CenterSpinner($('large-activity-spinner'));
        this.scrim.show();
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOnSpinner");
    },
    
    TurnOffSpinner: function()
    {
        Mojo.Log.info("-----> TurnOffSpinner");
        this.scrim.hide();
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<----- TurnOffSpinner");
    },
    
    dividerFunc: function(itemModel)
    {
       var regExp = /(the|a)\s+/g;
	   var dividerText = itemModel.name.toLowerCase().replace(regExp, '');
	   return dividerText[0].toUpperCase();
    },
    
    activate: function(event)
    {
        this.itemsHelper.Visible = true;
        this.itemsHelper.GetItems();
    },
    
    deactivate: function(event)
    {
        this.TurnOffSpinner();
        this.itemsHelper.Visible = false;
    },
    
    cleanup: function(event)
    {
        Mojo.Event.stopListening(this.controller.get('artistFilterList'), Mojo.Event.listTap, this.listTapHandler);
        this.itemsHelper = null;
    }
})
