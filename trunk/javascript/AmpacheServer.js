
AmpacheServer = Class.create({

  
	
   
	URL: "",
    UserName: "",
    Password: "",
	Connected: false,
	ConnectionFailed: false,
    pingTimer:null,
	
	ServerAction: "/server/xml.server.php?action=",
	
	//Information from connect
	 auth:"",
	 api:"",
	 update:"",
	 add:"",
	 clean:"",
	 songs:"",
	 albumn:"",
	 artists:"",
	 playlists:"",
	 videos:"",
	 
    			    
        /*'<?xml version="1.0" encoding="UTF-8" ?> 
        	<root>
			<auth><![CDATA[41990ad6edb665ded1a9878726650567]]></auth>
			<api><![CDATA[350001]]></api>
			<update><![CDATA[1969-12-31T18:00:00-06:00]]></update>
			<add><![CDATA[1969-12-31T18:00:00-06:00]]></add>
			<clean><![CDATA[1969-12-31T18:00:00-06:00]]></clean>
			<songs><![CDATA[15745]]></songs>
			<albums><![CDATA[1165]]></albums>
			<artists><![CDATA[384]]></artists>
			<playlists><![CDATA[0]]></playlists>
			<videos><![CDATA[1]]></videos>  
		</root> ';
        */
	
	
	
	
    initialize: function(url, username, password){
        Mojo.Log.info("Enter AmpacheServer.prototype.initialize", url, username, password);
        
        //this.phpPath = '/server/xml.server.php?action=';
        this.URL = url;
        this.UserName = username;
        this.Password = password;
        
        Mojo.Log.info("Exit AmpacheServer.prototype.initialize");
    },
    
    getAmpacheTime: function(){
        Mojo.Log.info("Enter AmpacheServer.prototype.getAmpacheTime");
        var foo = new Date; // Generic JS date object 
        var unixtime_ms = foo.getTime(); // Returns milliseconds since the epoch 
        var unixtime = parseInt(unixtime_ms / 1000);
        Mojo.Log.info("Exit AmpacheServer.prototype.getAmpacheTime", unixtime);
        return unixtime;
    },
    
    BuildConnectionUrl: function(url, username, password){
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
    
	BuildActionString : function(action, keypairParams)
	{
		Mojo.Log.info("--> AmpacheServer.prototype.BuildActionString");
		var paramsString="";
		
		
		if (keypairParams != null) {
			for (var i = 0; i < keypairParams.length; i += 2) {
				paramsString += "&" + keypairParams[i] + "=" + keypairParams[i + 1]
			}
		}
		var ActionString = this.URL + this.ServerAction + action + "&auth=" + this.auth + paramsString;
		Mojo.Log.info("Built Action String: " + ActionString);
		
		Mojo.Log.info("<-- AmpacheServer.prototype.BuildActionString");
		
		return ActionString;
	},
	
    
	_ping : function ()
	{
		Mojo.Log.info("--> AmpacheServer.prototype._ping");
		
		
		 var path = this.BuildActionString("ping");
		 
		 var request = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false, //to enforce parsing JSON if there is JSON response
            onCreate: function(){
                console.info('******* onCreate happened')
            },
            onLoading: function(){
                console.info('******* onLoading happened')
            },
            onLoaded: function(){
                console.info('******* onLodaed happened')
            },
            onSuccess: this._pingCallback.bind(this),

            onComplete:function(){
                console.info('******* onComplete happened')
            }, 
			
            onFailure: this._pingCallback.bind(this)
        });
		
		
		Mojo.Log.info("<-- AmpacheServer.prototype._ping");
	},
	
	_pingCallback: function(transport){
		Mojo.Log.info("--> AmpacheServer.prototype._pingCallback");
		Mojo.Log.info(transport.responseText);
		Mojo.Log.info("<-- AmpacheServer.prototype._pingCallback");
	},
	
    
	disconnect:function()
	{
		Mojo.Log.info("--> AmpacheServer.prototype.disconnect");
		
		if (this.pingTimer != null) {
			window.clearInterval(this.pingTimer);
			this.pingTimer = null;
		}
		
		
		Mojo.Log.info("<-- AmpacheServer.prototype.disconnect");
		
	},
	
	
    //Following format http://localhost/ampache/server/xml.server.php?action=handshake&auth=$passphrase&timestamp=$time&version=350001&user=vollmerk
    connect: function(callback){
        Mojo.Log.info("--> AmpacheServer.prototype.connect");
        
       this.ConnectCallback = callback;
        
		
		
        if (typeof this.ConnectCallback != "function") 
            this.ConnectCallback = new Function(func)
        
		
		
		
        var AuthPath = this.BuildConnectionUrl(this.URL, this.UserName, this.Password); 
        
        Mojo.Log.info("Sending ajax request to: ", AuthPath);
        
       var request = new Ajax.Request(AuthPath, {
            method: 'get',
            evalJSON: false, //to enforce parsing JSON if there is JSON response
            onCreate: function(){
                console.info('******* onCreate happened')
            },
            onLoading: function(){
                console.info('******* onLoading happened')
            },
            onLoaded: function(){
                console.info('******* onLodaed happened')
            },
            onSuccess: function(){
                console.info('******* onComplete happened')
            },
            onComplete: this.ConnectCallbackSuccess.bind(this),
            onFailure: this.ConnectCallbackFailure.bind(this)
        });
        
		
		
		
        Mojo.Log.info("<-- AmpacheServer.prototype.connect");
    },
    
    
    ConnectCallbackSuccess: function(transport){
        Mojo.Log.info("--> AmpacheServer.prototype.ConnectCallbackSuccess");
        Mojo.Log.info("TestConnectionCallbackSuccess gotResults: " + transport.responseText);
        
		this.pingTimer = setInterval (this._ping.bind(this), 1000*60);
		
		var returnValue = transport.responseText;;
		if (transport.responseText == "") {
			returnValue = "Error: Empty response";
		}		
		    
        /*'<?xml version="1.0" encoding="UTF-8" ?> 
        	<root>
			<auth><![CDATA[41990ad6edb665ded1a9878726650567]]></auth>
			<api><![CDATA[350001]]></api>
			<update><![CDATA[1969-12-31T18:00:00-06:00]]></update>
			<add><![CDATA[1969-12-31T18:00:00-06:00]]></add>
			<clean><![CDATA[1969-12-31T18:00:00-06:00]]></clean>
			<songs><![CDATA[15745]]></songs>
			<albums><![CDATA[1165]]></albums>
			<artists><![CDATA[384]]></artists>
			<playlists><![CDATA[0]]></playlists>
			<videos><![CDATA[1]]></videos>  
		</root> ';
        */
        
        if (transport.responseXML != null) {
            Mojo.Log.info("responseXML exits");
            var response = transport.responseXML;
            var findAuth = response.getElementsByTagName("auth");
            
            //Check for auth key to validate that login information is correct
            if (findAuth.length != 0) {
                Mojo.Log.info("Found Auth");
                this.auth = findAuth[0].firstChild.data;
                
				this.api = response.getElementsByTagName("api")[0].firstChild.data;
				this.update = response.getElementsByTagName("update")[0].firstChild.data;
				this.add = response.getElementsByTagName("add")[0].firstChild.data;
				this.clean = response.getElementsByTagName("clean")[0].firstChild.data;
				this.songs = parseInt(response.getElementsByTagName("songs")[0].firstChild.data);
				this.albums = parseInt(response.getElementsByTagName("albums")[0].firstChild.data);
				this.artists = parseInt(response.getElementsByTagName("artists")[0].firstChild.data);
				this.playlists = parseInt(response.getElementsByTagName("playlists")[0].firstChild.data);
				this.videos = parseInt(response.getElementsByTagName("videos")[0].firstChild.data);
				
				Mojo.Log.info(" auth: " + this.auth + " api: " + this.api + " update: " + this.update  + " add: " + this.add  + " clean: " + this.clean  + " songs: " + this.songs + " albums: " + this.albums + " artists: " + this.artists + " playlists: " + this.playlists  + " videos: " + this.videos);
				
				
                returnValue = "connected";
            }
            else {
                //if no auth key exists check for an error
                var findErrorCode = response.getElementsByTagName("error");
                if (findErrorCode.length != 0) {
                    returnValue = findErrorCode[0].firstChild.data;
                }
            }
        }
        
		Mojo.Log.info("Calling callback function this.ConnectCallback:");   
        this.ConnectCallback(returnValue);
        Mojo.Log.info("<-- AmpacheServer.prototype.ConnectCallbackSuccess");
    },
    
	ConnectCallbackFailure: function(transport){
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnectionCallbackFailure");
        this.TestConnectionCallback("failed", this.TestConnectionContext)    
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnectionCallbackFailure");
        
    },
	//******************************************************************************************/
	//Get All Artist information 
	
	GetArtistsCallback:null, 
	
	GetArtists: function(_GetArtistsCallback, _offset, _limit)
	{
		
		Mojo.Log.info("--> AmpacheServer.prototype.GetArtists");
		
		 this.GetArtistsCallback = _GetArtistsCallback;
		 
		 if (typeof this.GetArtistsCallback != "function") 
            this.GetArtistsCallback = new Function(func)
		 
		 if ((_offset != null) && (_limit != null)) {
				var offset = [];
				offset[0] = "offset";
				offset[1] = _offset;
				
				
				offset[2] = "limit";
				offset[3] = _limit;
				
				var path = this.BuildActionString("artists", offset);
			}
			else {
				var path = this.BuildActionString("artists");
			}
		 
		 var request = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false, //to enforce parsing JSON if there is JSON response
            onCreate: function(){
                console.info('******* onCreate happened')
            },
            onLoading: function(){
                console.info('******* onLoading happened')
            },
            onLoaded: function(){
                console.info('******* onLodaed happened')
            },
            onSuccess: this.GotArtistsCallback.bind(this),
            onComplete: function(){
                console.info('******* onComplete happened')
            },
            onFailure: this.GotArtistsCallback.bind(this)
        });
		
		Mojo.Log.info("<-- AmpacheServer.prototype.GetArtists");
	}, 
	
	GotArtistsCallback: function(transport)
	{
		Mojo.Log.info(transport.responseText);


		var ArtistList = null
		
		if(transport.responseXML!=null)
		{
			ArtistList = new Array();
			
			var artistListXML = transport.responseXML.getElementsByTagName("artist"); 
			
			//Mojo.Log.info("Artist lenth: " + artistListXML.length);
	
			
			for (var i = 0; i < artistListXML.length; i++) {
				
				
				var _id = artistListXML[i].getAttribute("id")
				var _name = artistListXML[i].getElementsByTagName("name")[0].firstChild.data;
				var _albums = artistListXML[i].getElementsByTagName("albums")[0].firstChild.data;
				var _songs = artistListXML[i].getElementsByTagName("songs")[0].firstChild.data;
				
				var newArtist = new ArtistModel(_id, _name, _albums, _songs);
				//newArtist.initialize(_id, _name, _albums, _songs);
				
				
				//Mojo.Log.info("Artist "+_id+": " + _name);
				
				ArtistList[i] = newArtist;
			}
			
			
		}
		
		this.GetArtistsCallback(ArtistList)
		//return ArtistList;
	},
	
	//******************************************************************************************/
	//Get Albums information 
	GetAlbumsCallback:null, 
	GetAlbumsInteractiveIndex:0,
	GetAlbumsLeftOvers:"",
	GetAlbumsTimeInterval:null,
	GetAlbumsRequest:null,
	
	GetAlbumsLastAlbumIndex:0,
	
	GetAlbums: function(_GetAlbumsCallback, _ArtistId, _offset, _limit)
	{
		
		Mojo.Log.info("--> AmpacheServer.prototype.GetAlbums");
		
		 this.GetAlbumsCallback = _GetAlbumsCallback;
		 
		 if (typeof this.GetAlbumsCallback != "function") 
            this.GetAlbumsCallback = new Function(func)
		 
		 
		 if (_ArtistId != null) {
		 
		 	var filter = [];
		 	filter[0] = "filter";
		 	filter[1] = _ArtistId;
		 	
		 	
			
		 		var path = this.BuildActionString("artist_albums", filter);
		 	
		 }
		 else
		 {
		 	if ((_offset != null) && (_limit != null)) {
				var offset = [];
				offset[0] = "offset";
				offset[1] = _offset;
				
				
				offset[2] = "limit";
				offset[3] = _limit;
				
				var path = this.BuildActionString("albums", offset);
			}
			else {
				var path = this.BuildActionString("albums");
			}
		 }
		 
		 
		 this.GetAlbumsInteractiveIndex = 0;
		 this.TotalAlbums=0;
		 
		 this.GetAlbumsRequest = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false, //to enforce parsing JSON if there is JSON response
            onCreate: function(){
                console.info('******* onCreate happened')
            },
            onLoading: function(){
                console.info('******* onLoading happened')
            },
            onLoaded: function(){
                console.info('******* onLoaded happened')
            },
			//onInteractive:this.GotAlbumsInteractiveCallback.bind(this),
            onSuccess:this.GotAlbumsCallbackOldSchool.bind(this),
            
            //onComplete: this.GotAlbumsInteractiveCallback.bind(this),
            onFailure: this.GotAlbumsOnFailure.bind(this)
        });
		
		Mojo.Log.info("<-- AmpacheServer.prototype.GetAlbums");
	}, 
	
	
	GotAlbumsLastIndex:0,
	GotAlbumsProcessing:false,
	
	GetAlbumsCancel:function(event)
	{
		if(this.GetAlbumsRequest!=null)
		{
			this.GetAlbumsRequest.transport.abort();
			
		}
		this.GotAlbumReset();
	},
	
	
	
	GotAlbumsOnSuccess:function(event)
	{
		this.GotAlbumsInteractiveCallback(event);
		this.GotAlbumReset();
	},
	
	
	
	
	GotAlbumsOnFailure:function(event)
	{
		this.GotAlbumReset();
	},
	
	GotAlbumReset:function(event)
	{
		this.GetAlbumsRequest = null;
		this.GotAlbumsProcessing = false;
		this.GetAlbumsLastAlbumIndex = 0;
		
	},
	
	
	GotAlbumsInteractiveCallback:function(event, isLast)
	{
		Mojo.Log.info("--> AmpacheServer.prototype.GotAlbumsInteractiveCallback");
		//if (this.GotAlbumsProcessing == false) {
		//	this.GotAlbumsProcessing = true;
		
		
			
		
			//Get unprocessed chunk
			var startKey = "<album ";
			var endKey = "</album>";
			
			var newLastIndex = event.responseText.lastIndexOf(endKey) + endKey.length;
			if((this.GetAlbumsLastAlbumIndex != newLastIndex) && (!this.GotAlbumsProcessing))
			{
				this.GotAlbumsProcessing = true
				var previousLastIndex = this.GetAlbumsLastAlbumIndex;
				this.GetAlbumsLastAlbumIndex = newLastIndex;
				var unprocessedText = event.responseText.substring(previousLastIndex, newLastIndex);
			
				var startIndex = unprocessedText.indexOf(startKey);
				unprocessedText = unprocessedText.substring(startIndex)
		
				Mojo.Log.info("unprocessedText: \n"+ unprocessedText);
			
				this.GotAlbumsCallback(unprocessedText);
				this.GotAlbumsProcessing = false;
			}
			else
			{
				Mojo.Log.info("No new albums");
				
			}
			
			
			/*
			var unprocessedText = event.responseText.substring(this.GotAlbumsLastIndex, lastClose+endKey.length);
			var firstOpen = unprocessedText.indexOf(startKey);
			unprocessedText = unprocessedText.substring(firstOpen);
			
			this.GotAlbumsLastIndex = lastClose+endKey.length;
			
			Mojo.Log.info("unprocessedText: \n"+ unprocessedText);
			
			this.GotAlbumsCallback(unprocessedText);
			
			this.GotAlbumsProcessing = false;*/
		//}
		//else
		//{
		//	Mojo.Log.info("Returning, still processing previous message");
		//}
		Mojo.Log.info("<-- AmpacheServer.prototype.GotAlbumsInteractiveCallback");
	},
	
	
	GotAlbumsCallbackOldSchool: function(transport){
		Mojo.Log.info("--> AmpacheServer.prototype.GotAlbumsCallback");
		
		
		var xmlDoc = transport.responseXML;
		
		var AlbumList = null
		
		if (xmlDoc != null) {
			AlbumList = new Array();
			
			var albumListXML = xmlDoc.getElementsByTagName("album");
			
			for (var i = 0; i < albumListXML.length; i++) {
			
			
				var _id = albumListXML[i].getAttribute("id")
				var _name = albumListXML[i].getElementsByTagName("name")[0].firstChild.data;
				var _artist = albumListXML[i].getElementsByTagName("artist")[0].firstChild.data;
				var _tracks = albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data;
				var _year = albumListXML[i].getElementsByTagName("year")[0].firstChild.data;
				var _disk = albumListXML[i].getElementsByTagName("disk")[0].firstChild.data;
				var _art = albumListXML[i].getElementsByTagName("art")[0].firstChild.data;
				
				var newAlbum = new AlbumModel(_id, _name, _artist, _tracks, _year, _disk, _art);
				
				AlbumList[i] = newAlbum;
			}
			
			
		}
		
		
		Mojo.Log.info("Processed " + AlbumList.length + " albums");
		
		if (AlbumList != null) {
			this.GetAlbumsCallback(AlbumList);
		//this.GetAlbumsCallback = null;
		}
		Mojo.Log.info("<-- AmpacheServer.prototype.GotAlbumsCallback");
	},
	
	
		
	GotAlbumsCallback: function(xml)
	{
		Mojo.Log.info("--> AmpacheServer.prototype.GotAlbumsCallback");
		
		//Mojo.Log.info(transport.responseText);
		
		var xml_header ='<?xml version="1.0" encoding="UTF-8" ?><root>';
		
		
  		try // Firefox, Mozilla, Opera, etc.
		{
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(xml_header + xml, "text/xml");
		} 
		catch (e) {
			alert(e.message);
			return;
		}

		var AlbumList = null
		
		if(xmlDoc!=null)
		{
			AlbumList = new Array();
			
			var albumListXML = xmlDoc.getElementsByTagName("album"); 
/*			
root>
<album id="2910">
        <name>Back in Black</name>
        <artist id="129348">AC/DC</artist>
        <year>1984</year>
        <tracks>12</tracks>
        <disk>1</disk>
        <tag id="2481" count="2">Rock & Roll</tag>
        <tag id="2482" count="1">Rock</tag>
        <tag id="2483" count="1">Roll</tag>
        <art>http://localhost/image.php?id=129348</art>
        <preciserating>3</preciserating>
        <rating>2.9</rating>
</album>
</root>
*/			
			for (var i = 0; i < albumListXML.length; i++) {
				
				
				var _id = albumListXML[i].getAttribute("id")
				var _name = albumListXML[i].getElementsByTagName("name")[0].firstChild.data;
				var _artist = albumListXML[i].getElementsByTagName("artist")[0].firstChild.data;
				var _tracks = albumListXML[i].getElementsByTagName("tracks")[0].firstChild.data;
				var _year = albumListXML[i].getElementsByTagName("year")[0].firstChild.data;
				var _disk = albumListXML[i].getElementsByTagName("disk")[0].firstChild.data;
				var _art = albumListXML[i].getElementsByTagName("art")[0].firstChild.data;
							
				var newAlbum = new AlbumModel(_id, _name, _artist,_tracks, _year, _disk, _art);
				
				AlbumList[i] = newAlbum;
			}
			
			
		}
		
		
		this.TotalAlbums += AlbumList.length
		Mojo.Log.info("Processed " +AlbumList.length+ " albums");
		Mojo.Log.info("Total Albums: " +this.TotalAlbums);
		
		if (AlbumList != null) {
			this.GetAlbumsCallback(AlbumList);
			//this.GetAlbumsCallback = null;
		}
		Mojo.Log.info("<-- AmpacheServer.prototype.GotAlbumsCallback");
	},
	
	TotalAlbums:0,
	//******************************************************************************************/
	//Get Album Songs
	GetSongsCallback:null, 
	
	GetSongs: function(_GetSongsCallback, _AlbumId, _ArtistId, _PlayListID)
	{
		
		Mojo.Log.info("--> AmpacheServer.prototype.GetSongs");
		
		 this.GetSongsCallback = _GetSongsCallback;
		 
		 if (typeof this.GetSongsCallback != "function") 
            this.GetSongsCallback = new Function(func)
		 
		 
		 var path="";
		  if (_AlbumId != null) {
		 	
		 	var filter = [];
		 	filter[0] = "filter";
		 	filter[1] = _AlbumId;
		 	
		 	path = this.BuildActionString("album_songs", filter);
		 	
		 }
		 else if (_ArtistId!=null)
		 {
		 	var filter = [];
		 	filter[0] = "filter";
		 	filter[1] = _ArtistId;
			path = this.BuildActionString("artist_songs", filter);
			
		 }
		 else if (_PlayListID!=null)
		 {
		 	var filter = [];
		 	filter[0] = "filter";
		 	filter[1] = _PlayListID;
			path = this.BuildActionString("playlist_songs", filer);
			
		 }
		 
	
		 
		 
		 var request = new Ajax.Request(path, {
            method: 'get',
            evalJSON: false, //to enforce parsing JSON if there is JSON response
            onCreate: function(){
                console.info('******* onCreate happened')
            },
            onLoading: function(){
                console.info('******* onLoading happened')
            },
            onLoaded: function(){
                console.info('******* onLoaded happened')
            },
            onSuccess: function(){
                console.info('******* onSuccess happened')
            },
            onComplete: this.GotSongsCallbackInternal.bind(this),
			
            onFailure: this.GotSongsCallbackInternal.bind(this),
  			
        });
		
		
		Mojo.Log.info("<-- AmpacheServer.prototype.GetSongs");
	}, 
	
	
	
	GotSongsCallbackInternal: function(transport)
	{
		Mojo.Log.info("--> AmpacheServer.prototype.GotSongsCallbackInternal");
		
		Mojo.Log.info(transport.responseText);


		var SongsList = null
		
		if(transport.responseXML!=null)
		{
			SongsList = new Array();
			
			
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
			
			for (var i = 0; i < songsListXML.length; i++) {
					
				var _id = songsListXML[i].getAttribute("id")
				var _title = songsListXML[i].getElementsByTagName("title")[0].firstChild.data;
				var _artist = songsListXML[i].getElementsByTagName("artist")[0].firstChild.data;
				var _album = songsListXML[i].getElementsByTagName("album")[0].firstChild.data;
				var _track = songsListXML[i].getElementsByTagName("track")[0].firstChild.data;
				var _time = songsListXML[i].getElementsByTagName("time")[0].firstChild.data;
				var _url = songsListXML[i].getElementsByTagName("url")[0].firstChild.data;
				var _size = songsListXML[i].getElementsByTagName("size")[0].firstChild.data;
				var _art = songsListXML[i].getElementsByTagName("art")[0].firstChild.data;
							
				
				var newSong  = new SongModel(_id, _title, _artist, _album, _track, _time, _url, _size, _art);
				
				SongsList[i] = newSong;
			}
		}
		Mojo.Log.info("Calling callback");
		this.GetSongsCallback(SongsList);
		this.GetSongsCallback = null;
		Mojo.Log.info("<-- AmpacheServer.prototype.GotSongsCallbackInternal");
	},
	
	
	
	
	

	
	
	/********************************************************************************************/
	// Test Processing
	TestConnection: function(url1, username1, password1, callback, source){
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnection");
        
        this.TestConnectionContext = source;
        this.TestConnectionCallback = callback;
        
        if (typeof this.TestConnectionCallback != "function") 
            this.TestConnectionCallback = new Function(func)
        
        
        Mojo.Log.info("Building connection string", url1, username1, password1);
        var testpath = this.BuildConnectionUrl(url1, username1, password1);
        Mojo.Log.info("TestConnection: " + testpath);
        
        
        
        var request = new Ajax.Request(testpath, {
            method: 'get',
            evalJSON: false, //to enforce parsing JSON if there is JSON response
            onCreate: function(){
                console.info('******* onCreate happened')
            },
            onLoading: function(){
                console.info('******* onLoading happened')
            },
            onLoaded: function(){
                console.info('******* onLodaed happened')
            },
            onSuccess: function(){
                console.info('******* onComplete happened')
            },
            onComplete: this.TestConnectionCallbackSuccess.bind(this),
            onFailure: this.TestConnectionCallbackFailure.bind(this)
        });
        
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnection");
    },
    
	
	
	TestConnectionCallbackSuccess: function(transport){
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnectionCallbackSuccess");
        Mojo.Log.info("TestConnectionCallbackSuccess gotResults: " + transport.responseText);
        
		
		var returnValue = transport.responseText;;
		if (transport.responseText == "") {
			returnValue = "Error: Empty response";
		}		
	 
        if (transport.responseXML != null) {
            Mojo.Log.info("responseXML exits");
            var response = transport.responseXML;
            var findAuth = response.getElementsByTagName("auth");
            
            //Check for auth key to validate that login information is correct
            if (findAuth.length != 0) {
                Mojo.Log.info("Found Auth");
                this.authKey = findAuth[0].firstChild.data;
                Mojo.Log.info("authKey", this.authKey);
                returnValue = "Connection Test Success";
            }
            else {
                //if no auth key exists check for an error
                var findErrorCode = response.getElementsByTagName("error");
                if (findErrorCode.length != 0) {
                    returnValue = findErrorCode[0].firstChild.data;
                }
            }
        }
        
		Mojo.Log.info("Calling callback function this.TestConnectionCallback:");   
        this.TestConnectionCallback(returnValue, this.TestConnectCallbackContext);
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnectionCallbackSuccess");
    },
	
	
    TestConnectionCallbackFailure: function(transport){
        Mojo.Log.info("Enter AmpacheServer.prototype.TestConnectionCallbackFailure");
        this.TestConnectionCallback("Test failed", this.TestConnectionContext)    
        Mojo.Log.info("Exit AmpacheServer.prototype.TestConnectionCallbackFailure");
        
    },
    
    
	
    
    
    
    
    
    
    ConnectionCallbackSuccess: function(transport){
        Mojo.Log.info("gotResults:" + transport.responseText);
        
        if (this.ConnectCallBack != null) {
            Mojo.Log.info("Calling Callback function", this.ConnectCallBack);
            this.ConnectCallBack(transport.responseText, this.ConnectCallbackContext);
        }
    },
    
    
    ConnectionCallbackFailure: function(transport){
        var m = t.evaluate(transport);
        
        Mojo.Log.info("Failed:", m);
        this.ConnectCallBack(m);
    },
});

