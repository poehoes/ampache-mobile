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


SearchBuilderAssistant = Class.create({

    initialize: function(params) {
        this.Search = params.Search;
        this.Type = params.Type;
        this.SettingsManager = params.SettingsManager;

    },

    setup: function() {
       
        
        
         this.searchScreenModel = {
            value: 0,
            disabled: false
        };

        this.controller.setupWidget("searchBuilderScreens", this.attributes = {
            choices: [{
                label: "Search",
                value: 0
            },
            {
                label: "Date",
                value: 1
            }
            ]
        },
        this.searchScreenModel);
      
         this.searchTypeModel = {
                value:  this.Search.type,
                disabled: false
        };
      
        this.controller.setupWidget("searchSelector",
            this.attributes = {
                labelPlacement: Mojo.Widget.labelPlacementRight,
                label: "Search Type",
                choices: [
                    {label: "Global", value: SEARCH_GLOBAL, icon:"images/icons/global.png"},
                    {label: "Artists", value: SEARCH_ARTISTS, icon:"images/icons/artists.png"},
                    {label: "Albums", value: SEARCH_ALBUMS, icon:"images/icons/albums.png"},
                    {label: "Songs", value: SEARCH_SONGS, icon:"images/icons/songs.png"},
                    {label: "Playlists", value: SEARCH_PLAYLISTS, icon:"images/icons/playlists.png"},
                    {label: "Videos", value: SEARCH_VIDEOS, icon:"images/icons/videos.png"}
                ]
            },this.searchTypeModel
           
        ); 

        if(this.Search.fromDate)
        {
            var fromDate = new Date(this.Search.fromDate);
            var fromDateStr = Mojo.Format.formatDate(fromDate, {
            date: "medium"
            });
            this.controller.get("FromDate").innerHTML = fromDateStr;
        }

        //if(this.Search.toDate)
        //{
        //    var toDate = new Date(this.Search.toDate);
        //    var toDateStr = Mojo.Format.formatDate(toDate, {
        //    date: "medium"
        //    });
        //    this.controller.get("ToDate").innerHTML = toDateStr;
        //}



        this.controller.setupWidget("SearchField", this.attributes = {
            //hintText: $L('Sea')
        },
        this.model = {
            value: this.Search.searchString
        });

        this.controller.setupWidget("SearchName", this.attributes = {
            //hintText: $L('Sea')
        },
        this.model = {
            value: this.Search.name
        });

        //**********************************************************************************************************************
        //Setup Use Date Toggle
        // Setup toggle widget and  listen  for when it is changed
        this.dateToggleAttr = {
            trueLabel: 'On',
            //if the state is true, what to label the toggleButton; default is 'On'
            trueValue: true,
            //if the state is true, what to set the model[property] to; default if not specified is true
            falseLabel: 'Off',
            //if the state is false, what to label the toggleButton; default is Off
            falseValue: false,
            //if the state is false, , what to set the model[property] to; default if not specific is false],
            fieldName: 'toggle' //name of the field; optional
        };
        this.dateToggleModel = {
            value: this.Search.useDate,
            // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };
        this.controller.setupWidget('allow-date-toggle', this.dateToggleAttr, this.dateToggleModel);

         this.pickerModel = {
            date: new Date()

        };
        this.controller.setupWidget('timepicker', {
            maxYear: Number(this.pickerModel.date.getFullYear()),
            minYear: Number(this.pickerModel.date.getFullYear()) - 2
        },
        this.pickerModel);

        



        this.screenChangeHandler = this.screenChangeHandler.bind(this);
        Mojo.Event.listen(this.controller.get('searchBuilderScreens'), Mojo.Event.propertyChange, this.screenChangeHandler);
        this.screenChangeHandler();

        this.controller.listen("SearchField", Mojo.Event.propertyChange, this.changeSearch.bindAsEventListener(this));
        this.controller.listen("SearchName", Mojo.Event.propertyChange, this.changeName.bindAsEventListener(this));
        this.controller.listen("searchSelector", Mojo.Event.propertyChange, this.changeSearchType.bindAsEventListener(this));
        
        //this.controller.listen("ToRow", Mojo.Event.tap, this.selectToDate.bindAsEventListener(this));
        this.controller.listen("FromRow", Mojo.Event.tap, this.selectFromDate.bindAsEventListener(this));
        
        
        this.UseDate = this.UseDate.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('allow-date-toggle'), Mojo.Event.propertyChange, this.UseDate);
        
        
        
        

    },

    changeSearchType: function(event) {
        
        this.Search.type = event.value;
    },

    changeSearch: function(event) {
        
        this.Search.searchString = event.value;
    },

    changeName: function(event) {
        
        this.Search.name = event.value;
    },


    UseDate: function(event) {
        //Display the value of the toggle
        this.Search.useDate = event.value;
    },


    pickedToDate:function(toDate, toDateStr)
    {
        this.controller.get("ToDate").innerHTML = toDateStr;
        if(toDate === null)
        {
            this.Search.toDate = null;    
        }
        else
        {
            this.Search.toDate = toDate.getTime();
        }
    },
    
    selectToDate:function(event)
    {
        this.doDatePickerDialog("To Date", this.pickedToDate.bind(this), this.Search.toDate);
    },
    
    pickedFromDate:function(fromDate, fromDateStr)
    {
        this.controller.get("FromDate").innerHTML = fromDateStr;
        if(fromDate === null)
        {
            this.Search.fromDate = null;    
        }
        else
        {
            this.Search.fromDate = fromDate.getTime();
        }
    },
    
    selectFromDate:function(event)
    {
        this.doDatePickerDialog("From Date", this.pickedFromDate.bind(this), this.Search.fromDate);
    },

    

    doDatePickerDialog: function(type, callback, date) {
        this.controller.showDialog({
            template: 'search-builder/datepicker-dialog',
            assistant: new DateSearchDialogAssistant(this, callback,type, date)
        });

    },


    screenChangeHandler:function()
    {
        switch(this.searchScreenModel.value){
            case 0:
            this.controller.get('search-settings').style.display = 'block';
            this.controller.get('date-settings').style.display = 'none';
            break;
        case 1:
            this.controller.get('search-settings').style.display = 'none';
            this.controller.get('date-settings').style.display = 'block';
            break;
        }    
    },



    ValidSettings: function(search) {
        var retVal = true;
        this.FailureReason = "Unknown Failure";
        if ((!search.name) || (search.name === "")) {
            this.FailureReason = "No search name entered ";
            retVal = false;
        }
        if(search.useDate)
        {
            switch(parseInt(search.type, 10))
            {
                case SEARCH_GLOBAL:
                case SEARCH_VIDEOS:
                case SEARCH_PLAYLISTS:
                    this.FailureReason = "Search type " + SEARCH_TYPES[search.type] + " does not support date, turn off to continue.";
                    retVal = false;
                break;
            }
        }
        

        
        return retVal;
    },
    
    StallPressed: function(event) {
        //Display the value of the toggle
        this.Account.StallDetection = event.value;
        this.settingsManager.SaveSettings();
    },
    
    SpacesPressed:function(event){
        //Display the value of the toggle
        this.Account.SpacesWorkAround = event.value;
       
    },
    
    ExtraArtPressed: function(event) {
        //Display the value of the toggle
        if (event.value === true) {
            this.Account.ExtraCoverArt = true;
            this.showDialogBox("WARNING", "This feature is disabled by default because it greatly diminishes performance, but it sure looks good");
        } else {
            this.Account.ExtraCoverArt = false;
        }
        this.settingsManager.SaveSettings();
    },

    searchQuestions: function(value) {
        if (value === "delete") {
            this.popSearch(null);
        }
    },

    popSearch: function(account) {
       
        this.controller.stageController.popScene(null);
    },

    handleCommand: function(event) {
        //test for Mojo.Event.back, not Mojo.Event.command..
        
        if (event.type === Mojo.Event.back) {
            event.preventDefault();
            event.stopPropagation();
            if (!this.ValidSettings(this.Search)) {
                this.controller.showAlertDialog({
                    onChoose: this.searchQuestions,
                    title: $L("Search Incomplete"),
                    message: this.FailureReason,
                    choices: [{
                        label: $L('OK'),
                        value: 'ok',
                        type: 'primary'
                    },
                    {
                        label: $L('Delete Search'),
                        value: 'delete',
                        type: 'negative'
                    }]
                });
            } else {
                if (this.Type === "Add") {
                    this.SettingsManager.AppendSearch(AmpacheMobile.Account,this.Search);
                }
                this.popSearch();
            }
        } 
    },

    

   
    

    activate: function(event) {
        /* put in event handlers here that should only be in effect when this scene is active. For
         example, key handlers that are observing the document */
        SetText(false, null, AmpacheMobile.settingsManager.settings.CSSTheme);
        SetBackground(this.controller, null, "");
        
        
    },

        deactivate: function(event) {
        /* remove any event handlers you added in activate and do any other cleanup that should happen before
         this scene is popped or another scene is pushed on top */
        
        SetBackground(this.controller, AmpacheMobile.settingsManager.settings.BackgroundImage, AmpacheMobile.settingsManager.settings.BackgroundColor);
        SetText(AmpacheMobile.settingsManager.settings.UseCustomColor, AmpacheMobile.settingsManager.settings.CustomColor, AmpacheMobile.settingsManager.settings.CSSTheme);


    },

    cleanup: function(event) {
        this.controller.stopListening("SearchField", Mojo.Event.propertyChange, this.changeSearch);
        this.controller.stopListening("SearchName", Mojo.Event.propertyChange, this.changeName);
        this.controller.stopListening("searchSelector", Mojo.Event.propertyChange, this.changeSearchType);
        Mojo.Event.stopListening(this.controller.get('allow-date-toggle'), Mojo.Event.propertyChange, this.UseDate);
        //this.controller.stopListening("ToRow", Mojo.Event.tap, this.selectToDate.bindAsEventListener(this));
        this.controller.stopListening("FromRow", Mojo.Event.tap, this.selectFromDate.bindAsEventListener(this));
        
    },


   


    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message) {
        this.controller.showAlertDialog({
            onChoose: function(value) {},
            title: title,
            message: message,
            choices: [{
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    }
});





/*
        Small controller class used for the dialog sample.
*/
var DateSearchDialogAssistant = Class.create({

    initialize: function(sceneAssistant,callback, type, date) {
        this.callback = callback;
        this.sceneAssistant = sceneAssistant;
        this.controller = sceneAssistant.controller;
        this.dialogType = type;
        if(date)
        {
            this.date = new Date(date);
        }
        else
        {
            this.date = new Date();
        }
    },

    setup: function(widget) {
        
       
        
        this.widget = widget;

        this.controller.get('search-button').addEventListener(Mojo.Event.tap, this.handleDate.bindAsEventListener(this));
        this.controller.get('cancel_button').addEventListener(Mojo.Event.tap, this.handleClose.bindAsEventListener(this));
        this.controller.get('lastupdate-button').addEventListener(Mojo.Event.tap, this.lastUpdate.bindAsEventListener(this));
        this.controller.get('cleardate-button').addEventListener(Mojo.Event.tap, this.clearDate.bindAsEventListener(this));

    },

    activate:function()
    {
         if(this.date)
        {
            this.controller.assistant.pickerModel.date = this.date.clone();
            this.controller.modelChanged(this.controller.assistant.pickerModel);
        }
    },

    handleClose: function() {
        this.widget.mojo.close();

    },

    clearDate:function()
    {
        this.callback(null, "");
        this.widget.mojo.close();
    },

    lastUpdate: function() {
        this.controller.assistant.pickerModel.date = AmpacheMobile.ampacheServer.add.clone();
        this.controller.modelChanged(this.controller.assistant.pickerModel);
    },

    handleDate: function() {
        var date = this.controller.assistant.pickerModel.date;
        var dateStr = Mojo.Format.formatDate(date, {
            date: "medium"
        });

        this.callback(date, dateStr);
        this.widget.mojo.close();

    }

});