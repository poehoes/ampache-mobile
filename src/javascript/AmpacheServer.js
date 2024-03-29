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
var DEFAULT_PING_TIME = 1000 * 120;

AmpacheServer = Class.create({
    URL: "",
    UserName: "",
    Password: "",
    Connected: false,
    ConnectionFailed: false,
    pingTimer: null,
    ServerAction: "/server/xml.server.php?action=",
    /*Information from connect*/
    auth: "",
    api: "",
    update: "",
    add: "",
    clean: "",
    songs: "",
    albumn: "",
    artists: "",
    playlists: "",
    videos: "",
    version:"",
    tags:null,
    XMLFormattingIssue: "This happens due to songs with invalid characters information. <br><br> Look in the Ampache Web Interface for characters like  <img src='images/illegal_chars.png'/>.",
    ErrorEmptyResponse: "Response from server contained no information.  This usually happens when you don't have a solid connection to the server.  Please try again.",

    initialize: function(url, username, password) {
        Mojo.Log.info("Enter AmpacheServer.prototype.initialize", url, username, password);
        //this.phpPath = '/server/xml.server.php?action=';
        this.URL = url;
        this.UserName = username;
        this.Password = password;
        this.parser = new DOMParser();
        Mojo.Log.info("Exit AmpacheServer.prototype.initialize");
    },

    getAmpacheTime: function() {
        Mojo.Log.info("Enter AmpacheServer.prototype.getAmpacheTime");
        var foo = new Date(); // Generic JS date object 
        var unixtime_ms = foo.getTime(); // Returns milliseconds since the epoch 
        var unixtime = parseInt(unixtime_ms / 1000, 10);
        Mojo.Log.info("Exit AmpacheServer.prototype.getAmpacheTime", unixtime);
        return unixtime;
    },

    BuildConnectionUrl: function(url, username, password) {
        Mojo.Log.info("Enter AmpacheServer.prototype.BuildConnectionUrl", url, username, password);
        var time = this.getAmpacheTime();
        Mojo.Log.info("Time", time);
        var key = SHA256(password);
        Mojo.Log.info("key", key);
        var passphrase = SHA256(time + key);
        Mojo.Log.info("passphrase", passphrase);
        var connectionUrl = url + this.ServerAction + "handshake&auth=" + passphrase + "&" + "timestamp=" + time + "&version=350001&user=" + username;
        Mojo.Log.info("connectionUrl", connectionUrl);
        Mojo.Log.info("Exit AmpacheServer.prototype.BuildConnectionUrl");
        return connectionUrl;
    },

    BuildActionString: function(action, keypairParams) {
        Mojo.Log.info("--> AmpacheServer.prototype.BuildActionString");
        var paramsString = "";
        if (keypairParams) {
            var i = 0;
            do {
                paramsString += "&" + keypairParams[i] + "=" + keypairParams[i + 1];
                i += 2;
            } while ( i < keypairParams . length );
        }
        var ActionString = this.URL + this.ServerAction + action + "&auth=" + this.auth + paramsString;
        Mojo.Log.info("Built Action String: " + ActionString);
        Mojo.Log.info("<-- AmpacheServer.prototype.BuildActionString");
        return ActionString;
    },


    GetRandomSongs:function(size)
    {
        var path = this.URL + "/play/index.php?sid=" +  this.auth + "&random=1&type=default&uid=1";
        songs = [];
        for(i = 0; i<size;i++)
        {
            songs[i] = new SongModel(0, "Shuffle All Songs", "Random Artist", 0, "Random Album", i, 1, 0, path, 0, "images/shuffled.png", "mime/random");
        }
        return songs;
    },

    onCreate: function() {
        console.info('******* onCreate happened');
    },

    onLoading: function() {
        console.info('******* onLoading happened');
    },

    onLoaded: function() {
        console.info('******* onLodaed happened');
    },

    onComplete: function() {
        console.info('******* onComplete happened');
    },

    PingCallBack:null,
    
    _ping: function(callback) {
        
        Mojo.Log.info("--> AmpacheServer.prototype._ping");
        this.StopPing();
        
        
        this.PingCallBack = callback;
        var path = this.BuildActionString("ping");
        var request = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false,
            //to enforce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this._pingCallback.bind(this),
            onFailure: this._pingCallback.bind(this)
        });
        Mojo.Log.info("<-- AmpacheServer.prototype._ping");
    },
    
    warned:false,
    _pingCallback: function(transport) {
        Mojo.Log.info("--> AmpacheServer.prototype._pingCallback");
        Mojo.Log.info(transport.responseText);
        
        try
        {
            var ping = new PingModel(transport.responseXML);
            this.version = ping.Server;
            if((ping.Server==="Uknown") && !this.warned)
            {
                this.ShowErrorAlert("Ampache Mobile will work best if you update to 3.5.2 or newer from ampache.org");
                this.warned = true;
            }
            this.StopPing();
            this.pingTimer = setInterval(this._ping.bind(this), ping.TimeRemaining);
            if(this.PingCallBack){
                this.PingCallBack();
                this.PingCallBack=null;
            }
            Mojo.Log.info("<-- AmpacheServer.prototype._pingCallback");
            
        }
        catch(ex)
        {
            if(!this.warned)
            {
                this.warned = true;
                this.ShowErrorAlert("Ping Error:<br>" + this.EscapeXML(transport.responseText));
            }
            this.StopPing();
            this.pingTimer = setInterval(this._ping.bind(this), DEFAULT_PING_TIME);
            Mojo.Log.info("<-- AmpacheServer.prototype._pingCallback");
        }
        
        

    },

    StopPing: function() {
        if (this.pingTimer) {
            window.clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    },

    disconnect: function() {
        Mojo.Log.info("--> AmpacheServer.prototype.disconnect");
        this.StopPing();
        this.Connected = false;
        Mojo.Log.info("<-- AmpacheServer.prototype.disconnect");
    },

    ConnectRequest: null,
    //Following format http://localhost/ampache/server/xml.server.php?action=handshake&auth=$passphrase&timestamp=$time&version=350001&user=vollmerk
    connect: function(callback) {
        Mojo.Log.info("--> AmpacheServer.prototype.connect");
        this.ConnectCallback = callback;
        if (typeof this.ConnectCallback !== "function") {
            this.ConnectCallback = new Function(func);
        }

        var AuthPath = this.BuildConnectionUrl(this.URL, this.UserName, this.Password);
        Mojo.Log.info("Sending ajax request to: ", AuthPath);
        this.ConnectRequest = new Ajax.Request(AuthPath, {
            method: 'get',
            evalJSON: false,
            //to enf rce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this.ConnectCallbackSuccess.bind(this),
            onFailure: this.ConnectCallbackFailure.bind(this)
        });
        Mojo.Log.info("<-- AmpacheServer.prototype.connect");
    },

    getServerDataTimeSignature:function(){
        if(this.Connected===true)
        {
            return this.update.getTime() + "_" + this.add.getTime()+ "_" + this.clean.getTime();
        }
        else
        {
            return "";
        }
    },

    ConnectCancel: function() {
        this.ConnectRequest.abort();
    },

    ConnectCallbackSuccess: function(transport) {
        Mojo.Log.info("--> AmpacheServer.prototype.ConnectCallbackSuccess");
        Mojo.Log.info("TestConnectionCallbackSuccess gotResults: " + transport.responseText);
        var returnValue = transport.responseText;
        if (transport.responseText === "") {
            returnValue = "Error: Empty response";
        }

        if (transport.responseXML) {
            Mojo.Log.info("responseXML exits");
            var response = transport.responseXML;
            var findAuth = response.getElementsByTagName("auth");

            //Check for auth key to validate that login information is correct
            if (findAuth.length !== 0) {
                Mojo.Log.info("Found Auth");
                this.auth = findAuth[0].firstChild.data;
                this.api = response.getElementsByTagName("api")[0].firstChild.data;
                this.update = new Date();
                this.update.setISO8601(response.getElementsByTagName("update")[0].firstChild.data);
                this.add = new Date();
                this.add.setISO8601(response.getElementsByTagName("add")[0].firstChild.data);
                this.clean = new Date();
                this.clean.setISO8601(response.getElementsByTagName("clean")[0].firstChild.data);
                this.songs = parseInt(response.getElementsByTagName("songs")[0].firstChild.data, 10);
                this.albums = parseInt(response.getElementsByTagName("albums")[0].firstChild.data, 10);
                this.artists = parseInt(response.getElementsByTagName("artists")[0].firstChild.data, 10);
                this.playlists = parseInt(response.getElementsByTagName("playlists")[0].firstChild.data, 10);
                this.videos = parseInt(response.getElementsByTagName("videos")[0].firstChild.data, 10);
                var tags = response.getElementsByTagName("tags");
                if(tags && tags.length!==0)
                {
                    this.tags = parseInt(tags[0].firstChild.data, 10);
                }
                Mojo.Log.info(" auth: " + this.auth + " api: " + this.api + " update: " + this.update + " add: " + this.add + " clean: " + this.clean + " songs: " + this.songs + " albums: " + this.albums + " artists: " + this.artists + " playlists: " + this.playlists + " videos: " + this.videos);
                returnValue = "connected";
                this.Connected = true;
                this._ping();
            } else { //if no auth key exists check for an error
                var findErrorCode = response.getElementsByTagName("error");
                if (findErrorCode.length !== 0) {
                    returnValue = findErrorCode[0].firstChild.data;
                }
            }
            
        }
        Mojo.Log.info("Calling callback function this.ConnectCallback:");
        this.ConnectCallback(returnValue);
        Mojo.Log.info("<-- AmpacheServer.prototype.ConnectCallbackSuccess");
    },

    ConnectCallbackFailure: function(transport) {
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnectionCallbackFailure");
        this.TestConnectionCallback("failed", this.TestConnectionContext);
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnectionCallbackFailure");
    },

    CleanupIllegalXML: function(transport) {
        this.ProblemFinder(transport.responseText); //Alert Users to Issue
        text = transport.responseText;
        if(text==="")
        {
            return transport;
        }
        text.replace(/[^\x0009\x000A\x000D\x0020-\xD7FF\xE000-\xFFFD]/g, ' ');
        transport.responseXML = parser.parseFromString(text, "text/xml");
        return transport;
    },

    EscapeXML: function(xml) {
        return xml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt; ");

    },

    ProblemFinder: function(xmlResponse, type) {
        try {
            if(xmlResponse=="")
            {
                this.ShowErrorAlert(this.ErrorEmptyResponse);
                return;
            }
            
            
            foundProblem = false;

            var footer = "</" + type + ">";

            var parts = xmlResponse.split("<root>");
            var header = parts[0];
            var parts = parts[1].split("</root>");
            var elements = parts[0].replace(/\s+$/, '').split(footer);
            for (var i = 0; (i < elements.length - 1) && !foundProblem; i++) {
                //Valid Chars = #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]

                var element = header + "<root>" + elements[i] + footer + "</root>";

                if (element.match(/[^\x0009\x000A\x000D\x0020-\xD7FF\xE000-\xFFFD]/)) {
                    this.ShowErrorAlert("Look for characters like this in the Ampache WebUI: <img src='images/illegal_chars.png'/><br><br><b>corrupt " + type + ":</b>" + this.EscapeXML(elements[i] + footer));
                    foundProblem = true;
                }
            }
        } catch(err) {
            Mojo.Controller.errorDialog("Caught Error: " + err.message);
            //foundProblem = true;
        }

        if (!foundProblem) {
            this.ShowErrorAlert(this.XMLFormattingIssue);
        }

    },

    ShowErrorAlert: function(string) {
        var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
        controller.showAlertDialog({
            onChoose: this.EmailError.bind(string),
            allowHTMLMessage: true,
            title: $L("XML Processing Error"),
            message: $L(string),
            choices: [{
                label: $L('Ok'),
                value: 'ok',
                type: 'primary'
            },
            {
                label: $L('E-Mail Report'),
                value: 'email',
                type: 'secondary'
            }]
        });

    },

    EmailError: function(event) {
        if (event === 'email') {
            errorString = this;
            var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
            controller.serviceRequest('palm://com.palm.applicationManager', {
                method: 'open',
                parameters: {
                    id: 'com.palm.app.email',
                    params: {
                        summary: 'Ampache Mobile XML Processing Error',
                        text: errorString
                    }
                }
            });
        }
    },

    //******************************************************************************************/
    //Get All Artist information 
    GetArtistsCallback: null,
    GetArtists: function(params) {
        Mojo.Log.info("--> AmpacheServer.prototype.GetArtists");
        this.GetArtistsCallback = params.CallBack;
        var path;
        if (typeof this.GetArtistsCallback !== "function") {
            this.GetArtistsCallback = new Function(func);
        }

        if((params.CheckSaved === true) && (AmpacheMobile.settingsManager.areArtistsCurrent(AmpacheMobile.Account, this) === true))
        {
            AmpacheMobile.settingsManager.FetchSavedArtists(AmpacheMobile.Account, this);
        }
        else
        {

        var filter = [];
        var i = 0;
        var type = "artists";
        filter[i++] = "offset";
        filter[i++] = params.offset;
        filter[i++] = "limit";
        filter[i++] = params.limit;

        if ((params.search !== null) && (params.search !== undefined)) {
            filter[i++] = "filter";
            filter[i++] = params.search;
        }

        if (params.TagID) {
            filter[i++] = "filter";
            filter[i++] = params.TagID;
            type = "tag_artists";
        }
        
        if(params.FromDate || params.ToDate)
        {
            filter[i++] = "add";
            filter[i++] = this.BuildDateString(params.FromDate, params.ToDate);
        }

        path = this.BuildActionString(type, filter);

        try {
            this.ArtistRequest = new Ajax.Request(path, {
                method: 'get',
                evalJSON: false,
                //to enforce parsing JSON if there is JSON response
                //onCreate: this.onCreate,
                //onLoading: this.onLoading,
                //onLoaded: this.onLoaded,
                //onComplete: this.onComplete,
                onSuccess: this.GotArtistsCallback.bind(this),
                onFailure: this.GetArtistsFailed.bind(this)
            });
        } catch(err) {
            Mojo.Controller.errorDialog("Get " + type + " failed: " + err.message);
        }
        }
        Mojo.Log.info("<-- AmpacheServer.prototype.GetArtists");
    },

    GetArtistsCancel: function() {
        if (this.ArtistRequest) {
            this.ArtistRequest.abort();
        }
    },
    
    GetArtistsFailed: function(transport) {
        this.ShowErrorAlert("Get Artists Failed");
    },


    GotArtistsCallback: function(transport) {
        Mojo.Log.info(transport.responseText);
        var ArtistList = "error";

        if (!transport.responseXML) {
            transport = this.CleanupIllegalXML(transport);
        }

        if (transport.responseXML) {
            ArtistList = [];
            var artistListXML = transport.responseXML.getElementsByTagName("artist");
            //Mojo.Log.info("Artist lenth: " + artistListXML.length);
            if (artistListXML.length > 0) {
                var i = 0;
                /*
                 do {
                 ArtistList[i] = new ArtistModel(artistListXML[i].getAttribute("id"), artistListXML[i].getElementsByTagName("name")[0].firstChild.data, artistListXML[i].getElementsByTagName("albums")[0].firstChild.data, artistListXML[i].getElementsByTagName("songs")[0].firstChild.data);
                 i++;
                 } while (i < artistListXML.length)
                 */
                var n = parseInt(artistListXML.length / 4, 10); // four Stage unloop... semi Duffish
                if (n > 0) {
                    do {
                        try {
                            ArtistList[i] = new ArtistModel(artistListXML[i].getAttribute("id"), artistListXML[i].getElementsByTagName("name")[0].firstChild.data, artistListXML[i].getElementsByTagName("albums")[0].firstChild.data, artistListXML[i].getElementsByTagName("songs")[0].firstChild.data);
                            i++;
                            ArtistList[i] = new ArtistModel(artistListXML[i].getAttribute("id"), artistListXML[i].getElementsByTagName("name")[0].firstChild.data, artistListXML[i].getElementsByTagName("albums")[0].firstChild.data, artistListXML[i].getElementsByTagName("songs")[0].firstChild.data);
                            i++;
                            ArtistList[i] = new ArtistModel(artistListXML[i].getAttribute("id"), artistListXML[i].getElementsByTagName("name")[0].firstChild.data, artistListXML[i].getElementsByTagName("albums")[0].firstChild.data, artistListXML[i].getElementsByTagName("songs")[0].firstChild.data);
                            i++;
                            ArtistList[i] = new ArtistModel(artistListXML[i].getAttribute("id"), artistListXML[i].getElementsByTagName("name")[0].firstChild.data, artistListXML[i].getElementsByTagName("albums")[0].firstChild.data, artistListXML[i].getElementsByTagName("songs")[0].firstChild.data);
                            i++;
                        } catch(err) {
                            var name = artistListXML[i].getElementsByTagName("name");
                            var _name;
                            if (name) {
                                _name = artistListXML[i].getElementsByTagName("name")[0].firstChild.data;
                            } else {
                                _name = "";
                            }
                            ArtistList[i] = new ArtistModel(artistListXML[i].getAttribute("id"), _name, artistListXML[i].getElementsByTagName("albums")[0].firstChild.data, artistListXML[i].getElementsByTagName("songs")[0].firstChild.data);
                            i++;
                        }
                    } while ( i < n );
                }
                if (i < artistListXML.length) {
                    do {
                        ArtistList[i] = new ArtistModel(artistListXML[i].getAttribute("id"), artistListXML[i].getElementsByTagName("name")[0].firstChild.data, artistListXML[i].getElementsByTagName("albums")[0].firstChild.data, artistListXML[i].getElementsByTagName("songs")[0].firstChild.data);
                    } while (++ i < artistListXML . length );
                }
            }
        } else {
            this.ProblemFinder(transport.responseText, "artist");
            //Mojo.Controller.errorDialog("Get Artists failed: " + this.XMLFormattingIssue);
            
        }

        this.GetArtistsCallback(ArtistList);
        this.ArtistRequest = null;
    },

    //******************************************************************************************/
    //Get Albums information 
    GetAlbumsCallback: null,

    //GetAlbums: function(_GetAlbumsCallback, _ArtistId, _TagID, _offset, _limit, _search) {
    GetAlbums: function(params) { 
        Mojo.Log.info("--> AmpacheServer.prototype.GetAlbums");
        var i = 0;
        this.GetAlbumsCallback = params.CallBack;
        if (typeof this.GetAlbumsCallback !== "function") {
            this.GetAlbumsCallback = new Function(func);
        }

        if((params.CheckSaved === true) && (AmpacheMobile.settingsManager.areAlbumsCurrent(AmpacheMobile.Account, this) === true))
        {
            AmpacheMobile.settingsManager.FetchSavedAlbums(AmpacheMobile.Account, this);
        }
        else
        {

        var type = "albums";
        var filter = [];

        if (params.ArtistId) {
            filter[i++] = "filter";
            filter[i++] = params.ArtistId;
            type = "artist_albums";
        } else if (params.TagID) {
            filter[i++] = "filter";
            filter[i++] = params.TagID;
            type = "tag_albums";
        }

        filter[i++] = "offset";
        filter[i++] = params.offset;
        filter[i++] = "limit";
        filter[i++] = params.limit;
        if (params.search) {
            filter[i++] = "filter";
            filter[i++] = params.search;
        }
        
        if(params.FromDate || params.ToDate)
        {
            filter[i++] = "add";
            filter[i++] = this.BuildDateString(params.FromDate, params.ToDate);
        }

        var path = this.BuildActionString(type, filter);
        this.GetAlbumsInteractiveIndex = 0;
        this.TotalAlbums = 0;
        this.GetAlbumsRequest = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false,
            //to enforce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this.GotAlbumsCallback.bind(this),
            onFailure: this.GetAlbumsFailed.bind(this)
        });
        }
        Mojo.Log.info("<-- AmpacheServer.prototype.GetAlbums");
    },


    GetAlbumsFailed: function(transport) {
        this.ShowErrorAlert("Get Albums Failed");
    },

    GetAlbumsCancel: function() {
        if (this.GetAlbumsRequest) {
            this.GetAlbumsRequest.abort();
        }
    },

    GotAlbumsCallback: function(transport) {
        Mojo.Log.info("--> AmpacheServer.prototype.GotAlbumsCallback");

        if (!transport.responseXML) {
            transport = this.CleanupIllegalXML(transport);
        }

        var AlbumList = "error";
        if (transport.responseXML) {
            var xmlDoc = transport.responseXML;
            AlbumList = [];
            var albumListXML = xmlDoc.getElementsByTagName("album");
            if (albumListXML.length > 0) {
                var i = 0;
                /*
                 do {
                 AlbumList[i] = new AlbumModel(albumListXML[i].getAttribute("id"),albumListXML[i].getElementsByTagName("name")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].firstChild.data,albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data,  albumListXML[i].getElementsByTagName("year")[0].firstChild.data, albumListXML[i].getElementsByTagName("disk")[0].firstChild.data, albumListXML[i].getElementsByTagName("art")[0].firstChild.data);
                 i++;
                 } while (i < albumListXML.length)
                 */

                var n = parseInt(albumListXML.length / 4, 10); // four Stage unloop... semi Duffish
                if (n > 0) {
                    do {
                        AlbumList[i] = new AlbumModel(albumListXML[i].getAttribute("id"), albumListXML[i].getElementsByTagName("name")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].getAttribute("id"), albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data, albumListXML[i].getElementsByTagName("year")[0].firstChild.data, albumListXML[i].getElementsByTagName("disk")[0].firstChild.data, albumListXML[i].getElementsByTagName("art")[0].firstChild.data);
                        i++;
                        AlbumList[i] = new AlbumModel(albumListXML[i].getAttribute("id"), albumListXML[i].getElementsByTagName("name")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].getAttribute("id"), albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data, albumListXML[i].getElementsByTagName("year")[0].firstChild.data, albumListXML[i].getElementsByTagName("disk")[0].firstChild.data, albumListXML[i].getElementsByTagName("art")[0].firstChild.data);
                        i++;
                        AlbumList[i] = new AlbumModel(albumListXML[i].getAttribute("id"), albumListXML[i].getElementsByTagName("name")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].getAttribute("id"), albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data, albumListXML[i].getElementsByTagName("year")[0].firstChild.data, albumListXML[i].getElementsByTagName("disk")[0].firstChild.data, albumListXML[i].getElementsByTagName("art")[0].firstChild.data);
                        i++;
                        AlbumList[i] = new AlbumModel(albumListXML[i].getAttribute("id"), albumListXML[i].getElementsByTagName("name")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].getAttribute("id"), albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data, albumListXML[i].getElementsByTagName("year")[0].firstChild.data, albumListXML[i].getElementsByTagName("disk")[0].firstChild.data, albumListXML[i].getElementsByTagName("art")[0].firstChild.data);
                        i++;
                    } while ( i < n );
                }
                if (i < albumListXML.length) {
                    do {
                        AlbumList[i] = new AlbumModel(albumListXML[i].getAttribute("id"), albumListXML[i].getElementsByTagName("name")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].firstChild.data, albumListXML[i].getElementsByTagName("artist")[0].getAttribute("id"), albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data, albumListXML[i].getElementsByTagName("year")[0].firstChild.data, albumListXML[i].getElementsByTagName("disk")[0].firstChild.data, albumListXML[i].getElementsByTagName("art")[0].firstChild.data);
                    } while (++ i < albumListXML . length );
                }
            }
        } else {
            this.ProblemFinder(transport.responseText, "album");
            //Mojo.Controller.errorDialog("Get Albums failed: " + this.XMLFormattingIssue);
        }
        
        this.GetAlbumsCallback(AlbumList);
        
        this.GetAlbumsRequest = null;
        Mojo.Log.info("<-- AmpacheServer.prototype.GotAlbumsCallback");
    },

    //******************************************************************************************/
    //Get Album Songs
    GetSongsCallback: null,
    //GetSongs: function(_GetSongsCallback, _AlbumId, _ArtistId, _PlayListID, _TagID, _offset, _limit, _search, _global_search) {
    GetSongs: function(params) {
        Mojo.Log.info("--> AmpacheServer.prototype.GetSongs");
        this.GetSongsCallback = params.CallBack;
        if (typeof this.GetSongsCallback !== "function") {
            this.GetSongsCallback = new Function(func);
        }
        var i = 0;
        var path = "";
        var type = "";
        var filter = [];
        if (params.AlbumId) {
            filter[i++] = "filter";
            filter[i++] = params.AlbumId;
            type = "album_songs";
        } else if (params.ArtistId) {
            filter[i++] = "filter";
            filter[i++] = params.ArtistId;
            type = "artist_songs";
        } else if (params.PlayListID) {
            filter[i++] = "filter";
            filter[i++] = params.PlayListID;
            type = "playlist_songs";
        } else if (params.TagID) {
            filter[i++] = "filter";
            filter[i++] = params.TagID;
            type = "tag_songs";
        } else if ((params.global_search) && (params.global_search === true)) {
            type = "search_songs";
        } else {
            type = "songs";
        }


        if(params.FromDate || params.ToDate)
        {
            filter[i++] = "add";
            filter[i++] = this.BuildDateString(params.FromDate, params.ToDate);
        }

        filter[i++] = "offset";
        filter[i++] = params.offset;
        filter[i++] = "limit";
        filter[i++] = params.limit;
        if (params.search) {
            filter[i++] = "filter";
            filter[i++] = params.search;
        }

        path = this.BuildActionString(type, filter);
        this.SongsRequest = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false,
            //to enforce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this.GotSongsCallbackInternal.bind(this),
            onFailure: this.GetSongsFailed.bind(this)
        });
        Mojo.Log.info("<-- AmpacheServer.prototype.GetSongs");
    },

    GetSongsFailed: function(transport) {
        this.ShowErrorAlert("Get Songs Failed");
    },

    GetSongsCancel: function() {
        if (this.SongsRequest) {
            this.SongsRequest.abort();
        }
    },

    GotSongsCallbackInternal: function(transport) {
        Mojo.Log.info("--> AmpacheServer.prototype.GotSongsCallbackInternal");
        Mojo.Log.info(transport.responseText);
        var SongsList = "error"; //Preinitialized to error will be made into an array if we get data

        if (!transport.responseXML) {
            transport = this.CleanupIllegalXML(transport);
        }
        if (transport.responseXML) {
            SongsList = [];
            /*
             <root>
             <song id="3180">
             <title>Hells Bells</title>
             <artist id="129348">AC/DC</artist>
             <album id="2910">Back in Black</album>
             <tag id="2481" count="3">Rock & Roll</tag>
             <tag id="2482" count="1">Rock</tag>
             <tag id="2483" count="1">Roll</tag>
             <track>4</track>
             <time>234</time>
             <url>http://localhost/play/index.php?oid=123908...</url>
             <size>Song Filesize in Bytes</size>
             <art>http://localhost/image.php?id=129348</art>
             <preciserating>3</preciserating>
             <rating>2.9</rating>
             </song>
             </root>
             */
            var songsListXML = transport.responseXML.getElementsByTagName("song");
            var i = 0;

            var _id;
            var _title;

            var artistTag;
            var _artist;
            var _artist_id;

            var albumTag;
            var _album;
            var _album_id;

            var _track;
            var _time;
            var _url;
            var _size;
            var mimeXML;
            var _mime;
            var artXML;
            var _art;
            var newSong;

            while (i < songsListXML.length) {
                _id = songsListXML[i].getAttribute("id");
                _title = songsListXML[i].getElementsByTagName("title")[0].firstChild.data;
                try {
                    artistTag = songsListXML[i].getElementsByTagName("artist")[0];
                    _artist = artistTag.firstChild.data;
                    _artist_id = artistTag.getAttribute("id");
                } catch(err) {
                    _artist = "";
                    _artist_id = -1;
                }
                try {
                    albumTag = songsListXML[i].getElementsByTagName("album")[0];
                    _album = albumTag.firstChild.data;
                    _album_id = albumTag.getAttribute("id");
                } catch(err2) {
                    _album = "";
                    _album_id = -1;
                }
                _track = songsListXML[i].getElementsByTagName("track")[0].firstChild.data;
                _time = songsListXML[i].getElementsByTagName("time")[0].firstChild.data;
                _url = songsListXML[i].getElementsByTagName("url")[0].firstChild.data;
                _size = songsListXML[i].getElementsByTagName("size")[0].firstChild.data;

                mimeXML = songsListXML[i].getElementsByTagName("mime");
                if (mimeXML[0].firstChild) {
                    _mime = mimeXML[0].firstChild.data;
                } else {
                    _mime = "";
                }

                artXML = songsListXML[i].getElementsByTagName("art");
                if (artXML[0].firstChild) {
                    _art = artXML[0].firstChild.data;
                } else {
                    _art = "";
                }

                newSong = new SongModel(_id, _title, _artist, _artist_id, _album, _album_id, _track, _time, _url, _size, _art, _mime);
                SongsList[i] = newSong;
                i++;
            }
        } else {
            this.ProblemFinder(transport.responseText, "song");
            //Mojo.Controller.errorDialog("Get songs failed: " + this.XMLFormattingIssue);
        }
        this.SongsRequest = null;
        Mojo.Log.info("Calling callback");
        this.GetSongsCallback(SongsList);
        Mojo.Log.info("<-- AmpacheServer.prototype.GotSongsCallbackInternal");
    },

    //********************************************************************************************
    // Playlists

    GetPlaylistsCallback: null,
    GetPlaylists: function(_GetPlaylistsCallback, _offset, _limit, _search) {
        Mojo.Log.info("--> AmpacheServer.prototype.GetPlaylists");
        var path;
        this.GetPlaylistsCallback = _GetPlaylistsCallback;
        if (typeof this.GetPlaylistsCallback !== "function") {
            this.GetPlaylistsCallback = new Function(func);
        }

        var offset = [];
        var i = 0;
        offset[i++] = "offset";
        offset[i++] = _offset;
        offset[i++] = "limit";
        offset[i++] = _limit;
        if (_search) {
            offset[i++] = "filter";
            offset[i++] = _search;
        }
        path = this.BuildActionString("playlists", offset);

        this.PlaylistRequest = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false,
            //to enforce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this.GotPlaylistsCallback.bind(this),
            onFailure: this.GetPlaylistsFailed.bind(this)
        });
        Mojo.Log.info("<-- AmpacheServer.prototype.GetArtists");
    },

    GetPlaylistsFailed: function(transport) {
        this.ShowErrorAlert("Get Playlists Failed");
    },

    GetPlaylistsCancel: function() {
        if (this.PlaylistRequest) {
            this.PlaylistRequest.abort();
        }
    },

    GotPlaylistsCallback: function(transport) {
        Mojo.Log.info(transport.responseText);
        var PlaylistsList = "error";

        if (!transport.responseXML) {
            transport = this.CleanupIllegalXML(transport);
        }

        if (transport.responseXML) {
            PlaylistsList = [];
            var PlaylistsListXML = transport.responseXML.getElementsByTagName("playlist");
            var i = 0;
            while (i < PlaylistsListXML.length) {
                PlaylistsList[i] = new PlaylistModel(PlaylistsListXML[i].getAttribute("id"), PlaylistsListXML[i].getElementsByTagName("name")[0].firstChild.data, PlaylistsListXML[i].getElementsByTagName("owner")[0].firstChild.data, PlaylistsListXML[i].getElementsByTagName("items")[0].firstChild.data, PlaylistsListXML[i].getElementsByTagName("type")[0].firstChild.data);
                i++;
            }
        } else {
            this.ProblemFinder(transport.responseText, "playlist");
            //Mojo.Controller.errorDialog("Get Playlists failed: " + this.XMLFormattingIssue);
        }
        this.GetPlaylistsCallback(PlaylistsList);
        this.PlaylistRequest = null;
    },

    //********************************************************************************************
    // Tags
    GetTagsCallback: null,
    GetTags: function(_GetTagsCallback, _offset, _limit, _search) {
        Mojo.Log.info("--> AmpacheServer.prototype.GetTags");
        var path;
        this.GetTagsCallback = _GetTagsCallback;
        if (typeof this.GetTagsCallback !== "function") {
            this.GetTagsCallback = new Function(func);
        }

        var offset = [];
        var i = 0;
        if (_search) {
            offset[i++] = "filter";
            offset[i++] = _search;
        }
        offset[i++] = "offset";
        offset[i++] = _offset;
        offset[i++] = "limit";
        offset[i++] = _limit;
        path = this.BuildActionString("tags", offset);

        this.TagsRequest = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false,
            //to enforce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this.GotTagsCallback.bind(this),
            onFailure: this.GetGenresFailed.bind(this)
        });
        Mojo.Log.info("<-- AmpacheServer.prototype.GetArtists");
    },

    GetGenresFailed: function(transport) {
        this.ShowErrorAlert("Get Genres Failed");
    },

    GetTagsCancel: function() {
        if (this.TagsRequest) {
            this.TagsRequest.abort();
        }
    },

    GotTagsCallback: function(transport) {
        //Mojo.Log.info(transport.responseText);
        var TagsList = "error";
        /*
         <root>
         <tag id="2481">
         <name>Rock & Roll</name>
         <albums>84</albums>
         <artists>29</artists>
         <songs>239</songs>
         <video>13</video>
         <playlist>2</playlist>
         <stream>6</stream>
         </tag>
         </root>
         *
         */

        if (!transport.responseXML) {
            transport = this.CleanupIllegalXML(transport);
        }

        if (transport.responseXML) {
            TagsList = [];
            var TagsListXML = transport.responseXML.getElementsByTagName("tag");
            var i = 0;
            while (i < TagsListXML.length) {
                var _id = TagsListXML[i].getAttribute("id");
                var _name = TagsListXML[i].getElementsByTagName("name")[0].firstChild.data;
                var _albums = TagsListXML[i].getElementsByTagName("albums")[0].firstChild.data;
                var _artists = TagsListXML[i].getElementsByTagName("artists")[0].firstChild.data;
                var _songs = TagsListXML[i].getElementsByTagName("songs")[0].firstChild.data;
                var _videos = TagsListXML[i].getElementsByTagName("videos")[0].firstChild.data;
                var _playlists = TagsListXML[i].getElementsByTagName("playlists")[0].firstChild.data;
                var _stream = TagsListXML[i].getElementsByTagName("stream")[0].firstChild.data;
                TagsList[i] = new TagModel(_id, _name, _albums, _artists, _songs, _videos, _playlists, _stream);
                i++;
            }
        } else {
            this.ProblemFinder(transport.responseText, "tag");
            //Mojo.Controller.errorDialog("Get Tags failed: " + this.XMLFormattingIssue);
        }
        this.GetTagsCallback(TagsList);
        this.TagsRequest = null;
    },
    
    
    
    
    //********************************************************************************************
    // Videos
    GetVideosCallback: null,
    GetVideos: function(params) {
        Mojo.Log.info("--> AmpacheServer.prototype.GetVideos");
        var path;
        this.GetVideosCallback = params.callback;
        if (typeof this.GetVideosCallback !== "function") {
            this.GetVideosCallback = new Function(func);
        }

        var offset = [];
        var i = 0;
        if (params.search) {
            offset[i++] = "filter";
            offset[i++] = params.search;
        }
        
        if(params.FromDate)
        {
            offset[i++] = "add";
            offset[i++] = params.FromDate.toISO8601String();
        }
        
        offset[i++] = "offset";
        offset[i++] = params.offset;
        offset[i++] = "limit";
        offset[i++] = params.limit;
        path = this.BuildActionString("videos", offset);

        this.VideosRequest = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false,
            //to enforce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this.GotVideosCallback.bind(this),
            onFailure: this.GetVideosFailed.bind(this)
        });
        Mojo.Log.info("<-- AmpacheServer.prototype.GetVideos");
    },

    GetVideosFailed: function(transport) {
        this.ShowErrorAlert("Get Videos Failed");
    },

    GetVideosCancel: function() {
        if (this.VideosRequest) {
            this.VideosRequest.abort();
        }
    },

    GotVideosCallback: function(transport) {
        Mojo.Log.info(transport.responseText);
        var VideosList = "error";
        /*
        <video id="1234">
         <title>Futurama Bender's Big Score</title>
         <mime>video/avi</mime>
         <resolution>720x288</resolution>
         <size>Video Filesize in Bytes</size>
         <tag id="12131" count="3">Futurama</tag>
         <tag id="32411" count="1">Movie</tag>
         <url>http://localhost/play/index.php?oid=123908...</url>
         *
         */

        if (!transport.responseXML) {
            Mojo.Log.info("Cleaning up XML");
            transport = this.CleanupIllegalXML(transport);
        }

        if (transport.responseXML) {
            VideosList = [];
            var VideosListXML = transport.responseXML.getElementsByTagName("video");
            var i = 0;
            while (i < VideosListXML.length) {
                Mojo.Log.info("Processing " + i);
                
                var _id = VideosListXML[i].getAttribute("id");
                
                var _title = "";
                titleXML = VideosListXML[i].getElementsByTagName("title");
                if (titleXML[0].firstChild) {
                    _title = titleXML[0].firstChild.data;
                } else {
                    _title = "---";
                }
                
                mimeXML = VideosListXML[i].getElementsByTagName("mime");
                if (mimeXML[0].firstChild) {
                    _mime = mimeXML[0].firstChild.data;
                } else {
                    _mime = "unknown";
                }
                
                Mojo.Log.info("Processed title" + i);
                
                //var _title = VideosListXML[i].getElementsByTagName("title")[0].firstChild.data;
                //var _mime = VideosListXML[i].getElementsByTagName("mime")[0].firstChild.data;
                var _resolution = VideosListXML[i].getElementsByTagName("resolution")[0].firstChild.data;
                var _size = VideosListXML[i].getElementsByTagName("size")[0].firstChild.data;
                var _url = VideosListXML[i].getElementsByTagName("url")[0].firstChild.data;
                VideosList[i] = new VideoModel(_id, _title,_mime, _resolution, _size, _url);
                
                i++;
            }
        } else {
            this.ProblemFinder(transport.responseText, "video");
            //Mojo.Controller.errorDialog("Get Tags failed: " + this.XMLFormattingIssue);
        }
        this.GetVideosCallback(VideosList);
        this.VideosRequest = null;
    },
    
    

    /********************************************************************************************/
    // Test Processing
    TestConnection: function(url1, username1, password1, callback, source) {
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnection");
        this.TestConnectionContext = source;
        this.TestConnectionCallback = callback;
        if (typeof this.TestConnectionCallback !== "function") {
            this.TestConnectionCallback = new Function(func);
        }
        Mojo.Log.info("Building connection string", url1, username1, password1);
        var testpath = this.BuildConnectionUrl(url1, username1, password1);
        Mojo.Log.info("TestConnection: " + testpath);
        var request = new Ajax.Request(testpath, {
            method: 'get',
            evalJSON: false,
            //to enforce parsing JSON if there is JSON response
            //onCreate: this.onCreate,
            //onLoading: this.onLoading,
            //onLoaded: this.onLoaded,
            //onComplete: this.onComplete,
            onSuccess: this.TestConnectionCallbackSuccess.bind(this),
            onFailure: this.TestConnectionCallbackSuccess.bind(this)
        });
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnection");
    },

    TestConnectionCallbackSuccess: function(transport) {
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnectionCallbackSuccess");
        Mojo.Log.info("TestConnectionCallbackSuccess gotResults: " + transport.responseText);
        var returnValue = transport.responseText;
        if (transport.responseText === "") {
            returnValue = "Error: Empty response";
        }
        
        if (transport.responseXML) {
            Mojo.Log.info("responseXML exits");
            var response = transport.responseXML;
            var findAuth = response.getElementsByTagName("auth");
            //Check for auth key to validate that login information is correct
            if (findAuth.length !== 0) {
                Mojo.Log.info("Found Auth");
                this.authKey = findAuth[0].firstChild.data;
                Mojo.Log.info("authKey", this.authKey);
                returnValue = "Connection Test Success";
            } else {
                //if no auth key exists check for an error
                var findErrorCode = response.getElementsByTagName("error");
                if (findErrorCode.length !== 0) {
                    returnValue = findErrorCode[0].firstChild.data;
                }
            }
        }
        else if(transport.responseText !== "") {
            returnValue = transport.responseText.escapeHTML();
        }
       

        Mojo.Log.info("Calling callback function this.TestConnectionCallback:");
        this.TestConnectionCallback(returnValue, this.TestConnectCallbackContext);
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnectionCallbackSuccess");
    },

    TestConnectionCallbackFailure: function(transport) {
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnectionCallbackFailure");
        this.TestConnectionCallback("Test failed", this.TestConnectionContext);
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnectionCallbackFailure");
    },

    ConnectionCallbackSuccess: function(transport) {
        Mojo.Log.info("gotResults:" + transport.responseText);
        if (this.ConnectCallBack) {
            Mojo.Log.info("Calling Callback function", this.ConnectCallBack);
            this.ConnectCallBack(transport.responseText, this.ConnectCallbackContext);
        }
    },

    ConnectionCallbackFailure: function(transport) {
        var m = t.evaluate(transport);
        Mojo.Log.info("Failed:", m);
        this.ConnectCallBack(m);
    },
    
    BuildDateString:function(FromDate, ToDate)
    {
        var dateStr;
        if(FromDate && ToDate)
        {
           
            dateStr = FromDate.toISO8601String()+"/"+ToDate.toISO8601String();
        }
        else if(FromDate)
        {
            dateStr = FromDate.toISO8601String();
        }
        else if(ToDate)
        {
            var fromDate = new Date(0);
            dateStr = fromDate.toISO8601String()+"/"+ToDate.toISO8601String();
        }
        return dateStr;
    }
});










AmpacheServerAUTH = Class.create({
    root: [{
        auth: "",
        api: "",
        update: "",
        add: "",
        clean: "",
        songs: "",
        albumns: "",
        artists: "",
        playlists: "",
        videos: ""
    }]
});

/**
 * Ajax.Request.abort
 * extend the prototype.js Ajax.Request object so that it supports an abort method
 */
Ajax.Request.prototype.abort = function() {
    this.transport.onreadystatechange = Prototype.emptyFunction; // prevent and state change callbacks from being issued
    this.transport.abort(); // abort the XHR
    Ajax.activeRequestCount--; // update the request counter
};

AmpacheServer.Result = false;
AmpacheServer.ConnectResult = "";
AmpacheServer.Connected = false;
AmpacheServer.ConnectCallback = null;
AmpacheServer.ConnectCallbackContext = null;

//Test Connection Variables
AmpacheServer.TestConnectionCallback = null;
AmpacheServer.TestConnectionContext = null;