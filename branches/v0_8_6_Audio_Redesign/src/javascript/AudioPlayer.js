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

    streamingEvents : ["play", "pause", "error", "ended", "canplay",
                      "emptied", "load", "loadstart",
                      "waiting", "progress"],
    
    //seeked seeking, "durationchange" "canplaythrough", "abort",  

    //bufferingEvents : ["abort", "error", "ended", "emptied", "load", "loadstart",
    //                   "waiting", "progress", "durationchange", "x-palm-disconnect"],
    

    initialize: function () {
        
        //this.blankSong = new SongModel(0, "", "", 0, "", 0, 0, 0, "", 0, "", "");
        //this.blankSong.index = 0;
        
        //Create 2 audio objects to toggle between streaming and buffering
        //this.audioBuffers = [];
        this.audioBuffers = new Array();
        this.bufferPool = new Array();
        var audioObj = null;
        for(var i =0; i < 2; i++) {
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
        //audioObj.song = this.blankSong;
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

    getBufferedSong:function(song)
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
    
    
    recoverStalledBuffers:function()
    {
        //var tempArray = new Array();
         for(var i=0; i<this.audioBuffers.length; i++) 
        {
            if((this.audioBuffers[i].fullyBuffered ===  false) && (this.audioBuffers[i] !== this.player))
            {
                this.putThisBufferIntoPool(this.popThisBuffer(this.audioBuffers[i]));
                i=-1;
            }
            
        }
        
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
        if(buffer!== null)
        {
            buffer.ampacheType = AudioType.pool;
            buffer.src = "../media/empty.mp3";
            buffer.load();
            buffer.autoplay = false;
            buffer.fullyBuffered = false;
            buffer.song.amtBuffered = 0;
            this.UIInvalidateSong(buffer.song);
            buffer.song = null;     
            this.bufferPool.push(buffer);
        }
    },

    loadSongIntoPlayer:function(player, song)
    {
        player.ampacheType = AudioType.player;
        //player.pause();
        //player.empty();
        player.song.plIcon = "images/player/blank.png";
        
        player.song.amtBuffered = 0;
        this.UIInvalidateSong(player.song);
        player.src = song.url;
        player.song = song;
        player.fullyBuffered = false;
        //player.startedBuffering=false;
        player.song.amtBuffered = 0;
        player.song.plIcon = "images/player/play.png";
        this.UIInvalidateSong(player.song);
        player.load();
        player.audioplay = true;
        this.UIShowSpinner(true);
        return player;
    },


    bufferMutex:false,
    waitForBufferMutex:function(){
        if(this.bufferMutex===true)
        {
                Mojo.Controller.errorDialog("Buffer Mutex: " + this.bufferMutex);
        }
        while(this.bufferMutex===true)
        {
            
        }
        
    },
    

    moveToPlayer:function(song) {
        
        var player = null;
        //var playerIndex =0;
        var reverse = false;
        
        this.waitForBufferMutex();
        this.bufferMutex = true;
        
        
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
        player = this.getBufferedSong(song);
        
        if(player === null)
        {   //Song no currently in a buffer
            
            //Check if there is another active buffer we can use
            player = this.findActiveBuffer();
        
            //If no active buffer, next check the buffer pool for a free buffer
            if( (player===null) && (this.bufferPool.length!== 0) )
            {
                player = this.bufferPool.pop();
                player.song = song;
                this.audioBuffers.push(player);
            }
        
            //Player Requires load
            if(player !== null)
            {
                 player = this.loadSongIntoPlayer(player,song);
            }
        }
        else
        {
            if(player.readyState>=player.HAVE_FUTURE_DATA)
            {
                player.play();
            }
            else if(player.readyState===player.HAVE_NOTHING)
            {   //Attempt to recover a stalled out buffer
                player.load()
                player.audioplay = true;
            }
            else
            {   
                player.audioplay = true;
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
        this.bufferMutex = false;
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
            buffer = this.getBufferedSong(song);
            
          
            
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
                    buffer.song = song;
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
        var eventHandler = this.handleAudioEvents.bindAsEventListener(this);    
        for(var i=0; i<this.streamingEvents.length; i++)
        {
            
            audioObj.addEventListener(this.streamingEvents[i], eventHandler);
        }
        audioObj.hasAmpacheStreamEvents = true;   
    },
    
    setAudioToPlayer:function(audioObj){
        audioObj.ampacheType = AudioType.player;
        audioObj.autoplay = true;
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
        
        this.stop();
        this.player = null;
        this.playList = new PlayList(newPlayList, _shuffleOn, 0, _startIndex);
        //Setup Player for new playlist
        this.moveToPlayer(this.playList.getCurrentSong());
        this.hasPlayList = true;
    },
    
    enqueuePlayList: function(newPlayList, _shuffleOn) {
        if(this.playList)
        {
            this.playList.enqueueSongs(newPlayList, _shuffleOn);
            if(this.player.fullyBuffered === true)
            {
                this.bufferNextSong(AmpacheMobile.audioPlayer.player.song);
            }
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
        this.player.pause();
        if(this.playList.moveCurrentToPrevious() === true)
        {
            
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
        this.player.pause;
        if(this.playList.moveToSong(index) ===true)
        {
            this.timePercentage=0;
            this.UIUpdateSongInfo(this.playList.getCurrentSong());
            this.kill_play_change_interval();
            this.play_change_interval = window.setInterval(this.do_play.bind(this), 200);
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
            this.UIPrintDebug(event, false);
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
                this.recoverStalledBuffers();

                
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
                event.currentTarget.fullyBuffered = false;
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
            //case "durationchange":
             //   _this.UIUpdatePlaybackTime();
             //   break;
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
                event.currentTarget.fullyBuffered = false;
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
        if(state === true)
        {
            song.plIcon = "images/icons/loading.png";
        }
        else
        {
            if(song!==this.player.song)
            {
                song.plIcon = "images/player/blank.png";
            }
            else
            {
                song.plIcon = "images/player/play.png";
            }
        }
        this.UIInvalidateSong(song)
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
