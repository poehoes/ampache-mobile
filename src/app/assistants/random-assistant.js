
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
RandomAssistant = Class.create(
{
initialize: function(){ },
    
    setup: function(){
        //*****************************************************************************************************
        // Setup Menu
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
        
        //******************************************************************************************************
        // Setup Spinner
        this.spinnerLAttrs = { spinnerSize: 'large' };
        this.spinnerModel = { spinning: false };
        this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
        
                // Setup Spinner
        this.spinnerSAttrs = { spinnerSize: 'small' };
        this.centerSpinnerModel = { spinning: true };
        this.controller.setupWidget('center-album-spinner', this.spinnerSAttrs, this.centerSpinnerModel);
        this.leftSpinnerModel = { spinning: true };
        this.controller.setupWidget('left-album-spinner', this.spinnerSAttrs, this.leftSpinnerModel);
        this.rightSpinnerModel = { spinning: true };
        this.controller.setupWidget('right-album-spinner', this.spinnerSAttrs, this.rightSpinnerModel);
        
        
        //******************************************************************************************************
        // Make scrim
         this.scrim = $("search-scrim");
         this.scrim.hide();
        
        //*********************************************************************************************************
        //  Setup Progress Pill
        this.PPattr = 
        {
            title: "Random",
            image: 'images/icons/random.png'
        };
        this.searchLoadModel = { value: 1 };
        this.controller.setupWidget('randomProgressbar', this.PPattr, this.searchLoadModel);
        
        
        this.tempArt = "images/blankalbum.png";
        
        this.randomMenu = [
       
        {
            type: $L("artists"),
            name: $L("Artists"),
            icon: "images/icons/artists.png",
            items: ["1","5","10","20"]
            
        }, 

        {
            type: $L("albums"),
            name: $L("Albums"),
            icon: "images/icons/albums.png",
            items: ["1","5","10","20"]
        }, 
        
        {
            type: $L("songs"),
            name: $L("Songs"),
            icon: "images/icons/songs.png",
            items: ["10","25","50","100", "200"]
            
        }
        
       
        ];
        
        
        this.controller.setupWidget('randomMenuList', 
        {
            itemTemplate: 'random/listitem'
        }, 
        {
            items: this.randomMenu
        });
        
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('randomMenuList'), Mojo.Event.listTap, this.listTapHandler);
        
  
        //*******************************************************************************************************
        // Random Album Selector
        var photoAttributes = {
            limitZoom:true,
            highResolutionLoadTimeout:0

            //noExtractFS : true
        };
        
        this.photoModel = {
            onLeftFunction: this.wentLeft.bind(this),
            onRightFunction: this.wentRight.bind(this)
        };
        this.controller.setupWidget('myPhotoDiv', photoAttributes, this.photoModel);
        this.myPhotoDivElement = $('myPhotoDiv');
        
        this.controller.get('myPhotoDiv').observe(Mojo.Event.tap, this.pushAlbum.bindAsEventListener(this));

        
        this.fetching = "center";
        this.GetRandomAlbum();
    },
    
    pushAlbum:function(){
        this.controller.stageController.pushScene('songs', {
            SceneTitle: this.center.artist + " - " + this.center.name,
            Type: "album",
            Album_id: this.center.id,
            Item: this.center

        });
    },
    
    center_stale:true,
    right_stale:true,
    left_stale:true,
    
    center:null,
    right:null,
    left:null,
    fetching:null,
    
    
    UpdateText:function()
    {
        this.controller.get('albumArtist').innerHTML = this.center.artist.escapeHTML() + " - " + this.center.name.escapeHTML();
    },
    
    
    AlbumSpinner: function(spinner, OnOff){
        var model;
        
        switch(spinner)
        {
            case "center":
                model = this.centerSpinnerModel;
                break;
            case "left":
                model = this.leftSpinnerModel;
                break;
            case "right":
                model = this.rightSpinnerModel;
                break;
            
        }
        
        model.spinning = OnOff;
        this.controller.modelChanged(model);
    },
    
    GetRandomAlbum:function()
    {
        this.AlbumSpinner(this.fetching, true);
        //this.TurnOnSpinner();
        var random = Math.floor(Math.random()* parseInt(AmpacheMobile.ampacheServer.albums, 10));
        AmpacheMobile.ampacheServer.GetAlbums(this.GotRandomAlbum.bind(this), null, null,random, 1, null);
    },
    
    GotRandomAlbum:function(album)
    {
        var params = this.myPhotoDivElement.mojo.getCurrentParams();
        
        switch(this.fetching)
        {
            case "center":
                
                this.center = album[0];
                this.myPhotoDivElement.mojo.centerUrlProvided(this.center.art, this.tempArt);
                this.center_stale=false;
                this.UpdateText();
                this.AlbumSpinner("center", false);
                break;
            case "left":
                this.left = album[0];
                this.myPhotoDivElement.mojo.leftUrlProvided(this.left.art, this.tempArt);
                this.left_stale=false;
                this.AlbumSpinner("left", false);
                break;
            case "right":
                this.right = album[0];
                this.myPhotoDivElement.mojo.rightUrlProvided(this.right.art, this.tempArt);
                this.right_stale=false;
                this.AlbumSpinner("right", false);
                break;
            default:
                //this.TurnOffSpinner();
                break;
        }
        
        if(this.center_stale)
        {
            Mojo.Log.info("Fetching Center");
            this.fetching = "center";
            this.GetRandomAlbum();
        }
        else if(this.right_stale)
        {
            Mojo.Log.info("Fetching right");
            this.fetching = "right";
            this.GetRandomAlbum();
        }
        else if(this.left_stale)
        {
            Mojo.Log.info("Fetching left");
            this.fetching = "left";
            this.GetRandomAlbum();
        }
        
        if(!this.center_stale && !this.right_stale && !this.left_stale)
        {
            //this.TurnOffSpinner();
        }
        
        
    },
    

    
    wentLeft: function (event) {
        this.left_stale = true;
        this.right = this.center;
        this.center=this.left;
        this.fetching = "left";
        this.UpdateText();
        this.GetRandomAlbum();
    },
    
    wentRight: function (event) {
        this.right_stale = true;
        this.left = this.center;
        this.center = this.right;
        this.fetching = "right";
        this.UpdateText();
        this.GetRandomAlbum();
    },
    
    
    
    listTapHandler: function(event)
    {
    
        var item = event.item;
        item._this = this;
        
        var items = [];
        
        for(i=0;i<event.item.items.length;i++)
        {
            items[i] ={
                label: event.item.items[i] + " " + event.item.name,
                command: event.item.type + "-" + event.item.items[i]
            };
        }
        
        this.controller.popupSubmenu(
        {
            onChoose: this.popupHandler.bind(item),
            placeNear: event.originalEvent.target,
            items: items
        });
        
    },
    
    
    
    popupHandler: function(event)
    {
        if(event)
        {
            var item = this;
            
            var controller = item._this.controller;
            var command = event.split("-");
            var numItems = parseInt(command[1], 10);
            
            if (command[0] === "artists") 
            {
                controller.stageController.pushScene("artists", 
                {
                    SceneTitle: numItems + " Random Artists",
                    ExpectedArtists: numItems,
                    type:"random"
                });
            }
            
            else if (command[0] === "albums") 
            {
                controller.stageController.pushScene('albums', 
                {
                    SceneTitle: numItems +" Random Albums",
                    Type: "random",
                    ExpectedAlbums: numItems
                });
            }
            
            else if (command[0] === "songs") 
            {
                controller.stageController.pushScene('songs', 
                {
                    SceneTitle: numItems + " Random Songs",
                    Type: "random",
                    DisplayArtistInfo: true,
                    Expected_items: numItems
                });
            }
        }
    },
    

    /*
    searchForPlaylists: function(){
        if (this.searchCriteria(3)){
            this.TurnOnSpinner();
            var numPlaylists = parseInt(AmpacheMobile.ampacheServer.playlists, 10);
            if (numPlaylists !== 0){
                this.controller.stageController.pushScene('playlists', 
                {
                    SceneTitle: "Playlist Search: " + this.searchText,
                    Search: this.searchText === "" ? null : this.searchText,
                    ExpectedPlaylists: numPlaylists
                });
            }
        }
    },
    */

    
    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message){
        this.controller.showAlertDialog(
        {
            onChoose: this.SetFocus.bind(this),
            title: title,
            message: message,
            choices: [
            {
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    },
    
    
    
    
    TurnOnSpinner: function(spinnerText){
        this.scrim.show();
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
    },
    
    TurnOffSpinner: function(){
        this.scrim.hide();
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
    },
    
    activate: function(event){
        
        //this.myPhotoDivElement.mojo.manualSize('200', '200');
    },
    
    deactivate: function(event){
        this.TurnOffSpinner();
    },
    
    cleanup: function(event){
    }
    
});
