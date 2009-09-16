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


function PlaylistsAssistant(params){
	Mojo.Log.info("--> PlaylistsAssistant.prototype.constructor");
	this.SceneTitle = params.SceneTitle;
	this.DisplayArtistInfo = params.DisplayArtistInfo;
	this.ExpectedPlaylists = params.ExpectedPlaylists
	
	this.PlaylistList = new Array();
	
	
	this.PLAYLIST_LIMIT = AmpacheMobile.settingsManager.settings.FetchSize;;
	this.playlistOffset = 0;
	
	Mojo.Log.info("<-- PlaylistsAssistant.prototype.constructor");
}




PlaylistsAssistant.prototype.setup = function(){

	Mojo.Log.info("--> PlaylistsAssistant.prototype.setup");
	
	

		this.PPattr = {
			title: this.SceneTitle,
			image: 'images/playlists.png',
		};
		this.playlistLoadModel = {
			//iconPath: "action-icon",
			value: 0,
			//disabled : false
		};
		this.controller.setupWidget('playlistProgressbar', this.PPattr, this.playlistLoadModel);
	
	
	
	//this.controller.get('title').update(this.SceneTitle);
	
	
	
	
	
	
	/* setup widgets here */
	this.spinnerLAttrs = {
		spinnerSize: 'large'
	}
	
	this.spinnerModel = {
		spinning: true
	}
	
	this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
	
	
	this.listAttributes = {
		
			itemTemplate: 'playlists/listitem',
			dividerTemplate: 'playlists/divider',
			dividerFunction: this.dividerFunc.bind(this),
			//renderLimit : 500,
			//lookahead: 100,
			filterFunction: this.FilterAlbumList.bind(this)
	};
	
	this.listModel = {
		disabled: false,
		items: this.PlaylistList,
	};
	
	
	
	
	this.controller.setupWidget('playlistFilterList', this.listAttributes, this.listModel);
	
	this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('playlistFilterList'), Mojo.Event.listTap, this.listTapHandler);
	

	
	//Request Playlists
	AmpacheMobile.ampacheServer.GetPlaylists(this.FinishedGettingPlaylists.bind(this), this.playlistOffset, this.PLAYLIST_LIMIT);
	
	this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
	
	Mojo.Log.info("<-- PlaylistsAssistant.prototype.setup");
	
}


PlaylistsAssistant.prototype.FinishedGettingPlaylists = function(_playlistList){
    Mojo.Log.info("--> PlaylistsAssistant.prototype.FinishedGettingAlbums");
    
	var currentItemsIndex = this.listModel.items.length;
	
	if (this.spinnerModel.spinning) {
		this.TurnOffSpinner();
	}
	for (var i = 0; i < _playlistList.length; i++) {
	
		var newItem = _playlistList[i];
		this.PlaylistList.push(newItem);
		//this.listModel.items.mojo.noticeAddedItems(this.listModel.items.length, [newItem]);
		//albumsList.mojo.noticeAddedItems(this.listModel.items.length, [newItem]);
		

	}
	var progress = this.PlaylistList.length / this.ExpectedPlaylists;
	this.playlistLoadModel.value = progress;
	this.controller.modelChanged(this.playlistLoadModel);
	
	var albumsList = this.controller.get('playlistFilterList');
	albumsList.mojo.noticeUpdatedItems(0,this.PlaylistList);
		
	if(progress>=1)
	{
		
	}
	else
	{
		AmpacheMobile.ampacheServer.GetPlaylists(this.FinishedGettingPlaylists.bind(this), this.listModel.items.length, this.PLAYLIST_LIMIT);

	}
	
	
	Mojo.Log.info("Progress: " + progress);
    Mojo.Log.info("<-- ArtistsAssistant.prototype.FinishedGettingAlbums");
    
}



PlaylistsAssistant.prototype.OnListAddEvent=function(event)
{
	Mojo.Log.info("--> PlaylistsAssistant.prototype.OnListAddEvent");
	
	
	Mojo.Log.info("--> PlaylistsAssistant.prototype.OnListAddEvent");	
},



