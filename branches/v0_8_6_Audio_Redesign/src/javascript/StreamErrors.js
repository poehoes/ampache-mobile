    
        //MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
    //
    //streamErrorCodeLookup: function(errorCode) {
    //    //refrence: http://dev.w3.org/html5/spc/Overview.html#dom-mediaerror-media_err_network
    //    // http://developer.palm.com/index.php?option=com_content&view=article&id=1539
    //    var errorString = "Unknown Error";
    //    switch (errorCode) {
    //    case MediaError.MEDIA_ERR_ABORTED:
    //        errorString = "The audio stream was aborted by WebOS. Most often this happens when you do not have a fast enough connection to support an audio stream.";
    //        //if (this.debug) {
    //        errorString += this.moreErrorInfo("MEDIA_ERR_ABORTED");
    //        //}
    //        break;
    //    case MediaError.MEDIA_ERR_NETWORK:
    //        errorString = "A network error has occured. The network cannot support an audio stream at this time.";
    //        //if (this.debug) {
    //        errorString += this.moreErrorInfo("MEDIA_ERR_NETWORK");
    //        //}
    //        break;
    //    case MediaError.MEDIA_ERR_DECODE:
    //        errorString = "An error has occurred while attempting to play the file. The file is either corrupt or an unsupported format (ex: m4p, ogg, flac).  Transcoding may be required to play this file.";
    //        //if (this.debug) {
    //        errorString += this.moreErrorInfo("MEDIA_ERR_DECODE");
    //        //}
    //        break;
    //    case this.MEDIA_ERR_SRC_NOT_SUPPORTED:
    //        errorString = "The file is not suitable for streaming";
    //        //if (this.debug) {
    //        errorString += "Error Type: MEDIA_ERR_SRC_NOT_SUPPORTED";
    //        //}
    //        break;
    //    }
    //    return errorString;
    //},
    //
    //moreErrorInfo: function(type) {
    //    var moreInfo = "<br><br><font style='{font-size:smaller;}'><b>Debug Info:</b>";
    //    moreInfo += "<br>Error Type: " + type;
    //    if (this.player.palm && this.player.palm.errorDetails && this.player.palm.errorDetails.errorCode) {
    //        var errorDetails = this.player.palm.errorDetails;
    //        Mojo.Log.info("Error Details: %j", errorDetails);
    //        var errorClassString = "Unknown: (0x" + errorDetails.errorClass.toString(16).toUpperCase() + ")";
    //        var errorCodeString = "Unknown: (0x" + errorDetails.errorCode.toString(16).toUpperCase() + ")";
    //        switch (errorDetails.errorClass) {
    //        case 0x50501:
    //            errorClassString = "DecodeError(0x50501)";
    //            break;
    //        case 0x50502:
    //            errorClassString = "NetworkError(0x50502)";
    //            break;
    //        }
    //        switch (errorDetails.errorCode) {
    //        case 1:
    //            errorCodeString = "DecodeErrorFileNotFound(1)";
    //            break;
    //        case 2:
    //            errorCodeString = "DecodeErrorBadParam(2)";
    //            break;
    //        case 3:
    //            errorCodeString = "DecodeErrorPipeline(3)";
    //            break;
    //        case 4:
    //            errorCodeString = "DecodeErrorUnsupported(4)";
    //            break;
    //        case 5:
    //            errorCodeString = "DecodeErrorNoMemory(5)";
    //            break;
    //        case 6:
    //            errorCodeString = "NetworkErrorHttp(6)";
    //            break;
    //        case 7:
    //            errorCodeString = "NetworkErrorRtsp(7)";
    //            break;
    //        case 8:
    //            errorCodeString = "NetworkErrorMobi(8)";
    //            break;
    //        case 9:
    //            errorCodeString = "NetworkErrorOther(9)";
    //            break;
    //        case 12:
    //            errorCodeString = "NetworkErrorPowerDown(12)";
    //            break;
    //        }
    //        moreInfo += "<br>Class: " + errorClassString;
    //        moreInfo += "<br>Code: " + errorCodeString;
    //        moreInfo += "<br>Value: 0x" + errorDetails.errorValue.toString(16).toUpperCase();
    //    }
    //    moreInfo += "<br>Mime: " + this.playList[this.currentPlayingTrack].mime;
    //    moreInfo += "<br>URL: <a href=" + this.playList[this.currentPlayingTrack].url + ">Stream Link</a></font>";
    //    return moreInfo;
    //},
    
    //NowPlayingDisplayError: function(message) {
    //
    //    //if (this.NowPlaying) {
    //
    //    //var song = this.playList[this.currentPlayingTrack];
    //    this.streamingError(message, null);
    //    //}
    //},
    //
    //onStreamingErrorDismiss: function(value) {
    //    Mojo.Log.info("--> onErrorDialogDismiss value: " + value);
    //    switch (value) {
    //    case "retry":
    //        break;
    //    case "palm-attempt":
    //        var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
    //        controller.serviceRequest('palm://com.palm.applicationManager', {
    //            method: 'open',
    //            parameters: {
    //                target: this.errorSong.url
    //            }
    //            /*
    //             onSuccess: function(status){
    //             $('area-to-update').update(Object.toJSON(status));
    //             },
    //             onFailure: function(status){
    //             $('area-to-update').update(Object.toJSON(status));
    //             },
    //             onComplete: function(){
    //             this.getButton = myassistant.controller.get('LaunchAudioButton');
    //             this.getButton.mojo.deactivate();
    //             }*/
    //        });
    //        break;
    //    }
    //    this.errorSong = null;
    //    Mojo.Log.info("<-- onErrorDialogDismiss");
    //},
    //streamingError: function(errorText, song) {
    //    //this.errorSong = song;
    //    var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
    //    controller.showAlertDialog({
    //        onChoose: this.onStreamingErrorDismiss.bind(this),
    //        title: $L("Streaming Error"),
    //        message: errorText,
    //        choices: [{
    //            label: 'OK',
    //            value: "retry",
    //            type: 'primary'
    //        }
    //        /*{
    //         label: 'Let Palm Try',
    //         value: "palm-attempt",
    //         type: 'secondary'
    //         
    //         }*/
    //        ],
    //        allowHTMLMessage: true
    //    });
    //},