ArtistModel = Class.create({
	
    initialize: function(_id, _name, _albums, _songs){
		 //Mojo.Log.info("Arist model: " + _name);
		
		this.id = _id;
		this.name = _name;
		this.albums = _albums;
		this.songs = _songs;
		
		},
		
     id:null, 
	 name:null, 
	 albums:null, 
	 songs:null,
    
});

/*
<root>
<album id="2910">
        <name>Back in Black</name>
        <artist id="129348">AC/DC</artist>
        <year>1984</year>
        <tracks>12</tracks>
        <disk>1</disk>
        <tag id="2481" count="2">Rock & Roll</tag>
        <tag id="2482" count="1">Rock</tag>
        <tag id="2483" count="1">Roll</tag>
        <art>http://localhost/image.php?id=129348</art>
        <preciserating>3</preciserating>
        <rating>2.9</rating>
</album>
</root>
*/

AlbumModel = Class.create({

    initialize: function(_id, _name,_artist, _tracks, _year, _disc, _art){
        //Mojo.Log.info("--> AlbumModel constructor " + _name);
        
        this.id = _id;
		this.artist = _artist;
        this.name = _name;
        this.tracks = _tracks;
        this.year = _year;
        this.disc = _disc;
        this.art = _art;
		this.generateDescription();
		// Mojo.Log.info("<-- AlbumModel constructor " + _name);
    },
    
    id: "",
    name: "",
	artist:"",
    tracks:"",
    year:"",
    disc:"",
    art:"",
    description:"",
    
	sortByYearTitleString:function()
	{
		//This is just for the sort function of the albums scene
		
		var year
		if(this.year == "N/A") var year = 0x0000
		else year = parseInt(this.year);
		
		
		return year + "_"+this.name + "_"+ this.disc;
        },
	
	
    generateDescription: function(){
        this.description = "";
        if (this.year != "") 
            this.description += "Year: " + this.year + " ";
        if (this.tracks != "") 
            this.description += "Tracks: " + this.tracks + " ";
        if ((this.disc != "") && (this.disc != "0")) 
            this.description += "Disc #: " + this.disc + " ";
        
        
    },

});

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
	
