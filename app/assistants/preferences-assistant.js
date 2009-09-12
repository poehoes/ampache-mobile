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


function PreferencesAssistant(params) {
	this.settingsManager = params.settingsManager;

	//this.settingsManager = AppAssistant.settingsManager;
	
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

PreferencesAssistant.prototype.stylesheet = null;


PreferencesAssistant.prototype.setup = function(){

	//Mojo.loadStylesheet(this.controller.document, "stylesheets/preferences.css");
	this.controller.get('body_wallpaper').style.background = null;
	this.controller.get('body_wallpaper').style.backgroundColor = "white";
	
	
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
	
	};
	this.controller.setupWidget('innerList', this.innerListAttrs, this.accountsModel);
	this.controller.listen('innerList', Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	this.controller.listen('innerList', Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this));
	this.controller.listen('innerList', Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));
	
	
	
	
	

	this.UpdateSelectorAccounts();
	
	var SelectorStartIndex
	if(this.settingsManager.settings.CurrentAccountIndex==-1)
		SelectorStartIndex =0;
	else if(this.settingsManager.settings.CurrentAccountIndex>= this.settingsManager.settings.Accounts.length)
	{
		SelectorStartIndex =0;
		this.settingsManager.settings.CurrentAccountIndex=0;
		
	}
	else
	{
		SelectorStartIndex =this.settingsManager.settings.CurrentAccountIndex+1;
	}
	
	this.selectorsModel = {currentAccount: this.Accounts[SelectorStartIndex].label ,  
	choices: this.Accounts}
	
	
	
	this.accountSelectorChanged = this.accountSelectorChanged.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('accountSelector'), Mojo.Event.propertyChange, this.accountSelectorChanged);
	this.controller.setupWidget('accountSelector', {label: 'Account', modelProperty:'currentAccount'}, this.selectorsModel);

	
	
	//Setup Album Art Toggle
			// Setup toggle widget and an observer for when it is changed
		this.tattr = {
  			trueLabel:  'On' ,//if the state is true, what to label the toggleButton; default is 'On'
  			trueValue:  true ,//if the state is true, what to set the model[property] to; default if not specified is true
 			falseLabel:  'Off', //if the state is false, what to label the toggleButton; default is Off
  			falseValue: false, //if the state is false, , what to set the model[property] to; default if not specific is false],
  			fieldName:  'toggle' //name of the field; optional
  		}
		this.tModel = {
			value : this.settingsManager.settings.ExtraCoverArt,   // Current value of widget, from choices array.
 			disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
			
		}
		
		this.controller.setupWidget('art-toggle', this.tattr,this.tModel );
		this.togglePressed = this.togglePressed.bindAsEventListener(this);
		Mojo.Event.listen(this.controller.get('art-toggle'),Mojo.Event.propertyChange,this.togglePressed);
	
	
		//Setup Stream Debug Toggle
			// Setup toggle widget and an observer for when it is changed
		this.debugAttr = {
  			trueLabel:  'On' ,//if the state is true, what to label the toggleButton; default is 'On'
  			trueValue:  true ,//if the state is true, what to set the model[property] to; default if not specified is true
 			falseLabel:  'Off', //if the state is false, what to label the toggleButton; default is Off
  			falseValue: false, //if the state is false, , what to set the model[property] to; default if not specific is false],
  			fieldName:  'toggle' //name of the field; optional
  		}
		this.debugModel = {
			value : this.settingsManager.settings.StreamDebug,   // Current value of widget, from choices array.
 			disabled: false //whether or not the checkbox value can be changed; if true, this cannot be changed; default is false
			
		}
		
		this.controller.setupWidget('stream-debug-toggle', this.debugAttr,this.debugModel );
		this.debug_pressed = this.debugPressed.bindAsEventListener(this);
		Mojo.Event.listen(this.controller.get('stream-debug-toggle'),Mojo.Event.propertyChange,this.debug_pressed);
	
		//********************************************************************************************************
		// Background button setup
		this.button1Attributes = {
		//disabledProperty: 'disabled',
		//type: 'default'
		}
		
		this.button1Model = {
		buttonLabel : "Background Options",
		buttonClass: 'primary',
		//disabled: this.disabled
		}
		
		this.controller.setupWidget('backgroundBtn', this.button1Attributes, this.button1Model);
	
	
		Mojo.Event.listen(this.controller.get('backgroundBtn'),Mojo.Event.tap, this.PushBackground.bind(this));
	
}


PreferencesAssistant.prototype.PushBackground = function()
{
	this.controller.stageController.pushScene("background");
	
}

PreferencesAssistant.prototype.debugPressed = function(event){
	//Display the value of the toggle
	if (event.value == true) {
		this.settingsManager.settings.StreamDebug = true;
	}
	else
	{
		this.settingsManager.settings.StreamDebug = false;
	}
	this.settingsManager.SaveSettings();
}



