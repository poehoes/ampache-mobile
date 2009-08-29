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

	Mojo.loadStylesheet(this.controller.document, "stylesheets/preferences.css");
	
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
			Account: event.item
	});
	}
	
	
}
PreferencesAssistant.prototype.listAddHandler = function(event) {
		/*
// If 'item' and 'index' are undefined, then the 'add...' item was tapped, and we add a "new/blank" item.
		event.model.items.push({data:$L('New Item') });
		this.controller.modelChanged(event.model, this);

*/	this.newAccount = this.settingsManager.CreateEmptyAccount();
	
	this.controller.stageController.pushScene("account", {
		Account: this.newAccount
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
	Mojo.Log.info("<-- PreferencesAssistant.prototype.cleanup");
}
