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
ItemsHelper = Class.create({
    //AmpacheServer:null,

    offset: 0,
    count: null,
    LoadingFinished: false,
    Visible: false,
    percentDone: 0,

    initialize: function(ItemsList) {
        this.ItemsList = [];
        this.Canceled = false;
    },

    setup: function(params) {
        this.type = params.controller.sceneName;
        this.controller = params.controller;
        this.filterList = params.filterList;
        this.getItemsCallback = params.getItemsCallback;
        
        this.numItemsDisplay = params.numItemsDisplay;
        //this.ItemsList = params.ItemsList;

        //this.progressModel = params.progressModel;
        this.fetchLimit = params.fetchLimit;
        //this.TurnOffSpinner = params.TurnOffSpinner;
        this.ExpectedItems = params.ExpectedItems;
        this.SortFunction = params.SortFunction;

        this.onLoadingFinished = params.onLoadingFinished;

        //this.listModel = params.listModel;
        this.MatchFunction = params.MatchFunction;

        this.PopulateSort = params.PopulateSort;

        this.IndexBusted = params.IndexBusted;

        //this.UpdateProgress = params.UpdateProgress;

        this.reloadModel = {
            label: $L('Reload'),
            //icon: 'forward',
            iconPath: "images/icons/download.png",
            command: 'finish-loading'
        };

        this.stopModel = {
            label: $L('Stop'),
            icon: 'load-progress',
            command: 'stop'
        };

        this.CurrentWaitImage = 0;
        this.waitModel = {
            label: $L('Stop'),
            icon: 'load-search',
            command: 'stop'
        };

        this.cmdMenuModel = {
            visible: true,
            items: [{},
            this.reloadModel]
        };

        this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);

        this.cmdMenuModel.items.pop(this.reloadModel);
        this.cmdMenuModel.items.push(this.waitModel);
        this.controller.modelChanged(this.cmdMenuModel);

        this.currLoadProgressImage = 0;

        this.percentDone = 0;

        //this.waiting = true;
        //this.WaitAnimation();

        this.waitingAnimation = new SpinningAnimation({
            controller: this.controller,
            model: this.waitModel
        });

        this.spacerDiv = this.controller.get('spacerDiv');
        this.scrim = this.controller.get('scrim');

        this.filterChange = this.handleFilterChange.bind(this);
        Mojo.Event.listen(this.filterList, Mojo.Event.filterImmediate, this.filterChange);

    },

    cleanup: function() {
        Mojo.Event.stopListening(this.filterList, Mojo.Event.filterImmediate, this.filterChange);
    },

    

    GotoLoadingMode: function() {
        this.waiting = false;
        this.waitingAnimation.stop();

        this.cmdMenuModel.items.pop(this.waitModel);
        this.cmdMenuModel.items.push(this.stopModel);
        this.controller.modelChanged(this.cmdMenuModel);
    },

    GotoRefreshMode: function() {
        this.cmdMenuModel.items.pop(this.stopModel);
        this.cmdMenuModel.items.push(this.reloadModel);
        this.controller.modelChanged(this.cmdMenuModel);
    },

    GetItems: function() {
        if ((this.Visible === true) && (this.LoadingFinished === false) && (this.Canceled === false)) {
            this.getItemsCallback(this.GotItems.bind(this), this.offset, this.fetchLimit);
        }
    },

    GotItems: function(_ItemsList) {
        if(_ItemsList === "error")
        {
            this.CancelRequest();
            this.GotoRefreshMode();
        }
        else
        {
        
        
            if (this.percentDone === 0) {
                this.GotoLoadingMode();
                this.scrim.hide();
            }
    
            //this.TurnOffSpinner();
    
            if (this.PopulateSort) {
                this.PopulateSort(_ItemsList);
            }
    
    
            this.ItemsList = this.ItemsList.concat(_ItemsList);
            //for (var i = 0; i < _ItemsList.length; i++) {
            //
            //    var newItem = _ItemsList[i];
            //    this.ItemsList.push(newItem);
            //
            //}
    
            //Update Progress
            this.percentDone = this.ItemsList.length / this.ExpectedItems;
            //var progress = this.ItemsList.length / this.ExpectedItems;
            //this.progressModel.value = progress;
            //this.controller.modelChanged(this.progressModel);
    
            this.loadProgress(this.percentDone * 100);
    
            //Sorting Here
    
            if ((this.SortFunction) && (_ItemsList.length<2000)) {
    
                this.ItemsList.sort(this.SortFunction);
            }
    
            //Add to list   
    
            if (!this.IsFiltered()) {
                this.Matches = this.ItemsList;
                this.filterList.mojo.noticeUpdatedItems(0, this.Matches);    
            } else //list currently has a filter
            {
                var matches = this.GetAllMatches(this.filterString);
                this.filterList.mojo.noticeUpdatedItems(0, matches);
                this.filterList.mojo.setLength(matches.length);
                this.filterList.mojo.setCount(matches.length);
            }
    
            if ((this.ItemsList.length >= this.ExpectedItems) || (_ItemsList.length !== this.fetchLimit) || this.IndexBusted) {
                this.percentDone = 1;
                this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
                this.LoadingFinished = true;
                if(this.onLoadingFinished)
                {
                    this.onLoadingFinished();
                }
                if(this.ItemsList.length===0)
                {
                    this.ShowErrorAlert("No Items", "No Items have been processed, please retry your request.");
                }
            }
    
            else {
                this.offset = this.ItemsList.length;
                this.GetItems();
                
            }
    
            if(this.numItemsDisplay)
            {
                this.numItemsDisplay.innerHTML = this.ItemsList.length;
            }
            
            
            Mojo.Log.info("<-- FinishedGettings");
        }
    },


    GetMoreItems:function(howmany)
    {
        this.ExpectedItems += howmany;
        this.percentDone = this.ItemsList.length / this.ExpectedItems;
        this.loadProgress(this.percentDone * 100);
        
        this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
        this.LoadingFinished = false;
        this.RestartRequest();
   
    },


    IsFiltered: function() {
        if ((this.filterString === "") || (!this.filterString)) {
            return false;
        }
        return true;
    },

    ReSortList: function() {
        //if (this.LoadingFinished) 
        //{
        if (this.PopulateSort) {
            this.PopulateSort(this.ItemsList);
        }

        if (this.SortFunction) {
            this.ItemsList.sort(this.SortFunction);
        }

        //Add to list   
        if (!this.IsFiltered()) {
            this.Matches = this.ItemsList;
            this.filterList.mojo.noticeUpdatedItems(0, this.Matches);
        } else //list currently has a filter
        {
            this.Matches = this.GetAllMatches(this.filterString);
            this.filterList.mojo.noticeUpdatedItems(0, this.Matches);
            this.filterList.mojo.setLength(this.Matches.length);
            this.filterList.mojo.setCount(this.Matches.length);
        }
        //}
    },

    RestartRequest: function() {
        this.Canceled = false;
        this.GetItems();
    },

    CancelRequest: function() {
        this.Canceled = true;
        switch (this.type) {
        case "artists":
            AmpacheMobile.ampacheServer.GetArtistsCancel();
            break;
        case "albums":
            AmpacheMobile.ampacheServer.GetAlbumsCancel();
            break;
        case "songs":
            AmpacheMobile.ampacheServer.GetSongsCancel();
            break;
        case "genres":
            AmpacheMobile.ampacheServer.GetTagsCancel();
            break;
        case "playlists":
            AmpacheMobile.ampacheServer.GetPlaylistsCancel();
            break;
        }
    },

    handleCommand: function(event) {
        switch (event.command) {
        case "stop":
            this.CancelRequest();
            if (this.percentDone === 0) {
                Mojo.Controller.stageController.popScene();
            } else {
                this.GotoRefreshMode();
            }
            break;
        case "finish-loading":
            
            if(this.percentDone===0)
            {
                this.waitingAnimation.start();
                this.cmdMenuModel.items.pop(this.reloadModel);
                this.cmdMenuModel.items.push(this.waitModel);
                this.controller.modelChanged(this.cmdMenuModel);
            }
            else
            {
                this.GotoLoadingMode();
                this.currLoadProgressImage = 0;
                this.loadProgress(this.percentDone * 100);
            }
            this.RestartRequest();
            break;
        }
    },

    handleFilterChange: function(event) {
        if (event.filterString.blank()) {
            this.spacerDiv.show();
        } else {
            this.spacerDiv.hide();
        }

    },

    GetAllMatches: function(filterString) {
        var subset = [];

        if (filterString === "") {
            for (var i = 0; i < this.ItemsList.length; i++) {
                subset.push(this.ItemsList[i]);
            }
        } else {
            for (i = 0; i < this.ItemsList.length; i++) {
                if (this.MatchFunction(this.ItemsList[i], filterString)) {
                    subset.push(this.ItemsList[i]);
                }
            }
        }
        
        return subset;
    },

    filterString: null,
    Matches: null,
    LastFilterLength: null,

    FilterList: function(filterString, listWidget, offset, count) {
        Mojo.Log.info("--> Items Helper FilterList filterString:", filterString, "offset:", offset, "count:", count);
        var subset = [];

        if ((this.ItemsList) && (this.ItemsList.length !== 0)) {

            if ((filterString !== this.filterString) || (this.LastFilterLength !== this.ItemsList.length)) {
                this.LastFilterLength = this.ItemsList.length;
                this.Matches = this.GetAllMatches(filterString);
                this.filterString = filterString;
            }

            Mojo.Log.info("Filtering: " + filterString);

            var Matches = this.Matches;

            for (var i = 0; i < count; i++) {
                if ((i + offset) < Matches.length) {

                    subset.push(Matches[i + offset]);
                }

            }

            listWidget.mojo.noticeUpdatedItems(offset, subset);
            listWidget.mojo.setLength(Matches.length);
            listWidget.mojo.setCount(Matches.length);

        }

        Mojo.Log.info("<-- Items Helper FilterList:");

    },
    Deactivate: function() {
        if (this.percentDone < 1) {
            this.CancelRequest();
            this.GotoRefreshMode();
        }
        this.Visible = false;
        Mojo.Event.stopListening(this.controller.get('now-playing-button'), Mojo.Event.tap, this.npTapHandler);
    },

    Activate: function() {
        this.Visible = true;

        if (this.percentDone === 0) {
            this.waitingAnimation.start();
            this.GetItems();
        }

        // Now Playing Button
        var button = this.controller.get('now-playing-button');
        button.style.display = AmpacheMobile.audioPlayer.hasPlayList ? 'block': 'none';
        this.npTapHandler = this.showNowPlaying.bindAsEventListener(this);
        Mojo.Event.listen(button, Mojo.Event.tap, this.npTapHandler);

        //this.GetItems();
    },


    ShowErrorAlert: function(title, string) {
        var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
        controller.showAlertDialog({
            onChoose: this.alertButton.bind(this),
            allowHTMLMessage: true,
            title: $L(title),
            message: $L(string),
            choices: [{
                label: $L('Go Back'),
                value: 'go-back',
                type: 'secondary'
            },{
                label: $L('OK'),
                value: 'ok',
                type: 'primary'
            }]
        });

    },

    alertButton:function(event)
    {
        if(event==="go-back")
        {
            this.CancelRequest();
            Mojo.Controller.stageController.popScene();
        }
    },

    showNowPlaying: function() {
        Mojo.Controller.stageController.pushScene({transition: AmpacheMobile.Transition, name: "now-playing"}, {
            type: "display"
        });
    },

    //  loadProgress - check for completion, then update progress
    WaitAnimation: function() {

        if (this.waiting === true) {
            //var percent = event.progress;
            try {
                if (!this.currWaitImage) {
                    this.currWaitImage = 0;
                }

                image = (this.currWaitImage + 1) % 13;

                // Has the progress changed?
                if (this.currWaitImage != image) {
                    // Cancel the existing animator if there is one
                    if (this.waitAnimator) {
                        this.waitAnimator.cancel();
                        delete this.waitAnimator;
                    }

                    // Animate from the current value to the new value
                    var icon = this.controller.select('div.load-search')[0];
                    if (icon) {
                        this.waitAnimator = Mojo.Animation.animateValue(Mojo.Animation.queueForElement(icon), "linear", this._updateWaitAnimation.bind(this), {
                            from: this.currWaitImage,
                            to: image,
                            duration: 0.1,
                            onComplete: this.WaitAnimation.bind(this)
                        });
                    }
                }

            } catch(e) {
                Mojo.Log.logException(e, e.description);
            }
        }
    },

    _updateWaitAnimation: function(image) {

        // Find the progress image
        image = Math.round(image);
        // Don't do anything if the progress is already displayed
        if (this.currWaitImage == image) {

            return;
        }
        var icon = this.controller.select('div.load-search');
        if (icon && icon[0]) {
            icon[0].setStyle({
                'background-position': "0px -" + (image * 48) + "px"
            });
        }
        this.currWaitImage = image;

    },

    //  loadProgress - check for completion, then update progress
    loadProgress: function(percent) {

        //var percent = event.progress;
        try {
            if (percent > 100) {
                percent = 100;
            } else if (percent < 0) {
                percent = 0;
            }

            // Update the percentage complete
            this.currLoadProgressPercentage = percent;

            // Convert the percentage complete to an image number
            // Image must be from 0 to 25 (26 images available)
            var image = Math.round(percent / 3.85);
            if (image > 25) {
                image = 25;
            }

            // Ignore this update if the percentage is lower than where we're showing
            //if (image < this.currLoadProgressImage) {
            //    return;
            //}

            // Has the progress changed?
            if (this.currLoadProgressImage != image) {
                // Cancel the existing animator if there is one
                if (this.loadProgressAnimator) {
                    this.loadProgressAnimator.cancel();
                    delete this.loadProgressAnimator;
                }

                // Animate from the current value to the new value
                var icon = this.controller.select('div.load-progress')[0];
                if (icon) {
                    this.loadProgressAnimator = Mojo.Animation.animateValue(Mojo.Animation.queueForElement(icon), "linear", this._updateLoadProgress.bind(this), {
                        from: this.currLoadProgressImage,
                        to: image,
                        duration: 0.1
                    });
                }
            }
        } catch(e) {
            Mojo.Log.logException(e, e.description);
        }
    },

    _updateLoadProgress: function(image) {

        // Find the progress image
        image = Math.round(image);
        // Don't do anything if the progress is already displayed
        if (this.currLoadProgressImage == image) {
            return;
        }
        var icon = this.controller.select('div.load-progress');
        if (icon && icon[0]) {
            icon[0].setStyle({
                'background-position': "0px -" + (image * 48) + "px"
            });
        }
        this.currLoadProgressImage = image;
    }

});

