SettingsManager = Class.create({
	
	settings:null, 
	depot:null,
	
	initialize: function(DataBaseName){
		var options = {
			name: "AmpacheMobileData", //Name used for the HTML5 database name. (required)
			version: 1, //Version number used for the HTML5 database. (optional, defaults to 1)	
			//displayName: "demoDB", //Name that would be used in user interface that the user sees regarding this database. Not currently used. (optional, defaults to name)
			//estimatedSize: 200000, //Estimated size for this database. (optional, no default)
			replace: false // open an existing depot
		};
		
		//Create a database when the scene is generated
		this.depot = new Mojo.Depot(options, this.dbSuccess, this.dbFailure);
		
	},
	
	
	
	dbSuccess: function(){
		console.log("***** depot operation success!");
	},

	dbFailure: function(transaction, result){
		console.log("***** depot failure: " + result.message);
		Mojo.Controller.errorDialog("This is not good!.  Settings database failed to load.  Error Message: " + result.message);
	},
	
	
	CreateSettings: function(){
		this.settings = new Settings();
		this.settings.Accounts = new Array();
		this.settings.CurrentAccountIndex=0;
	},
	
	CreateEmptyAccount:function()
	{
		var index = this.settings.Accounts.length;
		this.settings.Accounts[index] = new Account();	
		return this.settings.Accounts[index];
	},
	
	GetCurrentAccount:function()
	{
		var settings = this.settings;
		if ((settings.CurrentAccountIndex >= 0) && (settings.CurrentAccountIndex < settings.Accounts.length)) {
			return settings.Accounts[settings.CurrentAccountIndex];
		}
		else {
			return null;
		}
	},
	
	
	AddAccount:function(AccountName, username, password, url)
	{
		var index = this.settings.Accounts.length;
		this.settings.Accounts[index] = new Account();		
		this.settings.Accounts[index].UserName = username;
		this.settings.Accounts[index].Password = password;
		this.settings.Accounts[index].ServerURL = url;
		
		return this.settings.Accounts[index];
	
	},
	
	RemoveAccount:function(index)
	{
		this.settings.Accounts.splice(index,1);
	},
	
	
	GetSettings: function(OnSuccess, OnFailure){
		GetSettingsSuccessCallback = OnSuccess;
		GetSettingsFailureCallback = OnFailure;
		
		this.depot.get("AppSettings", this.GetSettingsSuccess.bind(this), this.GetSettingsFailure.bind(this))
		
	},
	
	GetSettingsSuccessCallback:null,
	GetSettingsSuccess:function(settings)
	{
			console.log("***************Success Get Happened")
			this.settings = settings;
			if(GetSettingsSuccessCallback!=null) GetSettingsSuccessCallback(this.settings);
		GetSettingsSuccessCallback=null;
	},
	
	GetSettingsFailureCallback:null,
	GetSettingsFailure: function(){
		console.log("***************Failure Get Happened")
		if (GetSettingsFailureCallback != null) 
			GetSettingsFailureCallback();
			
			GetSettingsFailureCallback=null;
	},
	
	SaveSettings: function(OnSuccess, OnFailure){
		this.depot.add("AppSettings", this.settings, 
		function(){
			console.log("***************Success Add Happened")
			if(OnSuccess!=null) OnSuccess();
		}, function(){
			console.log("***************Failure Add Happened")
			if(OnFailure!=null) OnFailure();
		})
	},
	
	
})



Account = Class.create({
	AccountName:null,
	UserName:null,
	Password:null,
	ServerURL:null,
})

Settings = Class.create({
	Accounts:null,
	CurrentAccountIndex:null,
});