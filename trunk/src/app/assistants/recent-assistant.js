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
RecentAssistant = Class.create({
    initialize: function() {},

    setup: function() {
        //*****************************************************************************************************
        // Setup Menu
        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);

        this.randomMenu = [{
            type: $L("lastUpdate"),
            name: $L("Last Update"),
            icon: "images/icons/recent.png",
            displayCount: "none"

        },
        {
            type: $L("artists"),
            name: $L("Artists"),
            icon: "images/icons/artists.png",
            items: ["Last Update", "1 Week", "1 Month", "3 Months", "Date"],
            displayCount: "none"

        },

        {
            type: $L("albums"),
            name: $L("Albums"),
            icon: "images/icons/albums.png",
            items: ["Last Update", "1 Week", "1 Month", "3 Months", "Date"],
            displayCount: "none"
        },

        {
            type: $L("songs"),
            name: $L("Songs"),
            icon: "images/icons/songs.png",
            items: ["Last Update", "1 Week", "1 Month", "3 Months", "Date"],
            displayCount: "none"

        }

        ];

        this.controller.setupWidget('recentMenuList', {
            itemTemplate: 'random/listitem'
        },
        {
            items: this.randomMenu
        });

        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('recentMenuList'), Mojo.Event.listTap, this.listTapHandler);

        this.pickerModel = {
            date: new Date()
            
        };
        this.controller.setupWidget('timepicker', {
            maxYear:Number(this.pickerModel.date.getFullYear()),
            minYear:Number(this.pickerModel.date.getFullYear())-2
        },
        this.pickerModel);

    },

    cleanup: function(event) {
        Mojo.Event.stopListening(this.controller.get('recentMenuList'), Mojo.Event.listTap, this.listTapHandler);

    },

    listTapHandler: function(event) {

        if (event.item.type === "lastUpdate") {
            fromDate = new Date();
            fromDate = AmpacheMobile.ampacheServer.add.clone();
            fromDate.addHours( - 2);

            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "songs"
            },
            {
                SceneTitle: "Recent Songs: Last Update",
                Type: "recent",
                DisplayArtistInfo: true,
                FromDate: fromDate
            });
        }

        var item = event.item;
        //item._this = this;
        var items = [];

        for (i = 0; i < event.item.items.length; i++) {
            items[i] = {
                label: event.item.items[i],
                command: event.item.type + ";" + event.item.items[i]
            };
        }

        this.tapTypeItem = event.item;

        this.controller.popupSubmenu({
            onChoose: this.popupHandler.bind(this),
            placeNear: event.originalEvent.target,
            items: items
        });

    },

    popupHandler: function(event) {
        if (event) {
            var item = this.tapTypeItem;

            var controller = this.controller;
            var command = event.split(";");
            //var numItems = parseInt(command[1], 10);
            var fromDate = new Date();
            switch (command[1]) {
            case "Last Update":
                fromDate = AmpacheMobile.ampacheServer.add.clone();
                fromDate.addHours( - 2);
                break;
            case "1 Week":
                fromDate.addDays( - 7);
                break;
            case "1 Month":
                fromDate.addMonths( - 1);
                break;
            case "3 Months":
                fromDate.addMonths( - 3);
                break;
            case "Date":
                this.doDatePickerDialog(command[0], event);
                break;

            }
            if (command[1] !== "Date") {
                if (command[0] === "artists") {

                    controller.stageController.pushScene({
                        transition: AmpacheMobile.Transition,
                        name: "artists"
                    },
                    {
                        SceneTitle: "Recent Artists: " + command[1],
                        ExpectedArtists: 0,
                        type: "recent",
                        FromDate: fromDate
                    });
                }

                else if (command[0] === "albums") {
                    controller.stageController.pushScene({
                        transition: AmpacheMobile.Transition,
                        name: "albums"
                    },
                    {
                        SceneTitle: "Recent Albums: " + command[1],
                        Type: "recent",
                        ExpectedAlbums: 0,
                        FromDate: fromDate
                    });
                }

                else if (command[0] === "songs") {

                    controller.stageController.pushScene({
                        transition: AmpacheMobile.Transition,
                        name: "songs"
                    },
                    {
                        SceneTitle: "Recent Songs: " + command[1],
                        Type: "recent",
                        DisplayArtistInfo: true,
                        FromDate: fromDate
                    });
                }
            }
        }
    },

    doDatePickerDialog: function(type, e) {
        this.controller.showDialog({
            template: 'recent/datepicker-dialog',
            assistant: new DateDialogAssistant(this, type)
        });

    },

    searchForAlbums: function() {},

    searchForSongs: function() {},

    searchForArtists: function() {},

    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message) {
        this.controller.showAlertDialog({
            onChoose: null,
            title: title,
            message: message,
            choices: [{
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    },

    TurnOnSpinner: function(spinnerText) {
        this.scrim.show();
        this.spinnerModel.spinning = true;
        this.controller.modelChanged(this.spinnerModel);
    },

    TurnOffSpinner: function() {
        this.scrim.hide();
        this.spinnerModel.spinning = false;
        this.controller.modelChanged(this.spinnerModel);
    },

    activate: function(event) {
        // Now Playing Button
        var button = this.controller.get('now-playing-button');
        button.style.display = AmpacheMobile.audioPlayer.PlayListPending ? 'block': 'none';
        this.npTapHandler = this.showNowPlaying.bindAsEventListener(this);
        Mojo.Event.listen(button, Mojo.Event.tap, this.npTapHandler);
    },

    deactivate: function(event) {

        Mojo.Event.stopListening(this.controller.get('now-playing-button'), Mojo.Event.tap, this.npTapHandler);
    },

    showNowPlaying: function() {
        Mojo.Controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "now-playing"
        },
        {
            type: "display"
        });
    }

});

