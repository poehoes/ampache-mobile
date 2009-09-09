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


NowPlayingAssistant.prototype.appMenuAttr = {omitDefaultItems: true};
NowPlayingAssistant.prototype.appMenuModel = {
	visible: true,
	items: [
		//{label: "Test Connection", command: "doTest-cmd"},
		{label: "Stream Info",  command: "doStreamingInfo-cmd" },
		{label: "About...", command: "about-cmd"}
	]
};


//*********************************************************************************************************************************
//                                Scene Functions
//*********************************************************************************************************************************


function NowPlayingAssistant(params){
    Mojo.Log.info("--> NowPlayingAssistant.prototype.constuctor");
    
    //this.playList = params.playList;
    
	this.playList = params.playList;
	this.startIndex = params.startIndex;
	this.shuffle = params.shuffle;
   
    
    this.pauseStopItem = this.pauseItem;
    this.repeatMode = 0;
    
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.constuctor");
}


NowPlayingAssistant.prototype.setup = function(){

    Mojo.Log.info("--> NowPlayingAssistant.prototype.setup");
    
	this.playing=false;
	
	this.NowPlayingDisplaySongInfo(this.playList, this.startIndex);
    
	 this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
	
    this.cmdMenuModel = {
        visible: true,
        items: null
    };
    
    
    // set up the controls
    
    this.setMenuControls(true, false, false);
    this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
    
    
    Mojo.Log.info("Setup sliderModel");
    this.sliderModel = {
        value: 0,
        maxValue: 100,
        minValue: 0,
        progress: 0
    };
    
    Mojo.Log.info("Setup spinnnerAttrs");
    this.spinnerAttrs = {
        spinnerSize: 'large'
    };
    
    
    
    Mojo.Log.info("Setup spinnerModel");
    this.spinnerModel = {
        spinning: false
    };
    
    Mojo.Log.info("Setup spinner");
    this.controller.setupWidget('spinner', this.spinnerAttrs, this.spinnerModel);
    
    Mojo.Log.info("Setup slider attrs");
    // setup the slider
    var sliderAttributes = {
        sliderProperty: 'value',
        progressStartProperty: 'progressStart',
        progressProperty: 'progressEnd',
        round: true,
        'updateInterval': .4
    };
    Mojo.Log.info("Setup slider");
    this.controller.setupWidget('sliderdiv', sliderAttributes, this.sliderModel);
    
    Mojo.Log.info("Setup listeners");
    var slider = this.controller.get('sliderdiv');
    slider.observe(Mojo.Event.propertyChange, this.progressBarSeek.bind(this));
    slider.observe(Mojo.Event.sliderDragStart, this.progressBarDragStart.bind(this));
    slider.observe(Mojo.Event.sliderDragEnd, this.progressBarDragEnd.bind(this));
    
	this.controller.get('playback-display').observe(Mojo.Event.dragStart, this.noDrag.bindAsEventListener(this));	
    this.controller.get('playback-display').observe(Mojo.Event.flick, this.handleFlick.bindAsEventListener(this));						
    this.controller.get('playback-display').observe(Mojo.Event.tap, this.doubleClick.bindAsEventListener(this));	
	
	
    this.updateBuffering(0, 0);
    
	
	//Setup audio player
	AmpacheMobile.audioPlayer = new AudioPlayer(this.controller);	
	
	AmpacheMobile.audioPlayer.addPlayList(this.playList, this.shuffle, this.startIndex);
    //AmpacheMobile.audioPlayer.setCurrentTrack(this.startIndex);
    AmpacheMobile.audioPlayer.setNowPlaying(this);
	//this.musicPlayer = AmpacheMobile.audioPlayer.player;
		
	
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.setup");
}


//****************************************************************************************************************
// Gestures and animation
//****************************************************************************************************************

NowPlayingAssistant.prototype.noDrag = function(event) {
	event.stop();
}
		

NowPlayingAssistant.prototype.handleFlick = function(event){
	Mojo.Log.info("--> NowPlayingAssistant.prototype.handleFlick: %j", event);
	
	event.stop();
	
	if (event.velocity.x < -1500) {
		AmpacheMobile.audioPlayer.play_next();
		//this.moveArt();
	}
	if (event.velocity.x > 1500) AmpacheMobile.audioPlayer.play_prev();
		
	Mojo.Log.info("<-- NowPlayingAssistant.prototype.handleFlick");
}



