function AlbumsAssistant(params){
	Mojo.Log.info("--> AlbumsAssistant.prototype.constructor");
	this.SceneTitle = params.SceneTitle;
	this.DisplayArtistInfo = params.DisplayArtistInfo;
	//this.AlbumsList = params.AlbumsList;
	//this.AlbumsList.sort(this.sortfunction);
	
	this.ExpectedAlbums = params.ExepectedAlbums;
	
	if (params.Artist != null) {
		this.Artist = params.Artist;
		this.isArtistView = true;
		
	}
	else this.isArtistView = false;
	
	
	this.AlbumList = new Array();
	
	
	this.ALBUM_LIMIT = 200;
	this.albumOffset = 0;
	
	Mojo.Log.info("<-- AlbumsAssistant.prototype.constructor");
}

AlbumsAssistant.prototype.FinishedGettingAlbums = function(_albumsList){
    Mojo.Log.info("--> ArtistsAssistant.prototype.FinishedGettingAlbums");
    
	var currentItemsIndex = this.listModel.items.length;
	
	if (this.spinnerModel.spinning) {
		this.TurnOffSpinner();
	}
	for (var i = 0; i < _albumsList.length; i++) {
	
		var newItem = _albumsList[i];
		this.AlbumList.push(newItem);
		//this.listModel.items.mojo.noticeAddedItems(this.listModel.items.length, [newItem]);
		//albumsList.mojo.noticeAddedItems(this.listModel.items.length, [newItem]);
		

	}
	var progress = this.listModel.items.length / this.ExpectedAlbums;
	this.albumLoadModel.value = progress;
	this.controller.modelChanged(this.albumLoadModel);
	
	this.AlbumList.sort(this.sortbyYearTitle);
		var albumsList = this.controller.get('albumsFilterList');
		albumsList.mojo.noticeUpdatedItems(0,this.AlbumList);
		
	if(progress==1)
	{
		
	}
	else
	{
		AmpacheMobile.ampacheServer.GetAlbums(this.FinishedGettingAlbums.bind(this), null, this.listModel.items.length, this.ALBUM_LIMIT);

	}
	
	
	Mojo.Log.info("Progress: " + progress);
    Mojo.Log.info("<-- ArtistsAssistant.prototype.FinishedGettingAlbums");
    
}


AlbumsAssistant.prototype.setup = function(){

	Mojo.Log.info("--> AlbumsAssistant.prototype.setup");
	
	
	
	

	
	this.PPattr = {
			title: this.SceneTitle,
			//image: 'stuff'
		};
		this.albumLoadModel = {
			//iconPath: "action-icon",
			value: 0,
			//disabled : false
		};
		this.controller.setupWidget('albumProgressbar', this.PPattr, this.albumLoadModel);
	
	
	
	//this.controller.get('title').update(this.SceneTitle);
	
	
	//Mojo.Log.info("Setting up albums for:", this.ArtistInfo.name);
	if(!this.isArtistView) this.controller.get('shuffleForArtist').hide();
	
	
	
	
	/* setup widgets here */
	this.spinnerLAttrs = {
		spinnerSize: 'large'
	}
	
	this.spinnerModel = {
		spinning: true
	}
	
	this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
	
	
	if (this.DisplayArtistInfo==true) {
		Mojo.Log.info("Display Artist Info");
		this.listAttributes = {
			
			itemTemplate: 'albums/listitem_w_artist',
			dividerTemplate: 'albums/divider',
			dividerFunction: this.dividerFunc.bind(this),
			//renderLimit : 500,
			//lookahead: 100,
			filterFunction: this.FilterAlbumList.bind(this)
		};
		/*
			this.listAttributes = {
			itemTemplate: 'albums/listitem',
		//dividerTemplate: 'artist-albums/divider',
		//dividerFunction: this.dividerFunc.bind(this),
		
		};*/
	}
	else {
		this.listAttributes = {
			itemTemplate: 'albums/listitem',
		//dividerTemplate: 'artist-albums/divider',
		//dividerFunction: this.dividerFunc.bind(this),
		filterFunction: this.FilterAlbumList.bind(this)
		};
	}
	
	this.listModel = {
		disabled: false,
		items: this.AlbumList,
	};
	
	
	
	
	this.controller.setupWidget('albumsFilterList', this.listAttributes, this.listModel);
	
	this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('albumsFilterList'), Mojo.Event.listTap, this.listTapHandler);
	

	
	
	
	this.controller.get('shuffleAll').observe(Mojo.Event.tap, this.handleShuffleAll.bindAsEventListener(this));
	
	if (this.isArtistView == true) {
		AmpacheMobile.ampacheServer.GetAlbums(this.FinishedGettingAlbums.bind(this), this.Artist.id);
	}
	else {
		AmpacheMobile.ampacheServer.GetAlbums(this.FinishedGettingAlbums.bind(this), null, this.albumOffset, this.ALBUM_LIMIT);
	}
	
	Mojo.Log.info("<-- AlbumsAssistant.prototype.setup");
	
}


