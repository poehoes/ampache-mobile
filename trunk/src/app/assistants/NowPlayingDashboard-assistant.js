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

NowPlayingDashboardAssistant = Class.create({

    initialize: function(params) {},

    setup: function() {

        this.controller.setupWidget("spinnerId", this.attributes = {
            spinnerSize: "small"
        },
        this.spinningModel = {
            spinning: false
        }

        );

        AmpacheMobile.audioPlayer.setNowPlaying(this);

        this.tapNextHandler = this.nextHandler.bind(this);
        this.tapPrevHandler = this.prevHandler.bind(this);
        this.tapPlayPauseHandler = this.togglePausePlay.bind(this);
        this.tapGotoMainApp = this.showMainApp.bind(this);

        Mojo.Event.listen(this.controller.get('Next'), Mojo.Event.tap, this.tapNextHandler);
        Mojo.Event.listen(this.controller.get('Prev'), Mojo.Event.tap, this.tapPrevHandler);
        Mojo.Event.listen(this.controller.get('PlayPause'), Mojo.Event.tap, this.tapPlayPauseHandler);

        Mojo.Event.listen(this.controller.get('viewTitle'), Mojo.Event.tap, this.tapGotoMainApp);
        Mojo.Event.listen(this.controller.get('albumArt'), Mojo.Event.tap, this.tapGotoMainApp);

        this.onActivate = this.onActivate.bind(this);
        this.controller.listen(this.controller.document, Mojo.Event.stageActivate, this.onActivate);
        
        this.onDeactivate = this.onDeactivate.bind(this);
        this.controller.listen(this.controller.document, Mojo.Event.stageDeactivate , this.onDeactivate);


        this.showPausePlay();

    },

    cleanup: function(event) {
        Mojo.Event.stopListening(this.controller.get('Next'), Mojo.Event.tap, this.tapNextHandler);
        Mojo.Event.stopListening(this.controller.get('Prev'), Mojo.Event.tap, this.tapPrevHandler);
        Mojo.Event.stopListening(this.controller.get('PlayPause'), Mojo.Event.tap, this.tapPlayPauseHandler);
        Mojo.Event.stopListening(this.controller.get('viewTitle'), Mojo.Event.tap, this.tapGotoMainApp);
        Mojo.Event.stopListening(this.controller.get('albumArt'), Mojo.Event.tap, this.tapGotoMainApp);

        this.controller.stopListening(this.controller.document, Mojo.Event.stageActivate, this.onActivate);
        this.controller.stopListening(this.controller.document, Mojo.Event.stageDeactivate , this.onDeactivate);

        if (AmpacheMobile.audioPlayer.UIHandler === this) {
            AmpacheMobile.audioPlayer.clearNowPlaying();
        }
    },

    onActivate:function()
    {
        AmpacheMobile.dashBoardDisplayed = true;
    },
    
    onDeactivate:function()
    {
        AmpacheMobile.dashBoardDisplayed = false;
    },

    activate: function(event) {

        AmpacheMobile.audioPlayer.UIUpdateSongInfo(AmpacheMobile.audioPlayer.player.song);
        AmpacheMobile.audioPlayer.UIStartPlaybackTimer();
        AmpacheMobile.audioPlayer.updateBuffering(AmpacheMobile.audioPlayer.player);

        

        if (AmpacheMobile.audioPlayer.player.song.amtBuffered === 0) {
            this.showSpinner();
        } else {
            this.showPausePlay();
        }
        
        
    },

    deactivate: function(event) {
        AmpacheMobile.dashBoardDisplayed = false;

    },

    showMainApp: function() {
        //this.closeDashboard();
        var parameters = {
            id: Mojo.Controller.appInfo.id
        };

        return new Mojo.Service.Request('palm://com.palm.applicationManager', {
            method: 'open',
            parameters: parameters
        });
    },

    nextHandler: function() {

        AmpacheMobile.audioPlayer.next(true);
    },

    prevHandler: function() {

        AmpacheMobile.audioPlayer.previous(true);
    },

    showPlayButton: function() {
        this.controller.get('PlayPause').src = "images/player/play.png";
    },

    showPauseButton: function() {
        this.controller.get('PlayPause').src = "images/player/pause.png";
    },

    togglePausePlay: function() {
        Mojo.Log.info("--> togglePausePlay");

        if (this.controller.get('PlayPause').src !== "images/player/blank.png") {
            this.hideSpinner();
            if (!AmpacheMobile.audioPlayer.player.paused) {
                this.showPlayButton();
                AmpacheMobile.audioPlayer.pause();
            } else {
                this.showPauseButton();
                AmpacheMobile.audioPlayer.play();
            }
        }
        Mojo.Log.info("--> togglePausePlay");
    },

    showPausePlay: function() {

        if (AmpacheMobile.audioPlayer.player && AmpacheMobile.audioPlayer.player.paused === true) {
            this.showPlayButton();
        } else {
            this.showPauseButton();
        }
    },

    DisplaySongInfo: function(song, currentIndex) {
        this.controller.get("artist").innerHTML = song.artist.escapeHTML();
        this.controller.get("album").innerHTML = song.album.escapeHTML();
        this.controller.get("song").innerHTML = song.title.escapeHTML();

        if ((!song.art) || (song.art === "")) {
            this.controller.get("albumArt").src = "images/blankalbum.png";
        } else {
            if (this.controller.get("albumArt").src !== song.art) {
                this.controller.get("albumArt").src = "images/blankalbum.png";
                this.controller.get("albumArt").src = song.art;
            }
        }

    },

    updateBuffering: function(startPctg, endPctg, index, primary) {
        if (primary) {
            this.controller.get("downloadDiv").style.width = Math.round(endPctg * 100) + "%";
        }
    },

    updateTime: function(_current, _duration, percentage, index) {
        this.controller.get("timeDiv").style.width = percentage + "%";
    },

    closeDashboard: function(event) {
        this.controller.window.close();
    },

  
    showSpinner: function() {

        if (this.spinningModel.spinning === false) {
            this.controller.get('PlayPause').src = "images/player/blank.png";
            this.spinningModel.spinning = true;
            this.controller.modelChanged(this.spinningModel);

        }
    },
    hideSpinner: function() {
        if (this.spinningModel.spinning === true) {
            this.spinningModel.spinning = false;
            this.controller.modelChanged(this.spinningModel);
            this.showPausePlay();
        }
    },

    printDebug: function() {},

    InvalidateSong: function() {},

    GetSongNode: function(song) {
        return null;
    }

});
