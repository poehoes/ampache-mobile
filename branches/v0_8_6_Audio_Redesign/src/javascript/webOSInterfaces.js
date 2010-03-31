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

        this.controller.serviceRequest('palm://com.palm.keys/headset', {
            method: 'status',
            parameters: {
                subscribe: true
            },
            onSuccess: this.handleSingleButton.bind(this),
            onFailure: this.handleSingleButtonFailure.bind(this)
        });

        this.controller.serviceRequest('palm://com.palm.keys/media', {
            method: 'status',
            parameters: {
                subscribe: true
            },
            onSuccess: this.btEventsCallbacks.bind(this),
            onFailure: this.btEventsFailure.bind(this)
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
                this.ampachePlayer.prev(true);
                //AmpacheMobile.vibrate();
            }
        }
    },
        btEventsFailure: function (event) {
        //Mojo.Controller.errorDialog("Bluetooth Error");
    },

    handleSingleButtonFailure: function(event) {
        //Mojo.Controller.errorDialog("Headset Error");
    },

    handleSingleButton: function(event) {
        
        if (event.state === "single_click") {
            
            //AmpacheMobile.vibrate();
            if (!ampachePlayer.player.paused) {
                this.ampachePlayer.pause();
            } else {
                this.ampachePlayer.play();
            }
        } else if (event.state === "double_click") {
            //AmpacheMobile.vibrate();
            this.ampachePlayer.next(true);
        } else if (event.state === "hold") {
            //AmpacheMobile.vibrate();
            this.ampachhePlayer.prev(true);
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