AlbumsAssistant.prototype.OnListAddEvent=function(event)
{
	Mojo.Log.info("--> AlbumsAssistant.prototype.OnListAddEvent");
	
	
	Mojo.Log.info("--> AlbumsAssistant.prototype.OnListAddEvent");	
},



AlbumsAssistant.prototype.listTapHandler = function(event){
    Mojo.Log.info("--> AlbumsAssistant.prototype.listTapHandler");
   	
	this.TurnOnSpinner();
	this.RequestedAlbum = event.item;
    AmpacheMobile.ampacheServer.GetSongs(this.FinishedGettingAlbumSongs.bind(this), event.item.id, null, null);
	
	
    Mojo.Log.info("<-- AlbumsAssistant.prototype.listTapHandler");
}

AlbumsAssistant.prototype.handleShuffleAll = function(event)
{
	 Mojo.Log.info("--> AlbumsAssistant.prototype.handleShuffleAll");
	 
	
	this.TurnOnSpinner();
	AmpacheMobile.ampacheServer.GetSongs(this.FinishedGettingArtistSongs.bind(this), null, this.Artist.id, null);
	this.RequestedArtist = event.item;
		 
	 Mojo.Log.info("<-- AlbumsAssistant.prototype.handleShuffleAll");
}

AlbumsAssistant.prototype.FinishedGettingArtistSongs = function(_songsList)
{
	Mojo.Log.info("--> AlbumsAssistant.prototype.GotAllSongsCallback");
	this.TurnOffSpinner();
	this.controller.stageController.pushScene('now-playing', 
	{
		playList:_songsList,
		startIndex:0,
		shuffle:true,
	});
	Mojo.Log.info("<-- AlbumsAssistant.prototype.GotAllSongsCallback");
	
}


AlbumsAssistant.prototype.FinishedGettingAlbumSongs = function(_songsList){
    Mojo.Log.info("--> ArtistsAssistant.prototype.FinishedGettingAlbumSongs");
	
	//this.GetArtistsPending = false;
	this.TurnOffSpinner();
    this.controller.stageController.pushScene('songs', 
	{
		SceneTitle:this.RequestedAlbum.name,
		//DisplayArtistInfo:false,
	    SongsList:_songsList,
	});
	
    Mojo.Log.info("<-- ArtistsAssistant.prototype.FinishedGettingAlbumSongs");
    
}


AlbumsAssistant.prototype.dividerFunc = function(itemModel){
    //Mojo.Log.info("--> AlbumsAssistant.prototype.dividerFunc");
    
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
	
    //Mojo.Log.info("--> AlbumsAssistant.prototype.dividerFunc");
}




//This function will sort the album list by year and then alphabetically within the year
AlbumsAssistant.prototype.sortbyYearTitle =function (a, b){
	
	var retvalue;
	
	/*
	var a_string = a.sortByYearTitleString()
	var b_string = b.sortByYearTitleString()

	var alpabetize = []
	alpabetize[0] = a_string;
	alpabetize[1] = b_string;
		
		
	alpabetize.sort();
		
	if(alpabetize[0] == a_string)
	{
		retvalue =-1;
	}
	else retvalue =1;
	*/
	
	if(a.year == "N/A") ayear = "0000"
	
	
	else ayear = a.year;
	if(b.year == "N/A") byear = "0000";
	else byear=b.year;
	
	
	
	if(ayear == byear)
	{
		if(a.name == b.name) return 0;
		
		var alpabetize = new Array();
		alpabetize[0] = a.name;
		alpabetize[1] = b.name;
		
		
		
		alpabetize.sort();
	
				
		if(alpabetize[0] == a.name)
		{
			retvalue =-1;
		}
		else retvalue =1;
	}
	else if(ayear < byear)
	{
		retvalue = 1;
	}
	else if(ayear > byear)
	{
		retvalue = -1;
	}
	
	//Mojo.Log.info("A.year:", a.year, "b.year:", b.year, "revalue", retvalue);
	
	return retvalue;
}


