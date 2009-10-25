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
/*
// *********************************************************************************************************************************
//  Scene Functions
// *********************************************************************************************************************************
 */
NowPlayingAssistant = Class.create(
{
    initialize: function(params){
        Mojo.Log.info("--> NowPlayingAssistant.prototype.constuctor");
        //this.playList = params.playList;
        this.type = params.type;
        this.pauseStopItem = this.pauseItem;
        
        switch(params.type)
        {
            case "display":
                this.repeatMode = AmpacheMobile.audioPlayer.repeatMode;
                this.shuffle = AmpacheMobile.audioPlayer.shuffleOn;
                this.pauseStopItem = this.pauseItem;
                break;
            case "play":
                this.playList = params.playList;
                this.startIndex = params.startIndex;
                this.shuffle = params.shuffle;
                this.repeatMode = 0;
                AmpacheMobile.audioPlayer.newPlayList(this.playList, this.shuffle, this.startIndex);
                break;
            case "enqueue":
                this.repeatMode = AmpacheMobile.audioPlayer.repeatMode;
                this.pauseStopItem = this.pauseItem;
                this.shuffle = params.shuffle || AmpacheMobile.audioPlayer.shuffleOn;
                AmpacheMobile.audioPlayer.enqueuePlayList(params.playList, this.shuffle);
                break;
            
        }
        

        Mojo.Log.info("<-- NowPlayingAssistant.prototype.constuctor");
    },
    
    setup: function(){
        Mojo.Log.info("--> setup");
        this.playing = false;
        if(this.type === "play" )
        {
            this.NowPlayingDisplaySongInfo(this.playList, this.startIndex);
        }
        this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
        this.cmdMenuModel = 
        {
            visible: true,
            items: null
        };
        // set up the controls
        this.setMenuControls(true, false, false);
        this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
        
        Mojo.Log.info("Setup sliderModel");
        this.sliderModel = 
        {
            value: 0,
            maxValue: 100,
            minValue: 0,
            progress: 0,
            property: "updating"
        
        };
        
        Mojo.Log.info("Setup spinnnerAttrs");
        this.spinnerAttrs = 
        {
            spinnerSize: 'large'
        };
        
        Mojo.Log.info("Setup spinnerModel");
        this.spinnerModel = 
        {
            spinning: false
        };
        
        Mojo.Log.info("Setup spinner");
        this.controller.setupWidget('spinner', this.spinnerAttrs, this.spinnerModel);
        
        Mojo.Log.info("Setup slider attrs");
        // setup the slider
        var sliderAttributes = 
        {
            sliderProperty: 'value',
            progressStartProperty: 'progressStart',
            progressProperty: 'progressEnd',
            round: true,
            updateInterval: 0.4
        };
        Mojo.Log.info("Setup slider");
        this.controller.setupWidget('sliderdiv', sliderAttributes, this.sliderModel);
        

        
        this.updateBuffering(0, 0);
        
        if(this.type!=="display")
        {
            $('coverArt').src = "images/blankalbum.png";
        }
        else
        {
            
        }
        
        window.onresize = this.FitToWindow;
        this.FitToWindow();
        
        
        //***************************************************************************************
        //Events
        this.slider = this.controller.get('sliderdiv');
        
        this.seekHandler = this.progressBarSeek.bindAsEventListener(this);
        Mojo.Event.listen(this.slider, Mojo.Event.propertyChange, this.seekHandler);
        
        this.dragStartHandler = this.progressBarDragStart.bindAsEventListener(this);
        Mojo.Event.listen(this.slider, Mojo.Event.sliderDragStart, this.dragStartHandler);
        
        this.dragEndHandler = this.progressBarDragEnd.bindAsEventListener(this);
        Mojo.Event.listen(this.slider, Mojo.Event.sliderDragEnd, this.dragEndHandler);
        
        this.noDragHandler = this.noDrag.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('now-playing'), Mojo.Event.dragStart, this.noDragHandler );
        
        this.flickHandler = this.handleFlick.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('playback-display'), Mojo.Event.flick, this.flickHandler);
        
        this.doubleClickHandler = this.doubleClick.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('playback-display'), Mojo.Event.tap, this.doubleClickHandler);
        
        Mojo.Log.info("<-- setup");
    },
    
    cleanup: function(event){
        Mojo.Event.stopListening(this.slider, Mojo.Event.propertyChange, this.seekHandler);
        Mojo.Event.stopListening(this.slider, Mojo.Event.sliderDragStart, this.dragStartHandler);
        Mojo.Event.stopListening(this.slider, Mojo.Event.sliderDragEnd, this.dragEndHandler);
        Mojo.Event.stopListening(this.controller.get('now-playing'), Mojo.Event.dragStart, this.noDragHandler );
        Mojo.Event.stopListening(this.controller.get('playback-display'), Mojo.Event.flick, this.flickHandler);
        Mojo.Event.stopListening(this.controller.get('playback-display'), Mojo.Event.tap, this.doubleClickHandler);
    },
    
    FitToWindow: function(){
        var percentate = 0.8;
        var coverArt = $('coverArt');
        //var diff = window.innerHeight - height;
        var height = coverArt.height;
        var option1 = (window.innerHeight - 200);
        
        if (option1 < 0) {
            option1 = 0;
        }
        var option2 = window.innerWidth * percentate;
        height = (option1 < option2) ? option1 : option2;
        coverArt.height = height;
        coverArt.width = height;
        var diff = window.innerHeight - height;
        //alert(window.innerHeight-height);
        spinner.style.left = (coverArt.offsetLeft + (height / 2 - 64)) + "px";
        spinner.style.top = (coverArt.offsetTop + (height / 2 - 64)) + "px";
        //CenterSpinner($('spinner'));
    },
    
    //****************************************************************************************************************
    // Gestures and animation
    //****************************************************************************************************************
    noDrag: function(event){
        event.stop();
    },
    
    handleFlick: function(event){
        Mojo.Log.info("--> handleFlick: %j", event);
        event.stop();
        if (event.velocity.x < -1500){
            AmpacheMobile.audioPlayer.play_next(true);
            //this.moveArt();
        }
        if (event.velocity.x > 1500) {
            AmpacheMobile.audioPlayer.play_prev();
        }
        Mojo.Log.info("<-- handleFlick");
    },
    
    // All this for double clicking
    doubleClick: function(){
        Mojo.Log.info("--> doubleClick");
        if (this.click === 1){
            this.togglePausePlay();
        }
        else{
            this.click = 1;
            this.clickInterval = window.setInterval(this.killlClick.bind(this), 450);
        }
    },
    
    killlClick: function(){
        Mojo.Log.info("--> killlClick");
        this.click = 0;
        window.clearInterval(this.clickInterval);
        this.clickInterval = null;
    },
    
    togglePausePlay: function(){
        Mojo.Log.info("--> togglePausePlay");
        if (!AmpacheMobile.audioPlayer.player.paused){
            this.showPlayButton();
            AmpacheMobile.audioPlayer.pause();
        }
        else {
            this.showPauseButton();
            AmpacheMobile.audioPlayer.play();
        }
        Mojo.Log.info("--> togglePausePlay");
    },
    /*
     // hardcoded position for the album art divs
     ANIMATION_FAR_LEFT_LEFT = -400
     ANIMATION_PREV_LEFT = -140
     ANIMATION_PREV_HEIGHT = 200
     ANIMATION_PREV_BOTTOM = 200
     ANIMATION_CURRENT_LEFT = 70
     ANIMATION_CURRENT_HEIGHT = 220
     ANIMATION_CURRENT_BOTTOM = 100
     ANIMATION_NEXT_LEFT = 280
     ANIMATION_NEXT_HEIGHT =200
     ANIMATION_NEXT_BOTTOM = 95
     ANIMATION_FAR_RIGHT_LEFT = 400
     moveArt : function(){
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
     _getDims = function (divPos){
     
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
    activate: function(event){
        Mojo.Log.info("--> activate");
        AmpacheMobile.audioPlayer.setNowPlaying(this);
        
        if(this.type === "play")
        {
            AmpacheMobile.audioPlayer.play();
        }
        else if(this.type==="enqueue")
        {
            this.setMenuControls();
        }
    
        
        
        AmpacheMobile.audioPlayer.debug = AmpacheMobile.settingsManager.settings.StreamDebug;
        Mojo.Log.info("<-- activate");
    },

    deactivate: function(event){
        Mojo.Log.info("<-- activate");
        //AmpacheMobile.audioPlayer.stop();
        AmpacheMobile.audioPlayer.clearNowPlaying();
        window.onresize = null;
        Mojo.Log.info("--> activate");
    },
    

    
    updateTime: function(current, duration){
        //Mojo.Log.info("-- updateTime secs", current);
        this.updateCounters(current, duration);
        this.percentage = 0;
        if (duration === 0){
            this.percentage = 0;
        }else{
            this.percentage = (current / duration) * 100;
        }
        this.sliderModel.value = this.percentage;
        this.controller.modelChanged(this.sliderModel);
    },
    
    updateCounters: function(_current, _duration){
        var current = Math.floor(_current);
        var duration = Math.floor(_duration);
        var remaining = Math.floor(duration - current);
        this.controller.get('playback-remaining').innerHTML = "-" + this.timeFormatter(remaining);
        var timeString = this.timeFormatter(current);
        this.controller.get('playback-progress').innerHTML = timeString;
    },
    
    timeFormatter: function(secs){
        Mojo.Log.info("--> timeFormatter secs: " + secs);
        var hrs = Math.floor(secs / 3600);
        var mins = Math.floor(secs / 60) - hrs * 60;
        secs = secs % 60;
        var displayHours = "";
        if (hrs > 0){
            displayHours = hrs + ":";
        }
        var result = displayHours + ((mins < 10) ? "0" + mins : mins) + ":" + ((secs < 10) ? "0" + secs : secs);
        //Mojo.Log.info("<-- timeFormatter result", result);
        return result;
    },
    
    //*********************************************************************************************************************************
    //                                Progress Bar Slider / Buffering
    //*********************************************************************************************************************************
    progressBarDragEnd: function(){
        Mojo.Log.info("--> progressBarDragEnd");
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
        Mojo.Log.info("<-- progressBarDragEnd");
    },
    
    progressBarDragStart: function(){
        Mojo.Log.info("--> progressBarDragStart");
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
        if (this.sliderIsDragging) {
            return;
        }
        this.sliderIsDragging = true;
        AmpacheMobile.audioPlayer.NowPlayingStopPlaybackTimer();
        Mojo.Log.info("<-- progressBarDragStart");
    },
    
    progressBarSeek: function(event){
        Mojo.Log.info("--> progressBarSeek");
        var pos = event.value;
        var secs = Math.round((pos / 100) * AmpacheMobile.audioPlayer.player.duration);
        this.updateCounters(secs, AmpacheMobile.audioPlayer.player.duration);
        Mojo.Log.info("<-- progressBarSeek");
    },
    
    
    updateBuffering: function(startPctg, endPctg){
        this.sliderModel.progressStart = startPctg;
        this.sliderModel.progressEnd = endPctg;
        this.controller.modelChanged(this.sliderModel);
    },
    
    //*********************************************************************************************************************************
    //                                Spinner
    //*********************************************************************************************************************************
    showSpinner: function(){
        Mojo.Log.info("--> showSpinner");
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<-- showSpinner");
    },
    hideSpinner: function(){
        Mojo.Log.info("--> hideSpinner");
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<-- hideSpinner");
    },
    
    //*********************************************************************************************************************************
    //  Now Playing Song Info
    //*********************************************************************************************************************************
    NowPlayingDisplaySongInfo: function(playList, currentIndex){
        var song = playList[currentIndex];
        Mojo.Log.info("--> NowPlayingDisplaySongInfo song"); //: %j", song);
        this.controller.get('loaded-display').show();
        this.controller.get('songTitle').innerHTML = song.title.escapeHTML();
        //this.controller.get('artist').innerHTML = song.artist.escapeHTML();
        //this.controller.get('album').innerHTML = song.album.escapeHTML();
        this.controller.get('albumArtist').innerHTML = song.artist.escapeHTML() + " - " + song.album.escapeHTML();
        if ((!song.art) || (song.art === "")){
            $('coverArt').src = "images/blankalbum.png";
        }else{
            if ($('coverArt').src !== song.art){
                $('coverArt').src = "images/blankalbum.png";
                $('coverArt').src = song.art;
            }
        }
        var xofy = (currentIndex + 1) + "/" + playList.length;
        this.controller.get('song-x-of-y').innerHTML = xofy.escapeHTML();
        var title = "Now Playing";
        this.controller.get('title').innerHTML = title.escapeHTML();
        Mojo.Log.info("<-- NowPlayingDisplaySongInfo");
    },
    
    streamDebug: function(state){
        var display = "";
        switch (state){
            case "Downloading NaN%":
                display = "Download Starting";
                break;
            case "Downloading 100%":
                display = "Downloading Finished";
                break;
            case "loadstart":
                display = "Starting Stream";
                break;
            case "canplaythrough":
                display = "Can Play Through";
                break;
            case "progress":
                display = "Downloading";
                break;
            case "stalled":
                display = "Stream loading stalled";
                break;
            case "load":
                display = "Fully Loaded";
                break;
            default:
                display = state;
                break;
        }
        this.controller.get('stream-debug').innerHTML = display;
    },
    
    setMenuControls: function(){
        var items = [];
        var leftGroup = [];
        leftGroup[0] = this._getShuffleItem();
        var centerGroup = [];
        var playButton = this.playItem;
        var rewindButton = this.rewindItem;
        var forwardButton = this.forwardItem;
        var pauseButton = this.pauseStopItem;
        centerGroup[0] = rewindButton;
        if (!this.playing){
            centerGroup[1] = playButton;
        }else{
            centerGroup[1] = pauseButton;
        }
        centerGroup[2] = forwardButton;
        var rightGroup = [];
        rightGroup[0] = this._getRepeatItem();
        // pad to center the button group
        items[0] = { items: leftGroup };
        items[1] = { items: centerGroup };
        items[2] = { items: rightGroup };
        this.cmdMenuModel.items = items;
        this.controller.modelChanged(this.cmdMenuModel);
        //if (enableRewFast) 
        //setTimeout(this._registerCmdMenuOnClicks.bind(this), 0);
    },
    
    onStreamingErrorDismiss: function(value){
        Mojo.Log.info("--> onErrorDialogDismiss value: " + value);
        switch (value) {
            case "retry":
                break;
            case "palm-attempt":
                this.controller.serviceRequest('palm://com.palm.applicationManager', 
                {
                    method: 'open',
                    parameters: 
                    {
                        target: this.errorSong.url
                    }
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
        Mojo.Log.info("<-- onErrorDialogDismiss");
    },
    streamingError: function(errorText, song){
        this.errorSong = song;
        this.controller.showAlertDialog(
        {
            onChoose: this.onStreamingErrorDismiss.bind(this),
            title: $L("Streaming Error"),
            message: errorText,
            choices: [
            {
                label: 'OK',
                value: "retry",
                type: 'primary'
            }            /*{
             label: 'Let Palm Try',
             value: "palm-attempt",
             type: 'secondary'
             
             }*/
            ],
            allowHTMLMessage: true
        });
    },
    
    showError: function(errorText){
        this.controller.showAlertDialog(
        {
            onChoose: this.onErrorDialogDismiss.bind(this),
            title: $L("Error"),
            message: errorText,
            choices: [
            {
                label: $L('Cancel'),
                value: "cancel",
                type: 'dismiss'
            }]
        });
    },
    
    onErrorDialogDismiss: function(event){
        this.controller.stageController.popScene();
    },
    
    
    showPauseButton: function(){
        this.playing = true;
        this.setMenuControls();
    },
    
    showPlayButton: function(){
        this.playing = false;
        this.setMenuControls();
    },
    
    handleCommand: function(event){
        Mojo.Log.info("--> handleCommand:", event.command);
        if (event.type === Mojo.Event.command){
            switch (event.command){
                case "forward":
                    AmpacheMobile.audioPlayer.play_next(true);
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
                //  this.turnOnShuffle();
                //  break;
                //case "shuffle-off":
                //  this.turnOffShuffle();
                //  break;  
                
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
                    this.controller.showAlertDialog(
                    {
                        // onChoose: this.onErrorDialogDismiss.bind(this),
                        title: "Stream Info",
                        message: AmpacheMobile.audioPlayer.getStreamInfo(),
                        choices: [
                        {
                            label: $L('Cancel'),
                            value: "cancel",
                            type: 'dismiss'
                        }]
                    });
                    break;
            }
        }
        Mojo.Log.info("<-- handleCommand:", event.command);
    },
    
    /**
     * Returns the proper shuffle command item for use as an item in the command list
     */
    _getShuffleItem: function(){
        var icon;
        var toggleCmd;
        
        if (this.shuffle === true){
            icon = "music-shuffle";
            toggleCmd = 'toggleShuffle';
        }else{
            icon = "music-shuffle";
        }
        return {
            toggleCmd: toggleCmd,
            items: [{
                command: 'toggleShuffle',
                icon: icon
            }]
        };
        //return {toggleCmd:'toggle-stuff', icon: icon, command:'toggleShuffle'};
    },
    
    _getRepeatItem: function(){
        //var repeatMode = this.musicPlayer.getRepeatMode();
        var icon;
        var toggleCmd;
        if (this.repeatMode === 0){
            icon = 'music-repeat';
        }else if (this.repeatMode === 1){
            icon = 'music-repeat';
            toggleCmd = 'toggleRepeat';
        }else{
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
    },
    
    toggleRepeat: function(){
        this.repeatMode++;
        this.repeatMode = this.repeatMode % 3;
        Mojo.Log.info("--> toggleRepeat  repeatMode:", this.repeatMode);
        AmpacheMobile.audioPlayer.setRepeatMode(this.repeatMode);
        this.setMenuControls();
    },
    
    setRepeatMode:function(mode){
         this.repeatMode=mode;
         this.setMenuControls();
    },
    
    toggleShuffle: function(){
        this.shuffle = !this.shuffle;
        if (this.shuffle){
            AmpacheMobile.audioPlayer.toggleShuffleOn();
        }else{
            AmpacheMobile.audioPlayer.toggleShuffleOff();
        }
        this.setMenuControls();
    },
    
    playItem: { icon: 'music-play', command: 'play' },
   
    playItemDisabled: { icon: 'music-play-disabled', command: 'playItemDisabled' },
   
    pauseItem: { icon: 'music-pause', command: 'pause' },

    stopItem: { icon: 'music-stop', command: 'stop' },
   
    shuffleOnItem: { toggleCmd: "toggleShuffle", items: [ { command: 'shuffle-off', icon: 'music-shuffle' }] },
    
    shuffleOffItem: { toggleCmd: null, icon: 'music-shuffle', command: 'shuffle-on' },
    
    forwardItem: { icon: 'music-forward', command: 'forward' },
    
    forwardItemDisabled: { icon: 'music-forward-disabled', command: 'forwardItemDisabled' },
    
    rewindItem: { icon: 'music-rewind', command: 'rewind' },
    
    rewindItemDisabled: { icon: 'music-rewind-disabled', command: 'rewindItemDisabled' },
    
    repeatItem: { icon: 'music-repeat', command: 'repeat' },
    
    appMenuAttr: { omitDefaultItems: true },

    appMenuModel: { visible: true, items: [ { label: "Stream Info", command: "doStreamingInfo-cmd" }, { label: "About...", command: "about-cmd" }] }
});
