AudioPlayer = Class.create({

    PlayerReady: false,
    NowPlaying: null,
    NowPlayingVisible: false,
    OneTimeInit:false,
	timeInterval:null,
	Paused:false,
	RequestedPlayBeforeReady:false,
	Controller:null,
	playOrderList:null,
	currentPlayingTrack:null,
	currentPlayingIndex:null,
	player: null,
    playList: null,
    shuffleOn:false,
	
	
	
	AudioPlayers:null,
	nPlayers:2,
	
    initialize: function(_controller){
        Mojo.Log.info("--> AudioPlayer.prototype.initialize", _controller);
        
		if(this.OneTimeInit==false)
		{
			this.OneTimeInit = true;
			this.createAudioObj(_controller);
			this.Controller = _controller;
			this.AudioPlayers = new Array()
			
		}
		Mojo.Log.error("<-- AudioPlayer.prototype.initialize %j", this.audioObj);
		
    },
    
  
    
    createAudioObj: function(_controller){
        Mojo.Log.error("--> AudioPlayer.prototype.createAudioObj");
        
        if (this.audioObj == null) {
		
			// use Safari's HTML5 implementation if we are runing on palm host
			if (Mojo.Host.current === Mojo.Host.browser) {
				Mojo.Log.error("Setting up audio for safari");
				this.inPalmHost = true;
				this.PlayerReady = true;
				this.player = new Audio();
				//this.player = AudioTag.extendElement(_controller.get('audioPlayerDiv'), _controller);
				
			}
			else {
			
				Mojo.Log.error("Setting up audio for palm");
				this.inPalmHost = false;
				this.PlayerReady = false;
				
				this.player = AudioTag.extendElement(_controller.get('audioPlayerDiv'), _controller);
				
				//this.player.palm.audioClass = "media";
				this.player.mojo.audioClass = "media";
				this.player.addEventListener("x-palm-connect", this.ConnectedToServer.bind(this));
				this.player.addEventListener("x-palm-disconnect", this.handleAudioEvents.bind(this));
				this.player.addEventListener("x-palm-render-mode", this.handleAudioEvents.bind(this));
				this.player.addEventListener("x-palm-success", this.handleAudioEvents.bind(this));
				this.player.addEventListener("x-palm-watchdog", this.handleAudioEvents.bind(this));
				
			}
			
			//Mojo.Log.error("audioObj: %j", this.player);
			
			this.player.addEventListener("play", this.handleAudioEvents.bind(this));
			this.player.addEventListener("pause", this.handleAudioEvents.bind(this));
			this.player.addEventListener("abort", this.handleAudioEvents.bind(this));
			this.player.addEventListener("error", this.handleAudioEvents.bind(this));
			
			this.player.addEventListener("ended", this.handleAudioEvents.bind(this));
			this.player.addEventListener("canplay", this.handleAudioEvents.bind(this));
			this.player.addEventListener("canplaythrough", this.handleAudioEvents.bind(this));
			this.player.addEventListener("canshowfirstframe", this.handleAudioEvents.bind(this));
			this.player.addEventListener("emptied", this.handleAudioEvents.bind(this));
			this.player.addEventListener("load", this.handleAudioEvents.bind(this));
			this.player.addEventListener("loadedfirstframe", this.handleAudioEvents.bind(this));
			this.player.addEventListener("loadedmetadata", this.handleAudioEvents.bind(this));
			this.player.addEventListener("loadstart", this.handleAudioEvents.bind(this));
			this.player.addEventListener("seeked", this.handleAudioEvents.bind(this));
			this.player.addEventListener("seeking", this.handleAudioEvents.bind(this));
			this.player.addEventListener("stalled", this.handleAudioEvents.bind(this));
			//this.player.addEventListener("timeupdate", this.handleAudioEvents.bind(this));
			this.player.addEventListener("waiting", this.handleAudioEvents.bind(this));
			
			this.player.addEventListener("progress", this.handleAudioEvents.bind(this));
			this.player.addEventListener("durationchange", this.handleAudioEvents.bind(this));
			
			
			
			
			
			
			
		}
        Mojo.Log.error("<-- AudioPlayer.prototype.createAudioObj");
    },
    
	getStreamInfo: function(){
		Mojo.Log.error("--> AudioPlayer.prototype.getStreamInfo");
		var info = "Info Unavailable"
		if (this.player.palm!=null) {
			info = "bitrate estimated: " + this.player.palm.bitrate.audio.estimate + "\r\n";
			info += "bitrate avg: " + this.player.palm.bitrate.audio.average.toString() + "\r\n";
			info += "bitrate max: " + this.player.palm.bitrate.audio.maximum.toString();
		}
		Mojo.Log.error("<-- AudioPlayer.prototype.getStreamInfo");
		return info;
	},
	
	ConnectedToServer:  function(event) 
	{
		Mojo.Log.error("--> AudioPlayer.prototype.ConnectedToServer");
        //this.playList = newPlayList;
		this.PlayerReady = true;
		if(this.RequestedPlayBeforeReady==true)
		{
			this.RequestedPlayBeforeReady=false;
			this.play();
		}
        Mojo.Log.error("<-- AudioPlayer.prototype.ConnectedToServer");
	},
	
    addPlayList: function(newPlayList, _shuffleOn, _startIndex){
        Mojo.Log.error("--> AudioPlayer.prototype.addPlayList");
        this.playList = newPlayList;
		this.markPlayListUnplayed();
		this.playOrderList = this.createOrderList();
		
		this.shuffleOn=_shuffleOn;
	
		
		if (_shuffleOn) {
			this.playOrderList.sort(this.randOrd);
			this.playOrderList.sort(this.randOrd);
			this.currentPlayingIndex = 0;
			this.currentPlayingTrack = this.playOrderList[0]
		}
		else {
			this.currentPlayingTrack = _startIndex;
			this.currentPlayingIndex = _startIndex;
		}
		

        
		Mojo.Log.info("<-- AudioPlayer.prototype.addPlayList");
    },
    
    setCurrentTrack: function(index){
        Mojo.Log.info("--> AudioPlayer.prototype.setCurrentTrack", index);
        //this.currentTrackIndex = parseInt(index);
        Mojo.Log.info("<-- AudioPlayer.prototype.setCurrentTrack");
    },
    
	//**********************************************************************************************************************
	//Code for shuffle
	//**********************************************************************************************************************
	markPlayListUnplayed: function(){
		for (var i = 0; i < this.playList.length; i++) {
			this.playList[i].played = false;
		};
	},		
	
	
	createOrderList:function()
	{
		//Inititialize an array to randomize;
		var newList = new Array();
		
		for (var i=0; i< this.playList.length; i++) {
			newList[i]=i;
		}
		return newList;
	},
	
	randOrd:function(){
		return (Math.round(Math.random())-0.5); 
	}, 
	
	
	
	printPlayOrderList:function()
	{
		Mojo.Log.info("printPlayOrderList: %j", this.playOrderList);
		Mojo.Log.info("currentPlayingTrack: " + this.currentPlayingTrack);
		Mojo.Log.info("currentPlayingIndex: " + this.currentPlayingIndex);
	
	},
	
	toggleShuffleOff:function()
	{
		this.playOrderList=this.createOrderList();
		this.currentPlayingIndex = this.currentPlayingTrack;
		this.printPlayOrderList();
		this.shuffleOn = false;
	},
	
	toggleShuffleOn:function()
	{
		
		this.playOrderList.sort(this.randOrd);
		this.playOrderList.sort(this.randOrd);
		for (var i = 0; i < this.playList.length; i++) {
		
			if (this.playOrderList[i] == this.currentPlayingTrack) {
				temp = this.playOrderList[0];
				this.playOrderList[0] =  this.currentPlayingTrack;
				this.playOrderList[i]= temp;
				break;
			};
		}
		this.currentPlayingIndex = 0;
		this.printPlayOrderList();
		this.shuffleOn = true;
	},
	
	getNextTrack:function()
	{
		if ((this.currentPlayingIndex + 1) < (this.playList.length)) {
			this.currentPlayingIndex++;
			return this.playOrderList[this.currentPlayingIndex];
		}
		else
		{
			return -1;
		}
	},
	
	getPrevTrack:function()
	{
		if ((this.currentPlayingIndex - 1) > -1) {
			this.currentPlayingIndex--;
			return this.playOrderList[this.currentPlayingIndex];
		}
		else
		{
			return -1;
		}
	},
	
	
	//**********************************************************************************************************************
	//                        Playback Controls
	//**********************************************************************************************************************
    play: function(){
        Mojo.Log.info("--> AudioPlayer.prototype.play");
        if (this.PlayerReady == true) { 
            this.internal_play();
        }
		else
		{
			this.RequestedPlayBeforeReady=true;
		}
        
        
        Mojo.Log.info("<-- AudioPlayer.prototype.play");
        
    },
    
    stop: function(){
        this.NowPlayingStopPlaybackTimer();
        this.player.pause();
        this.player.src = null;
        //this.player = null;
    },
    
    pause: function(){
		this.NowPlayingStopPlaybackTimer();
        this.player.pause();
		this.Paused=true;
    },
    
    play_next: function(){
        Mojo.Log.info("--> AudioPlayer.prototype.play_next");
        this.printPlayOrderList();
		
		//this.playList[this.currentPlayingTrack].played = true;
        this.currentPlayingTrack = this.getNextTrack();
        if (this.currentPlayingTrack  > -1) {
            this.Paused=false;
			stop();
            this.internal_play();
        }
        Mojo.Log.info("<-- AudioPlayer.prototype.play_next");
    },
    
    
    play_prev: function(){
        Mojo.Log.info("--> AudioPlayer.prototype.play_prev");
        this.printPlayOrderList();
        //this.playList[this.currentPlayingTrack].played = true;
        this.currentPlayingTrack = this.getPrevTrack();
        if (this.currentPlayingTrack  > -1) {
            this.Paused=false;
			stop();
            this.internal_play();
        }
        Mojo.Log.info("<-- AudioPlayer.prototype.play_prev");
    },
    
    play_previous: function(){
    
    
    },
    
    internal_play: function(){
    
        Mojo.Log.info("--> AudioPlayer.prototype.internal_play");
        
		if (this.Paused == true) {
			this.player.play()
		}
		else {
		
			Mojo.Log.info("Starting play of " +
			this.playList[this.currentPlayingTrack].artist +
			" - " +
			this.playList[this.currentPlayingTrack].album +
			" - " +
			this.playList[this.currentPlayingTrack].track +
			" - " +
			this.playList[this.currentPlayingTrack].title);
			
			Mojo.Log.info("URL play of " +
			this.playList[this.currentPlayingTrack].url);
			
			this.UpdateNowPlayingBuffering(0, 0);
			this.NowPlayingUpdateSongInfo();
			this.UpdateNowPlayingShowSpinner(true);
			this.player.src = this.playList[this.currentPlayingTrack].url;
			this.player.load()
		}
		this.Paused = false;
		
        //Mojo.Log.info("Audio() URL play of " + 
        //this.player.src);
        
        //this.player.play();
        
        
        Mojo.Log.info("<-- AudioPlayer.prototype.internal_play");
        
    },
    MEDIA_ERR_ABORTED : 1,
	MEDIA_ERR_NETWORK : 2,
	MEDIA_ERR_DECODE : 3,
	MEDIA_ERR_SRC_NOT_SUPPORTED :4,
	
	streamErrorCodeLookup: function(errorCode)
	{//refrence: http://dev.w3.org/html5/spec/Overview.html#dom-mediaerror-media_err_network
		var errorString="Unknown Error type"
		switch(errorCode)
		{
			case this.MEDIA_ERR_ABORTED:
				errorString = "MEDIA_ERR_ABORTED: The streaming process was aborted by the palm audio service.";
				break;
			case this.MEDIA_ERR_NETWORK:
				errorString = "MEDIA_ERR_NETWORK: A network error has occured";
				break;
			case this.MEDIA_ERR_DECODE:
				errorString = "MEDIA_ERR_DECODE: An error has occurred while decoding the file";
				break;
			case this.MEDIA_ERR_SRC_NOT_SUPPORTED:
				errorString = "MEDIA_ERR_SRC_NOT_SUPPORTED: The file is not suitable for streaming";
				break;
			
		}
		
		return errorString;
	},
	
	
    
    handleAudioEvents: function(event){
		Mojo.Log.info("------> AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
        
        //Mojo.Log.info("------> AudioPlayer.prototype.handleAudioEvents AudioEvent: %j", event);
		//Mojo.Log.info("handeAudioEvent: " + event.type);
        
        switch (event.type) {
            
			
			
            case "canplay":
                this.UpdateNowPlayingShowSpinner(false);
				this.player.play();
                break;
				
            case "stalled":
				this.UpdateNowPlayingShowSpinner(true);
				this.stalled =true;
				break;
			
			case "timeupdate":
                //this.UpdateNowPlayingTime()
                break;
            
			case "progress":
			case "load":
				if(this.stalled) this.UpdateNowPlayingShowSpinner(false);
				this.stalled =false;
				this._updateBuffering();
				break;
			
			case "play":
				this.time
				this.NowPlayingStartPlaybackTimer();
				this.NowPlayingShowPause();   
                break;
            
			case "abort":
				this.ClearNowPlayingTime();
				break;
			
			case "x-palm-disconnect":
				this.NowPlayingDisplayError("Palm Audio Service failed");
				break;
			
			case "error":
			/*this.Controller.showAlertDialog({
			    //onChoose: this.onErrorDialogDismiss.bind(this),
			    title: $L("Error"),
			    message: "Audio Player Recieved an Error",
			    choices:[
		        {label:$L('Cancel'), value:"cancel", type:'dismiss'}
			    ]
			  });*/
				//this.Controller.errorDialog();
				 var errorString = this.streamErrorCodeLookup(event.error);
				this.NowPlayingDisplayError("Audio Player Recieved an Error<br><br>"+errorString);
				
				break;
			
			case "ended":
                this.play_next();
				this.NowPlayingStopPlaybackTimer();
                break;
        }
        Mojo.Log.info("<------ AudioPlayer.prototype.handleAudioEvents AudioEvent:",event.type);
    },
    
    


	//******************************************************************************************************************
	// Now Playing updaters
	UpdateNowPlayingTime: function()
	{
		Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingTime");
		if (this.NowPlaying != null) {
			var currentTime = this.player.currentTime;
			var duration = (this.player.duration.toString()=="NaN") ? 0 : this.player.duration;
			this.NowPlaying.updateTime(currentTime,duration);
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingTime");
	},
	
	ClearNowPlayingTime: function()
	{
		Mojo.Log.info("--> AudioPlayer.prototype.ClearNowPlayingTime");
		if (this.NowPlaying != null) {
			this.NowPlaying.updateTime(0,0);
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.ClearNowPlayingTime");
	},

	UpdateNowPlayingBuffering: function(loaded, total)
	{
		//Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingBuffering loaded: " + loaded + " total: " + total);
		if(this.NowPlaying!=null) this.NowPlaying.updateBuffering(0, total);		
		//Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingBuffering");
	},
	
	UpdateNowPlayingShowSpinner:function(_spinnerOn)
	{
		if(this.NowPlaying!=null) 
		{
			if(_spinnerOn==true) this.NowPlaying.showSpinner();
			else if(_spinnerOn==false) this.NowPlaying.hideSpinner();
			else{}
			
		}
		
	},
	
	NowPlayingShowPause:function()
	{
		if (this.NowPlaying != null) {
			this.NowPlaying.showPauseButton();
		}
	},
	
	NowPlayingShowPlay:function()
	{
		if (this.NowPlaying != null) {
			this.NowPlaying.showPlayButton();
		}
	},
	
	NowPlayingStartPlaybackTimer: function()
	{
		Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStartPlaybackTimer")
		if (this.NowPlaying != null && this.timeInterval==null) {
			this.timeInterval = this.NowPlaying.controller.window.setInterval(this.UpdateNowPlayingTime.bind(this), 450);
		}
		else
		{
			Mojo.Log.info("***********************************************************")
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.NowPlayingStartPlaybackTimer")
	},
	
	NowPlayingStopPlaybackTimer: function()
	{
		Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer")
		if ((this.NowPlaying != null)&&  (this.timeInterval!=null))
		{
			 this.NowPlaying.controller.window.clearInterval(this.timeInterval);
			 this.timeInterval =null;
		}
		Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer")
	},
	
	NowPlayingUpdateSongInfo: function()
	{
		if (this.NowPlaying != null) {
			this.NowPlaying.NowPlayingDisplaySongInfo(this.playList, this.currentPlayingTrack);
			
		}
	},
	
	NowPlayingDisplayError:function(message)
	{
		if (this.NowPlaying != null) {
			var song = this.playList[this.currentPlayingTrack];
			this.NowPlaying.streamingError(message, song)
		}
	},
	
	
	
	_updateBuffering: function(){
		//Mojo.Log.info("--> AudioPlayer.prototype._updateBuffering")
		if (this.player.buffered && this.player.buffered.length > 0) {
			var startPercentage = (this.player.buffered.start(0) / this.player.duration);
			var endPercentage = (this.player.buffered.end(0) / this.player.duration);
			
			this.UpdateNowPlayingBuffering(startPercentage, endPercentage);
		}
		//Mojo.Log.info("<-- AudioPlayer.prototype._updateBuffering")
	},

	 setNowPlaying: function(NowPlayingPointer){
     	Mojo.Log.info("<-- AudioPlayer.prototype.setNowPlaying loaded");
	    this.NowPlaying = NowPlayingPointer; 
		
		Mojo.Log.info("--> AudioPlayer.prototype.setNowPlaying loaded");
    },
    
	clearNowPlaying: function(){
        this.NowPlaying =null;     
    },
});




