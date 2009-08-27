function ConnectionAssistant(test){
    Mojo.Log.info("--> ConnectionAssistant Constructor");
    
	
	
    Mojo.Log.info("<-- ConnectionAssistant Constructor");
}

ConnectionAssistant.prototype.setup = function(){
	Mojo.Log.info("--> ConnectionAssistant.prototype.setup");
	


	//AmpacheMobile.audioPlayer = new AudioPlayer(this.controller);
	//Mojo.Log.info("Audio Player Created Bitches");


	AmpacheMobile.settingsManager = new SettingsManager("AmpacheMobileData");
    this.settingsManager = AmpacheMobile.settingsManager;
	this.settingsManager.GetSettings(this.GotSettings.bind(this));
	
	this.Accounts = new Array();
	
	
	this.accountsModel = {
		listTitle: $L('Accounts'),
		items: this.Accounts,
	};
	this.innerListAttrs = {
		listTemplate: 'connection/listContainer',
		itemTemplate: 'connection/listItem',
		//addItemLabel: $L("Account..."),
		//swipeToDelete: true,
		//autoconfirmDelete: false,
		//deletedProperty: 'swiped',
	
	};
	this.controller.setupWidget('selectorList', this.innerListAttrs, this.accountsModel);
	this.controller.listen('selectorList', Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	
	
	
	
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	this.spinnerLAttrs = {
		spinnerSize: 'large'
	}
	
	this.spinnerModel = {
		spinning: true
	}
	
	this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
	
	
	
	/* add event handlers to listen to events from widgets */
	this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
	
	
	Mojo.Log.info("<-- ConnectionAssistant.prototype.setup");
}


ConnectionAssistant.prototype.TurnOnSpinner = function()
{
	Mojo.Log.info("--> ConnectionAssistant.prototype.TurnOnSpinner");
	this.spinnerModel.spinning = true;
    this.controller.modelChanged(this.spinnerModel);
	Mojo.Log.info("<-- ConnectionAssistant.prototype.TurnOnSpinner");
}


ConnectionAssistant.prototype.TurnOffSpinner = function()
{
	Mojo.Log.info("--> ConnectionAssistant.prototype.TurnOffSpinner");
	this.spinnerModel.spinning = false;
    this.controller.modelChanged(this.spinnerModel);
	Mojo.Log.info("<-- ConnectionAssistant.prototype.TurnOffSpinner");
}


ConnectionAssistant.prototype.listTapHandler = function(event){

	this.LoadMainMenu(event.item);	
	
}


ConnectionAssistant.prototype.GotSettings = function(settings){
	Mojo.Log.info("--> ConnectionAssistant.prototype.GotSettings")
	
	this.TurnOffSpinner();
	
	if (settings == null) {
		Mojo.Log.info("No Settings Case")
		AmpacheMobile.settingsManager.CreateSettings();
		var params = {
		
			settingsManager: AmpacheMobile.settingsManager,
		}
		this.controller.stageController.pushScene("preferences", params);
	}
	else {
		
		AmpacheMobile.Account = AmpacheMobile.settingsManager.GetCurrentAccount(this.controller.stageController);
		
		if (AmpacheMobile.Account == null) {
			Mojo.Log.info("Updating Accounts List")
			this.PopulateAccountsList(settings.Accounts);
		}
		else {
			this.TurnOnSpinner();
			this.LoadMainMenu(AmpacheMobile.Account);
			
		}
	}
	Mojo.Log.info("<-- StageAssistant.prototype.GotSettings")
}

ConnectionAssistant.prototype.PopulateAccountsList = function(Accounts){

	Mojo.Log.info("--> ConnectionAssistant.prototype.PopulateAccountsList");
	
	Mojo.Log.info("Updating Accounts List")
	this.Accounts = Accounts;
	var accountsList = this.controller.get('selectorList');
	accountsList.mojo.noticeUpdatedItems(0, this.Accounts);
	Mojo.Log.info("<-- ConnectionAssistant.prototype.PopulateAccountsList");
}

ConnectionAssistant.prototype.handleLaunch = function(params){

    Mojo.Log.info("--> ConnectionAssistant.prototype.handleLaunch");
    

    Mojo.Log.info("<-- ConnectionAssistant.prototype.handleLaunch");
}


ConnectionAssistant.prototype.ConnectionCallback = function(connectResult, source){
	Mojo.Log.info("--> ConnectionAssistant.prototype.ConnectionCallback");
	Mojo.Log.info("ConnectionCallback Got Connection info", connectResult);
	
	
	this.TurnOffSpinner();
	
	
	if (connectResult == "connected") {
	
		
		
		Mojo.Log.info("Pushing Main Menu", connectResult);
		if (this.controller.stageController != null) {
			this.controller.stageController.pushScene("mainmenu");
		}
		else
		{
			this.controller.pushScene("mainmenu");
		}
	}
	else {
	
		//Mojo.Log.info("Current Context", typeof this);
		
		//var currentScene = this.controller.activeScene();
		
		Mojo.Log.info("Display Alert");
		this.controller.showAlertDialog({
			onChoose: function(value){
			},
			title: $L("Connected?"),
			message: connectResult,
			choices: [{
				label: $L('OK'),
				value: 'ok',
				type: 'color'
			}]
		});
	}
	
	Mojo.Log.info("<-- ConnectionAssistant.prototype.ConnectionCallback")
}



ConnectionAssistant.prototype.LoadMainMenu=function(account)
{
	    /* put in event handlers here that should only be in effect when this scene is active. For
     example, key handlers that are observing the document */
	if (account != null) {
	
		if ((account.ServerURL == "") || (account.Password == "") || (account.UserName == "")) {
			Mojo.Log.info("Try to load preferences");
			this.controller.stageController.pushScene("preferences", "connection");
		}
		else {
			Mojo.Log.info("Creating AmpacheServer Object");
			this.spinnerModel.spinning = true;
			this.controller.modelChanged(this.spinnerModel);
			//AmpacheMobile.Account = account;
			AmpacheMobile.ampacheServer = null;
			AmpacheMobile.ampacheServer = new AmpacheServer(account.ServerURL, account.UserName, account.Password);
			AmpacheMobile.ampacheServer.connect(this.ConnectionCallback.bind(this), this);
		}
	}
}


ConnectionAssistant.prototype.activate = function(event){
    Mojo.Log.info("--> ConnectionAssistant.prototype.activate");
    
	this.TurnOffSpinner();
	
	if(AmpacheMobile.settingsManager.settings!=null)
	{
		this.PopulateAccountsList(AmpacheMobile.settingsManager.settings.Accounts);
	}

	if(AmpacheMobile.ampacheServer.pingTimer != null)
	{
		AmpacheMobile.ampacheServer.disconnect();
	}
	
    Mojo.Log.info("<-- ConnectionAssistant.prototype.activate");
    
}




ConnectionAssistant.prototype.deactivate = function(event){
    Mojo.Log.info("--> ConnectionAssistant.prototype.deactivate");
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
     this scene is popped or another scene is pushed on top */
	this.TurnOffSpinner();
	
    Mojo.Log.info("<-- ConnectionAssistant.prototype.deactivate");
}

ConnectionAssistant.prototype.cleanup = function(event){
    Mojo.Log.info("--> ConnectionAssistant.prototype.cleanup");
    /* this function should do any cleanup needed before the scene is destroyed as 
     a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('selectorList'), Mojo.Event.listTap, this.listTapHandler);
	
    Mojo.Log.info("<-- ConnectionAssistant.prototype.cleanup");
}