SpinningAnimation = Class.create({

    initialize: function(details) {

        Mojo.require(details.controller, "SpinningAnimation requires a controller");
        Mojo.require(details.model, "SpinningAnimation requires a model");
        this._controller = details.controller;
        this._model = details.model;
        this._iconClass = details.model.icon;
        this._iconSelector = '.' + details.model.icon;

        this._frameHeight = details.frameHeight || 48;
        this._frameCount = details.frameCount || 12;
        this._fps = details.fps || 12;

        this._drawInterval = Math.max(1, Mojo.Animation.targetFPS / this._fps);
        this._currentFrameIndex = 0;
        this._hasStarted = false;
    },

    _getElement: function() {

        var icon = this._controller.select(this._iconSelector);
        if (icon) {
            icon = icon[0];
        }
        return icon;
    },

    start: function() {

        // Add to the animation queue if the element exists.
        var element = this._getElement();
        if (element) {
            // Get a handle onto the main animation queue.
            this._animationQueue = Mojo.Animation.queueForElement(element);
        }

        // If the play period isn't defined the play forever.
        this._currentFrameIndex = 0;
        this._drawCount = 0;
        if (!this._hasStarted && this._animationQueue) {
            this._animationQueue.add(this);
            this._hasStarted = true;
        }
    },

    stop: function() {

        if (this._hasStarted && this._animationQueue) {
            this._animationQueue.remove(this);
        }
        this._hasStarted = false;
    },

    animate: function() {

        if (this._drawCount < this._drawInterval) {
            this._drawCount++;
        } else {
            this._drawCount -= this._drawInterval;
            this._currentFrameIndex++;
            this._currentFrameIndex = this._currentFrameIndex % this._frameCount;
            this._setFrame(this._currentFrameIndex);
        }
    },

    _setFrame: function(index) {

        var element = this._getElement();
        if (element) {
            if (this._model._progress) {
                element.removeClassName(this._model._progress);
            }
            var progress = 'progress-' + index;
            element.addClassName(progress);
            this._model.icon = this._iconClass + ' ' + progress;
            this._model._progress = progress;
        }
    }
});