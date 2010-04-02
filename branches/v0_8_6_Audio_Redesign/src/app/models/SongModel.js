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
    initialize: function(_id, _title, _artist, _artist_id, _album, _album_id, _track, _time, _url, _size, _art, _mime) {
        //Mojo.Log.info("--> SongModel constructor " + _title);
        this.id = _id;
        this.title = _title;
        this.artist = _artist;
        this.album = _album;
        this.track = _track;
        this.time = parseInt(_time,10);
        this.url = _url;
        this.size = _size;
        this.art = _art;
        this.mime = _mime;
        this.album_id = _album_id;
        this.artist_id = _artist_id;
        this.played = false;
        this.amtBuffered = 0;
        this.plIcon = "images/player/blank.png";
        //Mojo.Log.info("<-- SongModel constructor " + _title);
        
        minutes = Math.floor(this.time/60);
        seconds = this.time-(minutes*60);
        this.timeStr = minutes + ":";
        if(seconds<10)
        {
            this.timeStr += "0";
        }
        this.timeStr += seconds;
    },
    
    clone :function(){
        return new SongModel(this.id, this.title, this.artist, this.artist_id, this.album, this.album_id, this.track, this.time, this.url, this.size, this.art, this.mime); 
    },
    id: null,
    title: null,
    artist: null,
    artist_id: null,
    album: null,
    album_id: null,
    track: null,
    time: null,
    timeStr:null,
    url: null,
    size: null,
    art: null,
    mime: null
    
    
    
});