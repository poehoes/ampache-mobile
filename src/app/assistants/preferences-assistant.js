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

PreferencesAssistant = Class.create(
{

    initialize: function(params)
    {
        this.settingsManager = params.settingsManager;
        
    },
    
    stylesheet: null,
    
    
    setup: function()
    {
    
        //Mojo.loadStylesheet(this.controller.document, "stylesheets/preferences.css");
        this.controller.get('body_wallpaper').style.background = null;
        this.controller.get('body_wallpaper').style.backgroundColor = PREF_COLOR;
        
        
        this.accountsModel = 
        {
            listTitle: $L('Accounts'),
            items: this.settingsManager.settings.Accounts
        };
        this.innerListAttrs = 
        {
            listTemplate: 'preferences/listContainer',
            itemTemplate: 'preferences/listItem',
            addItemLabel: $L("Add Account..."),
            swipeToDelete: true,
            autoconfirmDelete: false,
            deletedProperty: 'swiped'
        
        };
        this.controller.setupWidget('innerList', this.innerListAttrs, this.accountsModel);
        this.controller.listen('innerList', Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
        this.controller.listen('innerList', Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this));
        this.controller.listen('innerList', Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));
        
        
        
        
        
        
        this.UpdateSelectorAccounts();
        
        var SelectorStartIndex;
        if (this.settingsManager.settings.CurrentAccountIndex === -1) {
            SelectorStartIndex = 0;
        }
        else if (this.settingsManager.settings.CurrentAccountIndex >= this.settingsManager.settings.Accounts.length) 
        {
            SelectorStartIndex = 0;
            this.settingsManager.settings.CurrentAccountIndex = 0;
            
        }
        else 
        {
            SelectorStartIndex = this.settingsManager.settings.CurrentAccountIndex + 1;
        }
        
        this.selectorsModel = 
        {
            currentAccount: this.Accounts[SelectorStartIndex].label,
            choices: this.Accounts
        };
        
        
        
        this.accountSelectorChanged = this.accountSelectorChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('accountSelector'), Mojo.Event.propertyChange, this.accountSelectorChanged);
        this.controller.setupWidget('accountSelector', 
        {
            label: 'Account',
            modelProperty: 'currentAccount'
        }, this.selectorsModel);
        
        
        
       
        
        //**********************************************************************************************************************
        //Setup Stream Debug Toggle
        // Setup toggle widget and an observer for when it is changed
        this.debugAttr = 
        {
            trueLabel: 'On',//if the state is true, what to label the toggleButton; default is 'On'
            trueValue: true,//if the state is true, what to set the model[property] to; default if not specified is true
            falseLabel: 'Off', //if the state is false, what to label the toggleButton; default is Off
            falseValue: false, //if the state is false, , what to set the model[property] to; default if not specific is false],
            fieldName: 'toggle' //name of the field; optional
        };
        this.debugModel = 
        {
            value: this.settingsManager.settings.StreamDebug, // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };
        
        this.controller.setupWidget('stream-debug-toggle', this.debugAttr, this.debugModel);
        this.debug_pressed = this.debugPressed.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('stream-debug-toggle'), Mojo.Event.propertyChange, this.debug_pressed);
        
        
        //**********************************************************************************************************************
        // Setup Toggle Rotation 
        this.rotationModel = 
        {
            value: this.settingsManager.settings.AllowRotation, // Current value of widget, from choices array.
            disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
        };
        
        this.controller.setupWidget('rotation-toggle', this.debugAttr, this.rotationModel);
        this.rotation_pressed = this.rotationPressed.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('rotation-toggle'), Mojo.Event.propertyChange, this.rotation_pressed);
        
        
        
        //********************************************************************************************************
        // Background button setup
        this.button1Attributes = { //disabledProperty: 'disabled',
            //type: 'default'
        };
        
        this.button1Model = 
        {
            buttonLabel: "Background Options",
            buttonClass: 'primary'
            //disabled: this.disabled
        };
        
        this.controller.setupWidget('backgroundBtn', this.button1Attributes, this.button1Model);
        
        Mojo.Event.listen(this.controller.get('backgroundBtn'), Mojo.Event.tap, this.PushBackground.bind(this));
        
        
        
        
        
    },
    
    
    
    
    
    PushBackground: function()
    {
        this.controller.stageController.pushScene("background");
        
    },
    
    debugPressed: function(event)
    {
        //Display the value of the toggle
        if (event.value === true) 
        {
            this.settingsManager.settings.StreamDebug = true;
        }
        else 
        {
            this.settingsManager.settings.StreamDebug = false;
        }
        this.settingsManager.SaveSettings();
    },
    
    rotationPressed:function(event)
    {
        if (event.value === true) 
        {
            this.showDialogBox("WARNING", "Close and reopen app for this setting to take effect.");
            this.settingsManager.settings.AllowRotation = true;
        }
        else 
        {
            this.settingsManager.settings.AllowRotation = false;
        }
        this.settingsManager.SaveSettings();
        
    },
    
    
   
    
    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message)
    {
        this.controller.showAlertDialog(
        {
            onChoose: function(value)
            {
            },
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
    
    
    
    UpdateSelectorAccounts: function()
    {
        this.Accounts = [];
        
        this.Accounts[0] = 
        {
            label: "Always Ask",
            value: -1
        };
        
        for (var i = 1; i < this.settingsManager.settings.Accounts.length + 1; i++) 
        {
            this.Accounts[i] = 
            {
                label: this.settingsManager.settings.Accounts[i - 1].AccountName,
                value: i - 1
            };
        }
    },
    
    
    
    //displays the current state of various selectors
    accountSelectorChanged: function(event)
    {
        Mojo.Log.info("event %j", event);
        this.settingsManager.settings.CurrentAccountIndex = parseInt(event.value, 10);
        
        this.settingsManager.SaveSettings();
        //this.currentStuff.innerText = $L("Status = ") +this.selectorsModel.currentStatus+ $L(", Transport = ") +this.selectorsModel.currentTransport+", work = "+this.selectorsModel.currentWork;
    },
    
    
    listDeleteHandler: function(event)
    {
        // Remove the item from the model's list.
        // Warning: By not checking which model we're modifying here, we implicitly assume that they share the same structure.
        event.model.items.splice(event.model.items.indexOf(event.item), 1); //Remove from items list
        //this.settings.Accounts.splice(event.model.items.indexOf(event.item),1); //Remove from 
        this.UpdateSelector();
        this.settingsManager.SaveSettings();
    },
    
    listTapHandler: function(event)
    {
    
        if (Element.hasClassName(event.originalEvent.target, 'list-item-remove-button')) 
        {
            Mojo.Log.info("Removing word " + event.item.data);
            
            // Warning: By not checking which model we're modifying here, we implicitly assume that they share the same structure.
            var index = event.model.items.indexOf(event.item);
            if (index > -1) 
            {
                event.model.items.splice(index, 1);
                this.controller.modelChanged(event.model, this);
                this.settingsManager.SaveSettings();
            }
            
        }
        else 
        {
            this.newAccount = event.item;
            this.controller.stageController.pushScene("account", 
            {
                Type: "Edit",
                SettingsManager: this.settingsManager,
                Account: event.item
            });
        }
        
        
    },
    
    listAddHandler: function(event)
    {
    
    
        this.newAccount = new Account();
        
        this.controller.stageController.pushScene("account", 
        {
            Type: "Add",
            SettingsManager: this.settingsManager,
            Account: this.newAccount
        });
        
    },
    
    
    
    
    
    
    activate: function(event)
    {
        /* put in event handlers here that should only be in effect when this scene is active. For
         example, key handlers that are observing the document */
        if (this.newAccount !== null) 
        {
            this.controller.modelChanged(this.accountsModel, this);
            this.settingsManager.SaveSettings();
            this.UpdateSelector();
            this.newAccount = null;
        }
        
        
    },
    
    UpdateSelector: function()
    {
        this.UpdateSelectorAccounts();
        this.selectorsModel.choices = this.Accounts;
        this.controller.modelChanged(this.selectorsModel, this);
    },
    
    
    deactivate: function(event)
    {
        /* remove any event handlers you added in activate and do any other cleanup that should happen before
         this scene is popped or another scene is pushed on top */
        this.settingsManager.SaveSettings();
        
    },
    
    cleanup: function(event)
    {
    
        Mojo.Log.info("--> PreferencesAssistant.prototype.cleanup");
        Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listAdd, this.listAddHandler);
        Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listDelete, this.listDeleteHandler);
        Mojo.Event.stopListening(this.controller.get('accountSelector'), Mojo.Event.propertyChange, this.accountSelectorChanged);
        
        
        Mojo.Event.stopListening(this.controller.get('stream-debug-toggle'), Mojo.Event.propertyChange, this.debug_pressed);
        Mojo.Event.stopListening(this.controller.get('rotation-toggle'), Mojo.Event.propertyChange, this.rotation_pressed);
        
        Mojo.Event.stopListening(this.controller.get('backgroundBtn'), Mojo.Event.tap, this.PushBackground);
        Mojo.Log.info("<-- PreferencesAssistant.prototype.cleanup");
    }
});