PlaylistsAssistant.prototype.listTapHandler = function(event){
    Mojo.Log.info("--> PlaylistsAssistant.prototype.listTapHandler");
   	
	this.TurnOnSpinner();
	this.RequestedPlaylist = event.item;
    AmpacheMobile.ampacheServer.GetSongs(this.FinishedGettingPlaylistSongs.bind(this), null, null, event.item.id);
	
	
    Mojo.Log.info("<-- PlaylistsAssistant.prototype.listTapHandler");
}



PlaylistsAssistant.prototype.FinishedGettingPlaylistSongs = function(_songsList){
    Mojo.Log.info("--> ArtistsAssistant.prototype.FinishedGettingPlaylistSongs");
	
	//this.GetArtistsPending = false;
	this.TurnOffSpinner();
    this.controller.stageController.pushScene('songs', 
	{
		SceneTitle:this.RequestedPlaylist.name,
		Artist:null,
		DisplayAlbumInfo:true,
	    SongsList:_songsList,
		art:null,
	});
	
    Mojo.Log.info("<-- ArtistsAssistant.prototype.FinishedGettingPlaylistSongs");
    
}



















PlaylistsAssistant.prototype.handleShuffleAll = function(event)
{
	 Mojo.Log.info("--> PlaylistsAssistant.prototype.handleShuffleAll");
	 
	
	this.TurnOnSpinner();
	AmpacheMobile.ampacheServer.GetSongs(this.FinishedGettingArtistSongs.bind(this), null, this.Artist.id, null);
	this.RequestedArtist = event.item;
		 
	 Mojo.Log.info("<-- PlaylistsAssistant.prototype.handleShuffleAll");
}

PlaylistsAssistant.prototype.FinishedGettingArtistSongs = function(_songsList)
{
	Mojo.Log.info("--> PlaylistsAssistant.prototype.GotAllSongsCallback");
	this.TurnOffSpinner();
	this.controller.stageController.pushScene('now-playing', 
	{
		playList:_songsList,
		startIndex:0,
		shuffle:true,
	});
	Mojo.Log.info("<-- PlaylistsAssistant.prototype.GotAllSongsCallback");
	
}





PlaylistsAssistant.prototype.dividerFunc = function(itemModel){
    //Mojo.Log.info("--> PlaylistsAssistant.prototype.dividerFunc");
    
	/*
    if (itemModel.name.charAt(0).toLowerCase() == "t") {
        if (itemModel.name.substring(0, 3).toLowerCase() == "the") {
            return itemModel.name.charAt(4);
        }
        else {
            return "T";
        }
    }
    else {
        return itemModel.name.charAt(0);
    }
    */
	
	return itemModel.year;
    
	//return itemModel.name.charAt(0).toUpperCase();
	
    //Mojo.Log.info("--> PlaylistsAssistant.prototype.dividerFunc");
}




//This function will sort the album list by year and then alphabetically within the year
PlaylistsAssistant.prototype.sortbyYearTitle =function (a, b){
	
	
	
	return 0;
}


PlaylistsAssistant.prototype.activate = function(event){

    Mojo.Log.info("--> PlaylistsAssistant.prototype.activate");
	
	this.controller.setupWidget('playlistProgressbar', this.PPattr, this.playlistLoadModel);
    
    Mojo.Log.info("<-- PlaylistsAssistant.prototype.activate");
}




PlaylistsAssistant.prototype.deactivate = function(event){

    Mojo.Log.info("--> PlaylistsAssistant.prototype.deactivate");

	AmpacheMobile.ampacheServer.GetAlbumsCancel();
    
    Mojo.Log.info("<-- PlaylistsAssistant.prototype.deactivate");
    
}