// All this for double clicking
NowPlayingAssistant.prototype.doubleClick = function() {
	Mojo.Log.info("--> NowPlayingAssistant.prototype.doubleClick");
	if (this.click == 1) {
		this.togglePausePlay();
	}
	else {
		this.click = 1
		this.clickInterval = this.controller.window.setInterval(this.killlClick.bind(this), 450);
	}	
}

NowPlayingAssistant.prototype.killlClick = function() {
	Mojo.Log.info("--> NowPlayingAssistant.prototype.killlClick");
    
	this.click = 0;
	this.controller.window.clearInterval(this.clickInterval);
	this.clickInterval = null;
}

NowPlayingAssistant.prototype.togglePausePlay = function(){
	Mojo.Log.info("--> NowPlayingAssistant.prototype.togglePausePlay");
	if (!AmpacheMobile.audioPlayer.player.paused) {
		this.showPlayButton();
		AmpacheMobile.audioPlayer.pause();
	}
	else {
		this.showPauseButton();
		AmpacheMobile.audioPlayer.play();
	}
	Mojo.Log.info("--> NowPlayingAssistant.prototype.togglePausePlay");
}




/*

		// hardcoded position for the album art divs
NowPlayingAssistant.prototype.ANIMATION_FAR_LEFT_LEFT = -400
		
NowPlayingAssistant.prototype.ANIMATION_PREV_LEFT = -140
NowPlayingAssistant.prototype.ANIMATION_PREV_HEIGHT = 200
NowPlayingAssistant.prototype.ANIMATION_PREV_BOTTOM = 200
		
		NowPlayingAssistant.prototype.ANIMATION_CURRENT_LEFT = 70
		NowPlayingAssistant.prototype.ANIMATION_CURRENT_HEIGHT = 220
		NowPlayingAssistant.prototype.ANIMATION_CURRENT_BOTTOM = 100
		
		NowPlayingAssistant.prototype.ANIMATION_NEXT_LEFT = 280
		NowPlayingAssistant.prototype.ANIMATION_NEXT_HEIGHT =200
		NowPlayingAssistant.prototype.ANIMATION_NEXT_BOTTOM = 95
		
		NowPlayingAssistant.prototype.ANIMATION_FAR_RIGHT_LEFT = 400


NowPlayingAssistant.prototype.moveArt = function(){

	this.currentPicDiv = this.controller.get('loaded-display');
	
	var oldInfo = {};
	oldInfo.left = 200;
	oldInfo.bottom = this.ANIMATION_CURRENT_BOTTOM;
	
	var newInfo = {};
	newInfo.left = 280;
	newInfo.bottom = this.ANIMATION_CURRENT_BOTTOM;
	
	
	Mojo.Animation.animateStyle(this.currentPicDiv, 'left', 'bezier', {
		from: 0,
		to: 100,
		duration: 0.2,
		curve: 'over-easy',
		reverse: false,
		onComplete: function(){
			Mojo.Log.info("Animation Complete")
		}
	});
	
	
	
}


NowPlayingAssistant.prototype._getDims = function (divPos){
			
			var dims = {};
			
			switch (divPos){
				case 0:
					dims.left = this.ANIMATION_FAR_LEFT_LEFT;
					dims.div = this.farLeftPicDiv;
					break;
				case 1:
					dims.left = this.ANIMATION_PREV_LEFT;
					dims.height = this.ANIMATION_PREV_HEIGHT;
					dims.bottom = this.ANIMATION_PREV_BOTTOM;
					dims.div = this.prevPicDiv;
					break;
				case 2:
					dims.left = this.ANIMATION_CURRENT_LEFT;					
					dims.height = this.ANIMATION_CURRENT_HEIGHT;
					dims.bottom = this.ANIMATION_CURRENT_BOTTOM;
					dims.div = this.currentPicDiv;
					break;
				case 3:
					dims.left = this.ANIMATION_NEXT_LEFT;
					dims.height = this.ANIMATION_NEXT_HEIGHT;
					dims.bottom = this.ANIMATION_NEXT_BOTTOM;
					dims.div = this.nextPicDiv;
					break;
				case 4:
					dims.left = this.ANIMATION_FAR_RIGHT_LEFT;
					dims.div = this.farRightPicDiv;
					break;
				
			}

			return dims;
			
}
*/


