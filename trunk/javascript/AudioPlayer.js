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
var RepeatModeType = {"no_repeat":0, "repeat_forever":1, "repeat_once":2 }

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
	repeatMode:RepeatModeType.no_repeat,
	debug: false,
	AudioPlayers:null,
	nPlayers:2,
	mediaEvents:null,
	
    initialize:function(_controller){
        Mojo.Log.info("--> AudioPlayer.prototype.initialize", _controller);
		if(this.OneTimeInit==false) {
			this.OneTimeInit = true;
			this.createAudioObj(_controller);
			this.Controller = _controller;
			this.AudioPlayers = new Array();
			this.mediaEvents = this.registerForMediaEvents(this.mediaEventsCallbacks.bind(this));
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.initialize", this.audioObj);
    },
    
    createAudioObj: function(_controller){
        Mojo.Log.info("--> AudioPlayer.prototype.createAudioObj");
        if (this.audioObj == null) {
			// use Safari's HTML5 implementation if we are runing on palm host
			if (Mojo.Host.current === Mojo.Host.browser) {
				Mojo.Log.info("Setting up audio for safari");
				this.inPalmHost = true;
				this.PlayerReady = true;
				this.player = new Audio();
				//this.player = AudioTag.extendElement(_controller.get('audioPlayerDiv'), _controller);
			}
			else {
				Mojo.Log.info("Setting up audio for palm");
				this.inPalmHost = false;
				this.PlayerReady = false;
				this.player = AudioTag.extendElement(_controller.get('audioPlayerDiv'), _controller);
				//this.player.palm.audioClass = "media";
				this.player.mojo.audioClass = "media";
				this.player.addEventListener("x-palm-connect", this.ConnectedToServer.bind(this));
				this.player.addEventListener("x-palm-disconnect", this.handleAudioEvents.bind(this));
				this.player.addEventListener("x-palm-render-mode", this.handleAudioEvents.bind(this));
				//this.player.addEventListener("x-palm-success", this.handleAudioEvents.bind(this));
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
        Mojo.Log.info("<-- AudioPlayer.prototype.createAudioObj");
    },
    
    //Handles Bluetooth Commands
    mediaEventsCallbacks: function(event){
       Mojo.Log.info("--> AudioPlayer.prototype.mediaEventsCallbacks: "+ event.key);
       switch (event.key) {
            case "next":
                this.play_next(true);
                break;
                
            case "prev":
                this.play_prev();
                break;
                
            case "pause":
			     this.Paused = true;
                this.pause();
			    break;
                
            case "stop":
                this.pause();
            	break;
                
            case "play":
                this.play();
			    break;
                
            case "togglePausePlay":
                if (!this.Paused) {
					this.Paused = true;
					this.pause();
				}
				else {
					this.play();
				}
				break;
        }
    },
	
	registerForMediaEvents: function(callback)
    {
        Mojo.Log.info("--> AudioPlayer.prototype.registerForMediaEvents");
		var parameters = {};
        parameters.appName = Mojo.appName;
        parameters.subscribe = "true";
        return new Mojo.Service.Request(
                MediaEventsService.identifier = 'palm://com.palm.mediaevents',
                {
                    method: 'mediaEvents',
                    onSuccess: callback,
                    parameters: parameters

                }, true
            );
	    Mojo.Log.info("<-- AudioPlayer.prototype.registerForMediaEvents");
    },
	
    getStreamInfo: function(){
		Mojo.Log.info("--> AudioPlayer.prototype.getStreamInfo");
		var info = "Info Unavailable"
		if (this.player.palm!=null) {
			info = "bitrate estimated: " + this.player.palm.bitrate.audio.estimate + "\r\n";
			info += "bitrate avg: " + this.player.palm.bitrate.audio.average.toString() + "\r\n";
			info += "bitrate max: " + this.player.palm.bitrate.audio.maximum.toString();
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.getStreamInfo");
		return info;
	},
	
	ConnectedToServer:function(event){
		Mojo.Log.info("--> AudioPlayer.prototype.ConnectedToServer");
        //this.playList = newPlayList;
		this.PlayerReady = true;
		if(this.RequestedPlayBeforeReady==true)
		{
			this.RequestedPlayBeforeReady=false;
			this.play();
		}
        Mojo.Log.info("<-- AudioPlayer.prototype.ConnectedToServer");
	},
	
    addPlayList:function(newPlayList, _shuffleOn, _startIndex){
        Mojo.Log.info("--> AudioPlayer.prototype.addPlayList");
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
	
	createOrderList:function(){
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
	
	toggleShuffleOff:function(){
		this.playOrderList=this.createOrderList();
		this.currentPlayingIndex = this.currentPlayingTrack;
		this.printPlayOrderList();
		this.shuffleOn = false;
	},
	
	toggleShuffleOn:function() {
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
	
	//**********************************************************************************************************************
    //Code for repeat
    //**********************************************************************************************************************
    setRepeatMode:function(type){
		this.repeatMode = type;
	},
	
    getNextTrack:function(){
		if ((this.currentPlayingIndex + 1) < (this.playList.length)) {
			this.currentPlayingIndex++;
			return this.playOrderList[this.currentPlayingIndex];
		}
		else {
			return -1;
		}
	},
	
	getPrevTrack:function() {
		if ((this.currentPlayingIndex - 1) > -1) {
			this.currentPlayingIndex--;
			return this.playOrderList[this.currentPlayingIndex];
		}
		else {
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
		else {
			this.RequestedPlayBeforeReady=true;
		}
        Mojo.Log.info("<-- AudioPlayer.prototype.play");
    },
    
    stop: function(){
        this.NowPlayingStopPlaybackTimer();
		this.player.pause();
        this.player.empty();
		this.player.src = null;
        //this.player = null;
    },
    
    pause:function(){
		this.NowPlayingStopPlaybackTimer();
        this.player.pause();
		this.Paused=true;
    },
    
	playFinished:false,
	
	play_finished:function() {
		this.currentPlayingIndex = 0
		this.currentPlayingTrack = this.playOrderList[this.currentPlayingIndex];
		this.Paused=false;
		switch (this.repeatMode) {
			case RepeatModeType.no_repeat:
				this.playFinished=true;
				this.stop();
				this.NowPlayingShowPlay();
				this.UpdateNowPlayingBuffering(0, 0);
				this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
				this.NowPlayingResetTime();
				break;

			case RepeatModeType.repeat_forever:
				this.internal_play();
				break;

			case RepeatModeType.repeat_once:
				this.repeatMode = RepeatModeType.no_repeat;
				this.NowPlayingSetRepeatMode();
				this.internal_play();
				break;
		}
	},
	play_change_interval:null,

	kill_play_change_interval:function() {
		if(this.play_change_interval){
			window.clearInterval(this.play_change_interval);
            this.play_change_interval = null;
		}
	},
	
    play_next: function(clicked){
        Mojo.Log.info("--> AudioPlayer.prototype.play_next");
        this.printPlayOrderList();
		//this.playList[this.currentPlayingTrack].played = true;
        this.currentPlayingTrack = this.getNextTrack();
        if (this.currentPlayingTrack > -1){
			this.Paused = false;
			this.stop();
			this.stop();
			this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
            //Add a little bit of delay after a next request to allow for rapid song switching.
			if (clicked) {
			     this.kill_play_change_interval();
				 this.play_change_interval =  window.setInterval(this.delayed_play.bind(this), 500);
			     
			}
			else {
				this.internal_play();
			}
		}
		else {
			if ((!clicked) || (this.repeatMode != RepeatModeType.no_repeat)) {
				this.play_finished();
			}
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
			this.stop();
            //this.internal_play();
			this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
			this.kill_play_change_interval();
            this.play_change_interval =  window.setInterval(this.delayed_play.bind(this), 500);
        }
        Mojo.Log.info("<-- AudioPlayer.prototype.play_prev");
    },
    
	delayed_play:function(){
		 this.Paused=false;
		 this.internal_play();
	},
    play_previous: function(){
    },
    
    internal_play: function(){
        Mojo.Log.info("--> AudioPlayer.prototype.internal_play");
		this.kill_play_change_interval();
		if ((this.Paused) && (!this.playFinished)){
			this.player.play()
		}
		else {
		    this.playFinished = false;
			Mojo.Log.info("Starting play of " +
			this.playList[this.currentPlayingTrack].artist + " - " +
			this.playList[this.currentPlayingTrack].album + " - " +
			this.playList[this.currentPlayingTrack].track + " - " +
			this.playList[this.currentPlayingTrack].title);
			Mojo.Log.info("URL play of " +
			this.playList[this.currentPlayingTrack].url);
			this.NowPlayingResetTime();
			this.UpdateNowPlayingBuffering(0, 0);
			this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
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
    
	MEDIA_ERR_SRC_NOT_SUPPORTED :4,
	
    streamErrorCodeLookup: function(errorCode){
		//refrence: http://dev.w3.org/html5/spc/Overview.html#dom-mediaerror-media_err_network
	 // http://developer.palm.com/index.php?option=com_content&view=article&id=1539
		var errorString="Unknown Error"
		switch(errorCode){
			case MediaError.MEDIA_ERR_ABORTED:
				errorString = "The audio stream was aborted by WebOS.  Most often this happens when you do not have a fast enough connection to support an audio stream.";
				//if (this.debug) {
					errorString += this.moreErrorInfo("MEDIA_ERR_ABORTED");
				//}
				break;
			case MediaError.MEDIA_ERR_NETWORK:
				errorString = "A network error has occured.  The network cannot support an audio stream at this time.";
				//if (this.debug) {
					errorString += this.moreErrorInfo("MEDIA_ERR_NETWORK");
				//}
				break;
			case MediaError.MEDIA_ERR_DECODE:
				errorString = "An error has occurred while attempting to play the file. The file is either corrupt or an unsupported format (ex: m4p, ogg, flac).  Transcoding may be required to play this file.";
				//if (this.debug) {
					errorString += this.moreErrorInfo("MEDIA_ERR_DECODE");
				//}
				break;
			case this.MEDIA_ERR_SRC_NOT_SUPPORTED:
				errorString = "The file is not suitable for streaming";
				//if (this.debug) {
					errorString += "Error Type: MEDIA_ERR_SRC_NOT_SUPPORTED"
				//}
				break;
		}
		return errorString;
	},
	
	moreErrorInfo:function(type){
		var moreInfo = "<br><br><font style='{font-size:smaller;}'><b>Debug Info:</b>"
		moreInfo += "<br>Error Type: " + type;
		if(this.player.palm != null && this.player.palm.errorDetails != null  && this.player.palm.errorDetails.errorCode != null) {
			var errorDetails = this.player.palm.errorDetails;
			Mojo.Log.info("Error Details: %j", errorDetails);
			var errorClassString = "Unknown: (0x" + errorDetails.errorClass.toString(16).toUpperCase() + ")"
			var errorCodeString = "Unknown: (0x" + errorDetails.errorCode.toString(16).toUpperCase() + ")"
			
            switch (errorDetails.errorClass) {
				case 0x50501:
				errorClassString = "DecodeError(0x50501)";
				break;
				case 0x50502:
				errorClassString = "NetworkError(0x50502)";
				break;
			}		
				
			switch (errorDetails.errorCode) {
				case 1:
					errorCodeString = "DecodeErrorFileNotFound(1)"
					break;
				case 2:
					errorCodeString = "DecodeErrorBadParam(2)"
					break;
				case 3:
					errorCodeString = "DecodeErrorPipeline(3)"
					break;
				case 4:
					errorCodeString = "DecodeErrorUnsupported(4)"
					break;
				case 5:
					errorCodeString = "DecodeErrorNoMemory(5)"
					break;
				case 6:
					errorCodeString = "NetworkErrorHttp(6)"
					break;
				case 7:
					errorCodeString = "NetworkErrorRtsp(7)"
					break;
				case 8:
					errorCodeString = "NetworkErrorMobi(8)"
					break;
				case 9:
					errorCodeString = "NetworkErrorOther(9)"
					break;
				case 12:
					errorCodeString = "NetworkErrorPowerDown(12)"
					break;
			}
			
			moreInfo += "<br>Class: " + errorClassString;
			moreInfo += "<br>Code: " + errorCodeString;
			moreInfo += "<br>Value: 0x" + errorDetails.errorValue.toString(16).toUpperCase()
		}
		moreInfo += "<br>Mime: " + this.playList[this.currentPlayingTrack].mime;
		moreInfo += "<br>URL: <a href=" + this.playList[this.currentPlayingTrack].url + ">Stream Link</a></font>";
		return moreInfo;
	},
	
    handleAudioEvents: function(event){
		Mojo.Log.info("------> AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
        //Mojo.Log.error("------> AudioPlayer.prototype.handleAudioEvents AudioEvent: %j", event);
		//Mojo.Log.info("handeAudioEvent: " + event.type);
		this.NowPlayingStreamDebug(event.type);
        switch (event.type) {
            case "canplay":
                this.UpdateNowPlayingShowSpinner(false);
				this.player.play();
                break;
				
            case "stalled":
				this.UpdateNowPlayingShowSpinner(true);
				this.stalled =true;
				break;
			
			case "durationchange":
			     this.UpdateNowPlayingTime();
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
				this.Paused = false;
				this.NowPlayingStartPlaybackTimer();
				this.NowPlayingShowPause();   
                break;
            
			case "pause":
			     this.Paused = true;
			     this.NowPlayingShowPlay();   
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
				this.NowPlayingDisplayError(errorString);
				break;
			
			case "ended":
                this.play_next(false);
				this.NowPlayingStopPlaybackTimer();
                break;
        }
        Mojo.Log.info("<------ AudioPlayer.prototype.handleAudioEvents AudioEvent:",event.type);
    },

	//******************************************************************************************************************
	// Now Playing updaters
	UpdateNowPlayingTime: function() {
		Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingTime");
		if (this.NowPlaying != null) {
			var currentTime = this.player.currentTime;
			var duration = (this.player.duration.toString()=="NaN") ? 0 : this.player.duration;
			this.NowPlaying.updateTime(currentTime,duration);
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingTime");
	},
	
	ClearNowPlayingTime: function() {
		Mojo.Log.info("--> AudioPlayer.prototype.ClearNowPlayingTime");
		if (this.NowPlaying != null) {
			this.NowPlaying.updateTime(0,0);
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.ClearNowPlayingTime");
	},

	UpdateNowPlayingBuffering: function(loaded, total) {
		//Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingBuffering loaded: " + loaded + " total: " + total);
		if(this.NowPlaying!=null) this.NowPlaying.updateBuffering(0, total);		
		//Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingBuffering");
	},
	
	UpdateNowPlayingShowSpinner:function(_spinnerOn) {
		if(this.NowPlaying!=null) {
			if(_spinnerOn==true) this.NowPlaying.showSpinner();
			else if(_spinnerOn==false) this.NowPlaying.hideSpinner();
			else{}
		}
	},
	
	NowPlayingShowPause:function() {
		if (this.NowPlaying != null) {
			this.NowPlaying.showPauseButton();
		}
	},
	
	NowPlayingShowPlay:function() {
		if (this.NowPlaying != null) {
			this.NowPlaying.showPlayButton();
		}
	},
	
	NowPlayingStreamDebug:function(eventText) {
		if (this.NowPlaying != null && this.debug) {
			this.NowPlaying.streamDebug(eventText);
		}
	},
	
	NowPlayingStartPlaybackTimer: function() {
		Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStartPlaybackTimer")
		if (this.NowPlaying != null && this.timeInterval==null) {
			this.timeInterval = this.NowPlaying.controller.window.setInterval(this.UpdateNowPlayingTime.bind(this), 450);
		}
		else {
			Mojo.Log.info("***********************************************************")
		}
		Mojo.Log.info("<-- AudioPlayer.prototype.NowPlayingStartPlaybackTimer")
	},
	
	NowPlayingStopPlaybackTimer: function() {
		Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer")
		if ((this.NowPlaying != null)&&  (this.timeInterval!=null)) {
			 this.NowPlaying.controller.window.clearInterval(this.timeInterval);
			 this.timeInterval =null;
		}
		Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer")
	},
	
	NowPlayingUpdateSongInfo: function(index) {
		if (this.NowPlaying != null) {
			this.NowPlaying.NowPlayingDisplaySongInfo(this.playList, index);
		}
	},
	
	NowPlayingDisplayError:function(message) {
		if (this.NowPlaying != null) {
			var song = this.playList[this.currentPlayingTrack];
			this.NowPlaying.streamingError(message, song)
		}
	},
	
	NowPlayingResetTime: function() {
		if (this.NowPlaying != null) {
			this.NowPlaying.updateTime(0, 0);
		}
	},
	
	NowPlayingSetRepeatMode: function() {
        if (this.NowPlaying != null) {
            this.NowPlaying.setRepeatMode(this.repeatMode);
        }
    },
	
	_updateBuffering: function(){
		//Mojo.Log.info("--> AudioPlayer.prototype._updateBuffering")
		if (this.player.buffered && this.player.buffered.length > 0) {
			var startPercentage = (this.player.buffered.start(0) / this.player.duration);
			var endPercentage = (this.player.buffered.end(0) / this.player.duration);
			this.UpdateNowPlayingBuffering(startPercentage, endPercentage);
			if (this.debug) {
				var percentage = (Math.round(endPercentage * 10000) / 100)	
				this.NowPlayingStreamDebug("Downloading " + percentage + "%");
			}
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
    }
});

