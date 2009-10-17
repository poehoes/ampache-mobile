
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
        
        
        
        
        //*****************************************************************************************************
        // Search Event
        this.controller.get('randomArtists').observe(Mojo.Event.tap, this.randomArtists.bindAsEventListener(this));
        this.controller.get('randomAlbum').observe(Mojo.Event.tap, this.randomAlbums.bindAsEventListener(this));
        this.controller.get('randomSongs').observe(Mojo.Event.tap, this.randomSongs.bindAsEventListener(this));
        //this.controller.get('searchPlaylists').observe(Mojo.Event.tap, this.searchForPlaylists.bindAsEventListener(this));
  

    },
    

    
    
    
    randomGenerator:function(numberOfItems)
    {
        return Math.floor(Math.random()*numberOfItems);
    },
    
    numRandomArtists:5,
    randomArtists: function(){
       
        //this.TurnOnSpinner();
        this.controller.stageController.pushScene("artists", 
        {
            SceneTitle: this.numRandomArtists + " Random Artists",
            ExpectedArtists: this.numRandomArtists,
            type:"random"
        });
            
        
    },
    
    numRandomAlbums:5,
    randomAlbums: function(){
        //this.TurnOnSpinner();
        //Math.floor(Math.random()* parseInt(AmpacheMobile.ampacheServer.albums, 10));
        //var randomAlbum = this.randomGenerator(parseInt(AmpacheMobile.ampacheServer.albums, 10));
        this.controller.stageController.pushScene('albums', 
        {
            SceneTitle: this.numRandomAlbums +" Random Albums",
            Type: "random",
            ExpectedAlbums: this.numRandomAlbums
            
        });
        
    },
    
    numRandomSongs:30,
    randomSongs: function(){
        //this.TurnOnSpinner();
        this.controller.stageController.pushScene('songs', 
        {
            SceneTitle: this.numRandomSongs + " Random Songs",
            Type: "random",
            DisplayArtistInfo: true,
            Expected_items: this.numRandomSongs
        });
        
    },
    
    
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
        
    },
    
    deactivate: function(event){
        this.TurnOffSpinner();
    },
    
    cleanup: function(event){
    }
    
});
