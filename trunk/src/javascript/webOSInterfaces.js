WebOSInterface = Class.create({

    ampachePlayer: null,

    initialize: function(audioPlayer, controller) {

        this.controller = controller;
        this.ampachePlayer = audioPlayer;

        //this.controller.serviceRequest('palm://com.palm.display', {
        //    method: 'status',
        //    parameters: {
        //        subscribe: true
        //    },
        //    onSuccess: this.screenEvent.bind(this)
        //});

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
            method:"getstatus",
            parameters: {
                subscribe:true
            },
            onSuccess: this.networkStatusCallback.bind(this),
            onFailure: this.webOSFailure.bind(this)
        });
        
        
    },
    
    cleanup:function()
    {
        this.connectionService.cancel();
        this.btService.cancel();
        this.buttonService.cancel();
        
        this.connectionService=null;
        this.btService=null;
        this.buttonService=null;
        
    },

    wifiState:"disconnected",
    
    networkStatusCallback:function(response)
    {
        var network = Object.toJSON(response);     
        
        var attemptRecovery = false;
        if((response.wan) &&  (response.wan.state === "connected"))
        {
            switch(response.wan.network)
            {
                //2 G
                case "unknown":
                case "1x":
                case "unusable":
                case "gprs": 
                    attemptRecovery = false;
                    break;
                
                default:
                    attemptRecovery = true;
                    break;
            }
        }
        
        
        //reload if the wifi state has changed from disconnected to connected
        if((response.wifi) && (response.wifi.state === "connected") && (this.wifiState==="disconnected"))
        {
            
            attemptRecovery = true;
        }
        
        try{
            if((this.ampachePlayer.hasPlayList=== true) && (attemptRecovery === true))
            {
                this.ampachePlayer.recoverStalledBuffers();
                this.ampachePlayer.bufferNextSong(this.ampachePlayer.player.song);
                
                
                
            }
            
        }
        catch(ex)
        {
            this.showDialogBox("Network Event", network+ Object.toJSON(ex));
        }
        //Save wifi state
        this.wifiState = response.wifi.state;
    },

    playSystemSound:function(sound)
    {
        this.controller.serviceRequest('palm://com.palm.audio/systemsounds', {
            method:"playFeedback",
            parameters:{
             name:sound
            },
            onSuccess:{},
            onFailure:{}
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
        //Mojo.Controller.errorDialog("Headset Error");
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

    lastEvent:null,
    screenEvent:function(event)
    {
            
        
        if(( event.event ==="displayOn") && (this.lastEvent = event.event))
        {
            this.showDialogBox("Screen Event", this.ampachePlayer.recoverFromSleep());
        
            //if(this.ampachePlayer.recoverFromSleep()==true)
            //{
            //    this.showDialogBox("Screen Event", "Buffers were emptied while the screen was off.");
            //}
        }
        this.lastEvent = event.event;
    },

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
            allowHTMLMessage:true
        });
    },

});