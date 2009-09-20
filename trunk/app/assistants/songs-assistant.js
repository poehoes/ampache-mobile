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
        Mojo.Log.info("--> constructor");
        this.SceneTitle = params.SceneTitle;
        this.Type = params.Type;
        this.Item = params.Item;
        //this.DisplayAlbumInfo = params.DisplayAlbumInfo;
        //this.SongsList = params.SongsList;
        
        
        //this.thisIsAnAlbum = params.thisIsAnAlbum;
        //this.art = params.art;
        
        if ((this.Type == "playlist") || (this.Type=="all-songs")) 
        {
            this.DisplayAlbumInfo = true;
        }
        
        this.SongList = new Array();
        
        this.LIMIT = AmpacheMobile.FetchSize;
        this.Offset = 0;
        
        this.LoadingFinished = false;
        this.Visible = false;
        
        Mojo.Log.info("<-- constructor");
    },
    
    setup: function()
    {
    
        Mojo.Log.info("--> setup");
        
        
        $(coverArt).src = "images/shuffle-32.png";
        
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
                filterFunction: this.FilterSongList.bind(this),
                itemTemplate: 'songs/listitem_w_artist'
                //dividerTemplate: 'artist-albums/divider',
                //dividerFunction: this.dividerFunc.bind(this),
            };
        }
        else 
        {
            var attributes = 
            {
				filterFunction: this.FilterSongList.bind(this),
                itemTemplate: 'songs/listitem'
                //dividerTemplate: 'artist-albums/divider',
                //dividerFunction: this.dividerFunc.bind(this),
            };
        }
        this.listModel = 
        {
            disabled: false,
            items: this.SongList
        };
        
        
        this.artistSongsList = null;
        this.controller.setupWidget('songsList', attributes, this.listModel);
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('songsList'), Mojo.Event.listTap, this.listTapHandler);
        
        //******************************************************************************************************
        // Setup Spinner
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
        
        
        
        
        this.controller.get('shuffleAll').observe(Mojo.Event.tap, this.handleShuffleAll.bindAsEventListener(this));
        
        
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        
		this.TurnOnSpinner("Retrieving<br>Songs");
		
        Mojo.Log.info("<-- setup");
        
    },
    
    GetSongs: function()
    {
        if ((this.Visible == true) && (this.LoadingFinished==false))
        {
            if (this.Type == "playlist") 
            {
                this.ExpectedItems = this.Item.items;
				AmpacheMobile.ampacheServer.GetSongs(this.GotSongs.bind(this), null, null, this.Item.id, this.Offset, this.LIMIT);
            }
			if(this.Type == "album")
			{
				this.ExpectedItems = this.Item.tracks;
				AmpacheMobile.ampacheServer.GetSongs(this.GotSongs.bind(this), this.Item.id, null, null, this.Offset, this.LIMIT);
			}
			if(this.Type=="all-songs")
			{
				this.ExpectedItems = AmpacheMobile.ampacheServer.songs;
				AmpacheMobile.ampacheServer.GetSongs(this.GotSongs.bind(this), null, null, null, this.Offset, this.LIMIT);
			}
			
        }
    },
    
    
    GotSongs: function(_songsList)
    {
    
    
        if (this.spinnerModel.spinning) 
        {
            this.TurnOffSpinner();
        }
        
        for (var i = 0; i < _songsList.length; i++) 
        {
        
            var newItem = _songsList[i];
            this.SongList.push(newItem);
            
        }
        
        //Update Progress
        var progress = this.listModel.items.length / this.ExpectedItems ;
        this.songLoadModel.value = progress;
        this.controller.modelChanged(this.songLoadModel);
        
        
        this.SongList.sort(this.sortbyYearTitle);
        
        
        //Add to list   
        var songsList = this.controller.get('songsList');
        if ((this.filterString == "") || (this.filterString == null)) 
        {
            songsList.mojo.noticeUpdatedItems(0, this.SongList);
        }
        else //list currently has a filter
         {
            var matches = this.GetAllMatches(this.filterString);
            songsList.mojo.noticeUpdatedItems(0, matches);
            songsList.mojo.setLength(matches.length);
            songsList.mojo.setCount(matches.length);
        }
        
        
        
        
        if (_songsList.length != this.LIMIT) 
        {
            this.songLoadModel.value = 1;
            this.controller.modelChanged(this.songLoadModel);
            this.LoadingFinished = true;
        }
        else 
        {
            this.Offset = this.listModel.items.length;
            this.GetSongs();
        }
        
        
        Mojo.Log.info("Progress: " + progress);
        
    },
    
    
    handleShuffleAll: function(event)
    {
        this.controller.stageController.pushScene('now-playing', 
        {
            playList: this.SongList,
            startIndex: 0,
            shuffle: true
        });
        
    },
    
    listTapHandler: function(event)
    {
        Mojo.Log.info("--> listTapHandler");
        
        
        this.controller.stageController.pushScene('now-playing', 
        {
            playList: this.SongList,
            startIndex: event.index,
            shuffle: false
        });
        
        
        /*
         Mojo.Log.info("Launch Stream of", event.item.url);
         this.controller.serviceRequest('palm://com.palm.applicationManager', {
         method:'launch',
         parameters: {
         id : 'com.palm.app.streamingmusicplayer',
         params: {
         //target : Mojo.appPath + "audio/conan06.wav"
         target : event.item.url,
         }
         }
         });
         */
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
        /*
         if(a.year == b.year)
         {
         var alpabetize = []
         alpabetize[0] = a.name;
         alpabetize[1] = b.name;
         alpabetize.sort();
         
         if(alpabetize[0] == a.name)
         {
         retvalue =-1;
         }
         else retvalue =1;
         }
         else if(a.year < b.year)
         {
         retvalue = 1;
         }
         else if(a.year > b.year)
         {
         retvalue = -1;
         }
         
         //Mojo.Log.info("A.year:", a.year, "b.year:", b.year, "revalue", retvalue);
         */
        return retvalue;
    },
    
    
    activate: function(event)
    {
    
        Mojo.Log.info("--> activate");
        this.Visible = true;
        this.GetSongs();
        Mojo.Log.info("<-- activate");
    },
    
    
    
    
    deactivate: function(event)
    {
        Mojo.Log.info("--> deactivate");
        this.Visible = false;
        Mojo.Log.info("<-- deactivate");
    },
    
    
    
    cleanup: function(event)
    {
        /* this function should do any cleanup needed before the scene is destroyed as 
         a result of being popped off the scene stack */
        Mojo.Event.stopListening(this.controller.get('songsList'), Mojo.Event.listTap, this.listTapHandler);
    },
    
    
    
    GetAllMatches: function(filterString)
    {
        var subset = [];
        
        if (filterString == "") 
        {
            for (var i = 0; i < this.SongList.length; i++) 
            {
            
                subset.push(this.SongList[i]);
            }
        }
        else 
        {
            for (var i = 0; i < this.SongList.length; i++) 
            {
                var matchString = this.SongList[i].title;
                if (matchString.toLowerCase().include(filterString.toLowerCase())) 
                {
                
                    subset.push(this.SongList[i]);
                }
            }
        }
        return subset;
    },
    
    
    filterString: null,
    Matches: null,
    LastFilterLength: null,
    
    FilterSongList: function(filterString, listWidget, offset, count)
    {
        Mojo.Log.info("--> FilterSongList filterString:", filterString, "offset:", offset, "count:", count);
        var subset = [];
        
        
        
        if (this.SongList.length != 0) 
        {
        
            if ((filterString != this.filterString) || (this.LastFilterLength != this.SongList.length)) 
            {
                this.LastFilterLength = this.SongList.length;
                this.Matches = this.GetAllMatches(filterString);
                this.filterString = filterString;
            }
            
            Mojo.Log.info("Filtering: " + filterString);
            
            var Matches = this.Matches;
            
            for (var i = 0; i < count; i++) 
            {
                if ((i + offset) < Matches.length) 
                {
                
                    subset.push(Matches[i + offset]);
                }
                
            }
            
            
            listWidget.mojo.noticeUpdatedItems(offset, subset);
            listWidget.mojo.setLength(Matches.length);
            listWidget.mojo.setCount(Matches.length);
            
        }
        
        
        Mojo.Log.info("<-- FilterSongList:");
        
        
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





