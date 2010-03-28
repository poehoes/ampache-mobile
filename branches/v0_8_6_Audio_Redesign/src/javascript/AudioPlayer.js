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

var STALL_RETRY_TIME = "20000";



AudioPlayer = Class.create({
    
    playList:null,
    playerIndex:0,
    bufferIndex:0,
    hasPlayList:false,
    
    player:null,
    buffer:null,

    streamingEvents : ["play", "pause", "abort", "error", "ended", "canplay",
                      "canplaythrough", "emptied", "load", "loadstart", "seeked",
                      "seeking", "waiting", "progress", "durationchange", "x-palm-disconnect"],

    bufferingEvents : ["abort", "error", "ended", "emptied", "load", "loadstart",
                       "waiting", "progress", "durationchange", "x-palm-disconnect"],
    

    initialize: function () {
        
        this.blankSong = new SongModel(0, "", "", 0, "", 0, 0, 0, "", 0, "", "");
        this.blankSong.index = 0;
        
        //Create 2 audio objects to toggle between streaming and buffering
        //this.audioBuffers = [];
        this.audioBuffers = new Array();
        var audioObj = null;
        for(var i =0; i < 3; i++) {
            audioObj = this.createAudioObj(i);
            this.addBufferingListeners(audioObj);
            this.audioBuffers.push(audioObj);
        }
    },

    createAudioObj: function (index) {
        
        var audioObj = new Audio();
        audioObj.hasAmpacheStreamEvents = false;
        audioObj.hasAmpacheBufferEvents = false;
        audioObj.fullyBuffered = false;
        audioObj.startedBuffering = false;
        
        audioObj.amtBuffered = null;
        
        audioObj.name = "Buffer " + index;
        audioObj.song = this.blankSong;
        
        audioObj.mojo.audioClass = "media";
    
        audioObj.isSong = function(song){
          return (audioObj.src === song.url) ? true : false;
        };
    
        audioObj.context = this;
        
        return audioObj;
    },


    isSongLoaded:function(song)
    {
       
    },

    sortBuffers:function(a, b){
       
        return a.song.index - b.song.index;
    },

    getAudioBuffer:function(songIndex)
    {
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            if(this.audioBuffers[i].song.index === songIndex)
            {
                return this.audioBuffers[i];
                
            }
        }
        return null;
    },

    moveToPlayer:function(song, reverse) {
        
        var player = null;
        var playerIndex =0;
        //var shiftedPlayer=false;
        
        var oldTracks = []
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            oldTracks[i] = this.audioBuffers[i].song;
        }
        
        
        
        if(this.player === null)
        {
            this.player=this.audioBuffers[0];
        }
        
        this.removeStreamingListeners(this.player);
        this.addBufferingListeners(this.player);


        


        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            if((this.audioBuffers[i].isSong(song) === true) && (this.audioBuffers[i].startedBuffering===true))
            {
                player = this.audioBuffers[i];
                break;
            }
            
        }
        
        this.audioBuffers.sort(this.sortBuffers);
        if(reverse === true)
        {
            this.audioBuffers.reverse();
            oldSong = this.audioBuffers[0].song;
        }
        
        //Song not already loaded in an audio object;
        if(player===null)
        {

            if(this.player.fullyBuffered === false)
            {
                player = this.player
            }
            else
            {
                player = this.audioBuffers.shift();
                this.audioBuffers.push(player);
            }
          
            
            
            
            player.pause();
            player.src = song.url;
            player.song = song;
            player.fullyBuffered = false;
            player.startedBuffering=false;
            player.amtBuffered = 0;
            player.load();
            
           
        }
        
        this.audioBuffers.sort(this.sortBuffers);
        this.player = player;
        this.removeBufferingListeners(this.player);
        this.addStreamingListeners(this.player);
        
        //redraw UI to reflect changes
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            this.UIInvalidateSong(oldTracks[i]);
            this.UIInvalidateSong(this.audioBuffers[i]);
            
        }
        this.UIUpdateSongInfo(this.player.song);
        
    },
    
    
    
    stopBackgroundBuffering:function(){
    
        
    
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            if(this.audioBuffers[i].fullyBuffered === false)
            {
                if(this.audioBuffers[i] !== this.player)
                {
                    this.audioBuffers[i].pause();
                    this.audioBuffers[i].src = null;
                    this.audioBuffers[i].empty();
                    if(this.audioBuffers[i].song)
                    {
                        this.UIInvalidateSong(this.audioBuffers[i].song);
                        //this.audioBuffers[i].song = null;
                    }
                }
            }
        }
    
    },
    
    
    stopBackgroundBuffering:function(){
    
        
    
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            if(this.audioBuffers[i].fullyBuffered === false)
            {
                if(this.audioBuffers[i] !== this.player)
                {
                    this.audioBuffers[i].pause();
                    this.audioBuffers[i].src = null;
                    this.audioBuffers[i].empty();
                    if(this.audioBuffers[i].song)
                    {
                        this.UIInvalidateSong(this.audioBuffers[i].song);
                        //this.audioBuffers[i].song = null;
                    }
                }
            }
        }
    
    },
    
    bufferNextSong:function(lastSongLoaded) {
        //Check if the song is alreay in an object
        var song = this.playList.peekNextSong(lastSongLoaded)
        var index = 0;
        
        if(song !== null)
        {
            var buffered = false;
            var buffer=null;
            //Is Song Already Buffered
            for(var i=0; i<this.audioBuffers.length; i++) 
            { 
                //index = (index +i) % this.audioBuffers.length;
            
                if((this.audioBuffers[i].isSong(song) === true) && (this.audioBuffers[i].startedBuffering===true))//if(this.audioBuffers[i].isSong(song) === true)
                {
                    buffered = true;
                    buffer = this.audioBuffers[i];
                    buffer.currentTime = 0;
                }
            }
            
            if(buffered === false)
            {
                    this.audioBuffers.sort(this.sortBuffers);
                    if(this.audioBuffers[0] != this.player)
                    {
                       
                        
                        
                        buffer = this.audioBuffers.shift();
                        
                            if(buffer.song)
                            {
                                this.UIInvalidateSong(buffer.song);
                            }
                    
                            buffer.pause();
                            //
                            buffer.src = song.url;
                            buffer.song = song;
                            buffer.fullyBuffered = false;
                            buffer.startedBuffering = false;
                            buffer.amtBuffered = 0;
                            buffer.load();
                            buffer.autoplay = false;
                    
                            
                            
                        
                        this.audioBuffers.push(buffer);
                        this.audioBuffers.sort(this.sortBuffers);
                    }
            }
            else
            {
                if((buffer.fullyBuffered === true))
                {
                    this.bufferNextSong(song);
                }
            }
        }
    },
    


    
    
    
    addStreamingListeners:function(audioObj)
    {
        Mojo.Log.info(" streaming events: " +  audioObj.name);
        
        eventHandler = this.handleAudioEvents;//.bindAsEventListener(this);    
        for(var i=0; i<this.streamingEvents.length; i++)
        {
            
            audioObj.addEventListener(this.streamingEvents[i], eventHandler);
        }
        audioObj.hasAmpacheStreamEvents = true;
        audioObj.autoplay = true;
    },
    
    
    
    removeStreamingListeners:function(audioObj)
    {
        if(audioObj.hasAmpacheStreamEvents===true)
        {
            Mojo.Log.info("Remove streaming events: " +  audioObj.name);
            eventHandler = this.handleAudioEvents;//.bindAsEventListener(this);
            for(var i=0; i<this.streamingEvents.length; i++)
            {
                audioObj.removeEventListener(this.streamingEvents[i], eventHandler);
            }
            audioObj.hasAmpacheStreamEvents = false;
            audioObj.autoplay = false;
        }
    },
    
    
    //Buffering Event Handler
    addBufferingListeners:function(audioObj)
    {
    
        Mojo.Log.info("Add buffer events: " +  audioObj.name);
        
        
        eventHandler = this.handleBufferEvents;//.bindAsEventListener(this);
        for(var i=0; i<this.bufferingEvents.length; i++)
        {
            
            audioObj.addEventListener(this.bufferingEvents[i], eventHandler);
        }
        audioObj.hasAmpacheBufferEvents = true;
        audioObj.autoplay = false;
    },

    
    removeBufferingListeners:function(audioObj)
    {
        if(audioObj.hasAmpacheBufferEvents===true)
        {
            Mojo.Log.info("Remove buffer events: " +  audioObj.name);
            eventHandler = this.handleBufferEvents;//.bindAsEventListener(this);
            for(var i=0; i<this.bufferingEvents.length; i++)
            {
                audioObj.removeEventListener(this.bufferingEvents[i], eventHandler);
            }
            audioObj.hasAmpacheBufferEvents = false;
        }
    },
    

    
    /***********************************************************************//*
    * Playlist Functions
    *
    ***************************************************************************/
    newPlayList: function(newPlayList, _shuffleOn, _startIndex) {
        this.playList = new PlayList(newPlayList, _shuffleOn, 0, _startIndex);
        //Setup Player for new playlist
        this.moveToPlayer(this.playList.getCurrentSong(), false);
        this.hasPlayList = true;
    },
    
    enqueuePlayList: function(newPlayList, _shuffleOn) {
        if(this.playList)
        {
            this.playList.enqueueSongs(newPlayList, _shuffleOn);
        }
    },
    

    
    /***********************************************************************//*
    * External Playback controls
    *
    ***************************************************************************/
    play: function(){
        this.player.play();
    },
    
    stop:function(){
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            this.audioBuffers[i].pause();
            this.audioBuffers[i].src = null;
            this.audioBuffers[i].song = null;
        }
    },
    
    pause:function(){
        this.player.pause();
    },
    
    next:function()
    {
        if(this.playList.moveCurrentToNext() === true)
        {
            this.removeStreamingListeners(this.player);
            
            //Stop Currently playing song
            this.pause();
            this.seek(0);
            var nextSong = this.playList.getCurrentSong();
            this.moveToPlayer(nextSong, false);
            
            this.play();
            //this.seek(0);
            
            
            //If the current song is already fully buffered then buffer the next
            if(this.player.fullyBuffered === true)
            {
                this.bufferNextSong(nextSong);
            }
           
            
        }
    },
    
    previous:function()
    {
        if(this.playList.moveCurrentToPrevious() === true)
        {
            //Stop Currently playing song
            this.pause();
            var nextSong = this.playList.getCurrentSong();
            this.moveToPlayer(nextSong, true);
            this.play();
            //this.seek(0);
            if(this.player.fullyBuffered === false)
            {
            }
            
        }
    },
    
    gotoTrack:function(track)
    {
        
    },
    
    
    seek:function(seekTime)
    {
        if(seekTime < this.player.duration)
        {
            if(seekTime >= 0)
            {
                this._seek(seekTime);
            }
            else
            {
                this._seek(0);
            }
        }
        else
        {
            this._seek(this.player.duration-1);
        }
    },
    
    jump:function(seconds)
    {
        this.seek(this.player.currentTime+seconds);
    },
    
    seekPercentage:function(percent)
    {
        var secs = this.player.currentTime;
        var duration = this.player.duration;
        if ((duration) && (duration !== 0)) {
            var secs = Math.round(percent * duration);
        }
    
        this.seek(secs);
       
    },
    
    
    /***********************************************************************//*
    * Internal Playback controls and user feedback
    *
    ***************************************************************************/
    _seek:function(seekTime)
    {
        try {
            this.player.currentTime = seekTime;
            if(this.player.paused)
            {
                this.UIUpdatePlaybackTime();
            }
        }
        catch(e) {
            Mojo.Log.error("Error setting currentTime: %j", e);
        }
    },
    
    logAudioEvent:function(source, event)
    {
        Mojo.Log.info(source +" AudioEvent: "+ event.type);
        Mojo.Log.info("Player " + event.currentTarget.name);
        Mojo.Log.info("Song: "+ event.currentTarget.song.title);
    },
    
    handleBufferEvents: function(event) {
        //Mojo.Log.info("------> AudioPlayer.prototype.handleBufferEvents AudioEvent:", event.type);
        var _this = this.context;
        
        //_this.logAudioEvent("handleBufferEvents", event);
    
        event.stop();
        event.stopPropagation();
        
        switch(event.type)
        {
            case "error":
                //Received error buffer is no longer valid throw it away and resort the available buffer stack
                
                event.currentTarget.src = null;
                event.currentTarget.fullyBuffered = false;
                event.currentTarget.startedBuffering = false;
                this.UIInvalidateSong(event.currentTarget.song);
                event.currentTarget.song = this.blankSong;
                _this.audioBuffers.sort(_this.sortBuffers);
                
                break;
            
            case "load":
                _this.bufferingFinished(event.currentTarget);
                _this.bufferNextSong(event.currentTarget.song);
                break;
            case "progress":
                event.currentTarget.startedBuffering = true;
                _this.updateBuffering(event.currentTarget)
                break;
        }
        
        //Mojo.Log.info("<------ AudioPlayer.prototype.handleBufferEvents AudioEvent:", event.type);
    },
    
    
     handleAudioEvents: function(event) {
        //Mojo.Log.info("------> AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
        var _this = this.context;
        //_this.logAudioEvent("handleAudioEvents", event);
    
        event.stop();
        event.stopPropagation();
    
        switch(event.type)
        {
            case "load":
                _this.bufferingFinished(event.currentTarget);
                _this.bufferNextSong(event.currentTarget.song);
                break;
            case "progress":
                event.currentTarget.startedBuffering = true;
                _this.updateBuffering(event.currentTarget);
                break;
            case "ended":
                _this.UIStopPlaybackTimer();
                _this.next(false);
                break;
            case "durationchange":
                _this.UIUpdatePlaybackTime();
                break;
            case "timeupdate":
                _this.UIUpdatePlaybackTime();
                break;
            case "play":
                _this.UIUpdatePlaybackTime();
                _this.UIStartPlaybackTimer();
                break;
            case "pause":
                _this.UIStopPlaybackTimer();
                break;
        }
        
    },
    
    
        //if (this.stallTimer && event.type !== "stalled") {
        //    this.kill_stall_timer();
        //}
        //
        //this.NowPlayingStreamDebug(event.type);
        //
        //
        //switch (event.type) {
        //case "canplay":
        //    this.UpdateNowPlayingShowSpinner(false);
        //    if(this.startPlayback===true) {
        //        this.player.play();
        //    }
        //    else
        //    {
        //        this.Paused = true;
        //    }
        //    break;
        //case "stalled":
        //    if(!this.stallTimer)
        //    {
        //        this.SetStalled(true);
        //    }
        //    break;
        //case "durationchange":
        //    this.UpdateNowPlayingTime();
        //    break;
        //case "timeupdate":
        //    this.UpdateNowPlayingTime();
        //    break;
        //case "progress":
        //    this.SetStalled(false);
        //    this._updateBuffering();
        //    break;
        //case "load":
        //    this.SetStalled(false);
        //    this._bufferingFinished();
        //    break;
        //case "play":
        //    this.Paused = false;
        //    this.NowPlayingStartPlaybackTimer();
        //    this.NowPlayingShowPause();
        //    this.kill_stall_timer();
        //    break;
        //case "pause":
        //    this.Paused = true;
        //    this.NowPlayingShowPlay();
        //    break;
        //case "abort":
        //    this.ClearNowPlayingTime();
        //    break;
        //case "x-palm-disconnect":
        //    this.NowPlayingDisplayError("Palm Audio Service failed");
        //    break;
        //case "error":
        //
        //    var errorString = this.streamErrorCodeLookup(event.error);
        //    this.NowPlayingDisplayError(errorString);
        //    break;
        //case "ended":
        //    
        //    this.play_next(false);
        //    this.NowPlayingStopPlaybackTimer();
        //    break;
        //case "x-palm-connect":
        //    //this.PlayerReady = true;
        //    //break;
        //case "loadstart":
        //case "canplaythrough":
        //case "seeked":
        //case "seeking":
        //case "waiting":
        //case "emptied":
        //    break;
        //default:
        //    this.streamingError("Event:" + event.type);
        //    break;
        //
        //}
        //Mojo.Log.info("<------ AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
    //},
    
    
    
    //btEventsCallbacks: function (event) {
    //    if (event.state === "up") {
    //        if (event.key === "play") {
    //            this.play();
    //            //AmpacheMobile.vibrate();
    //        } else if ((event.key === "pause") || (event.key === "stop")) {
    //
    //            this.pause();
    //            //AmpacheMobile.vibrate();
    //        } else if (event.key === "next") {
    //            this.play_next(true);
    //            //AmpacheMobile.vibrate();
    //        } else if (event.key === "prev") {
    //            this.play_prev();
    //            //AmpacheMobile.vibrate();
    //        }
    //    }
    //},
    //
    //btEventsFailure: function (event) {
    //    //Mojo.Controller.errorDialog("Bluetooth Error");
    //},
    //
    //handleSingleButtonFailure: function(event) {
    //    //Mojo.Controller.errorDialog("Headset Error");
    //},
    //
    //handleSingleButton: function(event) {
    //    
    //    if (event.state === "single_click") {
    //        
    //        //AmpacheMobile.vibrate();
    //        if (!this.Paused) {
    //            this.pause();
    //        } else {
    //            this.play();
    //        }
    //    } else if (event.state === "double_click") {
    //        //AmpacheMobile.vibrate();
    //        this.Paused = false;
    //        this.play_next(true);
    //    } else if (event.state === "hold") {
    //        //AmpacheMobile.vibrate();
    //        this.play_prev();
    //    }
    //},
    //
    //registerForMediaEvents: function(callback) {
    //    Mojo.Log.info("--> AudioPlayer.prototype.registerForMediaEvents");
    //    var parameters = {};
    //    parameters.appName = Mojo.appName;
    //    parameters.subscribe = "true";
    //    return new Mojo.Service.Request(MediaEventsService.identifier = 'palm://com.palm.mediaevents', {
    //        method: 'mediaEvents',
    //        onSuccess: callback,
    //        parameters: parameters
    //
    //    },
    //    true);
    //    //Mojo.Log.info("<-- AudioPlayer.prototype.registerForMediaEvents");
    //},
    //
    //getStreamInfo: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.getStreamInfo");
    //    var info = "Info Unavailable";
    //    if (this.player.palm) {
    //        info = "bitrate estimated: " + this.player.palm.bitrate.audio.estimate + "\r\n";
    //        info += "bitrate avg: " + this.player.palm.bitrate.audio.average.toString() + "\r\n";
    //        info += "bitrate max: " + this.player.palm.bitrate.audio.maximum.toString();
    //    }
    //    Mojo.Log.info("<-- AudioPlayer.prototype.getStreamInfo");
    //    return info;
    //},
    //
    ////ConnectedToServer: function(event) {
    ////    Mojo.Log.info("--> AudioPlayer.prototype.ConnectedToServer");
    ////    //this.playList = newPlayList;
    ////    this.PlayerReady = true;
    ////    if (this.RequestedPlayBeforeReady === true) {
    ////        this.RequestedPlayBeforeReady = false;
    ////        this.play();
    ////    }
    ////    Mojo.Log.info("<-- AudioPlayer.prototype.ConnectedToServer");
    ////},
    //
    //
    //removeSong: function(index){
    //    if(index === this.currentPlayingTrack)
    //    {
    //        this.play_next(false);
    //    }
    //    
    //    
    //    var playlist = this.playList;        
    //    playlist.splice(index,1);
    //    
    //    for (var i = 0; i < playlist.length; i++) {
    //        playlist[i].index = i+1;
    //    }
    //    this.playList = playlist;
    //    this.playOrderList = this.createOrderList();
    //    
    //    if(index < this.currentPlayingTrack)
    //    {
    //        this.currentPlayingIndex--;
    //        this.currentPlayingTrack--;
    //    }
    //    
    //    if(this.shuffleOn===true)
    //    {
    //        this.toggleShuffleOn();
    //    }
    //    
    //    //this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
    //    
    //    
    //},
    //
    //reorder:function(event)
    //{
    //    var item = this.playList[event.fromIndex];
    //    if(event.fromIndex<event.toIndex) 
    //    {   //Dragging down list
    //        
    //        this.playList.splice(event.fromIndex,1);
    //        this.playList.splice(event.toIndex,0,item);
    //        if(event.fromIndex ===this.currentPlayingTrack)
    //        {
    //            this.currentPlayingIndex=event.toIndex;
    //            this.currentPlayingTrack=event.toIndex;
    //        }
    //        else if((event.fromIndex<this.currentPlayingTrack)&&(event.toIndex>=this.currentPlayingTrack))
    //        {
    //            this.currentPlayingIndex--;
    //            this.currentPlayingTrack--;
    //        }
    //        
    //    }
    //    else
    //    {   //Dragging up list
    //        this.playList.splice(event.fromIndex,1);
    //        this.playList.splice(event.toIndex,0,item);
    //        if(event.fromIndex ===this.currentPlayingTrack)
    //        {
    //            this.currentPlayingIndex=event.toIndex;
    //            this.currentPlayingTrack=event.toIndex;
    //        }
    //        else if((event.fromIndex>this.currentPlayingTrack)&&(event.toIndex<=this.currentPlayingTrack))
    //        {
    //            this.currentPlayingIndex++;
    //            this.currentPlayingTrack++;
    //        }
    //    }
    //    
    //    for (var i = 0; i < this.playList.length; i++) {
    //        this.playList[i].index = i+1;
    //    }
    //    this.playOrderList = this.createOrderList();
    //    if(this.shuffleOn===true)
    //    {
    //        this.toggleShuffleOn();
    //    }
    //    
    //    //this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
    //    //_updateBuffering();
    //    
    //},
    //
    //setCurrentTrack:function(currentIndex)
    //{
    //    this.currentPlayingIndex = currentIndex;
    //    this.currentPlayingTrack = currentIndex;
    //    if(this.shuffleOn===true)
    //    {
    //        this.toggleShuffleOn();
    //    }
    //},
    //
    //
    //newPlayList: function(newPlayList, _shuffleOn, _startIndex) {
    //    Mojo.Log.info("--> AudioPlayer.prototype.addPlayList");
    //    this.stop();
    //    this.hasPlayList = true;
    //    this.playList = [];
    //    for (var i = 0; i < newPlayList.length; i++) {
    //        
    //        this.playList[i] = newPlayList[i];
    //        this.playList[i].index = i+1;
    //    }
    //
    //    //this.markPlayListUnplayed();
    //    this.playOrderList = this.createOrderList();
    //    this.shuffleOn = _shuffleOn;
    //    if (_shuffleOn) {
    //        this.playOrderList.sort(this.randOrd);
    //        //this.playOrderList.sort(this.randOrd);
    //        this.currentPlayingIndex = 0;
    //        this.currentPlayingTrack = this.playOrderList[0];
    //    } else {
    //        this.currentPlayingTrack = _startIndex;
    //        this.currentPlayingIndex = _startIndex;
    //    }
    //    Mojo.Log.info("<-- AudioPlayer.prototype.addPlayList");
    //},
    //
    //enqueuePlayList: function(newPlayList, _shuffleOn) {
    //    if (this.playList) {
    //        //Combine lists
    //       
    //        
    //        offset = this.playList.length;
    //        for (var i = 0; i < newPlayList.length; i++) {
    //        
    //            this.playList[i+offset] = newPlayList[i].clone();
    //        }
    //        
    //       
    //        for (var i = 0; i < this.playList.length; i++) {
    //        
    //            this.playList[i].index = i+1;
    //        }
    //        
    //        this.playOrderList = this.createOrderList();
    //        
    //        if (_shuffleOn || this.shuffleOn === true) {
    //            this.toggleShuffleOn();
    //        }
    //
    //    }
    //},
    //
    //
    //
    ////**********************************************************************************************************************
    ////Code for shuffle
    ////**********************************************************************************************************************
    ////markPlayListUnplayed: function() {
    ////    var i = 0;
    ////    do {
    ////        this.playList[i].played = false;
    ////    } while (++ i < this . playList . length );
    ////},
    //
    //createOrderList: function() {
    //    //Inititialize an array to randomize;
    //    var newList = [];
    //    var i = 0;
    //    do {
    //        newList[i] = i;
    //    } while (++ i < this.playList.length );
    //    return newList;
    //},
    //
    //randOrd: function() {
    //    return (Math.round(Math.random()) - 0.5);
    //},
    //
    //printPlayOrderList: function() {
    //    Mojo.Log.info("printPlayOrderList: %j", this.playOrderList);
    //    Mojo.Log.info("currentPlayingTrack: " + this.currentPlayingTrack);
    //    Mojo.Log.info("currentPlayingIndex: " + this.currentPlayingIndex);
    //},
    //
    //toggleShuffleOff: function() {
    //    this.playOrderList = this.createOrderList();
    //    this.currentPlayingIndex = this.currentPlayingTrack;
    //    //this.printPlayOrderList();
    //    this.shuffleOn = false;
    //},
    //
    //toggleShuffleOn: function() {
    //    this.playOrderList.sort(this.randOrd);
    //    var i = this.playList.length;
    //    do {
    //        if (this.playOrderList[i] === this.currentPlayingTrack) {
    //            temp = this.playOrderList[0];
    //            this.playOrderList[0] = this.currentPlayingTrack;
    //            this.playOrderList[i] = temp;
    //            break;
    //        }
    //    } while (-- i );
    //    this.currentPlayingIndex = 0;
    //    //this.printPlayOrderList();
    //    this.shuffleOn = true;
    //},
    //
    ////**********************************************************************************************************************
    ////Code for repeat
    ////**********************************************************************************************************************
    //setRepeatMode: function(type) {
    //    this.repeatMode = type;
    //},
    //
    //getNextTrack: function() {
    //    if ((this.currentPlayingIndex + 1) < (this.playList.length)) {
    //        this.currentPlayingIndex++;
    //        return this.playOrderList[this.currentPlayingIndex];
    //    } else {
    //        return - 1;
    //    }
    //},
    //
    //getPrevTrack: function() {
    //    if ((this.currentPlayingIndex - 1) > -1) {
    //        this.currentPlayingIndex--;
    //        return this.playOrderList[this.currentPlayingIndex];
    //    } else {
    //        return - 1;
    //    }
    //},
    //
    ////**********************************************************************************************************************
    ////                        Playback Controls
    ////**********************************************************************************************************************
    //play: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.play");
    //    //if (this.PlayerReady === true) {
    //        this.internal_play();
    //    //} else {
    //    //    this.RequestedPlayBeforeReady = true;
    //    //}
    //    Mojo.Log.info("<-- AudioPlayer.prototype.play");
    //},
    //
    //
    //
    //stop: function() {
    //    this.NowPlayingStopPlaybackTimer();
    //    if (this.player.src) {
    //
    //        this.pause();
    //        this.Paused = null;
    //        this.player.src = null;
    //        this.playFinished = true;
    //    }
    //},
    //
    //pause: function() {
    //    this.NowPlayingStopPlaybackTimer();
    //    this.Paused = true;
    //    this.player.pause();
    //    
    //},
    //
    //playFinished: false,
    //play_finished: function() {
    //    
    //    this.currentPlayingIndex = 0;
    //    this.currentPlayingTrack = this.playOrderList[this.currentPlayingIndex];
    //    this.Paused = false;
    //    switch (this.repeatMode) {
    //    case RepeatModeType.no_repeat:
    //        this.hasPlayList = false;
    //        this.playFinished = true;
    //        this.stop();
    //        this.NowPlayingShowPlay();
    //        this.UpdateNowPlayingBuffering(0, 0);
    //        this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
    //        this.NowPlayingResetTime();
    //        this.TurnOffNowPlayingButton();
    //        break;
    //    case RepeatModeType.repeat_forever:
    //        this.internal_play();
    //        break;
    //    case RepeatModeType.repeat_once:
    //        this.repeatMode = RepeatModeType.no_repeat;
    //        this.NowPlayingSetRepeatMode();
    //        this.internal_play();
    //        break;
    //    }
    //},
    //
    //_seek:function(seekTime)
    //{
    //    try {
    //        this.player.currentTime = seekTime;
    //        if(this.Paused)
    //        {
    //            this.UpdateNowPlayingTime();
    //        }
    //    }
    //    catch(e) {
    //        Mojo.Log.error("Error setting currentTime: %j", e);
    //    }
    //},
    //
    //seek:function(seekTime)
    //{
    //    if(seekTime < this.player.duration)
    //    {
    //        if(seekTime >= 0)
    //        {
    //            this._seek(seekTime);
    //        }
    //        else
    //        {
    //            this._seek(0);
    //        }
    //    }
    //    else
    //    {
    //        this._seek(this.player.duration-1);
    //    }
    //},
    //
    //jump:function(seconds)
    //{
    //    this.seek(this.player.currentTime+seconds);
    //},
    //
    //seekPercentage:function(percent)
    //{
    //    var secs = this.player.currentTime;
    //    var duration = this.player.duration;
    //    if ((duration) && (duration !== 0)) {
    //        var secs = Math.round(percent * duration);
    //    }
    //
    //    this.seek(secs);
    //   
    //},
    //
    //
    //TurnOffNowPlayingButton: function() {
    //    var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
    //    var button = controller.get('now-playing-button');
    //    button.style.display = 'none';
    //},
    //
    //kill_stall_timer: function() {
    //    window.clearInterval(this.stallTimer);
    //    this.stallTimer = null;
    //    this.stalled = false;
    //},
    //
    //play_change_interval: null,
    //
    //kill_play_change_interval: function() {
    //    if (this.play_change_interval) {
    //        window.clearInterval(this.play_change_interval);
    //        this.play_change_interval = null;
    //    }
    //},
    //
    //
    //playTrack:function(track)
    //{
    //    if(track !== this.currentPlayingTrack ){
    //    
    //        this.Paused = false;
    //        this.stop();
    //        
    //        this.downloadPercentage = 0;
    //        this.timePercentage = 0;
    //        
    //        this.currentPlayingTrack = track;
    //        
    //        if(this.shuffleOn===true)
    //        {
    //            this.toggleShuffleOn();
    //        }
    //        else
    //        {
    //            this.currentPlayingIndex = track;
    //        }
    //        
    //        this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
    //        this.internal_play();
    //    }
    //},
    //
    //play_next: function(clicked) {
    //    Mojo.Log.info("--> AudioPlayer.prototype.play_next");
    //    //this.printPlayOrderList();
    //    //this.playList[this.currentPlayingTrack].played = true;
    //    this.prevPlayingTrack = this.currentPlayingTrack;
    //    this.currentPlayingTrack = this.getNextTrack();
    //    if (this.currentPlayingTrack > -1) {
    //        this.Paused = false;
    //        this.stop();
    //        
    //        this.downloadPercentage = 0;
    //        this.timePercentage = 0;
    //        
    //        this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
    //        //Add a little bit of delay after a next request to allow for rapid song switching.
    //        if (clicked) {
    //            this.kill_play_change_interval();
    //            this.play_change_interval = window.setInterval(this.delayed_play.bind(this), 500);
    //        } else {
    //            this.internal_play();
    //        }
    //    } else {
    //        if ((!clicked) || (this.repeatMode !== RepeatModeType.no_repeat)) {
    //            this.play_finished();
    //        } else { //last track
    //            this.currentPlayingTrack = this.playOrderList[this.currentPlayingIndex];
    //        }
    //    }
    //    Mojo.Log.info("<-- AudioPlayer.prototype.play_next");
    //},
    //
    //play_prev: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.play_prev");
    //    
    //    this.currentPlayingTrack = this.getPrevTrack();
    //    if (this.currentPlayingTrack > -1) {
    //        this.Paused = false;
    //        this.stop();
    //        
    //        this.downloadPercentage = 0;
    //        this.timePercentage = 0;
    //        
    //        this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
    //        this.kill_play_change_interval();
    //        this.play_change_interval = window.setInterval(this.delayed_play.bind(this), 500);
    //    } else { //first track
    //        this.currentPlayingTrack = this.playOrderList[this.currentPlayingIndex];
    //    }
    //    Mojo.Log.info("<-- AudioPlayer.prototype.play_prev");
    //},
    //
    //delayed_play: function() {
    //    this.Paused = false;
    //    this.internal_play();
    //},
    //
    //play_previous: function() {},
    //
    //internal_play: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.internal_play");
    //    
    //    this.kill_play_change_interval();
    //    if ((this.Paused) && (!this.playFinished)) {
    //        this.player.play();
    //    } else {
    //        this.playFinished = false;
    //        Mojo.Log.info("Starting play of " + this.playList[this.currentPlayingTrack].artist + " - " + this.playList[this.currentPlayingTrack].album + " - " + this.playList[this.currentPlayingTrack].track + " - " + this.playList[this.currentPlayingTrack].title);
    //        Mojo.Log.info("URL play of " + this.playList[this.currentPlayingTrack].url);
    //        this.ClearNowPlayingTime();
    //        this.UpdateNowPlayingBuffering(0, 0);
    //        this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
    //        this.UpdateNowPlayingShowSpinner(true);
    //        this.player.src = this.playList[this.currentPlayingTrack].url;
    //        this.player.load();
    //    }
    //    this.Paused = false;
    //    //Mojo.Log.info("Audio() URL play of " + 
    //    Mojo.Log.info("<-- AudioPlayer.prototype.internal_play");
    //},
    //

    //
    //SetStalled:function(stalled)
    //{
    //    if( (stalled === true) && (this.StallRecovery === true) ) 
    //    {
    //        this.kill_stall_timer();
    //        this.stallTimer = window.setInterval(this.internal_play.bind(this), STALL_RETRY_TIME);
    //    }
    //    
    //    if(this.isFullyBuffered() === false){
    //        stalled = false;
    //    }
    //    
    //    this.UpdateNowPlayingShowSpinner(stalled);
    //    
    //},
    //
    //
    //handleAudioEvents: function(event) {
    //    Mojo.Log.info("------> AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
    //
    //    event.stop();
    //    event.stopPropagation();
    //
    //    if (this.stallTimer && event.type !== "stalled") {
    //        this.kill_stall_timer();
    //    }
    //
    //    this.NowPlayingStreamDebug(event.type);
    //    
    //
    //    switch (event.type) {
    //    case "canplay":
    //        this.UpdateNowPlayingShowSpinner(false);
    //        if(this.startPlayback===true) {
    //            this.player.play();
    //        }
    //        else
    //        {
    //            this.Paused = true;
    //        }
    //        break;
    //    case "stalled":
    //        if(!this.stallTimer)
    //        {
    //            this.SetStalled(true);
    //        }
    //        break;
    //    case "durationchange":
    //        this.UpdateNowPlayingTime();
    //        break;
    //    case "timeupdate":
    //        this.UpdateNowPlayingTime();
    //        break;
    //    case "progress":
    //        this.SetStalled(false);
    //        this._updateBuffering();
    //        break;
    //    case "load":
    //        this.SetStalled(false);
    //        this._bufferingFinished();
    //        break;
    //    case "play":
    //        this.Paused = false;
    //        this.NowPlayingStartPlaybackTimer();
    //        this.NowPlayingShowPause();
    //        this.kill_stall_timer();
    //        break;
    //    case "pause":
    //        this.Paused = true;
    //        this.NowPlayingShowPlay();
    //        break;
    //    case "abort":
    //        this.ClearNowPlayingTime();
    //        break;
    //    case "x-palm-disconnect":
    //        this.NowPlayingDisplayError("Palm Audio Service failed");
    //        break;
    //    case "error":
    //
    //        var errorString = this.streamErrorCodeLookup(event.error);
    //        this.NowPlayingDisplayError(errorString);
    //        break;
    //    case "ended":
    //        
    //        this.play_next(false);
    //        this.NowPlayingStopPlaybackTimer();
    //        break;
    //    case "x-palm-connect":
    //        //this.PlayerReady = true;
    //        //break;
    //    case "loadstart":
    //    case "canplaythrough":
    //    case "seeked":
    //    case "seeking":
    //    case "waiting":
    //    case "emptied":
    //        break;
    //    default:
    //        this.streamingError("Event:" + event.type);
    //        break;
    //
    //    }
    //    Mojo.Log.info("<------ AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
    //},
    //
    ////******************************************************************************************************************
    //// Now Playing updaters
    //UpdateNowPlayingTime: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingTime");
    //    if (this.NowPlaying) {
    //        var currentTime = 0;
    //        if (this.player.currentTime) {
    //            currentTime = this.player.currentTime;
    //        }
    //        var duration = 0;
    //        if (this.player.duration) {
    //            duration = this.player.duration;
    //        }
    //        if (duration != "Infinity") {
    //            
    //            this.timePercentage = 0;
    //            if (duration === 0) {
    //                duration = this.playList[this.currentPlayingTrack].time;
    //            }
    //            this.timePercentage = (currentTime / duration) * 100;
    //            
    //            this.NowPlaying.updateTime(currentTime, duration, this.timePercentage);
    //        }
    //        else
    //        {
    //            this.timePercentage = 0;
    //        }
    //    }
    //    Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingTime");
    //},
    //
    //
    //ClearNowPlayingTime: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.ClearNowPlayingTime");
    //    if (this.NowPlaying) {
    //        var trackLength = this.isValidTrack(this.currentPlayingTrack) ? this.playList[this.currentPlayingTrack].time : 0;
    //        this.NowPlaying.updateTime(0, trackLength, 0);
    //        this.timePercentage = 0;
    //    }
    //    Mojo.Log.info("<-- AudioPlayer.prototype.ClearNowPlayingTime");
    //},
    //
    UpdateNowPlayingBuffering: function(start, end) {
        this.downloadPercentage = Math.floor( end*100);
        //Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingBuffering loaded: " + loaded + " total: " + total);
        if (this.NowPlaying) {
            
            this.NowPlaying.updateBuffering(start, end);
        }
        //Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingBuffering");
    },
    
    
    
    //
    //UpdateNowPlayingShowSpinner: function(_spinnerOn) {
    //    if (this.NowPlaying) {
    //        if (_spinnerOn === true) {
    //            this.NowPlaying.showSpinner();
    //        } else if (_spinnerOn === false) {
    //            this.NowPlaying.hideSpinner();
    //        } else {}
    //    }
    //},
    //
    //NowPlayingShowPause: function() {
    //    if (this.NowPlaying) {
    //        this.NowPlaying.hideSpinner();
    //        this.NowPlaying.showPauseButton();
    //    }
    //},
    //
    //NowPlayingShowPlay: function() {
    //    if (this.NowPlaying) {
    //        this.NowPlaying.hideSpinner();
    //        this.NowPlaying.showPlayButton();
    //    }
    //},
    //
    //NowPlayingStreamDebug: function(eventText) {
    //    if (this.NowPlaying && this.debug) {
    //        this.NowPlaying.streamDebug(eventText);
    //    }
    //},
    //
    //NowPlayingStartPlaybackTimer: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStartPlaybackTimer");
    //    if (this.NowPlaying && !this.timeInterval) {
    //        this.timeInterval = this.NowPlaying.controller.window.setInterval(this.UpdateNowPlayingTime.bind(this), 450);
    //    } else {
    //        Mojo.Log.info("***********************************************************");
    //    }
    //    Mojo.Log.info("<-- AudioPlayer.prototype.NowPlayingStartPlaybackTimer");
    //},
    //
    //NowPlayingStopPlaybackTimer: function() {
    //    Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer");
    //    if ((this.NowPlaying) && (this.timeInterval)) {
    //        this.NowPlaying.controller.window.clearInterval(this.timeInterval);
    //        this.timeInterval = null;
    //    }
    //    Mojo.Log.info("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer");
    //},
    //
    //NowPlayingUpdateSongInfo: function(index) {
    //    if (this.NowPlaying) {
    //        this.NowPlaying.NowPlayingDisplaySongInfo(this.playList, index);
    //    }
    //},
    //

    //
    //NowPlayingResetTime: function() {
    //    if (this.NowPlaying) {
    //        this.NowPlaying.updateTime(0, 0, 0);
    //        this.timePercentage =0;
    //    }
    //},
    //
    //isValidTrack:function(index)
    //{
    //    if((this.currentPlayingTrack>=0) && (this.currentPlayingTrack<this.playList.length))
    //    {
    //        return true;
    //    }
    //    return false;
    //},
    //
    //NowPlayingSetRepeatMode: function() {
    //    if (this.NowPlaying) {
    //        this.NowPlaying.setRepeatMode(this.repeatMode);
    //    }
    //},
    //
    //_bufferingFinished: function()
    //{
    //        var startPercentage = (this.player.buffered.start(0) / this.player.duration);
    //        var endPercentage = 1;
    //        this.UpdateNowPlayingBuffering(startPercentage, endPercentage);
    //        if (this.debug) {
    //            var percentage = (Math.round(endPercentage * 10000) / 100);
    //            this.NowPlayingStreamDebug("Download Complete");
    //        }  
    //    
    //},
    //
    //
    //isFullyBuffered:function()
    //{
    //    var endPercentage = (this.player.buffered.end(0) / this.player.duration);
    //    return endPercentage === 100? true : false ;
    //},
    //
    //
    bufferingFinished: function(audioObj)
    {
            audioObj.fullyBuffered = true;
            
            var startPercentage = (this.player.buffered.start(0) / this.player.duration);
            var endPercentage = 1;
            
            audioObj.amtBuffered = endPercentage;
            
            this.UIPrintBuffered(startPercentage, endPercentage, audioObj.song.index-1, audioObj.hasAmpacheStreamEvents);
            if (this.debug) {
                var percentage = (Math.round(endPercentage * 10000) / 100);
                //this.NowPlayingStreamDebug("Download Complete");
            }  
        
    },
    
    
    UIStartPlaybackTimer: function() {
        if (this.UIHandler && !this.timeInterval) {
            this.timeInterval = this.UIHandler.controller.window.setInterval(this.UIUpdatePlaybackTime.bind(this), 1000);
        }
    },
    
    UIStopPlaybackTimer: function() {
        if ((this.UIHandler) && (this.timeInterval)) {
            this.UIHandler.controller.window.clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    },
    
    UIUpdatePlaybackTime: function() {
        
        if (this.UIHandler) {
            var currentTime = 0;
            if (this.player.currentTime) {
                currentTime = this.player.currentTime;
            }
            var duration = 0;
            if (this.player.duration) {
                duration = this.player.duration;
            }
            if (duration != "Infinity") {
                
                this.timePercentage = 0;
                if (duration === 0) {
                    duration = this.player.song.time;
                }
                this.timePercentage = (currentTime / duration) * 100;
                
                this.UIHandler.updateTime(currentTime, duration, this.timePercentage, this.player.song.index-1);
            }
            else
            {
                this.timePercentage = 0;
            }
        }
    },
    
    
    UIPrintBuffered: function(start, end, index, primary) {
        this.downloadPercentage = Math.floor( end*100);
        //Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingBuffering loaded: " + loaded + " total: " + total);
        if (this.UIHandler) {
            
            this.UIHandler.updateBuffering(start, end, index, primary);
        }
        //Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingBuffering");
    },
    
    updateBuffering: function(audioObj) {
        //Mojo.Log.info("--> AudioPlayer.prototype._updateBuffering")
        if (audioObj.buffered && audioObj.buffered.length > 0) {
            var startPercentage = (audioObj.buffered.start(0) / audioObj.duration);
            var endPercentage = (audioObj.buffered.end(0) / audioObj.duration);
            this.UIPrintBuffered(startPercentage, endPercentage, audioObj.song.index-1, audioObj.hasAmpacheStreamEvents);
            
            audioObj.amtBuffered = endPercentage;
            //if (this.debug) {
            //    var percentage = (Math.round(endPercentage * 10000) / 100);
            //    this.NowPlayingStreamDebug("Downloading " + percentage + "%");
            //}
        }
        //Mojo.Log.info("<-- AudioPlayer.prototype._updateBuffering");
    },
    
    UIUpdateSongInfo: function(song) {
        if (this.UIHandler) {
            this.UIHandler.DisplaySongInfo(song, song.index-1);
        }
    },
    
    UIInvalidateSong:function(song){
     if (this.UIHandler) {
            this.UIHandler.InvalidateSong(song, song.index - 1);
        }
    },
    
    
    //
    //
    //
    //
    setNowPlaying: function(UIHandler) {
        this.UIHandler = UIHandler;
        
        
        //this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
        //this._updateBuffering();
        //this.UpdateNowPlayingTime();
        //
        //if (this.Paused === false) {
        //    this.NowPlayingStartPlaybackTimer();
        //    this.NowPlayingShowPause();
        //} else {
        //    this.NowPlayingShowPlay();
        //}
    },
    //
    //clearNowPlaying: function() {
    //    this.NowPlayingStopPlaybackTimer();
    //    this.NowPlaying = null;
    //}
});
