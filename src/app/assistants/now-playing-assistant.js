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
NowPlayingAssistant = Class.create({
    
    firstActivate:true,
    
    initialize: function(params) {
        Mojo.Log.info("--> NowPlayingAssistant.prototype.constuctor");
        
        assistant = this;
        if(!AmpacheMobile.audioPlayer.listIsShowing)
        {
            AmpacheMobile.audioPlayer.listIsShowing = false;
        }
        this.type = params.type;
        this.pauseStopItem = this.pauseItem;
        
        if(params.repeat)
        {
            this.repeat = params.repeat;
        }
        else
        {
            this.repeat = 0;
        }


        for(var j=0;j<StageAssistant.nowPlayingMenu.items.length;j++)
                {
                    StageAssistant.nowPlayingMenu.items[j].disabled = false;
                }

        switch (params.type) {
        case "display":
            //this.repeatMode = AmpacheMobile.audioPlayer.playList.repeat;
            //this.shuffle = AmpacheMobile.audioPlayer.playList.shuffle;
            this.pauseStopItem = this.pauseItem;
            break;
        case "play":
            this.playList = params.playList;
            this.startIndex = params.startIndex;
            //this.shuffle = ;
            
            AmpacheMobile.audioPlayer.stop();
            AmpacheMobile.audioPlayer.newPlayList(this.playList, params.shuffle, this.startIndex);
            AmpacheMobile.audioPlayer.playList.repeat = this.repeat;
            break;
        case "enqueue":
            //this.repeatMode = AmpacheMobile.audioPlayer.playList.repeat;
            this.pauseStopItem = this.pauseItem;
            var shuffle = params.shuffle || AmpacheMobile.audioPlayer.playList.shuffle;
            AmpacheMobile.audioPlayer.enqueuePlayList(params.playList, shuffle);
            
            AmpacheMobile.audioPlayer.bufferNextSong(AmpacheMobile.audioPlayer.player.song);
            
            break;
        }

        if(params.repeat)
        {
            //this.repeatMode = ;
            AmpacheMobile.audioPlayer.repeatMode = params.repeat;
        }

        Mojo.Log.info("<-- NowPlayingAssistant.prototype.constuctor");
    },

    setup: function() {
        Mojo.Log.info("--> setup");
        //this.playing = false;
        if (this.type === "play") {
            this.DisplaySongInfo(this.playList[this.startIndex], this.startIndex);
        }
        this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
        this.cmdMenuModel = {
            visible: true,
            items: null
        };
        // set up the controls
        this.setMenuControls(true, false, false);
        this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);

        
        
        
       

        this.sliderModel = {
            value: 0,
            maxValue: 100,
            minValue: 0,
            progress: 0
        };

        // setup the slider
        var sliderAttributes = {
            sliderProperty: 'value',
            progressStartProperty: 'progressStart',
            progressProperty: 'progressEnd',
            round: false,
            updateInterval: 0.1
        };
        Mojo.Log.info("Setup slider");
        this.controller.setupWidget('sliderdiv', sliderAttributes, this.sliderModel);
        

        this.loadingModel = {
            label: $L('Stop'),
            icon: 'buffering',
            command: 'pause'
        };
        details = {
            controller: this.controller,
            model: this.loadingModel,
            frameHeight: 32
        };
        this.loadingAnimation = new SpinningAnimation(details);

        if (this.type !== "display") {
            $('coverArt').src = "images/blankalbum.png";
        } else {
        }
        
        var attributes = {
            itemTemplate: 'now-playing/listitem_w_artist',
            autoconfirmDelete:true,
            swipeToDelete:true,
            reorderable:true,
            onItemRendered:this.renderPlaylist
        };

        this.listModel = {
            disabled: false,
            items: AmpacheMobile.audioPlayer.playList.songs

            
        };
        this.controller.setupWidget('npList', attributes, this.listModel);
        this.npList = this.controller.get('npList');
        
        
        

         //List Tap
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('npList'), Mojo.Event.listTap, this.listTapHandler);
        
        //List Delete
        this.listDeleteHandler = this.listDeleteHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('npList'), Mojo.Event.listDelete, this.listDeleteHandler);
        
        //List Reorder
        this.listReorderHandler = this.listReorderHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('npList'), Mojo.Event.listReorder, this.listReorderHandler);
        
        

        
        

        //***************************************************************************************
        //Events
        this.slider = this.controller.get('sliderdiv');

        this.seekHandler = this.progressBarSeek.bindAsEventListener(this);
        Mojo.Event.listen(this.slider, Mojo.Event.propertyChange, this.seekHandler);

        this.dragStartHandler = this.progressBarDragStart.bindAsEventListener(this);
        Mojo.Event.listen(this.slider, Mojo.Event.sliderDragStart, this.dragStartHandler);

        this.dragEndHandler = this.progressBarDragEnd.bindAsEventListener(this);
        Mojo.Event.listen(this.slider, Mojo.Event.sliderDragEnd, this.dragEndHandler);

 
        this.flickHandler = this.handleFlick.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('playback-display'), Mojo.Event.flick, this.flickHandler);

        this.doubleClickHandler = this.doubleClick.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('playback-display'), Mojo.Event.tap, this.doubleClickHandler);
        
        
        
        
        AmpacheMobile.audioPlayer.debug = AmpacheMobile.settingsManager.settings.StreamDebug;
        if(AmpacheMobile.audioPlayer.debug){
            $('player-debug').innerHTML = "Player Debug";
            $('buffer-debug').innerHTML = "Buffer Ahead Not Used";
        }
        

        
        this.controller.get('list-display').style.display = "none";
        //this.controller.get('playback-display').hide();
        
        if (AmpacheMobile.audioPlayer.listIsShowing === true){
            this.controller.get('toggle-list-view').addClassName('depressed');
            this.controller.get('toggle-album-view').removeClassName('depressed');
        }
        else{
            this.controller.get('toggle-list-view').removeClassName('depressed');
            this.controller.get('toggle-album-view').addClassName('depressed');
           
        }
        
        
        this.keydownHandler = this.keydownHandler.bindAsEventListener(this);
        this.controller.listen(this.controller.sceneElement, Mojo.Event.keydown, this.keydownHandler);
        
        this.keypressHandler = this.handleKeyPressEvent.bindAsEventListener(this);
        this.controller.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keypressHandler);
        
        
        Mojo.Log.info("<-- setup");
    },
    
    ready: function(event) {
        Mojo.Log.info("--> activate");
        
        AmpacheMobile.audioPlayer.setNowPlaying(this);
        Mojo.Log.info("<-- activate");
    },
    
    cleanup: function(event) {
        AmpacheMobile.audioPlayer.clearNowPlaying();
        
        this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keypressHandler);
        this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keydown, this.keydownHandler);
        
        this.slider = this.controller.get('sliderdiv');
        Mojo.Event.stopListening(this.slider, Mojo.Event.propertyChange, this.seekHandler);
        Mojo.Event.stopListening(this.slider, Mojo.Event.sliderDragStart, this.dragStartHandler);
        Mojo.Event.stopListening(this.slider, Mojo.Event.sliderDragEnd, this.dragEndHandler);
        if((this.noDragHandler)&&(this.noDragHandler!== null))
        {
            Mojo.Event.stopListening(this.controller.get('now-playing'), Mojo.Event.dragStart, this.noDragHandler);
        }
        Mojo.Event.stopListening(this.controller.get('playback-display'), Mojo.Event.flick, this.flickHandler);
        Mojo.Event.stopListening(this.controller.get('playback-display'), Mojo.Event.tap, this.doubleClickHandler);
        Mojo.Event.stopListening(this.controller.get('npList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.controller.get('npList'), Mojo.Event.listDelete, this.listDeleteHandler);
        Mojo.Event.stopListening(this.controller.get('npList'), Mojo.Event.listReorder, this.listReorderHandler);
        
        this.loadingAnimation.stop();
        this.loadingAnimation = null;
        
        //AmpacheMobile.audioPlayer.clearNowPlaying();
        window.onresize = null;
    },
    
    activate:function()
    {
        if(this.firstActivate===true)
        {
            this.firstActivate = false;
            //this.updateBuffering(0,AmpacheMobile.audioPlayer.downloadPercentage/100);
            
            this.switchingReady=true;
            if (AmpacheMobile.audioPlayer.listIsShowing === true){
                this.showListView();
            }
            else {
                this.showAlbumView();
            }
            
             if (this.type === "play") {
                //AmpacheMobile.audioPlayer.play();
            } else if (this.type === "enqueue") {
                this.setMenuControls();
            }
            
        }
        
    },
    
    
    keydownHandler: function(event) {
        
        switch (Number(event.originalEvent.keyCode)) {
            
            
           
            case Mojo.Char.sym:
                AmpacheMobile.audioPlayer.jump(10);
                break;
           
            case Mojo.Char.shift:
                AmpacheMobile.audioPlayer.jump(-10);
                break;
        }
    },
    
    
    handleKeyPressEvent: function(event) {
        /*
         var eventModel =
         {
         eventType: event.type,
         eventKeyCode: event.originalEvent.keyCode,
         eventChar: String.fromCharCode(event.originalEvent.keyCode)
         };
         */
        
        switch (Number(event.originalEvent.keyCode)) {
            
            case  44: /* (,) Comma*/
            case  64: /* (@) Comma */
            
            
                AmpacheMobile.audioPlayer.previous(true);
                break;
            
            case  46: /* (.) Period Key*/
            
                AmpacheMobile.audioPlayer.next(true);
                break;
            
            case 32: /* Space Bar Key */
                this.togglePausePlay();
                break;
            case 115: /* S */
            case 83:  /* S + Caps */
            case 45:  /* S + Orange */
                this.toggleShuffle();
                break;
            case 114: /* R */
            case 82:  /* R + Caps */
            case 50:  /* R + Orange */
                this.toggleRepeat();
                break;
            
            case 118: /* V */
            case  86: /* V + Caps */
                this.toggleViews();
                break;
                
            case 117: /* U */
            case  85: /* U + Caps */

                if (AmpacheMobile.audioPlayer.listIsShowing === true)
                {
                    var range = this.npList.mojo.getLoadedItemRange();
                    this.npList.mojo.revealItem(range.offset, false);
                }
                break;
            
            case 100:/* D */
            case 68: /* U + Caps */

                if (AmpacheMobile.audioPlayer.listIsShowing === true)
                {
                    var range = this.npList.mojo.getLoadedItemRange();
                    this.npList.mojo.revealItem(range.offset+Math.floor(range.limit/1.5), false);
                }
                break;
            /*default:
                this.controller.showAlertDialog({
               title: $L("Unknown Keycode"),
               message: "Key Code: " + event.originalEvent.keyCode,
               choices: [{
                   label: 'OK',
                   value: "retry",
                   type: 'primary'
               }]});
                break; */
        }
    },
    
    
    listTapHandler:function(event)
    {
        AmpacheMobile.audioPlayer.playTrack(event.index);
    },
    
    listDeleteHandler:function(event)
    {
        ////Update Printouts
        for(var i=event.index; i<AmpacheMobile.audioPlayer.playList.songs.length; i++)
        {
            try{
                this.npList.mojo.getNodeByIndex(i).getElementsByClassName("npIndex")[0].innerHTML = i;
            }
            catch(ex)
            {
                i=AmpacheMobile.audioPlayer.playList.songs.length;
            }
        }
        AmpacheMobile.audioPlayer.removeSong(event.index);
        
        //Close Now Playing if there are no more tracks left
        if(AmpacheMobile.audioPlayer.playList.songs.length===0)
        {
            AmpacheMobile.audioPlayer.hasPlayList = false;
            this.controller.stageController.popScene();
        }
        else
        {
        
            //Update XofY
            var xofy = (AmpacheMobile.audioPlayer.player.song.index) + "/" + AmpacheMobile.audioPlayer.playList.songs.length;
            this.controller.get('song-x-of-y').innerHTML = xofy.escapeHTML();
        }
        
        
    },
    
    
    
    listReorderHandler:function(event)
    {
        AmpacheMobile.audioPlayer.reorder(event);
        //this.npList.mojo.invalidateItems(0, AmpacheMobile.audioPlayer.playList.songs.length);
        ////Update Printouts
        for(var i=event.index; i<AmpacheMobile.audioPlayer.playList.songs.length; i++)
        {
            try{
                this.npList.mojo.getNodeByIndex(i).getElementsByClassName("npIndex")[0].innerHTML = i;
            }
            catch(ex)
            {
                i=AmpacheMobile.audioPlayer.playList.songs.length;
            }
        }
        
        //Update XofY
        var xofy = (AmpacheMobile.audioPlayer.player.song.index) + "/" + AmpacheMobile.audioPlayer.playList.songs.length;
        this.controller.get('song-x-of-y').innerHTML = xofy.escapeHTML();
        
    },
    
    renderPlaylist:function(listWidget, itemModel, itemNode){
        
        if(AmpacheMobile.audioPlayer.player && AmpacheMobile.audioPlayer.player.song){
            if(itemNode.index === (AmpacheMobile.audioPlayer.player.song.index-1)){
                itemNode.getElementsByClassName("timeLoaded")[0].style.width =  AmpacheMobile.audioPlayer.timePercentage +"%";
            }
        }
    },
    
    toggleViews: function(){
        
        if(this.switchingReady){
            if (AmpacheMobile.audioPlayer.listIsShowing === true){
                this.showAlbumView(true);
            }
            else {
                this.showListView();
            }
            
            if(AmpacheMobile.audioPlayer.player === null)
            {
                AmpacheMobile.audioPlayer.moveToPlayer(AmpacheMobile.audioPlayer.playList.getCurrentSong());
            }
            
            AmpacheMobile.settingsManager.settings.npPlayingListView = AmpacheMobile.audioPlayer.listIsShowing;
            AmpacheMobile.settingsManager.SaveSettings();
            AmpacheMobile.audioPlayer.UIUpdateSongInfo(AmpacheMobile.audioPlayer.player.song);
            AmpacheMobile.audioPlayer.UIUpdatePlaybackTime();
            //AmpacheMobile.audioPlayer.UIUpdateAllBuffering();
        }
    }, 
    
    showAlbumView:function()
    {
        this.controller.get('toggle-list-view').removeClassName('depressed');        
        this.controller.get('toggle-album-view').addClassName('depressed');
        AmpacheMobile.audioPlayer.listIsShowing = false;
        this.controller.get('list-display').style.display = "none";
        this.controller.get('playback-display').style.display = "block";
        this.noDragHandler = this.noDrag.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('now-playing'), Mojo.Event.dragStart, this.noDragHandler);
    
        window.onresize = this.FitToWindow.bind(this);
        this.FitToWindow();
        
        AmpacheMobile.audioPlayer.updateBuffering(AmpacheMobile.audioPlayer.player);
        
    },
    
    showListView:function()
    {
        this.controller.get('toggle-list-view').addClassName('depressed');        
        this.controller.get('toggle-album-view').removeClassName('depressed');
        AmpacheMobile.audioPlayer.listIsShowing = true;
        this.controller.get('list-display').style.display = "block";
        this.controller.get('playback-display').style.display = "none";
        
        if(this.noDragHandler)
        {
            Mojo.Event.stopListening(this.controller.get('now-playing'), Mojo.Event.dragStart, this.noDragHandler);
            this.noDragHandler = null;
        }
        this.npList.mojo.invalidateItems(0);
        this.npList.mojo.revealItem(AmpacheMobile.audioPlayer.player.song.index-1, false);
        
        window.onresize = null;
    },
                
    
    
    

    FitToWindow: function() {
        
       
            var percentate = 1;
            var coverArt = $('coverArt');
            
            var top = $('songTitle');
            var bottom =  AmpacheMobile.audioPlayer.debug ? $('buffer-debug') : $('progress-info');
            
            var header = $('albumArtist');
            
            var controlHeight = header.offsetTop + header.offsetHeight + 100 + bottom.offsetTop + bottom.offsetHeight - top.offsetTop;
            
            var height = coverArt.height;
            var option1 = (window.innerHeight - controlHeight);
    
            if (option1 < 0) {
                option1 = 0;
            }
            var option2 = window.innerWidth * percentate;
            height = (option1 < option2) ? option1: option2;
            coverArt.height = height;
            coverArt.width = height;
            
            //var diff = window.innerHeight - height;
        
    },

    //****************************************************************************************************************
    // Gestures and animation
    //****************************************************************************************************************
    noDrag: function(event) {
        event.stop();
    },

    handleFlick: function(event) {
        Mojo.Log.info("--> handleFlick: %j", event);
        event.stop();
        if (event.velocity.x < -1500) {
            AmpacheMobile.audioPlayer.next(true);
            //this.moveArt();
        }
        if (event.velocity.x > 1500) {
            AmpacheMobile.audioPlayer.previous(true);
        }
        Mojo.Log.info("<-- handleFlick");
    },

    // All this for double clicking
    doubleClick: function() {
        Mojo.Log.info("--> doubleClick");
        if (this.click === 1) {
            this.togglePausePlay();
        } else {
            this.click = 1;
            this.clickInterval = window.setInterval(this.killlClick.bind(this), 450);
        }
    },

    killlClick: function() {
        Mojo.Log.info("--> killlClick");
        this.click = 0;
        window.clearInterval(this.clickInterval);
        this.clickInterval = null;
    },

    togglePausePlay: function() {
        Mojo.Log.info("--> togglePausePlay");
        if (!AmpacheMobile.audioPlayer.player.paused) {
            this.showPlayButton();
            AmpacheMobile.audioPlayer.pause();
        } else {
            this.showPauseButton();
            AmpacheMobile.audioPlayer.play();
        }
        Mojo.Log.info("--> togglePausePlay");
    },
    
    

    deactivate: function(event) {
        Mojo.Log.info("<-- activate");

        Mojo.Log.info("--> activate");
    },

    updateTime: function(current, duration, percentage, index) {
       
        if(AmpacheMobile.audioPlayer.listIsShowing === true)
        {            
            var node = this.npList.mojo.getNodeByIndex(index);
            if(node)
            {
                node.getElementsByClassName("timeLoaded")[0].style.width =  percentage + "%";
            }
        }
        else
        {
            this.sliderModel.value = percentage;
            this.controller.modelChanged(this.sliderModel);
        }
        this.updateCounters(current, duration, index);
    },

    updateCounters: function(_current, _duration, index) {
        var current = Math.floor(_current);
        var duration = Math.floor(_duration);
        var remaining = Math.floor(duration - current);
        var timeString = this.timeFormatter(current);
        
        if(AmpacheMobile.audioPlayer.listIsShowing === true)
        {            
            var node = this.npList.mojo.getNodeByIndex(index);
            if(node)
            {
                node.getElementsByClassName("nplist-progess")[0].innerHTML = timeString;
                node.getElementsByClassName("nplist-remaining")[0].innerHTML = "-" + this.timeFormatter(remaining);
                
            }
        }
        else
        {
        
            this.controller.get('playback-remaining').innerHTML = "-" + this.timeFormatter(remaining);
            this.controller.get('playback-progress').innerHTML = timeString;
        }
    },

    timeFormatter: function(secs) {
        //Mojo.Log.info("--> timeFormatter secs: " + secs);
        var hrs = Math.floor(secs / 3600);
        var mins = Math.floor(secs / 60) - hrs * 60;
        secs = secs % 60;
        var displayHours = "";
        if (hrs > 0) {
            displayHours = hrs + ":";
        }
        var result = displayHours + ((mins < 10) ? "0" + mins: mins) + ":" + ((secs < 10) ? "0" + secs: secs);
        
        if(result.match(/NaN/))
        {
            result = "00:00";
        }
        return result;
    },

    //*********************************************************************************************************************************
    //                                Progress Bar Slider / Buffering
    //*********************************************************************************************************************************
    progressBarDragEnd: function() {
        Mojo.Log.info("--> progressBarDragEnd");
        this.sliderIsDragging = false;
        var pos = this.sliderModel.value;
        var percentage = (pos / 100);
        AmpacheMobile.audioPlayer.seekPercentage(percentage);

        AmpacheMobile.audioPlayer.UIStartPlaybackTimer();
       
        Mojo.Log.info("<-- progressBarDragEnd");
    },

    progressBarDragStart: function() {
        Mojo.Log.info("--> progressBarDragStart");
       
        if (this.sliderIsDragging) {
            return;
        }
        
        this.sliderIsDragging = true;
        AmpacheMobile.audioPlayer.UIStopPlaybackTimer();
        Mojo.Log.info("<-- progressBarDragStart");
    },

    progressBarSeek: function(event) {
        Mojo.Log.info("--> progressBarSeek");
        var pos = event.value;
        var secs = Math.round((pos / 100) * AmpacheMobile.audioPlayer.player.duration);
        
        this.updateCounters(secs, AmpacheMobile.audioPlayer.player.duration);
        Mojo.Log.info("<-- progressBarSeek");
    },

    oneTime:true,

    getCurrentTrackNode:function()
    {
        return this.npList.mojo.getNodeByIndex (AmpacheMobile.audioPlayer.player.song.index-1);
    },

    updateBuffering: function(startPctg, endPctg, index, primary) {
        
        
        if(AmpacheMobile.audioPlayer.listIsShowing === true)
        {
            var node = this.npList.mojo.getNodeByIndex(index);
            
            if(node)
            {
                node.getElementsByClassName("progressDone")[0].style.width = Math.round(endPctg*100) + "%";
            }
            
        }
        else
        {
            if(primary === true)
            {
            if(startPctg === 0 && endPctg === 0)
            {
                this.sliderModel.progressStart = 0.0000001;
                this.sliderModel.progressEnd =   0.0000001;
                this.controller.modelChanged(this.sliderModel);
            }
            else
            {
                this.sliderModel.progressStart = startPctg;
                this.sliderModel.progressEnd = endPctg;
                this.controller.modelChanged(this.sliderModel);
            }
            }
        }
    },

    spinnerShown:false, //Spinner Mutex

    //*********************************************************************************************************************************
    //                                Spinner
    //*********************************************************************************************************************************
    showSpinner: function() {
        Mojo.Log.info("--> showSpinner");

        if(this.spinnerShown ===false)
        {
            this.spinnerShown = true;
            this.cmdMenuModel.items[1].items[1] = this.loadingModel;
            this.controller.modelChanged(this.cmdMenuModel);
            this.loadingAnimation.start();
        }
        Mojo.Log.info("<-- showSpinner");
    },
    hideSpinner: function() {
        if(this.cmdMenuModel.items[1].items[1] === this.loadingModel)
        {
        Mojo.Log.info("--> hideSpinner");
        
        this.loadingAnimation.stop();
        this.spinnerShown = false;
        if (AmpacheMobile.audioPlayer.player && AmpacheMobile.audioPlayer.player.paused) {
            this.cmdMenuModel.items[1].items[1] = this.playItem;
        } else {
            this.cmdMenuModel.items[1].items[1] = this.pauseStopItem;
        }

        this.controller.modelChanged(this.cmdMenuModel);
        //this.spinnerModel.spinning = false;
        //this.controller.modelChanged(this.spinnerModel);
        Mojo.Log.info("<-- hideSpinner");
        }
    },
    
    lastPlayed:null,
    currentPlayed:null,
    //*********************************************************************************************************************************
    //  Now Playing Song Info
    //*********************************************************************************************************************************
    InvalidateSong: function(song, index) {
        this.npList.mojo.invalidateItems(index, 1);
    },
    
    //SetSongPointer:function(index, state)
    //{
    //    if(AmpacheMobile.audioPlayer.listIsShowing === true)
    //    {
    //    }
    //    else
    //    {
    //        var node = this.npList.mojo.getNodeByIndex(index);
    //            
    //                if(node)
    //                {
    //                    if(state === true)
    //                    {
    //                        node.getElementsByClassName("npListIcon")[0].src = "images/player/play.png";
    //                         try {
    //                            this.npList.mojo.revealItem(index, false);
    //                        }
    //                        catch(ex)
    //                        {}
    //                    }
    //                    else
    //                    {
    //                        node.getElementsByClassName("npListIcon")[0].src =  "images/player/empty.png";
    //                    }
    //                }
    //        }
    //    
    //},
    
    SetBufferWait:function(index, state)
    {
        /*
        if(AmpacheMobile.audioPlayer.listIsShowing === true)
        {
        var node = this.npList.mojo.getNodeByIndex(index);
            
                if(node)
                {
                    if(state === true)
                    {
                        node.getElementsByClassName("npListIcon")[0].src = "images/icons/loading.png";
                    }
                    else
                    {
                        node.getElementsByClassName("npListIcon")[0].src =  "images/player/empty.png";
                    }
                }
        }
        */
    },
    
    GetSongNode:function(song)
    {
        return this.npList.mojo.getNodeByIndex(song.index-1);
    },
    
    DisplaySongInfo: function(song, currentIndex) {
        
        
        if(currentIndex !== this.currentPlayed)
        {
            this.lastPlayed = this.currentPlayed;
            this.currentPlayed = currentIndex;
        }
        
        Mojo.Log.info("--> NowPlayingDisplaySongInfo song");
        
        if(AmpacheMobile.audioPlayer.listIsShowing === false)
        {
            this.controller.get('loaded-display').show();
            this.controller.get('songTitle').innerHTML = song.title.escapeHTML();
            if(song.artist && song.album)
            {
                this.controller.get('albumArtist').innerHTML = song.artist.escapeHTML() + " - " + song.album.escapeHTML();
            }
            else
            {
                this.controller.get('albumArtist').innerHTML = "";
            }
            if ((!song.art) || (song.art === "")) {
                $('coverArt').src = "images/blankalbum.png";
            } else {
                if ($('coverArt').src !== song.art) {
                    $('coverArt').src = "images/blankalbum.png";
                    $('coverArt').src = song.art;
                }
            }
        }
        else
        {
            if(this.npList)
            {
                var node = this.npList.mojo.getNodeByIndex(currentIndex);
            
                if(node)
                {
                    node.getElementsByClassName("npListIcon")[0].src = "images/player/play.png";
                }
                
                if(this.lastPlayed!== null)
                {
                    //this.npList.mojo.invalidateItems(0);
                    this.npList.mojo.invalidateItems(this.lastPlayed, 1);
                    //this.lastPlayed =null;
                    //this.npList.mojo.invalidateItems(currentIndex, 1);
                    
                }
                try {
                    this.npList.mojo.revealItem(currentIndex, false);
                }
                catch(ex)
                {}
            }
        }
        var xofy = (currentIndex + 1) + "/" + AmpacheMobile.audioPlayer.playList.songs.length;
        this.controller.get('song-x-of-y').innerHTML = xofy.escapeHTML();
        var title = "Now Playing";
        this.controller.get('title').innerHTML = title.escapeHTML();
        
        Mojo.Log.info("<-- NowPlayingDisplaySongInfo");
    },

    printDebug: function(event, isPlayer) {
        state = event.type;
        var display = null;
        switch (state) {
        case "loadstart":
            display = "Download Starting";
            break;
        case "load":
            display = "Downloading Finished";
            this.hideSpinner();
            break;
        
        case "canplaythrough":
            display = "Can Play Through";
            break;
        case "progress":
            var amtDownloaded ="";
            if(event.currentTarget.song)
            {
                amtDownloaded = Math.round(event.currentTarget.song.amtBuffered)+ "%";
            }
            display = "Downloading " + amtDownloaded;
            break;
        case "stalled":
            display = "Stream Loading Stalled";
            break;
        case "load":
            display = "Fully Loaded";
            break;
        case "waiting":
            display = "Waiting for More Data";
        case "play":
            display = "Played";
            break;
        case "pause":
            display = "Paused";
            break;
        case "timeupdate":
            //Do nothing with this
            break;
        case "durationchange":
            display = "Found Song Length";
            break;
        default:
            display = state;
            break;
        }
        if(display !== null)
        {
        if(isPlayer===true)
        {
            if(event.currentTarget.song)
            {
                this.controller.get('player-debug').innerHTML = "Current ("+ event.currentTarget.song.index +"): "+ display;
            }
            else
            {
                this.controller.get('player-debug').innerHTML = "Current: "+ display;
            }
        }
        else
        {
            if(event.currentTarget.song)
            {
            this.controller.get('buffer-debug').innerHTML = "Buffer ("+ event.currentTarget.song.index +"): " + display;
            }
            else
            {
                this.controller.get('buffer-debug').innerHTML = "Pool: " + display;
            }
            
        
        }
        }
    },

    setMenuControls: function() {
        var items = [];
        var leftGroup = [];
        leftGroup[0] = this._getShuffleItem();
        var centerGroup = [];
        var playButton = this.playItem;
        var rewindButton = this.rewindItem;
        var forwardButton = this.forwardItem;
        var pauseButton = this.pauseStopItem;
        centerGroup[0] = rewindButton;
        if (AmpacheMobile.audioPlayer.player && AmpacheMobile.audioPlayer.player.paused===true) {
            centerGroup[1] = playButton;
        } else {
            centerGroup[1] = pauseButton;
        }
        centerGroup[2] = forwardButton;
        var rightGroup = [];
        rightGroup[0] = this._getRepeatItem();
        // pad to center the button group
        items[0] = {
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
    },

    onStreamingErrorDismiss: function(value) {
        Mojo.Log.info("--> onErrorDialogDismiss value: " + value);
        switch (value) {
        case "retry":
            break;
        case "palm-attempt":
            this.controller.serviceRequest('palm://com.palm.applicationManager', {
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
        this.errorSong = song;
        this.controller.showAlertDialog({
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

    showError: function(errorText) {
        this.controller.showAlertDialog({
            onChoose: this.onErrorDialogDismiss.bind(this),
            title: $L("Error"),
            message: errorText,
            choices: [{
                label: $L('Cancel'),
                value: "cancel",
                type: 'dismiss'
            }]
        });
    },

    onErrorDialogDismiss: function(event) {
        this.controller.stageController.popScene();
    },

    showPauseButton: function() {
        //this.playing = true;
        this.setMenuControls();
    },

    showPlayButton: function() {
        //this.playing = false;
        this.setMenuControls();
    },

    handleCommand: function(event) {
        Mojo.Log.info("--> handleCommand:", event.command);
        if (event.type === Mojo.Event.command) {
            switch (event.command) {
            case "forward":
                AmpacheMobile.audioPlayer.next(true);
                break;
            case "rewind":
                AmpacheMobile.audioPlayer.previous(true);
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
            case "keyboardCtrls-cmd":
                this.controller.showAlertDialog({
                    title: "Now Playing Controls",
                    message: Mojo.View.render({template:"now-playing/button-help"}),
                    allowHTMLMessage:true,
                    choices: [{
                        label: $L('OK'),
                        value: "cancel",
                        type: 'dismiss'
                    }]
                });
                break;
            case "doStreamingInfo-cmd":
                this.controller.showAlertDialog({
                    // onChoose: this.onErrorDialogDismiss.bind(this),
                    title:
                    "Stream Info",
                    message: AmpacheMobile.audioPlayer.getStreamInfo(),
                    choices: [{
                        label: $L('Cancel'),
                        value: "cancel",
                        type: 'dismiss'
                    }]
                });
                break;
            case "bufferInfo-cmd":
                this.controller.showAlertDialog({
                    // onChoose: this.onErrorDialogDismiss.bind(this),
                    title: "Buffer Info",
                    allowHTMLMessage:true,
                    message: AmpacheMobile.audioPlayer.getBufferInfo(),
                    choices: [{
                        label: $L('Cancel'),
                        value: "cancel",
                        type: 'dismiss'
                    }]
                });
                break;
                
                
            
            
            case "delete-np-cmd":
                this.controller.stageController.popScene();
            }
        }
        Mojo.Log.info("<-- handleCommand:", event.command);
    },

    /**
     * Returns the proper shuffle command item for use as an item in the command list
     */
    _getShuffleItem: function() {
        var icon;
        var toggleCmd;

        if (AmpacheMobile.audioPlayer.playList.shuffle === true) {
            icon = "music-shuffle";
            toggleCmd = 'toggleShuffle';
        } else {
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

    _getRepeatItem: function() {
        //var repeatMode = this.musicPlayer.getRepeatMode();
        var icon;
        var toggleCmd;
        if (AmpacheMobile.audioPlayer.playList.repeat === 0) {
            icon = 'music-repeat';
        } else if (AmpacheMobile.audioPlayer.playList.repeat === 1) {
            icon = 'music-repeat';
            toggleCmd = 'toggleRepeat';
        } else {
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

    toggleRepeat: function() {
        AmpacheMobile.audioPlayer.playList.repeat++;
        AmpacheMobile.audioPlayer.playList.repeat = AmpacheMobile.audioPlayer.playList.repeat % 3;
        //Mojo.Log.info("--> toggleRepeat  repeatMode:", this.repeatMode);
        //AmpacheMobile.audioPlayer.setRepeatMode(AmpacheMobile.audioPlayer.playList.repeat);
        this.setMenuControls();
    },

    setRepeatMode: function() {
        this.setMenuControls();
    },

    toggleShuffle: function() {
        //this.shuffle = !this.shuffle;
        if (AmpacheMobile.audioPlayer.playList.shuffle===false) {
            AmpacheMobile.audioPlayer.playList.shuffleOn();
            
        } else {
            AmpacheMobile.audioPlayer.playList.shuffleOff();
        }
        this.setMenuControls();
        this.npList.mojo.invalidateItems(0);
        //this.npList.mojo.noticeUpdatedItems(0, AmpacheMobile.audioPlayer.playList.songs);
        this.npList.mojo.revealItem(AmpacheMobile.audioPlayer.playList.current, false);
        AmpacheMobile.audioPlayer.audioBuffers.sort(AmpacheMobile.audioPlayer.sortBuffers);
        
        AmpacheMobile.audioPlayer.bufferNextSong(AmpacheMobile.audioPlayer.player.song);
        
    },

    playItem: {
        icon: 'music-play',
        command: 'play'
    },

    playItemDisabled: {
        icon: 'music-play-disabled',
        command: 'playItemDisabled'
    },

    pauseItem: {
        icon: 'music-pause',
        command: 'pause'
    },

    stopItem: {
        icon: 'music-stop',
        command: 'stop'
    },

    shuffleOnItem: {
        toggleCmd: "toggleShuffle",
        items: [{
            command: 'shuffle-off',
            icon: 'music-shuffle'
        }]
    },

    shuffleOffItem: {
        toggleCmd: null,
        icon: 'music-shuffle',
        command: 'shuffle-on'
    },

    forwardItem: {
        icon: 'music-forward',
        command: 'forward'
    },

    forwardItemDisabled: {
        icon: 'music-forward-disabled',
        command: 'forwardItemDisabled'
    },

    rewindItem: {
        icon: 'music-rewind',
        command: 'rewind'
    },

    rewindItemDisabled: {
        icon: 'music-rewind-disabled',
        command: 'rewindItemDisabled'
    },

    repeatItem: {
        icon: 'music-repeat',
        command: 'repeat'
    },

    appMenuAttr: {
        omitDefaultItems: true
    },

    appMenuModel: {
        visible: true,
        items: [
        { label: "Preferences...",
          command:"doPref-cmd",
          shortcut:'p'
            },        
        /*{
            label: "Stream Info",
            command: "doStreamingInfo-cmd"
        },*/
        {
            label: "Delete Now Playing",
            command: "delete-np-cmd",
            shortcut:'d'
        },
        
        //{
        //    label: "Buffer Info",
        //    command: "bufferInfo-cmd"
        //    
        //},
        
        {
            label: "Controls",
            command: "keyboardCtrls-cmd"
            
        },
        StageAssistant.helpMenu,
        StageAssistant.aboutApp
        /*,
        {
            label: "About...",
            command: "about-cmd"
            
        }*/]
    }
});