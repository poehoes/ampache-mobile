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

var AlbumSortType = {"alpha":0, "year":1, "artist":2};
var SortOrder = {"descending":1, "ascending":-1}

AlbumsAssistant = Class.create(
{

    initialize: function(params)
    {
        Mojo.Log.info("--> constructor");
        this.SceneTitle = params.SceneTitle;
        this.DisplayArtistInfo = params.DisplayArtistInfo;
        //this.AlbumsList = params.AlbumsList;
        //this.AlbumsList.sort(this.sortfunction);
        
        this.ExpectedAlbums = params.ExepectedAlbums;
        
        if (params.Artist_id != null) 
        {
            //this.Artist = params.Artist;
            this.isArtistView = true;
            this.Artist_id = params.Artist_id;
			
        }
        else 
            this.isArtistView = false;
        
        
		if(params.Search)
        {
            this.Search = params.Search;
        } 
        
        this.itemsHelper = new ItemsHelper();
        
		this.sortType = AmpacheMobile.settingsManager.settings.AlbumsSort;
		this.sortOrder = SortOrder.descending;
		
		
        Mojo.Log.info("<-- constructor");
    },
    
    
    
    
    setup: function()
    {
    
        Mojo.Log.info("--> setup");
        
        
        
        
        
        
        
        this.PPattr = 
        {
            title: this.SceneTitle,
            image: 'images/icons/albums.png'
        };
        this.albumLoadModel = 
        {
            //iconPath: "action-icon",
            value: 0
            //disabled : false
        };
        this.controller.setupWidget('albumProgressbar', this.PPattr, this.albumLoadModel);
        
        
        
        //this.controller.get('title').update(this.SceneTitle);
        
        
        //Mojo.Log.info("Setting up albums for:", this.ArtistInfo.name);
        if (!this.isArtistView) 
            this.controller.get('shuffleForArtist').hide();
        
        
        
        
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
        
        
        if (this.DisplayArtistInfo == true) 
        {
            var listAttributes = 
            {
                filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
                itemTemplate: 'albums/listitem_w_artist',
                dividerTemplate: 'albums/divider',
                dividerFunction: this.dividerFunc.bind(this)
            
            };
            
            
            /*
             this.listAttributes = {
             itemTemplate: 'albums/listitem',
             //dividerTemplate: 'artist-albums/divider',
             //dividerFunction: this.dividerFunc.bind(this),
             
             };*/
        }
        else 
        {
            if (AmpacheMobile.Account.ExtraCoverArt) 
            {
                var listAttributes = 
                {
                    itemTemplate: 'albums/listitem_w_coverart',
                    filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper)
                };
            }
            else 
            {
                var listAttributes = 
                {
                    itemTemplate: 'albums/listitem',
                    filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper)
                };
            }
        }
        
        
        
        
        this.listModel = 
        {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        
        
        
        this.controller.setupWidget('albumsFilterList', listAttributes, this.listModel);
        
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('albumsFilterList'), Mojo.Event.listTap, this.listTapHandler);
        
        
        
        
        
        this.controller.get('shuffleAll').observe(Mojo.Event.tap, this.handleShuffleAll.bindAsEventListener(this));
        
		//var toggleAlpaha = (AlbumSortType.alpha == this.sortType);
		//var toggleYear =(AlbumSortType.year == this.sortType);
		//var toggleArtist = (AlbumSortType.artist == this.sortType)
		
		//Setup App Menu
		var appMenuAttr = {omitDefaultItems: true};
        
		
		
		this.sortItems = [
            
            {label:"Alphabetical", command:"doSort-alpha" /*, toggleCmd: toggleAlpaha*/},
            {label:"Year", command: "doSort-year" /*,  toggleCmd: toggleYear*/},
            {label:"Artist", command:"doSort-artist" /*, toggleCmd: toggleArtist*/}
            
        ];
        
		
		this.appMenuModel = {
            visible: true,
            items: [
                //{label: "Test Connection", command: "doTest-cmd"},
                {label: "Preferences...",  command: "doPref-cmd" },
                {label: "Sort",  items:this.sortItems },
			    {label: "About...", command: "about-cmd"}
            ]
        };
		
		
		
		
        this.controller.setupWidget(Mojo.Menu.appMenu, appMenuAttr, this.appMenuModel);
        
        this.TurnOnSpinner("Retrieving<br>Albums");
        
        
        var params = 
        {
            controller: this.controller,
            TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('albumsFilterList'),
            getItemsCallback: this.GetAlbums.bind(this),
            //ItemsList :this.AlbumList,
            listModel: this.listModel,
            progressModel: this.albumLoadModel,
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: this.ExpectedAlbums,
            SortFunction: this.sortList.bind(this),
            MatchFunction: this.IsMatch,
			PopulateSort: this.AddSortToItems.bind(this)
        
        }
        
        this.itemsHelper.setup(params);
        
        
        Mojo.Log.info("<-- setup");
        
    },
    
	
	
	
	
	

	
	
    IsMatch: function(item, filterString)
    {
        var matchString = item.name + " " + item.artist;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) 
        {
            return true;
        }
        return false;
    },
    
    
    GetAlbums: function(GotItems, offset, limit)
    {
        Mojo.Log.info("--> GetMoreAlbums");
        
        if (this.isArtistView == true) 
        {
            AmpacheMobile.ampacheServer.GetAlbums(GotItems, this.Artist_id, offset, limit);
        }
        else 
        {
            AmpacheMobile.ampacheServer.GetAlbums(GotItems, null, offset, limit,this.Search);
        }
        
        Mojo.Log.info("<-- GetMoreAlbums");
    },
    
 
    
    listTapHandler: function(event)
    {
        Mojo.Log.info("--> listTapHandler");
        
        this.controller.stageController.pushScene('songs', 
        {
            SceneTitle: event.item.artist + " - " + event.item.name,
            Type: "album",
            Album_id: event.item.id,
			Item:event.item
        
        });
        
        Mojo.Log.info("<-- listTapHandler");
    },
    
    handleShuffleAll: function(event)
    {
        Mojo.Log.info("--> handleShuffleAll");
        
        
        this.TurnOnSpinner("Retrieving<br>Songs");
        AmpacheMobile.ampacheServer.GetSongs(this.FinishedGettingShuffleAll.bind(this), null, this.Artist_id, null);
        this.RequestedArtist = event.item;
        
        Mojo.Log.info("<-- handleShuffleAll");
    },
    
    FinishedGettingShuffleAll: function(_songsList)
    {
        Mojo.Log.info("--> GotAllSongsCallback");
        this.TurnOffSpinner();
        this.controller.stageController.pushScene('now-playing', 
        {
            playList: _songsList,
            startIndex: 0,
            shuffle: true
        });
        Mojo.Log.info("<-- GotAllSongsCallback");
        
    },
    
    
	handleCommand : function(event)
    {
        var reSortList = false;
		this.prevSortType = this.sortType;
		
        switch (event.command)
        {
            case "doSort-year":
			    if(this.sortType!= AlbumSortType.year)
				{
					this.sortType= AlbumSortType.year;
				    reSortList = true;
				}
                event.stopPropagation();
                break;
            case "doSort-alpha":
			    if(this.sortType!= AlbumSortType.alpha)
                {
                    this.sortType= AlbumSortType.alpha;
                    reSortList = true;
                }
                event.stopPropagation();
                break;
            case "doSort-artist":
                 if(this.sortType!= AlbumSortType.artist)
                {
                    this.sortType= AlbumSortType.artist;
                    reSortList = true;
                }
				event.stopPropagation();
                break;
                
                
        }
		
		if(reSortList)// && this.itemsHelper.LoadingFinished)
		{
			 AmpacheMobile.settingsManager.settings.AlbumsSort = this.sortType;
             AmpacheMobile.settingsManager.SaveSettings();
			 this.itemsHelper.ReSortList();
        }
		/*else if(reSortList)
		{
			this.showDialogBox("WARNING", "Cannot sort while list is loading.")
			this.sortType = this.prevSortType;
		}*/
        
    },
	
	
    AddSortToItems:function(items)
	{
		for (var i = 0; i < items.length; i++) 
		{
			switch (this.sortType)
			{
				case AlbumSortType.year:
					items[i].sort = items[i].year;
					break;
				case AlbumSortType.artist:
					items[i].sort = items[i].artist.toUpperCase();
					break;
				default:
					items[i].sort = items[i].name[0].toUpperCase();
					break;	
			}
		}
	},
	
	 
    
    
    dividerFunc: function(itemModel)
    {
        switch (this.sortType)
        {   
            case AlbumSortType.year:
			   
                return itemModel.year;
                break;
            case AlbumSortType.artist:
			   
                return itemModel.artist;
                break;
            default:
				return itemModel.sort[0];
                break;
                
                
        }
		
		
		  
    },
    
    
    
	sortList:function(a, b)
	{
		switch (this.sortType)
		{	
			case AlbumSortType.year:
			    return (this.sortbyYearTitle(a,b)*this.sortOrder);
				break;
			case AlbumSortType.artist:
			    return (this.sortAlpha(a.sort,b.sort)*this.sortOrder);
				break;
		    default:
                return (this.sortAlpha(a.name.toUpperCase(),b.name.toUpperCase())*this.sortOrder);
                break;
            	
				
		}
		
	},

	
	
	sortAlpha: function(a, b)
	{
		if (a == b) 
			return 0;
		
		if(a<b)
		  return -1;
		else return 1
	},
    
    //This function will sort the album list by year and then alphabetically within the year
    sortbyYearTitle: function(a, b)
    {
    
        var retvalue;
        
        if (a.year == "N/A") 
            ayear = "0000"
        
        
        else 
            ayear = a.year;
        if (b.year == "N/A") 
            byear = "0000";
        else 
            byear = b.year;
        
        
        
        if (ayear == byear) 
        {
            return this.sortAlpha(a.name,b.name);
			
        }
        else if (ayear < byear) 
        {
            retvalue = 1;
        }
        else if (ayear > byear) 
        {
            retvalue = -1;
        }
        
        //Mojo.Log.info("A.year:", a.year, "b.year:", b.year, "revalue", retvalue);
        
        return retvalue;
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
        
        //AmpacheMobile.ampacheServer.GetAlbumsCancel();
        this.itemsHelper.Visible = false;
        
        Mojo.Log.info("<-- deactivate");
        
    },
    
    cleanup: function(event)
    {
    
        Mojo.Log.info("--> cleanup");
        
        
        Mojo.Event.stopListening(this.controller.get('albumsFilterList'), Mojo.Event.listTap, this.listTapHandler);
        this.itemsHelper=null;
        Mojo.Log.info("<-- cleanup");
        
        
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
    },
	
	    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message)
    {
        this.controller.showAlertDialog(
        {
            onChoose: function(value)
            {
            },
            title: title,
            message: message,
            choices: [
            {
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    }
    


   
})

