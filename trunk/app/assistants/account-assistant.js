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



function AccountAssistant(params) {
	this.Account = params.Account;
	this.Type = params.Type;
	this.SettingsManager = params.SettingsManager;
	//this.Callback = params.Callback;
}

AccountAssistant.prototype.setup = function() {
    /* this function is for setup tasks that have to happen when the scene is first created */
    
    /* use Mojo.View.render to render view templates and add them to the scene, if needed. */
    
    /* setup widgets here */
    
    /* add event handlers to listen to events from widgets */
    Mojo.Log.info("Account assistant activating");
	//Mojo.Log.info("Loading Password:", AmpacheMobile.Password);
	//Mojo.Log.info("Loading ServerURL:", AmpacheMobile.ServerURL);
	//Mojo.Log.info("Loading UserName:", AmpacheMobile.UserName);
	
	this.context = this;
	
	
	this.controller.setupWidget("AccountNameField", this.attributes = {
        hintText: $L('Account Description')
    }, this.model = {
        value: this.Account.AccountName
    });
	
	
    this.controller.setupWidget("passwordField", this.attributes = {
        hintText: $L('Type Password')
    }, this.model = {
        value: this.Account.Password
    });
	this.controller.setupWidget("ServerURLField", this.attributes = {
        hintText: $L('Full URL of Server'),
		textCase : Mojo.Widget.steModeLowerCase
    }, this.model = {
        value: this.Account.ServerURL
    });

	this.controller.setupWidget("userNameField", this.attributes = {
        hintText: $L('Username'),
		textCase : Mojo.Widget.steModeLowerCase
    }, this.model = {
        value:this.Account.UserName
    });


	this.controller.setupWidget('btnTestConnection', 
				this.atts = {
					type: Mojo.Widget.activityButton
					}, 
				this.model = {
					buttonLabel: 'Test Connection',
					buttonClass: 'affirmative',
					disabled: false
				});
	
	Mojo.Event.listen(this.controller.get('btnTestConnection'),Mojo.Event.tap, this.callStartTest.bind(this));
	
	this.controller.listen("AccountNameField", Mojo.Event.propertyChange, this.changeAccountName.bindAsEventListener(this));
    this.controller.listen("ServerURLField", Mojo.Event.propertyChange, this.changeURL.bindAsEventListener(this));
    this.controller.listen("passwordField", Mojo.Event.propertyChange, this.changePassword.bindAsEventListener(this));
    this.controller.listen("userNameField", Mojo.Event.propertyChange, this.changeUserName.bindAsEventListener(this));


	
}


AccountAssistant.prototype.ValidSettings=function(account)
{
	var retVal = true;
	this.FailureReason = "Unknown Failure";
	if((account.AccountName==null) || (account.AccountName==""))
	{
		this.FailureReason =  "No acccount name entered "
		retVal=false;
	}
	if((account.ServerURL==null) || (account.ServerURL==""))
	{
		this.FailureReason =  "No Server URL entered "
		retVal=false;
	}
	else
	{
		var startOfURL = account.ServerURL.toLowerCase().substring(0,8);
		if( (!startOfURL.match("http://")) && (!startOfURL.match("https://") ) )
		{
			this.FailureReason =  "Server URL requires http://"
			retVal=false;
		}
	}
	
	
	
	if((account.UserName==null) || (account.UserName==""))
	{
		this.FailureReason =  "No user name entered "
		retVal=false;
	}
	
	
	
	
	return retVal;
}


AccountAssistant.prototype.accountQuestions = function(value)
{
	if(value=="delete")
	{
		this.popAccount(null);
	}
	
	
}

AccountAssistant.prototype.popAccount = function(account)
{
		var params = 
		{
			type:this.Type,
			account:account,
		}
	
		this.controller.stageController.popScene(null)
	
}


AccountAssistant.prototype.handleCommand = function(event) {
   //test for Mojo.Event.back, not Mojo.Event.command..
    
	event.preventDefault();
	event.stopPropagation();	
	
	
	if (event.type == Mojo.Event.back) {
		

		
		if (!this.ValidSettings(this.Account)) {
		
			
			this.controller.showAlertDialog({
				onChoose: this.accountQuestions,
				title: $L("Account Incomplete"),
				message: this.FailureReason,
				choices: [{
					label: $L('OK'),
					value: 'ok',
					type: 'primary'
				},
				{
					label: $L('Delete Account'),
					value: 'delete',
					type: 'negative'
				}]
			});
			
		}
		else
		{
			if(this.Type=="Add") this.SettingsManager.AppendAccount(this.Account);
			this.popAccount(this.Account);
		}
	}
	else
	{
		this.popAccount(this.Account);
	}
};