/*
        Small controller class used for the dialog sample.
*/
var DateDialogAssistant = Class.create({

    initialize: function(sceneAssistant, type) {
        this.sceneAssistant = sceneAssistant;
        this.controller = sceneAssistant.controller;
        this.dialogType = type;
    },

    setup: function(widget) {
        this.widget = widget;

        this.controller.get('search-button-text').innerHTML = "Find recent " + this.dialogType;
        //this.controller.get('date-dialog-title').innerHTML = "Find recent " + this.dialogType;
        this.controller.get('search-button').addEventListener(Mojo.Event.tap, this.handleSearch.bindAsEventListener(this));
        this.controller.get('cancel_button').addEventListener(Mojo.Event.tap, this.handleClose.bindAsEventListener(this));
        this.controller.get('lastupdate-button').addEventListener(Mojo.Event.tap, this.lastUpdate.bindAsEventListener(this));
        
        
    },

    handleClose: function() {
        this.widget.mojo.close();

    },

    lastUpdate:function()
    {
        this.controller.assistant.pickerModel.date = AmpacheMobile.ampacheServer.update.clone();
        this.controller.modelChanged(this.controller.assistant.pickerModel);
    },

    handleSearch: function() {
        var fromDate = this.controller.assistant.pickerModel.date;
        var fromDateStr = "Since " + Mojo.Format.formatDate(fromDate, {
            date: "short"
        });

        if (Number(fromDate) < Number(new Date())) {

            if (this.dialogType === "artists") {

                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "artists"
                },
                {
                    SceneTitle: "Recent Artists: " + fromDateStr,
                    ExpectedArtists: 0,
                    type: "recent",
                    FromDate: fromDate
                });
            }

            else if (this.dialogType === "albums") {
                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "albums"
                },
                {
                    SceneTitle: "Recent Albums: " + fromDateStr,
                    Type: "recent",
                    ExpectedAlbums: 0,
                    FromDate: fromDate
                });
            }

            else if (this.dialogType === "songs") {

                this.controller.stageController.pushScene({
                    transition: AmpacheMobile.Transition,
                    name: "songs"
                },
                {
                    SceneTitle: "Recent Songs: " + fromDateStr,
                    Type: "recent",
                    DisplayArtistInfo: true,
                    FromDate: fromDate
                });
            }
            this.widget.mojo.close();
        }
        else {
            //this.widget.mojo.close();
            this.controller.assistant.showDialogBox("Date Invalid", "Please select a date in the past.");
        }
        
    },

});