NowPlayingAssistant.prototype.activate = function(event){
    Mojo.Log.info("--> NowPlayingAssistant.prototype.activate");
    
	
	
    AmpacheMobile.audioPlayer.play();
    AmpacheMobile.audioPlayer.setNowPlaying(this);
    
    this.showPlayButton();
    
	AmpacheMobile.audioPlayer.debug = AmpacheMobile.settingsManager.settings.StreamDebug;
	
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.activate");
}


NowPlayingAssistant.prototype.deactivate = function(event){
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.activate");
    AmpacheMobile.audioPlayer.stop();
	AmpacheMobile.audioPlayer.clearNowPlaying();
	
	
	
    Mojo.Log.info("--> NowPlayingAssistant.prototype.activate");
}

NowPlayingAssistant.prototype.cleanup = function(event){
}



NowPlayingAssistant.prototype.updateTime = function(current, duration){
	//Mojo.Log.info("-- NowPlayingAssistant.prototype.updateTime secs", current);
    this.updateCounters(Math.round(current), duration);
	this.percentage = 0;
	if (duration == 0) {
		this.percentage = 0;
	}
	else {
		this.percentage = (current / duration) * 100;
	}
	this.sliderModel.value = this.percentage;
    this.controller.modelChanged(this.sliderModel);
}

NowPlayingAssistant.prototype.updateCounters = function(current, duration){
    var remaining = Math.floor(duration - current);
    this.controller.get('playback-remaining').innerHTML = "-" + this.timeFormatter(remaining);
    var timeString = this.timeFormatter(current);
    this.controller.get('playback-progress').innerHTML = timeString;
    
}


NowPlayingAssistant.prototype.timeFormatter = function(secs){
    //Mojo.Log.info("--> NowPlayingAssistant.prototype.timeFormatter secs", secs);
	
	var hrs = Math.floor(secs / 3600);
    var mins = Math.floor(secs / 60) - hrs * 60;
    secs = secs % 60;
    
    var displayHours = "";
    if (hrs > 0) {
        displayHours = hrs + ":";
    }
    
    var result = displayHours + ((mins < 10) ? "0" + mins : mins) + ":" + ((secs < 10) ? "0" + secs : secs);
    
	//Mojo.Log.info("<-- NowPlayingAssistant.prototype.timeFormatter result", result);
    return result;
}

//*********************************************************************************************************************************
//                                Progress Bar Slider / Buffering
//*********************************************************************************************************************************
NowPlayingAssistant.prototype.progressBarDragEnd = function(){
	Mojo.Log.info("--> NowPlayingAssistant.prototype.progressBarDragEnd");

	this.sliderIsDragging = false;
	var pos = this.sliderModel.value;
	var percentage = (pos / 100);
	
	//Not yet supporting restaring the download from a new spot
	var secs = (this.sliderModel.progressEnd < percentage) ? AmpacheMobile.audioPlayer.player.currentTime : Math.round((pos / 100) * AmpacheMobile.audioPlayer.player.duration);
	AmpacheMobile.audioPlayer.player.currentTime = secs;
	AmpacheMobile.audioPlayer.NowPlayingStartPlaybackTimer();
	/*
	if (this.pausedFromDrag) {
		AmpacheMobile.audioPlayer.NowPlayingStartPlaybackTimer();
		this.musicPlayer.play();
		this.pausedFromDrag = false;	
	}*/
	
	Mojo.Log.info("<-- NowPlayingAssistant.prototype.progressBarDragEnd");
}

