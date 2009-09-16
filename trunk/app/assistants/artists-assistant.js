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


function ArtistsAssistant(params){
	
	this.ExpectedArtists = params.ExpectedArtists;
	
	this.ARTIST_LIMIT = AmpacheMobile.settingsManager.settings.FetchSize;
	this.artistOffset = 0;
	
	this.Visible = true;
	this.LoadingFinished=false;
	
}

ArtistsAssistant.prototype.setup = function(){

	this.ArtistList = new Array();

	
		/* setup widgets here */
	this.spinnerLAttrs = {
		spinnerSize: 'large'
	}
	
	this.spinnerModel = {
		spinning: true
	}
	
	this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
	
	
	this.PPattr = {
			title: "Artists",
			image: 'images/artists.png'
		};
		this.artistLoadModel = {
			//iconPath: "action-icon",
			value: 0,
			//disabled : false
		};
		this.controller.setupWidget('artistProgressbar', this.PPattr, this.artistLoadModel);
	
	
	
	/*
	var attributes = {
		itemTemplate: 'artists/listitem',
		dividerTemplate: 'artists/divider',
		dividerFunction: this.dividerFunc.bind(this),
	};*/
	
	var attributesFilter = {
		itemTemplate: 'artists/listitem',
		dividerTemplate: 'artists/divider',
		dividerFunction: this.dividerFunc.bind(this),
		filterFunction: this.FilterArtistList.bind(this)
	};
	this.listModel = {
		disabled: false,
		items: this.ArtistList,
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
	
	
}

ArtistsAssistant.prototype.GetMoreArtists = function(){
    if ((this.Visible == true) && (this.LoadingFinished==false)) {
            AmpacheMobile.ampacheServer.GetArtists(this.GotArtists.bind(this), this.ArtistList.length, this.ARTIST_LIMIT)
    }
}





ArtistsAssistant.prototype.GotArtists = function (_artistList)
{
	 Mojo.Log.info("--> ArtistsAssistant.prototype.GotArtists");
	
	if (this.spinnerModel.spinning) {
		this.TurnOffArtistsSpinner();
	}
	
		for (var i = 0; i < _artistList.length; i++) {
	
		var newItem = _artistList[i];
		this.ArtistList.push(newItem);
	
	}
	
	//Update Progress
	var progress = this.listModel.items.length / this.ExpectedArtists;
	this.artistLoadModel.value = progress;
	this.controller.modelChanged(this.artistLoadModel);
	
	
	
	//Add to list	
	var artistFilterList = this.controller.get('artistFilterList');
	if ((this.filterString == "") ||(this.filterString == null)) {
		artistFilterList.mojo.noticeUpdatedItems(0, this.ArtistList);
	}
	else //list currently has a filter
	{
		var matches = this.GetAllMatches(this.filterString);
		artistFilterList.mojo.noticeUpdatedItems(0, matches);
	    artistFilterList.mojo.setLength(matches.length);
        artistFilterList.mojo.setCount(matches.length);
	}
		
	if(_artistList.length!=this.ARTIST_LIMIT)
	{
	    //Loading Fully Completed
		this.artistLoadModel.value = 1;
        this.controller.modelChanged(this.artistLoadModel);
		
	}
	else
	{
        this.GetMoreArtists();
	}
	
	
	Mojo.Log.info("Progress: " + progress);
	
	
	 Mojo.Log.info("<-- ArtistsAssistant.prototype.GotArtists");
}




ArtistsAssistant.prototype.listTapHandler = function(event){
    Mojo.Log.info("--> ArtistsAssistant.prototype.listTapHandler", event.item.name);
    
	/*if (this.GetArtistsPending == false) {
	
		this.GetArtistsPending = true;
		this.TurnOnArtistsSpinner();
		
		
		AmpacheMobile.ampacheServer.GetAlbums(this.FinishedGettingArtistAlbums.bind(this), event.item.id);
		this.RequestedArtist = event.item;
		
	}
	*/
	this.RequestedArtist = event.item;
	 this.controller.stageController.pushScene('albums', 
	{
		SceneTitle:this.RequestedArtist.name,
		DisplayArtistInfo:false,
	    //AlbumsList:_artistAlbumsList,
		Artist:this.RequestedArtist,
		ExepectedAlbums:this.RequestedArtist.albums,
	});
	
    Mojo.Log.info("<-- ArtistsAssistant.prototype.listTapHandler");
}


/*
ArtistsAssistant.prototype.FinishedGettingArtistAlbums = function(_artistAlbumsList){
    Mojo.Log.info("--> ArtistsAssistant.prototype.FinishedGettingArtists");
	
	this.GetArtistsPending = false;
	
    this.controller.stageController.pushScene('albums', 
	{
		SceneTitle:this.RequestedArtist.name,
		DisplayArtistInfo:false,
	    AlbumsList:_artistAlbumsList,
		Artist:this.RequestedArtist,
	});
	
    Mojo.Log.info("<-- ArtistsAssistant.prototype.FinishedGettingArtists");
    
}*/


ArtistsAssistant.prototype.TurnOnArtistsSpinner = function()
{
	Mojo.Log.info("-----> ArtistsAssistant.prototype.TurnOnArtistsSpinner");
	this.spinnerModel.spinning = true;
    this.ArtistsController.modelChanged(this.spinnerModel);
	Mojo.Log.info("<----- ArtistsAssistant.prototype.TurnOnArtistsSpinner");
}

ArtistsAssistant.prototype.TurnOffArtistsSpinner = function()
{
	Mojo.Log.info("-----> ArtistsAssistant.prototype.TurnOffArtistsSpinner");
	this.spinnerModel.spinning = false;
    this.ArtistsController.modelChanged(this.spinnerModel);
	Mojo.Log.info("<----- ArtistsAssistant.prototype.TurnOffArtistsSpinner");
}



ArtistsAssistant.prototype.dividerFunc = function(itemModel){
    //Mojo.Log.info("--> ArtistsAssistant.prototype.dividerFunc");
    
    if (itemModel.name.charAt(0).toLowerCase() == "t") {
		if (itemModel.name.substring(0, 4).toLowerCase() == "the ") {
			
			
			var regExp = /\s+/g;
			var name = itemModel.name.toLowerCase().replace(regExp,''); 
			
			return name[3].toUpperCase();
		}
		else {
			return "T";
		}
	}
	else if (itemModel.name.charAt(0).toLowerCase() == "a") {
		if (itemModel.name.substring(0, 2).toLowerCase() == "a ") {
            var regExp = /\s+/g;
			var name = itemModel.name.toLowerCase().replace(regExp,''); 
			return name[1].toUpperCase();
        }
        else {
            return "A";
        }
		
    }
    else {
        return itemModel.name.charAt(0).toUpperCase();
    }
    
    //Mojo.Log.info("--> ArtistsAssistant.prototype.dividerFunc");
}



ArtistsAssistant.prototype.activate = function(event){

    Mojo.Log.info("--> ArtistsAssistant.prototype.activate");
	
	this.Visible = true;
    this.GetMoreArtists();
	
    Mojo.Log.info("<-- ArtistsAssistant.prototype.activate");
}




ArtistsAssistant.prototype.deactivate = function(event){
	Mojo.Log.info("--> ArtistsAssistant.prototype.deactivate");
	this.TurnOffArtistsSpinner();
	this.Visible = false;
	Mojo.Log.info("<-- ArtistsAssistant.prototype.deactivate");
}

ArtistsAssistant.prototype.cleanup = function(event){
    /* this function should do any cleanup needed before the scene is destroyed as 
     a result of being popped off the scene stack */
	 //Mojo.Event.stopListening(this.controller.get('artistList'),Mojo.Event.listTap, this.listTapHandler); 
	 Mojo.Event.stopListening(this.controller.get('artistFilterList'),Mojo.Event.listTap, this.listTapHandler);
	 Mojo.Event.stopListening(this.controller.get('artistFilterList'), Mojo.Event.filter, this.gotFilter);
}

ArtistsAssistant.prototype.searchFilter = function(event){
	Mojo.Log.info("--> ArtistsAssistant.prototype.searchFilter filterString:", event.filterString);
	
	if (event.filterString == "") {
		
		//Mojo.Log.info("Repopulating artist list length: " + this.ArtistList.length)
		//var artistFilterList = this.controller.get('artistFilterList');
		//artistFilterList.mojo.noticeUpdatedItems(this.listModel.items.length, _artistList);
		//artistFilterList.mojo.noticeUpdatedItems(0, this.ArtistList);
		//artistFilterList.mojo.setLength(this.ArtistList.length);
		//artistFilterList.mojo.setCount(this.ArtistList.length);
	}
	
	/*
	if (event.filterString !== "") {
		$("artistList").hide();
		$("artistFilterList").show();
	}
	else {
		$("artistList").show();
		$("artistFilterList").hide();
	}
	*/
	Mojo.Log.info("<-- ArtistsAssistant.prototype.searchFilter filterString:", event.filterString);
} 


ArtistsAssistant.prototype.GetAllMatches = function(filterString){
	var subset = [];
	
	if (filterString == "") {
		
		for (var i = 0; i < this.ArtistList.length; i++) {
		
			subset.push(this.ArtistList[i]);
		}
	}
	else {
		
		for (var i = 0; i < this.ArtistList.length; i++) {
			if (this.ArtistList[i].name.toLowerCase().include(filterString.toLowerCase())) {
			
				subset.push(this.ArtistList[i]);
			}
		}
	}
	return subset;	
}


ArtistsAssistant.prototype.filterString = null;
ArtistsAssistant.prototype.Matches = null;
ArtistsAssistant.prototype.LastFilterLength = null;

ArtistsAssistant.prototype.FilterArtistList = function(filterString, listWidget, offset, count){
	Mojo.Log.info("--> ArtistsAssistant.prototype.FilterArtistList filterString:", filterString, "offset:", offset, "count:", count);
	var subset = [];
	var totalSubsetSize = 0;


	if (this.ArtistList.length != 0) {
	
    	 if ( (filterString != this.filterString) || (this.LastFilterLength != this.ArtistList.length) ) {
		 	this.LastFilterLength = this.ArtistList.length;
            this.Matches = this.GetAllMatches(filterString);
            this.filterString = filterString;
        }
        
        Mojo.Log.info("Filtering: " + filterString);
        
        var Matches = this.Matches;
		
		for (var i = 0; i < count; i++) {
			if ((i + offset) < Matches.length) {
			
				subset.push(Matches[i + offset]);
				totalSubsetSize++;
			}
			
		}
		
		
		listWidget.mojo.noticeUpdatedItems(offset, subset);
		listWidget.mojo.setLength(Matches.length);
		listWidget.mojo.setCount(Matches.length);
		
	}		
		
	
	Mojo.Log.info("<-- ArtistsAssistant.prototype.FilterArtistList:");
	
}


