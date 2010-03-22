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

var PREF_COLOR = '#4c4c4c';

PreferencesAssistant = Class.create({

    initialize: function(params) {
        this.settingsManager = params.settingsManager;

    },

    stylesheet: null,

    setup: function() {
        
        //**********************************************************************
        // Setup Customization Settings
        this.CSSTheme = AmpacheMobile.settingsManager.settings.CSSTheme;
        
        this.themeTypeModel = {
                value:  this.CSSTheme,
                disabled: false                
        };        

        this.controller.setupWidget("theme-selector",
            this.attributes = {
                labelPlacement: Mojo.Widget.labelPlacementLeft,
                label: "Theme",
                choices: [
                    {label: "None", value: THEME_NONE},
                    {label: THEMES[THEME_DARK], value: THEME_DARK}
                   
                ]
            },this.themeTypeModel
           
        ); 
        
        this.controller.setupWidget(Mojo.Menu.appMenu,
            this.attributes = {
                omitDefaultItems: true
            },
            this.model = {
                visible: false,
                items: [ StageAssistant.aboutApp ]
            }
         );
        
        this.themeSelectorChanged = this.themeSelectorChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('theme-selector'), Mojo.Event.propertyChange, this.themeSelectorChanged);
        
        //Mojo.loadStylesheet(this.controller.document, "stylesheets/preferences.css");
        SetBackground(this.controller, null, "");
        SetText(false, null, AmpacheMobile.settingsManager.settings.CSSTheme);
        //this.controller.get('body_wallpaper').style.backgroundColor = PREF_COLOR;

        //**********************************************************************
        //Setup Radio Button
        this.prefTypeModel = {
            value: 0,
            disabled: false
        };
        
        this.controller.setupWidget("preference-type", this.attributes = {
            choices: [{
                label: "Account",
                value: 0
            },
            {
                label: "Color",
                value: 1
            },
            {
                label: "More",
                value: 2
            }]
        },
        this.prefTypeModel);

        this.prefTypeChangeHandler = this.prefTypeChangeHandler.bind(this);
        Mojo.Event.listen(this.controller.get('preference-type'), Mojo.Event.propertyChange, this.prefTypeChangeHandler);

        //**********************************************************************
        // Setup Accounts
        this.accountsModel = {
            listTitle: $L('Accounts'),
            items: this.settingsManager.settings.Accounts
        };
        this.innerListAttrs = {
            listTemplate: 'preferences/listContainer',
            itemTemplate: 'preferences/listItem',
            addItemLabel: $L("Add Account..."),
            swipeToDelete: true,
            autoconfirmDelete: false,
            deletedProperty: 'swiped',
            reorderable:true

        };
        this.controller.setupWidget('innerList', this.innerListAttrs, this.accountsModel);

        this.UpdateSelectorAccounts();

        var SelectorStartIndex;
        if (this.settingsManager.settings.CurrentAccountIndex === -1) {
            SelectorStartIndex = 0;
        } else if (this.settingsManager.settings.CurrentAccountIndex >= this.settingsManager.settings.Accounts.length) {
            SelectorStartIndex = 0;
            this.settingsManager.settings.CurrentAccountIndex = 0;

        } else {
            SelectorStartIndex = this.settingsManager.settings.CurrentAccountIndex + 1;
        }

        this.selectorsModel = {
            currentAccount: this.Accounts[SelectorStartIndex].label,
            choices: this.Accounts
        };

        this.controller.setupWidget('accountSelector', {
            label: 'Account',
            modelProperty: 'currentAccount'
        },
        this.selectorsModel);

        this.searchTypeModel = {
                value:  this.settingsManager.settings.SearchType,
                disabled: false
        };
        
        this.controller.setupWidget("searchSelector",
            this.attributes = {
                labelPlacement: Mojo.Widget.labelPlacementLeft,
                label: "Default Search",
                choices: [
                    {label: "Global", value: SEARCH_GLOBAL},
                    {label: "Artists", value: SEARCH_ARTISTS},
                    {label: "Albums", value: SEARCH_ALBUMS},
                    {label: "Songs", value: SEARCH_SONGS},
                    {label: "Playlists", value: SEARCH_PLAYLISTS}
                ]
            },this.searchTypeModel
           
        ); 

        this.recentTypeModel = {
                value:  this.settingsManager.settings.Recent,
                disabled: false
        };
        
        this.recentChoices = [];
        for(var i =0; i<RECENT_TYPES.length;i++)
        {
            this.recentChoices[i] = {label:RECENT_TYPES[i], value:i};
        }
        
        this.controller.setupWidget("recentSelector",
            this.attributes = {
                labelPlacement: Mojo.Widget.labelPlacementLeft,
                label: "Default Recent",
                choices: this.recentChoices
            },this.recentTypeModel
           
        ); 

        


        //**********************************************************************************************************************
        //Setup Stream Debug Toggle
        // Setup toggle widget and  listen  for when it is changed
        this.debugAttr = {
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
        this.debugModel = {
            value: this.settingsManager.settings.StreamDebug,
            // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };

        this.controller.setupWidget('stream-debug-toggle', this.debugAttr, this.debugModel);

        //**********************************************************************************************************************
        // Setup Toggle Rotation 
        this.rotationModel = {
            value: this.settingsManager.settings.AllowRotation,
            // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };

        this.controller.setupWidget('rotation-toggle', this.debugAttr, this.rotationModel);

        ////********************************************************************************************************
        //// Background button setup
        //this.button1Attributes = { //disabledProperty: 'disabled',
        //    //type: 'default'
        //};
        //
        //this.button1Model = {
        //    buttonLabel: "Background Options",
        //    buttonClass: 'primary'
        //    //disabled: this.disabled
        //};
        //
        //this.controller.setupWidget('backgroundBtn', this.button1Attributes, this.button1Model);
        //
        //// Background button setup
        //this.button2Attributes = { //disabledProperty: 'disabled',
        //    //type: 'default'
        //};
        //
        //this.button2Model = {
        //    buttonLabel: "Text Options",
        //    buttonClass: 'primary'
        //    //disabled: this.disabled
        //};
        //
        //this.controller.setupWidget('textBtn', this.button2Attributes, this.button2Model);


        //Events
        this.listTapFunction = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('innerList'), Mojo.Event.listTap, this.listTapFunction);

        this.listAddFunction = this.listAddHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('innerList'), Mojo.Event.listAdd, this.listAddFunction);

        this.listDeleteFunction = this.listDeleteHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('innerList'), Mojo.Event.listDelete, this.listDeleteFunction);
        
                this.listReorderFunction = this.listReorderFunction.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('innerList'), Mojo.Event.listReorder, this.listReorderFunction);

        this.accountSelectorChanged = this.accountSelectorChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('accountSelector'), Mojo.Event.propertyChange, this.accountSelectorChanged);

        this.debug_pressed = this.debugPressed.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('stream-debug-toggle'), Mojo.Event.propertyChange, this.debug_pressed);

        this.pushBackGroundHandler = this.PushBackground.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('background-row'), Mojo.Event.tap, this.pushBackGroundHandler);

        this.pushTextHandler = this.pushTextHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('text-color-row'), Mojo.Event.tap, this.pushTextHandler);

        this.rotation_pressed = this.rotationPressed.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('rotation-toggle'), Mojo.Event.propertyChange, this.rotation_pressed);
        
        this.searchSelectorChanged = this.searchSelectorChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('searchSelector'), Mojo.Event.propertyChange, this.searchSelectorChanged);
        
        this.recentSelectorChanged = this.recentSelectorChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('recentSelector'), Mojo.Event.propertyChange, this.recentSelectorChanged);
        
    },

    cleanup: function(event) {

        Mojo.Log.info("--> PreferencesAssistant.prototype.cleanup");
        Mojo.Event.stopListening(this.controller.get('preference-type'), Mojo.Event.propertyChange, this.prefTypeChangeHandler);
        
        Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listTap, this.listTapFunction);
        Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listAdd, this.listAddFunction);
        Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listDelete, this.listDeleteFunction);
        Mojo.Event.stopListening(this.controller.get('accountSelector'), Mojo.Event.propertyChange, this.accountSelectorChanged);
        Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listReorder, this.listReorderFunction);
        Mojo.Event.stopListening(this.controller.get('recentSelector'), Mojo.Event.propertyChange, this.accountSelectorChanged);
        

        Mojo.Event.stopListening(this.controller.get('stream-debug-toggle'), Mojo.Event.propertyChange, this.debug_pressed);
        Mojo.Event.stopListening(this.controller.get('rotation-toggle'), Mojo.Event.propertyChange, this.rotation_pressed);

        Mojo.Event.stopListening(this.controller.get('background-row'), Mojo.Event.tap, this.pushBackGroundHandler);
        Mojo.Event.stopListening(this.controller.get('text-color-row'), Mojo.Event.tap, this.pushTextHandler);
        Mojo.Log.info("<-- PreferencesAssistant.prototype.cleanup");
    },

    prefTypeChangeHandler:function(event){
        switch(event.value)
        {
            case 0:
                this.controller.get('accout-container').style.display = 'block';
                this.controller.get('custom-container').style.display = 'none';
                this.controller.get('more-container').style.display = 'none';
                break;
            case 1:
                this.controller.get('accout-container').style.display = 'none';
                this.controller.get('custom-container').style.display = 'block';
                this.controller.get('more-container').style.display = 'none';
                break;
            case 2:
                this.controller.get('accout-container').style.display = 'none';
                this.controller.get('custom-container').style.display = 'none';
                this.controller.get('more-container').style.display = 'block';
                break;
        }
    
    },


    PushBackground: function() {
        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "background"
        });

    },
    
    pushTextHandler: function() {
        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "textselect"
        });

    },
    
    themeSelectorChanged:function(event)
    {
        this.CSSTheme = event.value;
        this.settingsManager.settings.CSSTheme = event.value;
        SetCSSTheme(this.controller, this.CSSTheme);
        this.settingsManager.SaveSettings();
        
    },   

    debugPressed: function(event) {
        //Display the value of the toggle
        if (event.value === true) {
            this.settingsManager.settings.StreamDebug = true;
        } else {
            this.settingsManager.settings.StreamDebug = false;
        }
        this.settingsManager.SaveSettings();
    },

    rotationPressed: function(event) {
        if (event.value === true) {
            this.showDialogBox("WARNING", "Close and reopen app for this setting to take effect.");
            this.settingsManager.settings.AllowRotation = true;
        } else {
            this.settingsManager.settings.AllowRotation = false;
        }
        this.settingsManager.SaveSettings();

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
    },

    UpdateSelectorAccounts: function() {
        this.Accounts = [];

        this.Accounts[0] = {
            label: "Always Ask",
            value: -1
        };

        for (var i = 1; i < (this.settingsManager.settings.Accounts.length + 1); i++) {
            this.Accounts[i] = {
                label: this.settingsManager.settings.Accounts[i - 1].AccountName,
                value: i - 1
            };
        }
        

        
        
    },

    //displays the current state of various selectors
    accountSelectorChanged: function(event) {
        Mojo.Log.info("event %j", event);
        this.settingsManager.settings.CurrentAccountIndex = parseInt(event.value, 10);

        this.settingsManager.SaveSettings();
        //this.currentStuff.innerText = $L("Status = ") +this.selectorsModel.currentStatus+ $L(", Transport = ") +this.selectorsModel.currentTransport+", work = "+this.selectorsModel.currentWork;
    },

    searchSelectorChanged:function(event)
    {
        this.settingsManager.settings.SearchType = parseInt(event.value, 10);
        this.settingsManager.SaveSettings();
    },

    recentSelectorChanged:function(event)
    {
        this.settingsManager.settings.Recent = parseInt(event.value, 10);
        this.settingsManager.SaveSettings();
    },

    listDeleteHandler: function(event) {
        // Remove the item from the model's list.
        // Warning: By not checking which model we're modifying here, we implicitly assume that they share the same structure.
        event.model.items.splice(event.model.items.indexOf(event.item), 1); //Remove from items list
        //this.settings.Accounts.splice(event.model.items.indexOf(event.item),1); //Remove from 
        
        this.UpdateSelector();
        this.settingsManager.SaveSettings();
    },

    listTapHandler: function(event) {

        if (Element.hasClassName(event.originalEvent.target, 'list-item-remove-button')) {
            Mojo.Log.info("Removing word " + event.item.data);

            // Warning: By not checking which model we're modifying here, we implicitly assume that they share the same structure.
            var index = event.model.items.indexOf(event.item);
            if (index > -1) {
                event.model.items.splice(index, 1);
                this.controller.modelChanged(event.model, this);
                this.settingsManager.SaveSettings();
            }

        } else {
            this.newAccount = event.item;
            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "account"
            },
            {
                Type: "Edit",
                SettingsManager: this.settingsManager,
                Account: event.item
            });
        }

    },

    listAddHandler: function(event) {

        this.newAccount = new Account();

        this.controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "account"
        },
        {
            Type: "Add",
            SettingsManager: this.settingsManager,
            Account: this.newAccount
        });

    },
    
    listReorderFunction:function(event)
    {
        if(this.settingsManager.settings.CurrentAccountIndex!==-1)
        {
            var accountIndexChanged = true;
            var currentAccount = event.model.items[this.settingsManager.settings.CurrentAccountIndex];
        }
        
        event.model.items.splice(event.fromIndex,1);
        event.model.items.splice(event.toIndex,0,event.item);
        
        if(accountIndexChanged)
        {
            this.settingsManager.settings.CurrentAccountIndex = event.model.items.indexOf(currentAccount);
        }
        
        this.UpdateSelector();
        this.settingsManager.SaveSettings();
    },

    activate: function(event) {
        /* put in event handlers here that should only be in effect when this scene is active. For
         example, key handlers that are observing the document */
        if (this.newAccount) {
            this.controller.modelChanged(this.accountsModel, this);
            this.settingsManager.SaveSettings();
            this.UpdateSelector();
            this.newAccount = null;
        }
        
        this.DemoColors();
        

    },

    DemoColors:function(){
        var textColorDisplay =this.controller.get("text-color-display");
        var previewBox =this.controller.get("preview-box");
        
        if(this.settingsManager.settings.UseCustomColor)
        {
            textColorDisplay.style.color = this.settingsManager.settings.CustomColor;
            textColorDisplay.innerHTML = this.settingsManager.settings.CustomColor+ "";;
            
            var nodes = previewBox.getElementsByClassName("mainMenuTitle")
            for(var i =0; i<nodes.length;i++)
            {
                nodes[i].style.color = this.settingsManager.settings.CustomColor;
            }
        }
        else
        {
            textColorDisplay.style.color = null;
            textColorDisplay.innerHTML = "Theme Default";
            var nodes = previewBox.getElementsByClassName("mainMenuTitle")
            for(var i =0; i<nodes.length;i++)
            {
                nodes[i].style.color = null;
            }
        }
        
        var backgroundColorDisplay =this.controller.get("background-color-display");
        if(this.settingsManager.settings.BackgroundMode === CUSTOM_COLOR)
        {
            backgroundColorDisplay.style.color = this.settingsManager.settings.BackgroundColor;
            backgroundColorDisplay.innerHTML = this.settingsManager.settings.BackgroundColor ==""? "Theme Default" : this.settingsManager.settings.BackgroundColor ;
        }
        else
        {
            backgroundColorDisplay.style.color = null;
            backgroundColorDisplay.innerHTML = "Image";
        }
        
        
        previewBox.style.background = "url('" + AmpacheMobile.settingsManager.settings.BackgroundImage + "')";
        previewBox.style.backgroundColor = AmpacheMobile.settingsManager.settings.BackgroundColor;
        
        
        
    },
    
    getColor:function(color)
    {
        if(color.match(/#[A-Fa-f0-0]+/))
        {
            return color
        }
        
        return null
    },


    UpdateSelector: function() {
        this.UpdateSelectorAccounts();
        this.selectorsModel.choices = this.Accounts;
        
        //Determine new account index
        newIndex = this.settingsManager.settings.CurrentAccountIndex+1;
        if(newIndex>= this.selectorsModel.choices.length)
        {
            newIndex=this.selectorsModel.choices.length-1;
            this.settingsManager.settings.CurrentAccountIndex=newIndex-1;
        }
        
        this.selectorsModel.currentAccount =  this.selectorsModel.choices[newIndex].label;
        this.controller.modelChanged(this.selectorsModel, this);
    },

    deactivate: function(event) {
        /* remove any event handlers you added in activate and do any other cleanup that should happen before
         this scene is popped or another scene is pushed on top */
        this.settingsManager.SaveSettings();

    }

});