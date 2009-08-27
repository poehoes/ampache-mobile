function MainmenuAssistant(){
    /* this is the creator function for your scene assistant object. It will be passed all the 
     additional parameters (after the scene name) that were passed to pushScene. The reference
     to the scene controller (this.controller) has not be established yet, so any initialization
     that needs the scene controller should be done in the setup function below. */
    this.getPending = false;
    this.ArtistList = null;
    this.AlbumsList = null;
	this.SongsList = null;
    
}

MainmenuAssistant.prototype.setup = function(){
    Mojo.Log.info("--> MainmenuAssistant.prototype.setup");
    
   
	
    
    this.spinnerAttrs = {
        spinnerSize: 'small'
    }
    
    this.spinnerModel = {
        spinning: false
    }
    
    this.controller.setupWidget('mainmenu-spinner', this.spinnerAttrs, this.spinnerModel);
    
    
    this.mainmenu = [
	/*
	{
        category: $L("top"),
        directory: $L("search"),
        name: $L("Search"),
        scene: $L("search")
    },*/ 
	{
        category: $L("bottom"),
        directory: $L("artists"),
        name: $L("Artists"),
        scene: $L("artists"),
        description: $L(AmpacheMobile.ampacheServer.artists.toString())
    }, 
	{
        category: $L("bottom"),
        directory: $L("albums"),
        name: $L("Albums"),
        scene: $L("albums"),
        description: $L(AmpacheMobile.ampacheServer.albums.toString())
    }, 
	/*
	{
        category: $L("bottom"),
        directory: $L("songs"),
        name: $L("Songs"),
        scene: $L("songs"),
        description: $L(AmpacheMobile.ampacheServer.songs.toString())
    }, 
	{
        category: $L("bottom"),
        directory: $L("playlists"),
        name: $L("Playlists"),
        scene: $L("playlists"),
        description: $L(AmpacheMobile.ampacheServer.playlists.toString())
    }, 
	{
        category: $L("bottom"),
        directory: $L("genre"),
        name: $L("Genre"),
        scene: $L("genre"),
        description: ""
    }, */
	];
    
    
    this.controller.setupWidget('mainMenuList', {
        itemTemplate: 'mainmenu/listitem',
        //dividerTemplate: 'mainmenu/divider',
        //dividerFunction: this.dividerFunc.bind(this)
    }, {
        items: this.mainmenu
    });
    
    // Watch for taps on the list items	
    this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
    Mojo.Event.listen(this.controller.get('mainMenuList'), Mojo.Event.listTap, this.listTapHandler);
    
    Mojo.Log.info("<-- MainmenuAssistant.prototype.setup");
    
    this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
}


MainmenuAssistant.prototype.listTapHandler = function(event){
    Mojo.Log.info("--> MainmenuAssistant.prototype.listTapHandler: " + event.item.scene);
    
    if (this.getPending == false) {
        this.getPending = true;
        
        switch (event.item.scene) {
            case "artists":
                //this.TurnOnSpinner("Getting Artists");
                if (this.ArtistList == null) {
					//AmpacheMobile.ampacheServer.GetAllArtists(this.FinishedGettingArtists.bind(this));
					
					this.controller.stageController.pushScene("artists",
					{
						ExpectedArtists:parseInt(AmpacheMobile.ampacheServer.artists),
					});
					this.getPending = false;
					
				}
				else {
				//this.FinishedGettingArtists(this.ArtistList);
				}
				break;
            case "albums":
				Mojo.Log.info("Pushing Albums");
				//this.TurnOnSpinner("Getting Albums");
				    this.controller.stageController.pushScene('albums', {
        				SceneTitle: "All Albums",
        				DisplayArtistInfo:true,
						ExepectedAlbums: parseInt(AmpacheMobile.ampacheServer.albums),
        				//AlbumsList: _albumsList,
    				});
		
				this.getPending = false;
				/*
				if (this.AlbumsList == null) {
					AmpacheMobile.ampacheServer.GetAlbums(this.FinishedGettingAlbums.bind(this), null);
				}
				else
				{
					this.FinishedGettingAlbums(this.AlbumsList);
				}*/
				
				this.TurnOffSpinner("Getting Albums");
				break;
			case "songs":
				var megaBytes = Math.round((AmpacheMobile.ampacheServer.songs*223)/(1024*1024)*100)/100
				if (megaBytes < 1.3) {
				
				
					this.TurnOnSpinner("Getting Songs");
					if (this.AlbumsList == null) {
						AmpacheMobile.ampacheServer.GetSongs(this.FinishedGettingSongs.bind(this), null);
					}
					else {
						this.FinishedGettingSongs(this.SongsList);
					}
				}
				else {
					Mojo.Log.info("Display Alert");
					this.controller.showAlertDialog({
						onChoose: function(value){
						},
						title: $L("Songs unavailable"),
						message: "Sorry but this would result in processing " + megaBytes + "MB of information and would likely lock up your phone.  Please use Artists or Albums instead",
						choices: [{
							label: $L('OK'),
							value: 'ok',
							type: 'color'
						}]
					});
					this.getPending = false;
				}
				break;
				  
			default:
			 	this.getPending = false;
                break;
                
        }
    }
    //this.controller.stageController.assistant.showScene(event.item.directory, event.item.scene)
    
    
    Mojo.Log.info("<-- MainmenuAssistant.prototype.listTapHandler");
}