PreferencesAssistant.prototype.togglePressed = function(event){
	//Display the value of the toggle
	if (event.value == true) {
		this.settingsManager.settings.ExtraCoverArt = true;
		this.showDialogBox("WARNING", "This feature is disabled by default because it greatly diminishes performance, but it sure looks good");
	}
	else
	{
		this.settingsManager.settings.ExtraCoverArt = false;
	}
	this.settingsManager.SaveSettings();
}

// This function will popup a dialog, displaying the message passed in.
PreferencesAssistant.prototype.showDialogBox = function(title,message){
		this.controller.showAlertDialog({
		onChoose: function(value) {},
		title:title,
		message:message,
		choices:[ {label:'OK', value:'OK', type:'color'} ]
	});
	}



PreferencesAssistant.prototype.UpdateSelectorAccounts = function()
{
	this.Accounts =  new Array()
	
	this.Accounts[0] = {label:"Always Ask", value:-1};
	
	for (var i=1; i<this.settingsManager.settings.Accounts.length+1; i++) {
		this.Accounts[i] = {label:this.settingsManager.settings.Accounts[i-1].AccountName, value:i-1}
	};
}



//displays the current state of various selectors
PreferencesAssistant.prototype.accountSelectorChanged = function(event) {
	Mojo.Log.info("event %j", event)
	this.settingsManager.settings.CurrentAccountIndex = parseInt(event.value);

	this.settingsManager.SaveSettings();
		//this.currentStuff.innerText = $L("Status = ") +this.selectorsModel.currentStatus+ $L(", Transport = ") +this.selectorsModel.currentTransport+", work = "+this.selectorsModel.currentWork;
}


PreferencesAssistant.prototype.listDeleteHandler = function(event) {
		// Remove the item from the model's list.
		// Warning: By not checking which model we're modifying here, we implicitly assume that they share the same structure.
		event.model.items.splice(event.model.items.indexOf(event.item), 1); //Remove from items list
		//this.settings.Accounts.splice(event.model.items.indexOf(event.item),1); //Remove from 
		this.UpdateSelector();
		this.settingsManager.SaveSettings();
	}
PreferencesAssistant.prototype.listTapHandler = function(event){

	if (Element.hasClassName(event.originalEvent.target, 'list-item-remove-button')) {
		Mojo.Log.info("Removing word " + event.item.data);
		
		// Warning: By not checking which model we're modifying here, we implicitly assume that they share the same structure.
		var index = event.model.items.indexOf(event.item);
		if (index > -1) {
			event.model.items.splice(index, 1);
			this.controller.modelChanged(event.model, this);
			this.settingsManager.SaveSettings();
		}
		
	}
	else
	{
		this.newAccount = event.item;
		this.controller.stageController.pushScene("account", {
			Type:"Edit",
			SettingsManager:this.settingsManager,
			Account: event.item
	});
	}
	
	
}
PreferencesAssistant.prototype.listAddHandler = function(event) {
		/*
// If 'item' and 'index' are undefined, then the 'add...' item was tapped, and we add a "new/blank" item.
		event.model.items.push({data:$L('New Item') });
		this.controller.modelChanged(event.model, this);

*/	this.newAccount = new Account();
	
	this.controller.stageController.pushScene("account", {
		Type:"Add",
		SettingsManager:this.settingsManager,
		Account: this.newAccount,
	});

}



	


PreferencesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	 if(this.newAccount !=null)
	 {
		this.controller.modelChanged(this.accountsModel, this);
		this.settingsManager.SaveSettings();
		this.UpdateSelector();
	 	this.newAccount =null;
	 }
	  

}

PreferencesAssistant.prototype.UpdateSelector=function()
{
	this.UpdateSelectorAccounts();
	this.selectorsModel.choices = this.Accounts;
	this.controller.modelChanged(this.selectorsModel , this);
}


PreferencesAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	
	this.settingsManager.SaveSettings();
	
}

PreferencesAssistant.prototype.cleanup = function(event){

 Mojo.Log.info("--> PreferencesAssistant.prototype.cleanup");
	Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listTap, this.listTapHandler);
	Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listAdd, this.listAddHandler);	
	Mojo.Event.stopListening(this.controller.get('innerList'), Mojo.Event.listDelete, this.listDeleteHandler);
	Mojo.Event.stopListening(this.controller.get('accountSelector'), Mojo.Event.propertyChange, this.accountSelectorChanged);
	
	Mojo.Event.stopListening(this.controller.get('art-toggle'),Mojo.Event.propertyChange,this.togglePressed);
	Mojo.Event.stopListening(this.controller.get('stream-debug-toggle'),Mojo.Event.propertyChange,this.debug_pressed);
	
	Mojo.Event.stopListening(this.controller.get('backgroundBtn'),Mojo.Event.tap, this.PushBackground);
	Mojo.Log.info("<-- PreferencesAssistant.prototype.cleanup");
}