AlbumsAssistant.prototype.activate = function(event){

    Mojo.Log.info("--> AlbumsAssistant.prototype.activate");

	
    
    Mojo.Log.info("<-- AlbumsAssistant.prototype.activate");
}




AlbumsAssistant.prototype.deactivate = function(event){

    Mojo.Log.info("--> AlbumsAssistant.prototype.deactivate");

	AmpacheMobile.ampacheServer.GetAlbumsCancel();
    
    Mojo.Log.info("<-- AlbumsAssistant.prototype.deactivate");
    
}

AlbumsAssistant.prototype.cleanup = function(event){
  
    Mojo.Log.info("--> AlbumsAssistant.prototype.cleanup");

	
	Mojo.Event.stopListening(this.controller.get('albumsFilterList'),Mojo.Event.listTap, this.listTapHandler); 
    
    Mojo.Log.info("<-- AlbumsAssistant.prototype.cleanup");
  
  
}


AlbumsAssistant.prototype.TurnOnSpinner = function()
{
	Mojo.Log.info("--> AlbumsAssistant.prototype.TurnOnSpinner");
	this.spinnerModel.spinning = true;
    this.controller.modelChanged(this.spinnerModel);
	Mojo.Log.info("<-- AlbumsAssistant.prototype.TurnOnSpinner");
}

AlbumsAssistant.prototype.TurnOffSpinner = function()
{
	Mojo.Log.info("-----> AlbumsAssistant.prototype.TurnOffSpinner");
	this.spinnerModel.spinning = false;
    this.controller.modelChanged(this.spinnerModel);
	Mojo.Log.info("<----- AlbumsAssistant.prototype.TurnOffSpinner");
}


/*
AlbumsAssistant.prototype.FilterAlbumList = function(filterString, listWidget, offset, count){
	Mojo.Log.info("--> AlbumsAssistant.prototype.FilterAlbumList");
	
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
	
	
	Mojo.Log.info("<-- AlbumsAssistant.prototype.FilteralbumAlbumList");
}*/



AlbumsAssistant.prototype.GetAllMatches = function(filterString){
	var subset = [];
	
	if (filterString == "") {
		for (var i = 0; i < this.AlbumList.length; i++) {
		
			subset.push(this.AlbumList[i]);
		}
	}
	else {
		for (var i = 0; i < this.AlbumList.length; i++) {
			var matchString = this.AlbumList[i].name + " " + this.AlbumList[i].artist
			if (matchString.toLowerCase().include(filterString.toLowerCase())) {
			
				subset.push(this.AlbumList[i]);
			}
		}
	}
	return subset;	
}



AlbumsAssistant.prototype.FilterAlbumList = function(filterString, listWidget, offset, count){
	Mojo.Log.info("--> AlbumsAssistant.prototype.FilterArtistList filterString:", filterString, "offset:", offset, "count:", count);
	var subset = [];


	if (this.AlbumList.length != 0) {
	
		Mojo.Log.info("Filtering: " + filterString);
		
		var Matches = this.GetAllMatches(filterString);
		
		for (var i = 0; i < count; i++) {
			if ((i + offset) < Matches.length) {
			
				subset.push(Matches[i + offset]);
			}
			
		}
		
		
		listWidget.mojo.noticeUpdatedItems(offset, subset);
		listWidget.mojo.setLength(Matches.length);
		listWidget.mojo.setCount(Matches.length);
		
	}		
		
	
	Mojo.Log.info("<-- AlbumsAssistant.prototype.FilterArtistList:");
	
	
}

