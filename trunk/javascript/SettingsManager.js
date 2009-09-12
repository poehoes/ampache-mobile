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
		console.log("***** depot failure: ");
		Mojo.Controller.errorDialog("This is not good!.  Settings database failed to load.  Error Message: ");
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
			this.FindMissingSettings();
			if(GetSettingsSuccessCallback!=null) GetSettingsSuccessCallback(this.settings);
		GetSettingsSuccessCallback=null;
	},
	
	FindMissingSettings: function(){
		if (this.settings != null) {
			if (this.settings.BackgroundColor == null) {
				this.settings.BackgroundColor = this.DEFAULT_COLOR;
			}
			if (this.settings.BackgroundImage == null) {
				this.settings.BackgroundImage = this.DEFAULT_IMAGE;
			}
			if (this.settings.StreamDebug == null) {
				this.settings.StreamDebug = false;
			}
			
			if (this.settings.BackgroundMode == null) {
				this.settings.BackgroundMode = 0;
			}
			
			this.SaveSettings(null, null);
		}
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
			console.log("***************Success SaveSettings Happened")
			if(OnSuccess!=null) OnSuccess();
		}, function(){
			console.log("***************Failure SaveSettings Happened")
			if(OnFailure!=null) OnFailure();
		})
	},
	
	DEFAULT_COLOR:"#384438",
	DEFAULT_IMAGE:"images/background_alpha.png",
	
	
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
	ExtraCoverArt:false,
	StreamDebug:false,
	BackgroundColor:"#384438",
	BackgroundImage:"images/background_alpha.png",
	BackgroundMode:this.CUSTOM_COLOR,

	CUSTOM_COLOR:0,
	CUSTOM_IMAGE:1,
	
});