NowPlayingAssistant.prototype.progressBarDragStart = function(){
    Mojo.Log.info("--> NowPlayingAssistant.prototype.progressBarDragStart");
	/*
	if (this.sliderIsDragging) 
        return;
    
     this.sliderIsDragging = true;
     if (!this.musicPlayer.paused) {
	 	this.eatPause = true;
		AmpacheMobile.audioPlayer.NowPlayingStopPlaybackTimer();
	 	this.musicPlayer.pause();
	 	this.pausedFromDrag = true;
	 }
	 else {
	 	this.pausedFromDrag = false; 	
	 }
	 */
	
	if (this.sliderIsDragging) 
        return;
	this.sliderIsDragging = true;	
	AmpacheMobile.audioPlayer.NowPlayingStopPlaybackTimer();
	
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.progressBarDragStart");
}

NowPlayingAssistant.prototype.progressBarSeek = function(event){
	Mojo.Log.info("--> NowPlayingAssistant.prototype.progressBarSeek");
	var pos = event.value;
    var secs = Math.round((pos / 100) * AmpacheMobile.audioPlayer.player.duration);
    this.updateCounters(secs, AmpacheMobile.audioPlayer.player.duration);
	Mojo.Log.info("<-- NowPlayingAssistant.prototype.progressBarSeek");
}


NowPlayingAssistant.prototype.updateBuffering = function(startPctg, endPctg){
    this.sliderModel.progressStart = startPctg
    this.sliderModel.progressEnd = endPctg;
    this.controller.modelChanged(this.sliderModel);
}

//*********************************************************************************************************************************
//                                Spinner
//*********************************************************************************************************************************
NowPlayingAssistant.prototype.showSpinner = function(){
    Mojo.Log.info("--> NowPlayingAssistant.prototype.showSpinner");
    
    this.spinnerModel.spinning = true;
    this.controller.modelChanged(this.spinnerModel);
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.showSpinner");
    
}
NowPlayingAssistant.prototype.hideSpinner = function(){
    Mojo.Log.info("--> NowPlayingAssistant.prototype.hideSpinner");
    this.spinnerModel.spinning = false;
    this.controller.modelChanged(this.spinnerModel);
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.hideSpinner");
}



//*********************************************************************************************************************************
//  Now Playing Song Info
//*********************************************************************************************************************************

NowPlayingAssistant.prototype.NowPlayingDisplaySongInfo = function(playList, currentIndex)
{
	var song = playList[currentIndex]
	Mojo.Log.info("--> NowPlayingAssistant.prototype.NowPlayingDisplaySongInfo song: %j", song);
	
	this.controller.get('loaded-display').show();
	
	this.controller.get('songTitle').innerHTML = song.title.escapeHTML();
	//this.controller.get('artist').innerHTML = song.artist.escapeHTML();
	//this.controller.get('album').innerHTML = song.album.escapeHTML();
	this.controller.get('albumArtist').innerHTML = song.artist.escapeHTML() + " - " + song.album.escapeHTML();
	
	
	
	if ((song.art == null) || (song.art == "")) {
		$('coverArt').src = "images/blankalbum.jpg"
	}
	else {
		if ($('coverArt').src != song.art) 
			$('coverArt').src = song.art;
	}
	var xofy =(currentIndex+1) + "/" + playList.length;
	this.controller.get('song-x-of-y').innerHTML = xofy.escapeHTML();
	
	var title = "Now Playing"
	this.controller.get('title').innerHTML = title.escapeHTML();
	
	
	Mojo.Log.info("<-- NowPlayingAssistant.prototype.NowPlayingDisplaySongInfo");
	
	
}

NowPlayingAssistant.prototype.streamDebug = function(state)
{
	var display = "";
	switch(state)
	{
		case "loadstart":
			display = "Starting Stream"
			break;
		
		case "canplaythrough":
			display = "Can Play Through";
			break;
			
		case "progress":
			display = "Downloading";
			break;
	 
	    case "stalled":
	 		display = "Downloading Stalled";
			break;
			
		case "load":
			display = "Fully Loaded";
			break;
			
		default:
			display = state;
			break;
	}
	
	this.controller.get('stream-debug').innerHTML = display;
}


