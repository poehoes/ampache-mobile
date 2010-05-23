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

WebOSInterface = Class.create({

    ampachePlayer: null,

    initialize: function(audioPlayer, controller) {

	this.controller = controller;
	this.ampachePlayer = audioPlayer;

	//PowerManagerService.identifier = 'palm://com.palm.display/control';

	this.powerService = new Mojo.Service.Request('palm://com.palm.display', {
	    method: 'status',
	    parameters: {
		//requestBlock: true,
		//client: Mojo.appName,
		subscribe: true
	    },
	    onSuccess: this.handlePowerEvent.bind(this),
	    onFailure: this.webOSFailure.bind(this)
	});

	this.buttonService = this.controller.serviceRequest('palm://com.palm.keys/headset', {
	    method: 'status',
	    parameters: {
		subscribe: true
	    },
	    onSuccess: this.handleSingleButton.bind(this),
	    onFailure: this.webOSFailure.bind(this)
	});

	this.btService = this.controller.serviceRequest('palm://com.palm.keys/media', {
	    method: 'status',
	    parameters: {
		subscribe: true
	    },
	    onSuccess: this.btEventsCallbacks.bind(this),
	    onFailure: this.webOSFailure.bind(this)
	});

	this.connectionService = new Mojo.Service.Request('palm://com.palm.connectionmanager', {
	    method: "getstatus",
	    parameters: {
		subscribe: true
	    },
	    onSuccess: this.networkStatusCallback.bind(this),
	    onFailure: this.webOSFailure.bind(this)
	});

	//this.lockedService = new Mojo.Service.Request("palm://com.palm.systemmanager/", {
	//    method: 'getLockStatus',
	//    parameters: {
	//	'subscribe': true
	//    },
	//    onSuccess: this.lockedStatusCallback.bind(this),
	//    onFailure: this.webOSFailure.bind(this)
	//});

    },

    cleanup: function() {
	this.connectionService.cancel();
	this.btService.cancel();
	this.buttonService.cancel();
	this.powerService.cancel();
	//this.lockedService.cancel();

	this.connectionService = null;
	this.btService = null;
	this.buttonService = null;
	this.powerService = null;
	//this.lockedService = null;

    },

    setConnection: function(network) {

	if (network.wifi.state == "connected") {
	    network.connection = "wifi_" + network.wifi.ipAddress;
	} else if (network.wan.state == "connected") {
	    network.connection = "wan_" + network.wan.network + "_" + network.wan.ipAddress;
	} else {
	    network.connection = "";
	}

    },

    connection: "hello",
    networkState: null,
    networkStatusCallback: function(response) {
	//var network = Object.toJSON(response);     

	this.setConnection(response);
	this.networkState = response;

	var attemptRecovery = false;
	if (this.connection !== response.connection) {
	    attemptRecovery = true;
	    this.connection = response.connection;

	    //Mojo.Controller.getAppController().showBanner("Network: " + this.connection, {
	    //        source: 'notification'
	    //    });

	}

	//if((response.wan) &&  (response.wan.state === "connected"))
	//{
	//var type = this.getWanNetworkType(response);
	//if(type ==="slow")
	//{
	//    attemptRecovery = false;
	//}
	//else
	//{
	//        attemptRecovery = true;
	//}
	//}

	////reload if the wifi state has changed from disconnected to connected
	//if((response.wifi.state === "connected") && (this.wifiState==="disconnected"))
	//{ 
	//    attemptRecovery = true;
	//}

	try {
	    if ((this.ampachePlayer.hasPlayList === true) && (attemptRecovery === true)) {
		var recovered = this.ampachePlayer.recoverStalledBuffers();
		this.ampachePlayer.bufferNextSong(this.ampachePlayer.player.song);

		//if(recovered ===true)
		//{
		//    Mojo.Controller.getAppController().showBanner("Network Change, Recovering", {
		//        source: 'notification'
		//    });
		//}

	    }

	} catch(ex) {
	    this.showDialogBox("Network Event", Object.toJSON(ex));
	}
	//Save wifi state
	//this.wifiState = response.wifi.state;
    },

    getWanNetworkType: function(network) {
	var ret_val = "fast";
	if (network.wifi.state !== "connected") {
	    switch (network.wan.network) {
		//2 G
	    case "unknown":
	    case "1x":
	    case "unusable":
	    case "gprs":
		ret_val = "slow";
		break;
	    }
	}
	return ret_val;
    },

    networkAvailable: function() {
	var ret_val = true;

	if (this.networkState !== null) {

	    //2G Limitation set on streaming
	    if ((this.getWanNetworkType(this.networkState) === "slow") && (AmpacheMobile.Account.Allow2GBuffer === false)) {
		ret_val = false;
	    }

	    //No networks available... anyone use BT PAN for this?
	    if ((this.networkState.wifi.state !== "connected") && (this.networkState.wan.state !== "connected")) {
		ret_val = false;
	    }
	}
	return ret_val;
    },

    playSystemSound: function(sound) {
	this.controller.serviceRequest('palm://com.palm.audio/systemsounds', {
	    method: "playFeedback",
	    parameters: {
		name: sound
	    },
	    onSuccess: {},
	    onFailure: {}
	});
    },

    btEventsCallbacks: function(event) {
	if (event.state === "up") {
	    if (event.key === "play") {
		this.ampachePlayer.play();
		//AmpacheMobile.vibrate();
	    } else if ((event.key === "pause") || (event.key === "stop")) {
		//AmpacheMobile.vibrate();
		this.ampachePlayer.pause();
		//AmpacheMobile.vibrate();
	    } else if (event.key === "next") {
		this.ampachePlayer.next(true);
		//AmpacheMobile.vibrate();
	    } else if (event.key === "prev") {
		this.ampachePlayer.previous(true);
		//AmpacheMobile.vibrate();
	    }
	}
    },

    webOSFailure: function(event) {

	Mojo.Controller.errorDialog(Object.toJSON(event));
    },

    handleSingleButton: function(event) {

	if (event.state === "single_click") {

	    //AmpacheMobile.vibrate();
	    if (!this.ampachePlayer.player.paused) {
		this.ampachePlayer.pause();
	    } else {
		this.ampachePlayer.play();
	    }
	} else if (event.state === "double_click") {
	    //AmpacheMobile.vibrate();
	    this.ampachePlayer.next(true);
	} else if (event.state === "hold") {
	    //AmpacheMobile.vibrate();
	    this.ampachePlayer.previous(true);
	}
    },

    displayOff: false,
    handlePowerEvent: function(event) {

	if (event.event == "displayOff") {
	    this.displayOff = true;

	    //AmpacheMobile.audioPlayer.screenChanged(this.displayOff);

	    //this.startDashboardCreateTimer();
	    //this.stopUpdateTimer();
	} else if (event.event == "displayOn") {
	    this.displayOff = false;
	    //AmpacheMobile.audioPlayer.screenChanged(this.displayOff);
	    //this.stopDashboardCreateTimer();
	    //this._updateTime(true);
	    //this.startUpdateTimer();
	}
    },

//    lockedStatusCallback: function(event) {
//	if (event.locked == true) {
//	    this.locked = true;
//	    if(AmpacheMobile.dashboard.dashboardShown ===false)
//	    {
//		AmpacheMobile.dashboard.showDashboard();
//	    }
//	} else if (event.locked == false) {
//	    this.locked = false;
//	    if (AmpacheMobile.settingsManager.settings.UseDashBoard === false) {
//		AmpacheMobile.dashboard.hideDashboard();
//	    }
//	}
//    },

    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message) {
	var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
	controller.showAlertDialog({
	    //onChoose: this.SetFocus.bind(this),
	    title: title,
	    message: message,
	    choices: [{
		label: 'OK',
		value: 'OK',
		type: 'color'
	    }],
	    allowHTMLMessage: true
	});
    }

});