MainmenuAssistant.prototype.TurnOnSpinner = function(spinnerText){
    this.spinnerModel.spinning = true;
    this.controller.modelChanged(this.spinnerModel);
}

MainmenuAssistant.prototype.TurnOffSpinner = function(){
    this.spinnerModel.spinning = false;
    this.controller.modelChanged(this.spinnerModel);
}


/*
 * This function will push a passed in scene.  The reason we are using a special function here is that
 * for file organization purposes we have put the scene files in sub directories & to load them requires that
 * we use the name and sceneTemplate properties when pushing the scenes.
 */
MainmenuAssistant.prototype.showScene = function(sceneName, directory){
    Mojo.Log.info("--> MainmenuAssistant.prototype.showScene");
    
    this.controller.stageController.pushScene({
        name: sceneName,
        sceneTemplate: directory + "/" + sceneName + "/" + sceneName + "-scene"
    })
    
    Mojo.Log.info("<-- MainmenuAssistant.prototype.showScene");
}




MainmenuAssistant.prototype.FinishedGettingSongs = function(_songsList){
    Mojo.Log.info("--> MainmenuAssistant.prototype.FinishedGettingSongs");
    
    this.SongsList = _songsList;
    
    this.getPending = false;
    
    this.controller.stageController.pushScene("songs", {
         SceneTitle: "All Songs",
        //DisplayArtistInfo:false,
        SongsList: _songsList,
    })
    
    this.TurnOffSpinner();
    Mojo.Log.info("<-- MainmenuAssistant.prototype.FinishedGettingSongs");
    
}

/*
MainmenuAssistant.prototype.FinishedGettingArtists = function(_artistList){
    Mojo.Log.info("--> MainmenuAssistant.prototype.FinishedGettingArtists");
    
    this.ArtistList = _artistList;
    
    this.getPending = false;
    
    this.controller.stageController.pushScene("artists", {
        artistList: _artistList
    })
    
    this.TurnOffSpinner();
    Mojo.Log.info("<-- MainmenuAssistant.prototype.FinishedGettingArtists");
    
}

MainmenuAssistant.prototype.FinishedGettingAlbums = function(_albumsList){
    Mojo.Log.info("--> ArtistsAssistant.prototype.FinishedGettingAlbums");
    
    this.AlbumsList = _albumsList;
    
    //this.GetArtistsPending = false;
    this.getPending = false;
    
    this.controller.stageController.pushScene('albums', {
        SceneTitle: "All Albums",
        DisplayArtistInfo:true,
        AlbumsList: _albumsList,
    });
    this.TurnOffSpinner();
    Mojo.Log.info("<-- ArtistsAssistant.prototype.FinishedGettingAlbums");
    
}
*/


MainmenuAssistant.prototype.activate = function(event){
    /* put in event handlers here that should only be in effect when this scene is active. For
    
    
     example, key handlers that are observing the document */
    //this.ArtistList = null;
    //this.AlbumsList = null;
	//this.SongsList = null;
    
}


MainmenuAssistant.prototype.deactivate = function(event){
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
    
     this scene is popped or another scene is pushed on top */
    
}

MainmenuAssistant.prototype.cleanup = function(event){
    /* this function should do any cleanup needed before the scene is destroyed as 
     a result of being popped off the scene stack */
    Mojo.Event.stopListening(this.controller.get('mainMenuList'), Mojo.Event.listTap, this.listTapHandler);
    this.ArtistList = null;
    this.AlbumsList = null;
	this.SongsList = null;
    
}

MainmenuAssistant.prototype.dividerFunc = function(itemModel){
    return itemModel.category; // We're using the item's category as the divider label.
}