NowPlayingAssistant.prototype.setMenuControls = function(){
    var items = new Array();
    
    
	var leftGroup = new Array();
    leftGroup[0] = this._getShuffleItem()
	
	
	var centerGroup = new Array();
	
    var playButton = this.playItem;
    var rewindButton = this.rewindItem;
    var forwardButton = this.forwardItem;
    var pauseButton = this.pauseStopItem;
    
	
	
    centerGroup[0] = rewindButton;
    if (!this.playing) {
        centerGroup[1] = playButton;
    }
    else {
        centerGroup[1] = pauseButton;
    }
    centerGroup[2] = forwardButton;
    
    
	var rightGroup = new Array();
	rightGroup[0] = this._getRepeatItem();
	
	// pad to center the button group
    items[0] = 
	{ 
		items: leftGroup
    };
	items[1] = {
        items: centerGroup
    };
    items[2] = {
		items: rightGroup
	};
    
    this.cmdMenuModel.items = items;
    this.controller.modelChanged(this.cmdMenuModel);
    
    //if (enableRewFast) 
    //setTimeout(this._registerCmdMenuOnClicks.bind(this), 0);
}

NowPlayingAssistant.prototype.onStreamingErrorDismiss = function(value){
    Mojo.Log.info("--> NowPlayingAssistant.prototype.onErrorDialogDismiss value: " + value);
    
    switch (value) {
        case "retry":
            break;
        case "palm-attempt":
            this.controller.serviceRequest('palm://com.palm.applicationManager', {
                method: 'open',
                parameters: {
						target: this.errorSong.url
					
				},
            /*
             onSuccess: function(status){
             $('area-to-update').update(Object.toJSON(status));
             },
             onFailure: function(status){
             $('area-to-update').update(Object.toJSON(status));
             },
             onComplete: function(){
             this.getButton = myassistant.controller.get('LaunchAudioButton');
             this.getButton.mojo.deactivate();
             }*/
            });
            break;
    }
    
    
    this.errorSong = null;
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.onErrorDialogDismiss");
}




NowPlayingAssistant.prototype.streamingError = function(errorText, song){
	this.errorSong = song;
	
	this.controller.showAlertDialog({
		onChoose: this.onStreamingErrorDismiss.bind(this),
		title: $L("Streaming Error"),
		message: errorText,
		choices: [{
			
					label: 'OK',
					value: "retry",
					type: 'primary'
				}, /*{
					label: 'Let Palm Try',
					value: "palm-attempt",
					type: 'secondary'
				
				}*/],
		allowHTMLMessage:true,
	});
}


NowPlayingAssistant.prototype.showError = function(errorText){
			this.controller.showAlertDialog({
			    onChoose: this.onErrorDialogDismiss.bind(this),
			    title: $L("Error"),
			    message: errorText,
			    choices:[
		        {label:$L('Cancel'), value:"cancel", type:'dismiss'}
			    ]
			  });
}

NowPlayingAssistant.prototype.onErrorDialogDismiss = function(event)
{
	this.controller.stageController.popScene();
}


NowPlayingAssistant.prototype.showPauseButton = function(){
    this.playing=true;
	this.setMenuControls();
}

NowPlayingAssistant.prototype.showPlayButton = function(){
	this.playing=false;;
    this.setMenuControls();
}

NowPlayingAssistant.prototype.handleCommand = function(event){
    Mojo.Log.info("--> NowPlayingAssistant.prototype.handleCommand:", event.command);
    
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case "forward":
                AmpacheMobile.audioPlayer.play_next();
                break;
            case "rewind":
                AmpacheMobile.audioPlayer.play_prev();
                break;
            case "pause":
                this.showPlayButton();
                AmpacheMobile.audioPlayer.pause();
                break;
            case "stop":
                break;
			//case "shuffle-on":
			//	this.turnOnShuffle();
			//	break;
			//case "shuffle-off":
			//	this.turnOffShuffle();
			//	break;	
			
			case "toggleShuffle":
				this.toggleShuffle();
				break;
			case "toggleRepeat":
				this.toggleRepeat();
				break;			
            case "play":
                this.showPauseButton();
                AmpacheMobile.audioPlayer.play();
                break;
			case "doStreamingInfo-cmd":
				this.controller.showAlertDialog({
			   // onChoose: this.onErrorDialogDismiss.bind(this),
			    title: "Stream Info",
			    message: AmpacheMobile.audioPlayer.getStreamInfo(),
			    choices:[
		        {label:$L('Cancel'), value:"cancel", type:'dismiss'}
			    ]
			  });
				break;			
        }
    }
    
    Mojo.Log.info("<-- NowPlayingAssistant.prototype.handleCommand:", event.command);
    
}

		/**
		 * Returns the proper shuffle command item for use as an item in the command list
		 */