SongModel = Class.create({

    initialize: function(_id, _title, _artist, _album, _track, _time, _url, _size, _art){
        //Mojo.Log.info("--> SongModel constructor " + _title);
        
		this.id = _id; 
		this.title = _title;
		this.artist = _artist;
		this.album = _album;
		this.track = _track;
		this.time = _time;
		this.url =_url;
		this.size = _size;
		this.art = _art;
		this.played = false;
		
    	//Mojo.Log.info("<-- SongModel constructor " + _title);
    },
    
	id: null, 
	title: null,
	artist: null,
	album: null,
	track: null,
	time: null,
	url: null,
	size: null,
	art: null,
	
	//used when put into a song array to create a playlist
	//played:null,
	//linked list for playback
	//next:null,
    //prev:null,
    
	/*generateDescription: function(){
        this.description = "";
        if (this.year != "") 
            this.description += "Year: " + this.year + " ";
        if (this.tracks != "") 
            this.description += "Tracks: " + this.tracks + " ";
        if ((this.disc != "") && (this.disc != "0")) 
            this.description += "Disc #: " + this.disc + " ";
        
        
    },*/

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
        videos: "",
    }],
});






AmpacheServer.Result = false;
AmpacheServer.ConnectResult = "";
AmpacheServer.Connected = false;
AmpacheServer.ConnectCallback = null;
AmpacheServer.ConnectCallbackContext = null;

//Test Connection Variables
AmpacheServer.TestConnectionCallback = null;
AmpacheServer.TestConnectionContext = null;

