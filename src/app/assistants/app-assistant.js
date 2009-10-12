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

/*  AppAssistant - AmpacheMobile
*/    

//  ---------------------------------------------------------------
//    GLOBALS
//  ---------------------------------------------------------------

//  AmpacheMobile namespace
AmpacheMobile = {};

AmpacheMobile.MenuAttr = {omitDefaultItems: true};

AmpacheMobile.MenuModel = {
    visible: true,
    items: [ 
        {label: $L("About News..."), command: "do-aboutNews"},
        Mojo.Menu.editItem,
        {label: $L("Preferences..."), command: "do-Prefs"},    
        {label: $L("Help..."), command: "do-Help"}            
    ]
};

function AppAssistant(appController){
    Mojo.Log.info("--> AppAssistant Constructor");
    //Creating Audio Player
    //AmpacheMobile.AppController = appController;
    //AppAssistant.audioPlayer = new AudioPlayer(appController);
    var browser = navigator.appName;
    Mojo.Log.info("<-- AppAssistant Constructor");
};

AppAssistant.prototype.setup = function(){
    Mojo.Log.info("Enter AppAssistant.prototype.setup");
    Mojo.Log.info("Exit AppAssistant.prototype.setup");
};

AppAssistant.prototype.handleLaunch = function (launchParams) {
    Mojo.Log.info("--> AppAssistant.prototype.handleLaunch");
    Mojo.Log.info("<-- AppAssistant.prototype.handleLaunch");
};
