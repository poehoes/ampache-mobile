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

PingModel = Class.create({
    /*
     <?xml version="1.0" encoding="UTF-8" ?>
     <root>
     <session_expire><![CDATA[Sun, 20 Sep 2009 22:29:27 -0500]]></session_expire>
     <version><![CDATA[350001]]></version>
     <server></server>
     </root>
     */
    initialize: function(PingXML) {
        var pingResponse = PingXML.getElementsByTagName("root")[0];
        this.SessionExpires = pingResponse.getElementsByTagName("session_expire")[0].firstChild.data;
        this.UTC = Date.parse(this.SessionExpires);
        var CurrentTime = new Date();
        var CurrentUTC = CurrentTime.getTime();
        this.TimeRemaining = this.UTC - CurrentUTC;
        this.TimeRemaining *= 0.45; //So it will ping twice during the session time
        this.ApiVersion = pingResponse.getElementsByTagName("version")[0].firstChild.data;
        if(pingResponse.getElementsByTagName("server")[0])
        {
            this.Server = pingResponse.getElementsByTagName("server")[0].firstChild.data;
        }
        else
        {
            this.Server= "Unknown";
        }
        
    },
    
    
    UTC: null,
    SessionExpires: null,
    ApiVersion: null,
    Server:null
});