PlaylistsAssistant.prototype.cleanup = function(event){
  
    Mojo.Log.info("--> PlaylistsAssistant.prototype.cleanup");

	
	Mojo.Event.stopListening(this.controller.get('playlistFilterList'),Mojo.Event.listTap, this.listTapHandler); 
    
    Mojo.Log.info("<-- PlaylistsAssistant.prototype.cleanup");
  
  
}


PlaylistsAssistant.prototype.TurnOnSpinner = function()
{
	Mojo.Log.info("--> PlaylistsAssistant.prototype.TurnOnSpinner");
	this.spinnerModel.spinning = true;
    this.controller.modelChanged(this.spinnerModel);
	Mojo.Log.info("<-- PlaylistsAssistant.prototype.TurnOnSpinner");
}

PlaylistsAssistant.prototype.TurnOffSpinner = function()
{
	Mojo.Log.info("-----> PlaylistsAssistant.prototype.TurnOffSpinner");
	this.spinnerModel.spinning = false;
    this.controller.modelChanged(this.spinnerModel);
	Mojo.Log.info("<----- PlaylistsAssistant.prototype.TurnOffSpinner");
}


/*
PlaylistsAssistant.prototype.FilterAlbumList = function(filterString, listWidget, offset, count){
	Mojo.Log.info("--> PlaylistsAssistant.prototype.FilterAlbumList");
	
	var subset = [];
	var totalSubsetSize = 0;
	
	//loop through the original data set & get the subset of items that have the filterstring
	var i = 0;
	while (i < this.albumAlbumList.length) {
	
		if (this.albumAlbumList[i].name.toLowerCase().include(filterString.toLowerCase())) {
			if (subset.length < count && totalSubsetSize >= offset) {
				subset.push(this.albumAlbumList[i]);
			}
			totalSubsetSize++;
		}
		i++;
	}
	
	//update the items in the list with the subset
	listWidget.mojo.noticeUpdatedItems(offset, subset);
	
	//set the list's lenght & count if we're not repeating the same filter string from an earlier pass
	if (this.filter !== filterString) {
		listWidget.mojo.setLength(totalSubsetSize);
		listWidget.mojo.setCount(totalSubsetSize);
	}
	this.filter = filterString;
	
	
	Mojo.Log.info("<-- PlaylistsAssistant.prototype.FilteralbumAlbumList");
}*/



PlaylistsAssistant.prototype.GetAllMatches = function(filterString){
	var subset = [];
	
	if (filterString == "") {
		for (var i = 0; i < this.PlaylistList.length; i++) {
		
			subset.push(this.PlaylistList[i]);
		}
	}
	else {
		for (var i = 0; i < this.PlaylistList.length; i++) {
			var matchString = this.PlaylistList[i].name + " " + this.PlaylistList[i].artist
			if (matchString.toLowerCase().include(filterString.toLowerCase())) {
			
				subset.push(this.PlaylistList[i]);
			}
		}
	}
	return subset;	
}


PlaylistsAssistant.prototype.filterString=null;
PlaylistsAssistant.prototype.Matches=null;

PlaylistsAssistant.prototype.FilterAlbumList = function(filterString, listWidget, offset, count){
	Mojo.Log.info("--> PlaylistsAssistant.prototype.FilterArtistList filterString:", filterString, "offset:", offset, "count:", count);
	var subset = [];
	

	
	if (this.PlaylistList.length != 0) {
	
			if(filterString != this.filterString)
	{
		this.Matches = this.GetAllMatches(filterString);
		this.filterString = filterString;
	}
	
		Mojo.Log.info("Filtering: " + filterString);
		
		var Matches = this.Matches;
		
		for (var i = 0; i < count; i++) {
			if ((i + offset) < Matches.length) {
			
				subset.push(Matches[i + offset]);
			}
			
		}
		
		
		listWidget.mojo.noticeUpdatedItems(offset, subset);
		listWidget.mojo.setLength(Matches.length);
		listWidget.mojo.setCount(Matches.length);
		
	}		
		
	
	Mojo.Log.info("<-- PlaylistsAssistant.prototype.FilterArtistList:");
	
	
}

