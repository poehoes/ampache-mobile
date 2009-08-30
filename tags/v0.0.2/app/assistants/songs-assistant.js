function SongsAssistant(params){
	Mojo.Log.info("--> SongsAssistant.prototype.constructor");
	this.SceneTitle = params.SceneTitle;
	this.DisplayAlbumInfo = params.DisplayAlbumInfo;
	this.SongsList = params.SongsList;
	this.thisIsAnAlbum = params.thisIsAnAlbum;
	this.art = params.art;
	Mojo.Log.info("<-- SongsAssistant.prototype.constructor");
}

SongsAssistant.prototype.setup = function(){

	Mojo.Log.info("--> SongsAssistant.prototype.setup");
	
	
	$(coverArt).src = "images/shuffle-32.png";
	
	//Mojo.Log.info("Setting up albums for:", this.ArtistInfo.name);
	//this.SongsList.sort(sortfunction);
	
	/*if((this.art !=null) && AmpacheMobile.settingsManager.settings.ExtraCoverArt)
	{
		$(coverArt).src = this.art;
	}
	else
	{
		$(coverArt).src = "images/shuffle-32.png";
	}*/
	
	/*
	this.spinnerLAttrs = {
		spinnerSize: 'large'
	}
	
	this.spinnerModel = {
		spinning: false
	}
	
	this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
	*/
	
	if (this.DisplayAlbumInfo == true) {
		var attributes = {
			itemTemplate: 'songs/listitem_w_artist',
		//dividerTemplate: 'artist-albums/divider',
		//dividerFunction: this.dividerFunc.bind(this),
		};
	}
	else {
		var attributes = {
			itemTemplate: 'songs/listitem',
		//dividerTemplate: 'artist-albums/divider',
		//dividerFunction: this.dividerFunc.bind(this),
		};
	}
	this.listModel = {
		disabled: false,
		items: this.SongsList,
	};
	
	
	this.artistSongsList = null;
	this.controller.setupWidget('songsList', attributes, this.listModel);
	
	this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('songsList'), Mojo.Event.listTap, this.listTapHandler);
	this.controller.get('shuffleAll').observe(Mojo.Event.tap, this.handleShuffleAll.bindAsEventListener(this));
	
	
	this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
	
	Mojo.Log.info("<-- SongsAssistant.prototype.setup");
	
}

SongsAssistant.prototype.handleShuffleAll = function(event)
{
	 this.controller.stageController.pushScene('now-playing', 
	{
		playList:this.SongsList,
		startIndex:0,
		shuffle:true,
	});
	
}

SongsAssistant.prototype.listTapHandler = function(event){
    Mojo.Log.info("--> SongsAssistant.prototype.listTapHandler");
   	
    
	 this.controller.stageController.pushScene('now-playing', 
	{
		playList:this.SongsList,
		startIndex:event.index,
		shuffle:false,
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
	
    Mojo.Log.info("<-- SongsAssistant.prototype.listTapHandler");
}


SongsAssistant.prototype.dividerFunc = function(itemModel){
    //Mojo.Log.info("--> SongsAssistant.prototype.dividerFunc");
    
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
    
    //Mojo.Log.info("--> SongsAssistant.prototype.dividerFunc");
}




//This function will sort the album list by year and then alphabetically within the year
function sortfunction(a, b){
	
	var retvalue=0;
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
}


SongsAssistant.prototype.activate = function(event){

    Mojo.Log.info("--> SongsAssistant.prototype.activate");

	this.controller.get('title').update(this.SceneTitle);
    
    Mojo.Log.info("<-- SongsAssistant.prototype.activate");
}




SongsAssistant.prototype.deactivate = function(event){
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
    
     this scene is popped or another scene is pushed on top */
    
}

SongsAssistant.prototype.cleanup = function(event){
    /* this function should do any cleanup needed before the scene is destroyed as 
     a result of being popped off the scene stack */
	 Mojo.Event.stopListening(this.controller.get('songsList'),Mojo.Event.listTap, this.listTapHandler); 
}


/*
SongsAssistant.prototype.FilterArtistList = function(filterString, listWidget, offset, count){
	Mojo.Log.info("--> SongsAssistant.prototype.FilterArtistList");
	
	var subset = [];
	var totalSubsetSize = 0;
	
	//loop through the original data set & get the subset of items that have the filterstring
	var i = 0;
	while (i < this.albumArtistList.length) {
	
		if (this.albumArtistList[i].name.toLowerCase().include(filterString.toLowerCase())) {
			if (subset.length < count && totalSubsetSize >= offset) {
				subset.push(this.albumArtistList[i]);
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
	
	
	Mojo.Log.info("<-- SongsAssistant.prototype.FilteralbumArtistList");
}*/