AccountAssistant.prototype.callStartTest = function() {
	//console.log("*** ")
	
	if (!this.spinning) {
		Mojo.Log.info("Staring Connection Test");
		this.ampacheServer = new AmpacheServer();
		this.ampacheServer.TestConnection(this.Account.ServerURL, this.Account.UserName, this.Account.Password, this.TestCallback.bind(this));
		this.timeoutInterval = window.setInterval(this.ConnectionTestTimeout.bind(this), 30000);
		Mojo.Log.info("this.timeoutInterval", this.timeoutInterval)
		this.spinning = true;	
			
	}
	else
	{
		Mojo.Log.info("Test already started");
		
	}
}

AccountAssistant.prototype.TestCallback = function(connectResult)
{
	
	this.buttonWidget = this.controller.get('btnTestConnection');
    this.buttonWidget.mojo.deactivate();
	this.spinning = false;

	window.clearInterval(this.timeoutInterval);
	var html = false;

		var DisplayMessage = connectResult;
		if(connectResult.toLowerCase() == "acl error")
		{
			DisplayMessage = "Error: " + connectResult + "<br><br>" + AmpacheMobile.AclErrorHelp;
			 html = true;
		}
		
		if(connectResult.toLowerCase() == "error: empty response")
		{
			DisplayMessage = connectResult + "<br><br>" + AmpacheMobile.EmptyResponseErrorHelp
			html = true;
		
		}


	Mojo.Log.info("Display Alert");	
	this.controller.showAlertDialog({
            onChoose: function(value){},
            title: $L("Connection Test"),
            message: DisplayMessage,
            choices: [{
                label: $L('OK'),
                value: 'ok',
                type: 'color'
            }],
			 allowHTMLMessage:html,
        });
	
}


AccountAssistant.prototype.ConnectionTestTimeout = function(){
    this.buttonWidget = this.controller.get('btnTestConnection');
    this.buttonWidget.mojo.deactivate();
    this.spinning = false;
    
	Mojo.Log.info("this.timeoutInterval", this.timeoutInterval)
    window.clearInterval(this.timeoutInterval);
    
    Mojo.Log.info("Deactivate Spinner");
	Mojo.Log.info(this.testContext);
	
	Mojo.Log.info("Display Alert");	
	this.controller.showAlertDialog({
            onChoose: function(value){},
            title: $L("Connection Test"),
            message: "Timed out while attempting test",
            choices: [{
                label: $L('OK'),
                value: 'ok',
                type: 'color'
            }]
        });
	
	
	/*
	var currentScene = this.ControllerSave.activeScene();
   
    currentScene.showAlertDialog({
        onChoose: function(value){
        },
        title: "Connection Test",
        message: "Test Failed",
        choices: [{
            label: "OK",
            //value: "failed"
        }]
    });
    */
    
}


AccountAssistant.prototype.changeAccountName = function(event) {
    Mojo.Log.info("Account Name Changed; value = ", event.value);
  	this.Account.AccountName = event.value; 
};

AccountAssistant.prototype.changeURL = function(event) {
    Mojo.Log.info("Server URL Changed; value = ", event.value);
  	this.Account.ServerURL = event.value; 
};


AccountAssistant.prototype.changePassword = function(event) {
    Mojo.Log.info("Server Password Changed; value = ", event.value);
  	this.Account.Password = event.value; 
};

AccountAssistant.prototype.changeUserName = function(event) {
    Mojo.Log.info("Server UserName Changed; value = ", event.value);
  	this.Account.UserName = event.value; 
};


AccountAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


AccountAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	this.controller.showAlertDialog({
            onChoose: function(value){},
            title: $L("Connection Test"),
            message: "Timed out while attempting test",
            choices: [{
                label: $L('OK'),
                value: 'ok',
                type: 'color'
            }]
        });
	
	
	Mojo.Event.stopListening(this.controller.get('btnTestConnection'),Mojo.Event.tap, this.callStartTest);  
	
	this.controller.stopListening("AccountNameField", Mojo.Event.propertyChange, this.changeURL);
	this.controller.stopListening("ServerURLField", Mojo.Event.propertyChange, this.changeURL);
	this.controller.stopListening("passwordField", Mojo.Event.propertyChange, this.changePassword);
	this.controller.stopListening("userNameField", Mojo.Event.propertyChange, this.changeUserName);
	
	  
}

AccountAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */


}
