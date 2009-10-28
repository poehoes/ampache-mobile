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

AudioPlayer = Class.create({
    PlayerReady: false,
    NowPlaying: null,
    NowPlayingVisible: false,
    OneTimeInit: false,
    timeInterval: null,
    Paused: false,
    RequestedPlayBeforeReady: false,
    Controller: null,
    playOrderList: null,
    currentPlayingTrack: null,
    currentPlayingIndex: null,
    playList: null,
    shuffleOn: false,

    //Audio Player Objects
    player: null,
    playerIndex: 0,
    bufferIndex: 0,
    AudioPlayers: null,
    nPlayers: 2,
    buffer: null,

    MediaEvents: null,

    initialize: function(_controller) {
        Mojo.Log.info("--> AudioPlayer.prototype.initialize", _controller);

        if (this.OneTimeInit == false) {

            this.createAudioObj(_controller);
            this.Controller = _controller;

            this.OneTimeInit = true;
        }
        Mojo.Log.info("<-- AudioPlayer.prototype.initialize");

    },

    //**********************************************************************************************************************
    //Code for audio events vodo
    //**********************************************************************************************************************
    audioEvents: ["play", "pause", "abort", "error", "ended", "canplay", "canplaythrough", "canshowfirstframe", "emptied", "load", "loadedfirstframe", "loadedmetadata", "loadstart", "seeked", "seeking", "stalled"
    /* "timeupdate",*/
    , "waiting", "progress", "durationchange"],

    registerEventsForPlayer: function(player) {
        Mojo.Log.info("--> AudioPlayer.prototype.registerEventsForPlayer");
        this.unregisterEventsForPlayer();

        for (var i = 0; i < this.audioEvents.length; i++) {
            player.addEventListener(this.audioEvents[i], this.handleAudioEvents, false);
        };

        Mojo.Log.info("<-- AudioPlayer.prototype.registerEventsForPlayer");
    },

    unregisterEventsForPlayer: function(player) {
        Mojo.Log.info("--> AudioPlayer.prototype.unregisterEventsForPlayer");

        for (var j = 0; j < this.nPlayers; j++) {
            for (var i = 0; i < this.audioEvents.length; i++) {
                this.AudioPlayers[j].removeEventListener(this.audioEvents[i], this.handleAudioEvents, false);
            };
        }

        Mojo.Log.info("<-- AudioPlayer.prototype.unregisterEventsForPlayer");
    },

    registerEventsForBuffer: function(buffer) {
        Mojo.Log.info("--> AudioPlayer.prototype.unregisterEventsForBuffer");

        this.unregisterEventsForBuffer();

        for (var i = 0; i < this.audioEvents.length; i++) {
            buffer.addEventListener(this.audioEvents[i], this.handleBufferEvents, false);
        };

        Mojo.Log.info("<-- AudioPlayer.prototype.registerEventsForBuffer");
    },

    unregisterEverything: function() {
        for (var j = 0; j < this.nPlayers; j++) {
            for (var i = 0; i < this.audioEvents.length; i++) {
                this.AudioPlayers[j].removeEventListener(this.audioEvents[i], this.handleAudioEvents, false);
                this.AudioPlayers[j].removeEventListener(this.audioEvents[i], this.handleBufferEvents, false);
            };
        }
    },

    unregisterEventsForBuffer: function() {
        Mojo.Log.info("--> AudioPlayer.prototype.unregisterEventsForBuffer");

        for (var j = 0; j < this.nPlayers; j++) {
            for (var i = 0; i < this.audioEvents.length; i++) {
                this.AudioPlayers[j].removeEventListener(this.audioEvents[i], this.handleBufferEvents, false);
            };
        }
        Mojo.Log.info("<-- AudioPlayer.prototype.unregisterEventsForBuffer");
    },

    createAudioObj: function(_controller) {
        Mojo.Log.info("--> AudioPlayer.prototype.createAudioObj");

        if (!this.AudioPlayers) {
            this.AudioPlayers = new Array();

            // use Safari's HTML5 implementation if we are runing on palm host
            if (Mojo.Host.current === Mojo.Host.browser) {
                Mojo.Log.info("Setting up audio for safari");
                this.inPalmHost = true;
                this.PlayerReady = true;

                for (var i = 0; i < this.nPlayers; i++) {
                    //var audioObj = new Audio();
                    this.AudioPlayers[i] = new Audio();
                    this.AudioPlayers[i].Context = this;
                    this.AudioPlayers[i].autoplay = false;
                };
                //this.player = AudioTag.extendElement(_controller.get('audioPlayerDiv'), _controller);
            } else {
                Mojo.Log.info("Setting up audio for palm");

                this.MediaEvents = this.registerForMediaEvents(this.handleAudioEvents.bind(this));

                this.inPalmHost = false;
                this.PlayerReady = false;

                //this.player = AudioTag.extendElement(_controller.get('audioPlayerDiv'), _controller);
                for (var i = 0; i < this.nPlayers; i++) {
                    this.AudioPlayers[i] = new Audio();
                    this.AudioPlayers[i].mojo.audioClass = "media";
                    this.AudioPlayers[i].Context = this;
                    this.AudioPlayers[i].autoplay = false;
                };

                /*
                this.player.addEventListener("x-palm-connect", this.ConnectedToServer.bind(this));
                this.player.addEventListener("x-palm-disconnect", this.handleAudioEvents.bind(this));
                this.player.addEventListener("x-palm-render-mode", this.handleAudioEvents.bind(this));
                this.player.addEventListener("x-palm-success", this.handleAudioEvents.bind(this));
                this.player.addEventListener("x-palm-watchdog", this.handleAudioEvents.bind(this));
                */
                this.PlayerReady = true;
            }

            //Mojo.Log.error("audioObj: %j", this.player);
            this.player = this.AudioPlayers[this.playerIndex] this.registerEventsForPlayer(this.player);
        }
        Mojo.Log.info("<-- AudioPlayer.prototype.createAudioObj");
    },

    //**********************************************************************************************************************
    // Buffer vodo
    //**********************************************************************************************************************
    BufferState: {
        "UNKNOWN": 0,
        "STALE": 1,
        "LOADING": 2,
        "CANPLAY": 3,
        "PLAYTHRU": 4,
        "FULLY_LOADED": 5
    },

    _initBufferTracker: function() {
        for (var i = 0; i < this.playList.length; i++) {
            this.playList[i].bufferState = this.BufferState.UNKNOWN;
        };
    },

    getNextBuffer: function() {
        return this.AudioPlayers[(this.playerIndex + 1) % this.nPlayers]
    },

    swapNextPlayer: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.swapNextPlayer");
        this.unregisterEverything();
        this.player.pause();
        this.player.src = null;

        this.playerIndex = (this.playerIndex + 1) % this.nPlayers this.player = this.AudioPlayers[this.playerIndex];
        this.registerEventsForPlayer(this.player);
        Mojo.Log.error("<-- AudioPlayer.prototype.swapNextPlayer");
    },

    startBufferingNextSong: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.startBufferingNextSong");

        var index = this.getNextTrackIndex();
        this.buffer = this.getNextBuffer();
        this.registerEventsForBuffer(this.buffer);
        if (index != -1) {
            Mojo.Log.error("Starting buffering of " + this.playList[index].artist + " - " + this.playList[index].album + " - " + this.playList[index].track + " - " + this.playList[index].title);
            Mojo.Log.error("URL play of " + this.playList[index].url);

            this.playList[index].bufferState = this.BufferState.UNKNOWN;

            this.buffer.src = this.playList[index].url;
            this.buffer.load()
        }
        Mojo.Log.error("<-- AudioPlayer.prototype.startBufferingNextSong");
    },

    stopBuffering: function() {
        this.buffer.pause();
        this.buffer.src = null;
        unregisterEventsForBuffer();
    },

    getStreamInfo: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.getStreamInfo");
        var info = "Info Unavailable"
        if (this.player.palm != null) {
            info = "bitrate estimated: " + this.player.palm.bitrate.audio.estimate + "\r\n";
            info += "bitrate avg: " + this.player.palm.bitrate.audio.average.toString() + "\r\n";
            info += "bitrate max: " + this.player.palm.bitrate.audio.maximum.toString();
        }
        Mojo.Log.error("<-- AudioPlayer.prototype.getStreamInfo");
        return info;
    },

    ConnectedToServer: function(event) {
        Mojo.Log.error("--> AudioPlayer.prototype.ConnectedToServer");
        //this.playList = newPlayList;
        this.PlayerReady = true;
        if (this.RequestedPlayBeforeReady == true) {
            this.RequestedPlayBeforeReady = false;
            this.play();
        }
        Mojo.Log.error("<-- AudioPlayer.prototype.ConnectedToServer");
    },

    registerForMediaEvents: function(callback) {
        var parameters = {};
        parameters.appName = Mojo.appName;
        parameters.subscribe = "true";

        return new Mojo.Service.Request(MediaEventsService.identifier, {
            method: 'mediaEvents',
            onSuccess: callback,
            parameters: parameters

        },
        true);
    },

    //**********************************************************************************************************************
    // Play list
    //**********************************************************************************************************************
    addPlayList: function(newPlayList, _shuffleOn, _startIndex) {
        Mojo.Log.info("--> AudioPlayer.prototype.addPlayList");
        this.playList = newPlayList;
        this.markPlayListUnplayed();
        this.playOrderList = this.createOrderList();

        this._initBufferTracker();
        this.shuffleOn = _shuffleOn;

        if (_shuffleOn) {
            this.playOrderList.sort(this.randOrd);
            this.playOrderList.sort(this.randOrd);
            this.currentPlayingIndex = 0;
            this.currentPlayingTrack = this.playOrderList[0]
        } else {
            this.currentPlayingTrack = _startIndex;
            this.currentPlayingIndex = _startIndex;
        }

        Mojo.Log.info("<-- AudioPlayer.prototype.addPlayList");
    },

    setCurrentTrack: function(index) {
        Mojo.Log.error("--> AudioPlayer.prototype.setCurrentTrack", index);
        //this.currentTrackIndex = parseInt(index);
        Mojo.Log.error("<-- AudioPlayer.prototype.setCurrentTrack");
    },

    //**********************************************************************************************************************
    //Code for shuffle
    //**********************************************************************************************************************
    markPlayListUnplayed: function() {
        for (var i = 0; i < this.playList.length; i++) {
            this.playList[i].played = false;
        };
    },

    createOrderList: function() {
        var newList = new Array(); //Inititialize an array to randomize;
        for (var i = 0; i < this.playList.length; i++) {
            newList[i] = i;
        }
        return newList;
    },

    randOrd: function() {
        return (Math.round(Math.random()) - 0.5);
    },

    printPlayOrderList: function() {
        Mojo.Log.error("printPlayOrderList: %j", this.playOrderList);
        Mojo.Log.error("currentPlayingTrack: " + this.currentPlayingTrack);
        Mojo.Log.error("currentPlayingIndex: " + this.currentPlayingIndex);
    },

    toggleShuffleOff: function() {
        this.playOrderList = this.createOrderList();
        this.currentPlayingIndex = this.currentPlayingTrack;
        this.printPlayOrderList();
        this.shuffleOn = false;
    },

    toggleShuffleOn: function() {
        this.playOrderList.sort(this.randOrd);
        this.playOrderList.sort(this.randOrd);
        this.stopBuffering(); //Stop any buffering song
        for (var i = 0; i < this.playList.length; i++) {
            this.playList[i].bufferState = this.BufferState.STALE;
            if (this.playOrderList[i] == this.currentPlayingTrack) {
                temp = this.playOrderList[0];
                this.playOrderList[0] = this.currentPlayingTrack;
                this.playOrderList[i] = temp;
                break;
            };
        }
        this.currentPlayingIndex = 0;
        this.printPlayOrderList();
        this.shuffleOn = true;
    },

    getNextTrackIndex: function() {
        if ((this.currentPlayingIndex + 1) < (this.playList.length)) {
            return this.playOrderList[this.currentPlayingIndex + 1];
        } else {
            return - 1;
        }
    },

    getNextTrack: function() {
        if ((this.currentPlayingIndex + 1) < (this.playList.length)) {
            this.currentPlayingIndex++;
            return this.playOrderList[this.currentPlayingIndex];
        } else {
            return - 1;
        }
    },

    getPrevTrack: function() {
        if ((this.currentPlayingIndex - 1) > -1) {
            this.currentPlayingIndex--;
            return this.playOrderList[this.currentPlayingIndex];
        } else {
            return - 1;
        }
    },

    //**********************************************************************************************************************
    //                        Playback Controls
    //**********************************************************************************************************************
    play: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.play");
        if (this.PlayerReady == true) {
            this.internal_play();
        } else {
            this.RequestedPlayBeforeReady = true;
        }

        Mojo.Log.error("<-- AudioPlayer.prototype.play");

    },

    stop: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.stop");
        this.player.pause();
        this.player.src = null;
        //this.player = null;
        Mojo.Log.error("<-- AudioPlayer.prototype.stop");
    },

    stopPlayingAndListening: function() {
        this.unregisterEverything();
        for (var j = 0; j < this.nPlayers; j++) {
            this.AudioPlayers[j].pause();
            this.AudioPlayers[j].src = null;
        }

    },

    pause: function() {
        this.NowPlayingStopPlaybackTimer();
        this.player.pause();
        this.Paused = true;
    },

    play_next: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.play_next");
        this.printPlayOrderList();

        //this.playList[this.currentPlayingTrack].played = true;
        this.playList[this.currentPlayingTrack].bufferState = this.BufferState.STALE;
        this.currentPlayingTrack = this.getNextTrack();

        if (this.currentPlayingTrack > -1) {
            this.Paused = false;
            this.stop();
            this.swapNextPlayer();
            this.internal_play();
        } else {
            this.currentPlayingTrack = this.playOrderList[this.currentPlayingIndex];
        }
        Mojo.Log.error("<-- AudioPlayer.prototype.play_next");
    },

    play_prev: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.play_prev");
        this.printPlayOrderList();
        //this.playList[this.currentPlayingTrack].played = true;
        this.currentPlayingTrack = this.getPrevTrack();
        if (this.currentPlayingTrack > -1) {
            this.Paused = false;
            this.stop();
            this.internal_play();
        } else {
            this.currentPlayingTrack = this.playOrderList[this.currentPlayingIndex];
        }
        Mojo.Log.error("<-- AudioPlayer.prototype.play_prev");
    },

    play_previous: function() {},

    internal_play: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.internal_play");

        if (this.Paused == true) {
            this.player.play()
        } else {
            Mojo.Log.error("Starting play of " + this.playList[this.currentPlayingTrack].artist + " - " + this.playList[this.currentPlayingTrack].album + " - " + this.playList[this.currentPlayingTrack].track + " - " + this.playList[this.currentPlayingTrack].title);

            Mojo.Log.error("URL play of " + this.playList[this.currentPlayingTrack].url);

            this.UpdateNowPlayingBuffering(0, 0);
            this.NowPlayingUpdateSongInfo();

            var bufferState = this.playList[this.currentPlayingTrack].bufferState
            //var NetworkState = 
            if (bufferState < this.BufferState.CANPLAY) {
                this.UpdateNowPlayingShowSpinner(true);
                Mojo.Log.error("Settings Audio Source");
                this.player.src = this.playList[this.currentPlayingTrack].url;
                Mojo.Log.error("Starting audio load");
                this.player.load()
            } else {
                Mojo.Log.error("We have buffered some data") this._updateBuffering();
                this.player.play();
                if (bufferState == this.BufferState.FULLY_LOADED) {
                    Mojo.Log.error("Our next song is fully buffered so startup another") this.startBufferingNextSong();
                }
            }
        }
        this.Paused = false;
        Mojo.Log.error("<-- AudioPlayer.prototype.internal_play");
    },

    handleAudioEvents: function(event) {
        Mojo.Log.error("------> AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);

        var obj = this.Context;
        switch (event.type) {
        case "canplay":
            obj.UpdateNowPlayingShowSpinner(false);
            obj.player.play();
            break;

        case "stalled":
            obj.UpdateNowPlayingShowSpinner(true);
            obj.stalled = true;
            break;

        case "timeupdate":
            //this.UpdateNowPlayingTime()
            break;

        case "progress":
            if (obj.stalled) obj.UpdateNowPlayingShowSpinner(false);
            obj.stalled = false;
            obj._updateBuffering();
            break;

        case "load":
            if (obj.stalled) obj.UpdateNowPlayingShowSpinner(false);
            obj.stalled = false;
            obj._updateBuffering();
            obj.startBufferingNextSong();
            break;

        case "play":
            obj.time obj.NowPlayingStartPlaybackTimer();
            obj.NowPlayingShowPause();
            break;

        case "abort":
            obj.ClearNowPlayingTime();
            break;

        case "error":
            this.Controller.showAlertDialog({
                //onChoose: this.onErrorDialogDismiss.bind(this),
                title:
                $L("Error"),
                message: "Audio Player Recieved an Error",
                choices: [{
                    label: $L('Cancel'),
                    value: "cancel",
                    type: 'dismiss'
                }]
            });
            //this.Controller.errorDialog();
            break;

        case "ended":
            obj.play_next();
            obj.NowPlayingStopPlaybackTimer();
            break;
        }
        Mojo.Log.error("<------ AudioPlayer.prototype.handleAudioEvents AudioEvent:", event.type);
    },

    handleBufferEvents: function(event) {
        Mojo.Log.error("------> AudioPlayer.prototype.handleBufferEvents AudioEvent:", event.type);
        //Mojo.Log.error("------> AudioPlayer.prototype.handleAudioEvents AudioEvent: %j", event);
        //Mojo.Log.error("handeAudioEvent: " + event.type);
        //BufferState:{"UNKNOWN" : 0, "STALE" : 1, "LOADING" : 2, "CANPLAY" : 4, "CANPLAYTHRU" : 5, "FULLY_LOADED":6},
        var obj = this.Context;
        switch (event.type) {
        case "loadstart":
            obj.playList[obj.getNextTrackIndex()].bufferState = obj.BufferState.LOADING;
            break;

        case "play":
            obj.buffer.pause() break;

        case "canplay":
            obj.playList[obj.getNextTrackIndex()].bufferState = obj.BufferState.CANPLAY;
            obj.buffer.pause();
            break;

        case "canplaythrough":
            obj.playList[obj.getNextTrackIndex()].bufferState = obj.BufferState.CANPLAYTHRU;
            break;

        case "load":
            obj.playList[obj.getNextTrackIndex()].bufferState = obj.BufferState.FULLY_LOADED;
            obj.unregisterEventsForBuffer(obj.buffer);
            break;
        }

        /*switch (event.type) {
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
            
            case "error":
            this.Controller.showAlertDialog({
                //onChoose: this.onErrorDialogDismiss.bind(this),
                title: $L("Error"),
                message: "Audio Player Recieved an Error",
                choices:[
                {label:$L('Cancel'), value:"cancel", type:'dismiss'}
                ]
              });
                //this.Controller.errorDialog();
                break;
            
            case "ended":
                this.play_next();
                this.NowPlayingStopPlaybackTimer();
                break;
        }*/
        Mojo.Log.error("<------ AudioPlayer.prototype.handleBufferEvents AudioEvent:", event.type);
    },

    //******************************************************************************************************************
    // Now Playing updaters
    UpdateNowPlayingTime: function() {
        //Mojo.Log.error("--> AudioPlayer.prototype.UpdateNowPlayingTime");
        if (this.NowPlaying != null) {
            var currentTime = this.player.currentTime;
            var duration = (this.player.duration.toString() == "NaN") ? 0 : this.player.duration;
            this.NowPlaying.updateTime(currentTime, duration);
        }
        //Mojo.Log.error("<-- AudioPlayer.prototype.UpdateNowPlayingTime");
    },

    ClearNowPlayingTime: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.ClearNowPlayingTime");
        if (this.NowPlaying != null) {
            this.NowPlaying.updateTime(0, 0);
        }
        Mojo.Log.error("<-- AudioPlayer.prototype.ClearNowPlayingTime");
    },

    UpdateNowPlayingBuffering: function(loaded, total) {
        //Mojo.Log.error("--> AudioPlayer.prototype.UpdateNowPlayingBuffering loaded: " + loaded + " total: " + total);
        if (this.NowPlaying != null) this.NowPlaying.updateBuffering(0, total);
        //Mojo.Log.error("<-- AudioPlayer.prototype.UpdateNowPlayingBuffering");
    },

    UpdateNowPlayingShowSpinner: function(_spinnerOn) {
        if (this.NowPlaying != null) {
            if (_spinnerOn == true) this.NowPlaying.showSpinner();
            else if (_spinnerOn == false) this.NowPlaying.hideSpinner();
            else {}
        }
    },

    NowPlayingShowPause: function() {
        if (this.NowPlaying != null) {
            this.NowPlaying.showPauseButton();
        }
    },

    NowPlayingShowPlay: function() {
        if (this.NowPlaying != null) {
            this.NowPlaying.showPlayButton();
        }
    },

    NowPlayingStartPlaybackTimer: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.NowPlayingStartPlaybackTimer") if (this.NowPlaying != null && this.timeInterval == null) {
            this.timeInterval = this.NowPlaying.controller.window.setInterval(this.UpdateNowPlayingTime.bind(this), 900);
        } else {
            Mojo.Log.error("***********************************************************")
        }
        Mojo.Log.error("<-- AudioPlayer.prototype.NowPlayingStartPlaybackTimer")
    },

    NowPlayingStopPlaybackTimer: function() {
        Mojo.Log.error("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer") if ((this.NowPlaying != null) && (this.timeInterval != null)) {
            this.NowPlaying.controller.window.clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        Mojo.Log.error("--> AudioPlayer.prototype.NowPlayingStopPlaybackTimer")
    },

    NowPlayingUpdateSongInfo: function() {
        if (this.NowPlaying != null) {
            this.NowPlaying.NowPlayingDisplaySongInfo(this.playList, this.currentPlayingTrack);
        }
    },

    _updateBuffering: function() {
        //Mojo.Log.error("--> AudioPlayer.prototype._updateBuffering")
        if (this.player.buffered && this.player.buffered.length > 0) {
            var startPercentage = (this.player.buffered.start(0) / this.player.duration);
            var endPercentage = (this.player.buffered.end(0) / this.player.duration);

            this.UpdateNowPlayingBuffering(startPercentage, endPercentage);
        }
        //Mojo.Log.error("<-- AudioPlayer.prototype._updateBuffering")
    },

    setNowPlaying: function(NowPlayingPointer) {
        Mojo.Log.error("<-- AudioPlayer.prototype.setNowPlaying loaded");
        this.NowPlaying = NowPlayingPointer;
        Mojo.Log.error("--> AudioPlayer.prototype.setNowPlaying loaded");
    },

    clearNowPlaying: function() {
        this.NowPlaying = null;
    },
});