NowPlayingAssistant.prototype._getShuffleItem = function(){
			var icon;
			var toggleCmd;
			
			if (this.shuffle==true){
				icon = "music-shuffle";
				toggleCmd = 'toggleShuffle';
			} else{
				icon = "music-shuffle";
			}
			
			return {toggleCmd: toggleCmd, items:[
										{ command:'toggleShuffle', icon:icon}
										]};
			
			//return {toggleCmd:'toggle-stuff', icon: icon, command:'toggleShuffle'};
		}

NowPlayingAssistant.prototype._getRepeatItem = function(){

	//var repeatMode = this.musicPlayer.getRepeatMode();
	var icon;
	var toggleCmd;
	
	if (this.repeatMode == 0) {
		icon = 'music-repeat';
	}
	else 
		if (this.repeatMode==1) {
			icon = 'music-repeat';
			toggleCmd = 'toggleRepeat';
		}
		else {
			icon = 'music-repeat-one';
			toggleCmd = 'toggleRepeat';
		}
	
	return {
		toggleCmd: toggleCmd,
		items: [{
			command: 'toggleRepeat',
			icon: icon
		}]
	};
	
	//return {icon: icon, command:'toggleRepeat'};
}

NowPlayingAssistant.prototype.toggleRepeat = function()
{
	this.repeatMode++;
	this.repeatMode = this.repeatMode%3;
	
	Mojo.Log.info("--> NowPlayingAssistant.prototype.toggleRepeat  repeatMode:", this.repeatMode);
	
	if (this.repeatMode == 1) {
		this.controller.showAlertDialog({
			// onChoose: this.onErrorDialogDismiss.bind(this),
			title: "Feature not Complete",
			message: "This feature has not been finished, look for it in a future version",
			choices: [{
				label: $L('Cancel'),
				value: "cancel",
				type: 'dismiss'
			}]
		});
	}
	//if (this.shuffle) {
		//AmpacheMobile.audioPlayer.toggleShuffleOn();
	//}
	//else
	//{
		//AmpacheMobile.audioPlayer.toggleShuffleOff();
	//}
	
	this.setMenuControls();
	
	
};


NowPlayingAssistant.prototype.toggleShuffle = function()
{
	this.shuffle=!this.shuffle;
	if (this.shuffle) {
		AmpacheMobile.audioPlayer.toggleShuffleOn();
	}
	else
	{
		AmpacheMobile.audioPlayer.toggleShuffleOff();
	}
	
	this.setMenuControls();
	
	
};


NowPlayingAssistant.prototype.playItem = {
    icon: 'music-play',
    command: 'play'
};
NowPlayingAssistant.prototype.playItemDisabled = {
    icon: 'music-play-disabled',
    command: 'playItemDisabled'
};
NowPlayingAssistant.prototype.pauseItem = {
    icon: 'music-pause',
    command: 'pause'
};
NowPlayingAssistant.prototype.stopItem = {
    icon: 'music-stop',
    command: 'stop'
};


NowPlayingAssistant.prototype.shuffleOnItem = {
	toggleCmd: "toggleShuffle",
	items: [{
		command: 'shuffle-off',
		icon: 'music-shuffle'
	}]
};

NowPlayingAssistant.prototype.shuffleOffItem = {
    toggleCmd:null,
	icon: 'music-shuffle',
    command: 'shuffle-on'
};

NowPlayingAssistant.prototype.forwardItem = {
    icon: 'music-forward',
    command: 'forward'
};
NowPlayingAssistant.prototype.forwardItemDisabled = {
    icon: 'music-forward-disabled',
    command: 'forwardItemDisabled'
};
NowPlayingAssistant.prototype.rewindItem = {
    icon: 'music-rewind',
    command: 'rewind'
};
NowPlayingAssistant.prototype.rewindItemDisabled = {
    icon: 'music-rewind-disabled',
    command: 'rewindItemDisabled'
};

NowPlayingAssistant.prototype.repeatItem = {
    icon: 'music-repeat',
    command: 'repeat'
};

