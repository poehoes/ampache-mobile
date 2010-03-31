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

var AudioType = {
    "pool": 0,
    "player": 1,
    "buffer": 2
};

AudioPlayer = Class.create({
    
    playList:null,

    hasPlayList:false,
    
    player:null,
    audioBuffers:null,
    bufferPool:null,
    
    //buffer:null,

    streamingEvents : ["play", "pause", "abort", "error", "ended", "canplay",
                      "canplaythrough", "emptied", "load", "loadstart", "seeked",
                      "seeking", "waiting", "progress", "durationchange", "x-palm-disconnect"],

    //bufferingEvents : ["abort", "error", "ended", "emptied", "load", "loadstart",
    //                   "waiting", "progress", "durationchange", "x-palm-disconnect"],
    

    initialize: function () {
        
        this.blankSong = new SongModel(0, "", "", 0, "", 0, 0, 0, "", 0, "", "");
        this.blankSong.index = 0;
        
        //Create 2 audio objects to toggle between streaming and buffering
        //this.audioBuffers = [];
        this.audioBuffers = new Array();
        this.bufferPool = new Array();
        var audioObj = null;
        for(var i =0; i < 4; i++) {
            audioObj = this.createAudioObj(i);
            audioObj.ampacheType = AudioType.pool;
            this.addStreamingListeners(audioObj);
            this.bufferPool.push(audioObj);
        }
        //this.player = this.audioBuffers[this.audioBuffers.length-1];
        
    },

    createAudioObj: function (index) {
        
        var audioObj = new Audio();
        audioObj.hasAmpacheStreamEvents = false;
        audioObj.hasAmpacheBufferEvents = false;
        audioObj.fullyBuffered = false;
        //audioObj.startedBuffering = false;
        
        //audioObj.amtBuffered = null;
        
        audioObj.name = "Buffer " + index;
        audioObj.song = this.blankSong;
        this.setAudioToBuffer(audioObj);
        
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
    
    findActiveBuffer:function(){
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            //if((this.audioBuffers[i].fullyBuffered === false) && (this.audioBuffers[i].startedBuffering===true))
            if(this.audioBuffers[i].networkState===this.audioBuffers[i].NETWORK_LOADING)
            {
                return this.audioBuffers[i];
            }
        }
        return null;
    },

    getActiveBuffer:function(song)
    {
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            //if((this.audioBuffers[i].isSong(song) === true) && (this.audioBuffers[i].startedBuffering===true))
            //if((this.audioBuffers[i].isSong(song) === true) && (this.audioBuffers[i].networkState===this.audioBuffers[i].NETWORK_LOADING))
            if(this.audioBuffers[i].isSong(song) === true)
            {
                return this.audioBuffers[i];
            }
            
        }
        return null;
    },
    
    popThisBuffer:function(buffer)
    {
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            if(this.audioBuffers[i] === buffer)
            {
                this.audioBuffers.splice(i,1);
                this.audioBuffers.sort(this.sortBuffers);
                return buffer;
            }
        }
        
        return null;
    },
    
    putThisBufferIntoPool:function(buffer)
    {
        
        buffer.ampacheType = AudioType.pool;
        buffer.src = "../media/empty.mp3";
        buffer.load();
        buffer.autoplay = false;
        buffer.fullyBuffered = false;
        buffer.song.amtBuffered = 0;
        this.UIInvalidateSong(buffer.song);
        buffer.song = this.blankSong;        
        this.bufferPool.push(buffer);
        
    },

    loadSongIntoPlayer:function(player, song)
    {
        player.ampacheType = AudioType.player;
        //player.pause();
        //player.empty();
        
        player.song.amtBuffered = 0;
        this.UIInvalidateSong(player.song);
        player.src = song.url;
        player.song = song;
        player.fullyBuffered = false;
        //player.startedBuffering=false;
        player.song.amtBuffered = 0;
        this.UIInvalidateSong(player.song);
        player.load();
        player.audioplay = true;
        this.UIShowSpinner(true);
        return player;
    },


    moveToPlayer:function(song) {
        
        var player = null;
        //var playerIndex =0;
        var reverse = false;
        
        
        
        
        
        //Capture Old buffers
        //var oldTracks = []
        //for(var i=0; i<this.audioBuffers.length; i++) 
        //{
        //    oldTracks[i] = this.audioBuffers[i].song;
        //}
        
        //Cleanup old player
        if(this.player)
        {  
            var direction = song.index - this.player.song.index;
            if(direction<0)
            {
                reverse = true;
            }
            this.setAudioToBuffer(this.player);
        }
    
        
        //first check if we've already buffered the song
        player = this.getActiveBuffer(song);
        
        if(player === null)
        {   //Song no currently in a buffer
            
            //Check if there is another active buffer we can use
            player = this.findActiveBuffer();
        
            //If no active buffer, next check the buffer pool for a free buffer
            if( (player===null) && (this.bufferPool.length!== 0) )
            {
                player = this.bufferPool.pop();
                this.audioBuffers.push(player);
            }
        
            //Player Requires load
            if(player !== null)
            {
                 player = this.loadSongIntoPlayer(player,song);
            }
        }
        
        
        //at this point no active, pooled or buffered
        if(player===null)
        {
            this.audioBuffers.sort(this.sortBuffers);
            if(reverse === true)
            {
                this.audioBuffers.reverse();
            }
            player = this.audioBuffers.shift();
            this.audioBuffers.push(player);  
            player = this.loadSongIntoPlayer(player,song);
        }
        
        this.audioBuffers.sort(this.sortBuffers);
        this.player = player;
        this.setAudioToPlayer(this.player);
        this.UIInvalidateSong(this.player.song);
        //this.UIInvalidateSong(player.song);
        
        //redraw UI to reflect changes
        //for(var i=0; i<oldTracks.length; i++) 
        //{
        //    this.UIInvalidateSong(oldTracks[i]);            
        //}
        //redraw UI to reflect changes
        //for(var i=0; i<this.audioBuffers.length; i++) 
        //{
        //    this.UIInvalidateSong(this.audioBuffers[i]);   
        //}
        
        this.UIUpdateSongInfo(this.player.song);
        
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
            buffer = this.getActiveBuffer(song);
            
          
            
                if(buffer !== null)
                {
                    buffered = true;
                    
                    //Check if we have enough data to seek
                    if(buffer.readyState>buffer.HAVE_NOTHING)
                    {
                        buffer.currentTime = 0;
                    }
                    else
                    {   //Attempt to reload the buffer if we have no data
                        buffer.fullyBuffered = false;
                        //buffer.startedBuffering = false;
                        buffer.song.amtBuffered = 0;
                        this.UISetBufferWait(song, true);
                        buffer.load();
                        buffer.autoplay = false;
                    }
                
            }
            

            
            if(buffered === false)
            {
                if(this.bufferPool.length!== 0 )
                {
                    buffer = this.bufferPool.pop();
                    this.audioBuffers.push(buffer);
                    this.setAudioToBuffer(buffer);
                    buffer.song.amtBuffered = 0;
                    this.UIInvalidateSong(buffer.song);
                    buffer.src = song.url;
                    buffer.song = song;
                    buffer.fullyBuffered = false;
                    //buffer.startedBuffering = false;
                    buffer.song.amtBuffered = 0;
                    //this.UIInvalidateSong(buffer.song);
                    this.UISetBufferWait(song, true);
                    buffer.load();
                    buffer.autoplay = false;
                    buffered = true;
                    this.audioBuffers.sort(this.sortBuffers);
                }
                else
                {
                    if(this.audioBuffers[0] != this.player)
                    {  //If the top buffer is not the the player take it and use it to buffer up the next song
                            buffer = this.audioBuffers.shift();
                        }
                        else
                        {
                            var bottomSong = this.playList.peekSongAheadOffset(this.player.song, this.audioBuffers.length-1);   
                            if(song.index<=bottomSong.index)
                            {
                                buffer = this.audioBuffers.pop();
                            }
                        }
                        
                        if(buffer!==null)
                        {   //if this is set we have decided that we are going to buffer the next song
                            if(buffer.song)
                            {
                                this.UIInvalidateSong(buffer.song);
                            }
                        
                                //buffer.pause();
                                //
                                buffer.song.amtBuffered = 0;
                                this.UIInvalidateSong(buffer.song);
                                buffer.src = song.url;
                                buffer.song = song;
                                buffer.fullyBuffered = false;
                                //buffer.startedBuffering = false;
                                buffer.song.amtBuffered = 0;
                                //this.UIInvalidateSong(buffer.song);
                                this.UISetBufferWait(song, true);
                                buffer.load();
                                buffer.autoplay = false;
                            
                                this.audioBuffers.push(buffer);
                                this.audioBuffers.sort(this.sortBuffers);
                            
                        }
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
    

    recoverFromSleep:function()
    {
        var onString ="";
        //var emptied = (this.audioBuffers.length!==0);
        for(var i=0; i<this.audioBuffers.length; i++) 
        {
            onString+="<BR>Buffer: " + i;
            onString+="<BR>readyState:" + this.audioBuffers[i].readyState;
            onString+="<BR>networkState:"+ this.audioBuffers[i].networkState;
            onString+="<BR>Connected:"+ this.audioBuffers[i].mojo.connected
            
            //if(this.audioBuffers[i].readyState !== this.audioBuffers[i].HAVE_NOTHING)
            //{
            //    //emptied = false;
            //}
        }
        return onString;
        
        
        //if(emptied === true)
        //{
        //     //Capture Old buffers
        //    var oldTracks = []
        //    for(var i=0; i<this.audioBuffers.length; i++) 
        //    {
        //        oldTracks[i] = this.audioBuffers[i].song;
        //    }
        //    this.stop();
        //     //redraw UI to reflect changes
        //    for(var i=0; i<oldTracks.length; i++) 
        //    {
        //        this.UIInvalidateSong(oldTracks[i]);            
        //    }
        //    this.moveToPlayer(this.playList.getCurrentSong());
        //}
        //return emptied;
    },
    
    
    
    addStreamingListeners:function(audioObj)
    {
        Mojo.Log.info(" streaming events: " +  audioObj.name);
        
        eventHandler = this.handleAudioEvents.bindAsEventListener(this);    
        for(var i=0; i<this.streamingEvents.length; i++)
        {
            
            audioObj.addEventListener(this.streamingEvents[i], eventHandler);
        }
        audioObj.hasAmpacheStreamEvents = true;
        
    },
    
    setAudioToPlayer:function(audioObj){
        audioObj.ampacheType = AudioType.player;
        audioObj.autoplay = true;
        audioObj.play();
    },
    
    setAudioToBuffer:function(audioObj){
        audioObj.ampacheType = AudioType.buffer;
        audioObj.autoplay = false;
        if(audioObj.readyState > audioObj.HAVE_NOTHING)
        {
            this.player.currentTime = 0;
           
        }      
        //audioObj.pause();
    },
    
    /***********************************************************************//*
    * Playlist Functions
    *
    ***************************************************************************/
    newPlayList: function(newPlayList, _shuffleOn, _startIndex) {
        this.playList = new PlayList(newPlayList, _shuffleOn, 0, _startIndex);
        //Setup Player for new playlist
        this.moveToPlayer(this.playList.getCurrentSong());
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
        this.UIStartPlaybackTimer();
    },
    
    stop:function(){
        var buffer;
        while(this.audioBuffers.length!== 0) 
        {
            buffer = this.audioBuffers.pop();
            this.putThisBufferIntoPool(buffer);            
        }
    },
    
    pause:function(){
        this.player.pause();
        this.UIStopPlaybackTimer();
    },
    
    next:function(clicked)
    {
        this.ampachePaused = this.player.paused;
        
        
        //this.UISetPointer(this.playList.getCurrentSong(), false);
        if(this.playList.moveCurrentToNext() === true)
        {
            
            //this.UISetPointer(this.playList.getCurrentSong(), true);
            this.pause();
            this.timePercentage=0;
            this.UIUpdateSongInfo(this.playList.getCurrentSong());
            
            if (clicked) {
                this.kill_play_change_interval();
                this.play_change_interval = window.setInterval(this.do_play.bind(this), 200);
            }
            else
            {
                this.do_play();
            }
            
           
            
        }
        //else
        //{
            //this.UISetPointer(this.playList.getCurrentSong(), true);
        //}
    },
    
    
    
    
    previous:function(clicked)
    {
        this.ampachePaused = this.player.paused;
        
        //this.UISetPointer(this.playList.getCurrentSong(), false);
        
        if(this.playList.moveCurrentToPrevious() === true)
        {
            this.pause();
            this.timePercentage=0;
            this.UIUpdateSongInfo(this.playList.getCurrentSong());
            //this.UISetPointer(this.playList.getCurrentSong(), true);
            ////Stop Currently playing song
            //this.pause();
            //var nextSong = this.playList.getCurrentSong();
            //this.moveToPlayer(nextSong, true);
            //this.play();
            ////this.seek(0);
            //if(this.player.fullyBuffered === false)
            //{
            //    //this.bufferNextSong(nextSong);
            //}
            if (clicked) {
                this.kill_play_change_interval();
                this.play_change_interval = window.setInterval(this.do_play.bind(this), 200);
            }
            else
            {
                this.do_play();
            }
            
        }
        //else
        //{
        //    this.UISetPointer(this.playList.getCurrentSong(), true);
        //}
    },
    
    do_play:function()
    {
        this.kill_play_change_interval();
        this.timePercentage =0;
        //this.removeStreamingListeners(this.player);
        //this.player.ampacheType = AudioType.buffer;
        //this.player.autoplay = false;
            
            //Stop Currently playing song
            //this.pause();
            //this.seek(0);
            
            var nextSong = this.playList.getCurrentSong();
            this.moveToPlayer(nextSong);
            //if(this.ampachePaused === false)
            //{
            //    this.play();
            //}
            //this.seek(0);
            
            
            //If the current song is already fully buffered then buffer the next
            if(this.player.fullyBuffered === true)
            {
                this.bufferNextSong(nextSong);
            }
    },
    
    play_change_interval: null,

    kill_play_change_interval: function() {
        if (this.play_change_interval) {
            window.clearInterval(this.play_change_interval);
            this.play_change_interval = null;
        }
    },
    
    playTrack:function(index)
    {
        //this.UISetPointer(this.playList.getCurrentSong(), false);
        if(this.playList.moveToSong(index) ===true)
        {
            this.pause();
            this.timePercentage=0;
            this.UIUpdateSongInfo(this.playList.getCurrentSong());
            this.do_play();
        }
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
        if(this.player.readyState > this.player.HAVE_NOTHING)
        {
            this.player.currentTime = seekTime;
            if(this.player.paused)
            {
                this.UIUpdatePlaybackTime();
            }
        }        
    },
    
    logAudioEvent:function(source, event)
    {
        Mojo.Log.info(source +" AudioEvent: "+ event.type);
        Mojo.Log.info("Player " + event.currentTarget.name);
        Mojo.Log.info("Song: "+ event.currentTarget.song.title);
    },
    
    
    handleAudioEvents: function(event) {
        if(event.currentTarget.ampacheType === AudioType.buffer)
        {
            this.handleBufferEvents(event);
        }
        else if(event.currentTarget.ampacheType === AudioType.player)
        {
            this.handlePlayerEvents(event);
        }
        else
        {
            _this.UIPrintDebug(event, false);
        }
    },
    
    
    
    handleBufferEvents: function(event) {
        //Mojo.Log.info("------> AudioPlayer.prototype.handleBufferEvents AudioEvent:", event.type);
        var _this = this;
        
        //_this.logAudioEvent("handleBufferEvents", event);
    
        event.stop();
        event.stopPropagation();
        
        switch(event.type)
        {
            case "error":
                //Received error buffer is no longer valid throw it away and resort the available buffer stack
                
                var errorBuf = popThisBuffer(event.currentTarget)
                if(errorBuf !== null)
                {
                    _this.putThisBufferIntoPool(event.currentTarget);
                }

                
                break;
            case "loadstart":
                //event.currentTarget.startedBuffering = true;
                break;
            
            case "load":
                _this.bufferingFinished(event.currentTarget);
                _this.bufferNextSong(event.currentTarget.song);
                break;
            case "progress":
                _this.UISetBufferWait(event.currentTarget.song, false);
                //event.currentTarget.startedBuffering = true;
                _this.updateBuffering(event.currentTarget)
                break;
            
            case "emptied":
                event.currentTarget.fulllyBuffered = false;
                //event.currentTarget.startedBuffering = false;
                _this.updateBuffering(event.currentTarget);
                break;
             case "error":
                var errorString = this.streamErrorCodeLookup(event);
                this.UIDisplayError(errorString, event.currentTarget.song);
                break;

            
        }
        _this.UIPrintDebug(event, false);
        //Mojo.Log.info("<------ AudioPlayer.prototype.handleBufferEvents AudioEvent:", event.type);
    },
    
    
     handlePlayerEvents: function(event) {
        //Mojo.Log.info("------> AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
        var _this = this;
        _this.logAudioEvent("handleAudioEvents", event);
    
        event.stop();
        event.stopPropagation();
    
        switch(event.type)
        {
            
            case "load":
                _this.UIShowSpinner(false);
                _this.bufferingFinished(event.currentTarget);
                _this.bufferNextSong(_this.player.song);
                break;
            case "loadstart":
                _this.UIShowSpinner(true);
                //event.currentTarget.startedBuffering = true;
                break;
            case "progress":
                _this.UIShowSpinner(false);
                //event.currentTarget.startedBuffering = true;
                _this.updateBuffering(event.currentTarget);
                break;
            case "ended":
                _this.UIShowSpinner(false);
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
                if(event.currentTarget.song.amtBuffered!== 0)
                {
                    _this.UIShowPause();
                }
                _this.UIUpdatePlaybackTime();
                _this.UIStartPlaybackTimer();
                break;
            case "pause":
                _this.UIShowPlay();
                _this.UIStopPlaybackTimer();
                break;
            case "waiting":
            case "stalled":
                _this.UIShowSpinner(true);
                break;
            case "emptied":
                event.currentTarget.fulllyBuffered = false;
                //event.currentTarget.startedBuffering = false;
                _this.updateBuffering(event.currentTarget);
                break;
            case "error":
                var errorString = _this.streamErrorCodeLookup(event);
                _this.UIDisplayError(errorString, event.currentTarget.song);
                break;
        }
        _this.UIPrintDebug(event, true);
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
        //this.downloadPercentage = Math.floor( end*100);
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
    
    MEDIA_ERR_SRC_NOT_SUPPORTED: 4,

    streamErrorCodeLookup: function(event) {
        
        //refrence: http://dev.w3.org/html5/spc/Overview.html#dom-mediaerror-media_err_network
        // http://developer.palm.com/index.php?option=com_content&view=article&id=1539
        var error = event.currentTarget.error;
        var errorString = "Unknown Error";
        
        if(error.code === error.MEDIA_ERR_ABORTED){
            errorString = "The audio stream was aborted by WebOS. Most often this happens when you do not have a fast enough connection to support an audio stream.";
            errorString += this.moreErrorInfo("MEDIA_ERR_ABORTED", event);
        }
        else if(error.code === error.MEDIA_ERR_NETWORK){
            errorString = "A network error has occured. The network cannot support an audio stream at this time.";
            errorString += this.moreErrorInfo("MEDIA_ERR_NETWORK", event);
        }
        else if(error.code === error.MEDIA_ERR_DECODE){
            errorString = "An error has occurred while attempting to play the file. The file is either corrupt or an unsupported format (ex: m4p, ogg, flac).  Transcoding may be required to play this file.";
            errorString += this.moreErrorInfo("MEDIA_ERR_DECODE", event);
        }
        else if(error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED){
    
            errorString = "The file is not suitable for streaming";
            errorString += this.moreErrorInfo("MEDIA_ERR_SRC_NOT_SUPPORTED", event);
        }
        else{
            errorString = "ErrorCode: " + errorCode;
            errorString += this.moreErrorInfo("", event);
        }    
        
        return errorString;
    },

    moreErrorInfo: function(type, event) {
        var player = event.currentTarget;
        var moreInfo = "<br><br><font style='{font-size:smaller;}'><b>Debug Info:</b>";
        if(type)
        {
            moreInfo += "<br>Error Type: " + type;
        }
        
        
        if (player.mojo) {
            var errorClass = player.mojo.getErrorClass();
            var errorCode = player.mojo.getErrorCode();
            //var errorValue = player.mojo.getErrorValue();
        
            //var errorDetails = player.mojo.getErrorValue;
            //Mojo.Log.info("Error Details: %j", errorDetails);
            //var errorClassString = "Unknown: (0x" + errorClass.toString(16).toUpperCase() + ")";
            var errorCodeString = "Unknown: (0x" + errorCode.toString(16).toUpperCase() + ")";
            //switch (errorClass) {
            //case 0x50501:
            //    errorClassString = "DecodeError(0x50501)";
            //    break;
            //case 0x50502:
            //    errorClassString = "NetworkError(0x50502)";
            //    break;
            //}
            switch (Number(errorCode)) {
            case 1:
                errorCodeString = "DecodeErrorFileNotFound(1)";
                break;
            case 2:
                errorCodeString = "DecodeErrorBadParam(2)";
                break;
            case 3:
                errorCodeString = "DecodeErrorPipeline(3)";
                break;
            case 4:
                errorCodeString = "DecodeErrorUnsupported(4)";
                break;
            case 5:
                errorCodeString = "DecodeErrorNoMemory(5)";
                break;
            case 6:
                errorCodeString = "NetworkErrorHttp(6)";
                break;
            case 7:
                errorCodeString = "NetworkErrorRtsp(7)";
                break;
            case 8:
                errorCodeString = "NetworkErrorMobi(8)";
                break;
            case 9:
                errorCodeString = "NetworkErrorOther(9)";
                break;
            case 12:
                errorCodeString = "NetworkErrorPowerDown(12)";
                break;
            }
            //moreInfo += "<br>Class: " + errorClassString;
            //moreInfo += "<br>Code: " + errorCodeString;
            //moreInfo += "<br>Value: 0x" + errorValue;//.toString(16).toUpperCase();
        }
        moreInfo += "<br>Mime: " + player.song.mime;
        moreInfo += "<br>Song Link: <a href=" + player.song.url + ">Stream Link</a></font>";
        return moreInfo;
    },
    
    UIDisplayError: function(message, song) {

        this.errorSong = song;
        this.streamingError(message, null);
        
    },

    onStreamingErrorDismiss: function(value) {
        Mojo.Log.info("--> onErrorDialogDismiss value: " + value);
        switch (value) {
        case "retry":
            break;
        case "palm-attempt":
            var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
            controller.serviceRequest('palm://com.palm.applicationManager', {
                method: 'open',
                parameters: {
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
    
    streamingError: function(errorText, song) {
        //this.errorSong = song;
        var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
        controller.showAlertDialog({
            onChoose: this.onStreamingErrorDismiss.bind(this),
            title: $L("Streaming Error"),
            message: errorText,
            choices: [{
                label: 'OK',
                value: "retry",
                type: 'primary'
            }
            /*{
             label: 'Let Palm Try',
             value: "palm-attempt",
             type: 'secondary'
             
             }*/
            ],
            allowHTMLMessage: true
        });
    },
    
    
    bufferingFinished: function(audioObj)
    {
            audioObj.fullyBuffered = true;
            
            var startPercentage = (this.player.buffered.start(0) / this.player.duration);
            var endPercentage = 1;
            var primary = (this.player === audioObj);
            
            
            audioObj.song.amtBuffered = endPercentage*100;
            this.UIPrintBuffered(startPercentage, endPercentage, audioObj.song.index-1, primary);
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
        
        if (this.UIHandler && this.player) {
            var duration = 0;
            var currentTime = 0;
            if(this.player.readyState >= this.player.HAVE_ENOUGH_DATA)
            {    
                currentTime = Number(this.player.currentTime);
                duration = Number(this.player.duration);
            }
            if(duration === 0)
            {
                    duration = Number(this.player.song.time); 
            }
            
            this.timePercentage = (currentTime / duration) * 100;    
            this.UIHandler.updateTime(currentTime, duration, this.timePercentage, this.player.song.index-1);
       
            
        }
    },
    
    
    UIPrintBuffered: function(start, end, index, primary) {
        //this.downloadPercentage = Math.floor( end*100);
        //Mojo.Log.info("--> AudioPlayer.prototype.UpdateNowPlayingBuffering loaded: " + loaded + " total: " + total);
        if (this.UIHandler) {
            
            this.UIHandler.updateBuffering(start, end, index, primary);
        }
        //Mojo.Log.info("<-- AudioPlayer.prototype.UpdateNowPlayingBuffering");
    },
    
    //UIUpdateAllBuffering:function()
    //{
    //    for(var i=0; i<this.audioBuffers.length; i++) 
    //    {
    //        this.updateBuffering(this.audioBuffers[i]);
    //    }
    //},
    
    updateBuffering: function(audioObj) {
        //Mojo.Log.info("--> AudioPlayer.prototype._updateBuffering")

        var start =0;
        var end = 0;
    
        if(audioObj.readyState < audioObj.HAVE_ENOUGH_DATA)
        {   
            duration = Number(audioObj.song.time);
        }
        else
        {
            duration = audioObj.duration;
            start =  audioObj.buffered.start(0);
            end = audioObj.buffered.end(0);
        }
        
        var startPercentage = start / duration;
        var endPercentage = end / duration;
        

        var primary = (this.player === audioObj)
        this.UIPrintBuffered(startPercentage, endPercentage, audioObj.song.index-1, primary);
            
        audioObj.song.amtBuffered = endPercentage*100;

    },
    
    UIUpdateSongInfo: function(song) {
        if (this.UIHandler) {
            this.UIHandler.DisplaySongInfo(song, song.index-1);
        }
    },
    
    UIInvalidateSong:function(song){
     if (this.UIHandler) {
            if(song)
            {
                this.UIHandler.InvalidateSong(song, song.index - 1);
            }
            else
            {
               Mojo.Log.info("Missing Song"); 
            }
        }
    },
    
    UIShowSpinner: function(_spinnerOn) {
        if (this.UIHandler) {
            if (_spinnerOn === true) {
                this.UIHandler.showSpinner();
            } else if (_spinnerOn === false) {
                this.UIHandler.hideSpinner();
            } else {}
        }
    },
    
    UIShowPause: function() {
        if (this.UIHandler) {
            this.UIHandler.hideSpinner();
            this.UIHandler.showPauseButton();
        }
    },

    UIShowPlay: function() {
        if (this.UIHandler) {
            this.UIHandler.hideSpinner();
            this.UIHandler.showPlayButton();
        }
    },
    //UISetPointer: function(song, state) {
    //    if (this.UIHandler) {
    //        this.UIHandler.SetSongPointer(song.index-1, state);
    //    }
    //},
    
    UISetBufferWait:function(song, state)
    {
        if (this.UIHandler) {
            this.UIHandler.SetBufferWait(song.index-1, state);
        }
    },
    
    UIPrintDebug: function(event, isPlayer) {
        if (this.UIHandler && this.debug) {
            this.UIHandler.printDebug(event, isPlayer);
        }
    },
    
    //
    //
    //
    //
    setNowPlaying: function(UIHandler) {
        this.UIHandler = UIHandler;
        
        if(this.player && this.player.song)
        {
            this.UIUpdateSongInfo(this.player.song)
        }
        if(this.player.paused === false)
        {
            this.UIStartPlaybackTimer();
        }
        //this.UIUpdateAllBuffering();
        //this.UIUpdatePlaybackTime();
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
    clearNowPlaying: function() {
        this.UIStopPlaybackTimer();
        this.UIHandler = null;
    },
    
    cleanup:function()
    {
        this.stop();
        this.player = null;
        while(this.audioBuffers.length !== 0)
        {
            this.audioBuffers.pop();
        }
        while(this.bufferPool.length!=0)
        {
            this.bufferPool.pop();
        }
        this.playList = null;
        this.hasPlayList = false;
    }
});
