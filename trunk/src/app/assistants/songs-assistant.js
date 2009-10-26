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
        
        
        this.Playlist_id = params.Playlist_id;
        this.Album_id = params.Album_id;
        this.Artist_id = params.Artist_id;
        this.Expected_items = params.Expected_items;
        
        if ((this.Type === "random") || (this.Type === "playlist") || (this.Type === "all-songs") || (this.Type === "search") || (this.Type === "search-global") || (this.Type === "genre") || this.Type === "artist-songs") 
        {
            this.DisplayAlbumInfo = true;
        }
        
        if (params.Genre_id) 
        {
            this.Genre_id = params.Genre_id;
        }
        
        if (params.Search) 
        {
            this.Search = params.Search;
        }
        
        this.itemsHelper = new ItemsHelper();
        
        AmpacheMobile.clickedLink = false;
    },
    
    setup: function()
    {
    
        var title = this.controller.get('title');
        title.innerHTML = this.SceneTitle;
        
        
        
        
        //*********************************************************************************
        //Setup Sort List
        var template = 'songs/listitem';
        
        if ((this.DisplayAlbumInfo === true) && (this.Type === "artist-songs")) 
        {
            template = 'songs/listitem_w_artist_simple';
        }
        else if (this.DisplayAlbumInfo === true) 
        {
            template = 'songs/listitem_w_artist';
        }
        
        
        var attributes = 
        {
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
            itemTemplate: template
            //dividerTemplate: 'artist-albums/divider',
            //dividerFunction: this.dividerFunc.bind(this),
        };
        
        this.listModel = 
        {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('songsList', attributes, this.listModel);
        
        
        
        
        //*********************************************************************************************************
        // Items Helper
        var params = 
        {
            controller: this.controller,
            //TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('songsList'),
            getItemsCallback: this.GetSongs.bind(this),
            listModel: this.listModel,
            //progressModel: this.songLoadModel,
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: this.Expected_items,
            SortFunction: null,
            MatchFunction: this.IsMatch,
            IndexBusted: (this.Type === "search-global") ? true : false
        
        };
        this.itemsHelper.setup(params);
        
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        
        //**********************************************************************
        // Events
        this.shuffleHandler = this.handleShuffleAll.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('shuffleAll'), Mojo.Event.tap, this.shuffleHandler);
        
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('songsList'), Mojo.Event.listTap, this.listTapHandler);
        
    },
    
    cleanup: function(event)
    {
        Mojo.Event.stopListening(this.controller.get('songsList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.controller.get('shuffleAll'), Mojo.Event.tap, this.shuffleHandler);
        this.itemsHelper.cleanup();
        this.itemsHelper = null;
    },
    
    
    handleCommand: function(event)
    {
        this.itemsHelper.handleCommand(event);
    },
    
    holdEvent: function(event)
    {
        event.stop();
        //alert(event.count);
    },
    
    
    pushArtist: function(id)
    {
        //alert(id);
    },
    
    
    GetSongs: function(callback, offset, limit)
    {
    
        if (this.Type === "random") 
        {
            this.itemsHelper.fetchLimit = 1;
            var random = Math.floor(Math.random() * parseInt(AmpacheMobile.ampacheServer.songs, 10));
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, null, null, random, 1);
        }
        else if (this.Type === "playlist") 
        {
            this.itemsHelper.ExpectedItems = this.Item.items;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, this.Playlist_id, null, offset, limit);
        }
        else if (this.Type === "album") 
        {
            if (this.Item) 
            {
                this.itemsHelper.ExpectedItems = this.Item.tracks;
            }
            AmpacheMobile.ampacheServer.GetSongs(callback, this.Album_id, null, null, null, offset, limit);
        }
        else if ((this.Type === "all-songs") || (this.Type === "search")) 
        {
            this.itemsHelper.ExpectedItems = AmpacheMobile.ampacheServer.songs;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, null, null, offset, limit, this.Search);
        }
        else if (this.Type === "artist-songs") 
        {
        
            this.itemsHelper.ExpectedItems = this.Expected_items;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, this.Artist_id, null, null, offset, limit);
        }
        else if (this.Type === "search-global") 
        {
            this.itemsHelper.ExpectedItems = AmpacheMobile.ampacheServer.songs;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, null, null, offset, limit, this.Search, true);
        }
        else if (this.Type === "genre") 
        {
            this.itemsHelper.ExpectedItems = AmpacheMobile.ampacheServer.songs;
            AmpacheMobile.ampacheServer.GetSongs(callback, null, null, null, this.Genre_id, offset, limit, this.Search, true);
        }
        
        
        
        
    },
    
    IsMatch: function(item, filterString)
    {
        var matchString = item.title + " " + item.artist + " " + item.album;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) 
        {
            return true;
        }
        return false;
    },
    
    
    handleShuffleAll: function(event)
    {
        if (!this.itemsHelper.IsFiltered() && (AmpacheMobile.audioPlayer.PlayListPending === false)) 
        {
        
        
            if (this.itemsHelper.ItemsList.length > 0) 
            {
                this.controller.stageController.pushScene(
                {
                    transition: AmpacheMobile.Transition,
                    name: "now-playing"
                }, 
                {
                    type: "play",
                    playList: this.itemsHelper.ItemsList,
                    startIndex: 0,
                    shuffle: true
                });
            }
        }
        
        else 
        { //Filtered
            var i = 0;
            var filteredCmd = [];
            
            if (this.itemsHelper.IsFiltered() || (AmpacheMobile.audioPlayer.PlayListPending === true)) 
            {
                filteredCmd[i++] = 
                {
                    label: "Shuffle All Songs",
                    command: "play-songs-shuffle"
                };
            }
            
            if (this.itemsHelper.IsFiltered()) 
            {
                //Filtered
                filteredCmd[i++] = 
                {
                    label: "Shuffle Filtered Songs",
                    command: "play-filtered-shuffle"
                };
            }
            
            if (this.itemsHelper.IsFiltered() && (AmpacheMobile.audioPlayer.PlayListPending === true)) 
            {
                filteredCmd[i++] = 
                {
                    label: "Enqueue Filtered Shuffled",
                    command: "enqueue-filtered-shuffle"
                };
            }
            
            if (AmpacheMobile.audioPlayer.PlayListPending === true) 
            {
                filteredCmd[i++] = 
                {
                    label: "Enqueue All Shuffled",
                    command: "enqueue-songs-shuffle"
                };
            }
            
            
            this.controller.popupSubmenu(
            {
                onChoose: this.popupHandler.bind(this),
                placeNear: $('shuffleAll'),
                items: filteredCmd
            });
        }
        
        
        
    },
    
    
    popupHandler: function(event)
    {
        if (event) 
        {
            var item = this;
            var obj;
            var controller;
            if (item._this) 
            {
                controller = item._this.controller;
                obj = item._this;
            }
            else 
            {
                controller = this.controller;
                obj = this;
            }
            var playList;
            var index;
            Mojo.Log.info(event);
            
            var type = "unknown";
            if (event.match("play")) 
            {
                type = "play";
            }
            else if (event.match("enqueue")) 
            {
                type = "enqueue";
            }
            
            var index = 0;
            var shuffled = false;
            if (event.match("shuffle")) 
            {
                shuffled = true;
            }
            
            
            if ((type !== "play") && shuffled === false) 
            {
                index = obj.FindIndex(item.id);
            }
            else if ((type !== "enqueue") && shuffled === false) 
            {
                index = item._event.index;
            }
            
            if (type !== "unknown") 
            {
                if (event.match("filtered")) 
                {
                    playList = obj.itemsHelper.GetAllMatches(obj.itemsHelper.filterString);
                }
                else 
                {
                    playList = obj.itemsHelper.ItemsList;
                }
            }
            
            
            if (event === "pushArtist") 
            {
                controller.stageController.pushScene(
                {
                    transition: AmpacheMobile.Transition,
                    name: "albums"
                }, 
                {
                    SceneTitle: item.artist,
                    DisplayArtistInfo: false,
                    Artist_id: item.artist_id,
                    ExpectedAlbums: parseInt(AmpacheMobile.ampacheServer.albums, 10)
                });
            }
            else if (event === "pushAlbum") 
            {
                controller.stageController.pushScene(
                {
                    transition: AmpacheMobile.Transition,
                    name: "songs"
                }, 
                {
                    SceneTitle: item.artist + " - " + item.album,
                    Type: "album",
                    Album_id: item.album_id,
                    Expected_items: parseInt(AmpacheMobile.ampacheServer.songs, 10),
                    Item: event.item
                
                });
            }
            else if (type !== "unknown") 
            {
                if (playList.length != 0) 
                {
                    controller.stageController.pushScene(
                    {
                        transition: AmpacheMobile.Transition,
                        name: "now-playing"
                    }, 
                    {
                        type: type,
                        playList: playList,
                        startIndex: index,
                        shuffle: shuffled
                    });
                }
            }
        }
    },
    
    
    FindIndex: function(id)
    {
        for (var i = 0; i < this.itemsHelper.ItemsList.length; i++) 
        {
            if (this.itemsHelper.ItemsList[i].id === id) 
            {
                return i;
            }
        }
        return 0;
    },
    
    listTapHandler: function(event)
    {
        Mojo.Log.info("--> listTapHandler");
        
        var click_id = event.originalEvent.target.id;
        var item;
        if (click_id === "moreOptions") 
        {
            item = event.item;
            item._this = this;
            var editCmd = [
            {
                label: event.item.artist,
                command: "pushArtist",
                secondaryIconPath: "images/icons/artists.png"
            }, 
            {
                label: event.item.album,
                command: "pushAlbum",
                secondaryIconPath: "images/icons/albums.png"
            }];
            
            this.controller.popupSubmenu(
            {
                onChoose: this.popupHandler.bind(item),
                placeNear: event.originalEvent.target,
                items: editCmd
            });
        }
        else 
        {
            if (!this.itemsHelper.IsFiltered() && (AmpacheMobile.audioPlayer.PlayListPending === false)) 
            {
                var playList = this.itemsHelper.ItemsList;
                this.controller.stageController.pushScene(
                {
                    transition: AmpacheMobile.Transition,
                    name: "now-playing"
                }, 
                {
                    type: "play",
                    playList: playList,
                    startIndex: event.index,
                    shuffle: false
                });
            }
            else 
            {
            
                var i = 0;
                var filteredCmd = [];
                item = event.item;
                item._this = this;
                item._event = event;
                
                if (this.itemsHelper.IsFiltered() || (AmpacheMobile.audioPlayer.PlayListPending === true)) 
                {
                    filteredCmd[i++] = 
                    {
                        label: "Play All Songs",
                        command: "play-songs"
                    };
                }
                
                if (this.itemsHelper.IsFiltered()) 
                {
                    //Filtered
                    filteredCmd[i++] = 
                    {
                        label: "Play Filtered Songs",
                        command: "play-filtered"
                    };
                }
                
                if (this.itemsHelper.IsFiltered() && (AmpacheMobile.audioPlayer.PlayListPending === true)) 
                {
                    filteredCmd[i++] = 
                    {
                        label: "Enqueue Filtered Songs",
                        command: "enqueue-filtered"
                    };
                }
                
                if (AmpacheMobile.audioPlayer.PlayListPending === true) 
                {
                    filteredCmd[i++] = 
                    {
                        label: "Enqueue All Songs",
                        command: "enqueue-songs"
                    };
                }
                
                
                this.controller.popupSubmenu(
                {
                    onChoose: this.popupHandler.bind(item),
                    placeNear: event.originalEvent.target,
                    items: filteredCmd
                });
            }
            
            
            
            
            
            
            
            
            
        }
        
        Mojo.Log.info("<-- listTapHandler");
    },
    
    
    
    
    dividerFunc: function(itemModel)
    {
        //Mojo.Log.info("--> dividerFunc");
        
        if (itemModel.name.charAt(0).toLowerCase() === "t") 
        {
            if (itemModel.name.substring(0, 3).toLowerCase() === "the") 
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
        this.itemsHelper.Activate();
    },
    
    deactivate: function(event)
    {
        this.itemsHelper.Deactivate();
    }
    
});





