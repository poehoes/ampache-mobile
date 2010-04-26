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
<video id="1234">
         <title>Futurama Bender's Big Score</title>
         <mime>video/avi</mime>
         <resolution>720x288</resolution>
         <size>Video Filesize in Bytes</size>
         <tag id="12131" count="3">Futurama</tag>
         <tag id="32411" count="1">Movie</tag>
         <url>http://localhost/play/index.php?oid=123908...</url>
</video>
</root>
 */
VideoModel = Class.create({
    initialize: function(_id, _title,_mime, _resolution, _size, _url) {
        //Mojo.Log.info("--> SongModel constructor " + _title);
        this.id = _id;
        this.title = _title;
        this.resolution = _resolution;
       
        
        if(AmpacheMobile.Account.SpacesWorkAround===true)
        {
            this.url = _url.replace(/&name=.*/g, "");
        }
        else
        {
            this.url = _url;
        }
        this.size = parseInt(_size,10);
        this.sizeMB = Math.floor((this.size/1051648)*100)/100 + "MB";
        this.mime = _mime;
    },
    
    id: null,
    title: null,
    resolution: null,
    mime: null,
    url: null,
    size: null
    
    
    
});