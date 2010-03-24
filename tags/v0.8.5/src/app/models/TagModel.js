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

TagModel = Class.create({
    /*
     *
     <root>
     <tag id="2481">
     <name>Rock & Roll</name>
     <albums>84</albums>
     <artists>29</artists>
     <songs>239</songs>
     <videos>13</video>
     <playlists>2</playlist>
     <stream>6</stream>
     </tag>
     </root>
     *
     */
    initialize: function(_id, _name, _albums, _artists, _songs, _videos, _playlists, _stream) {
        this.id = _id;
        this.name = _name;
        this.albums = _albums;
        this.artists = _artists;
        this.songs = _songs;
        this.videos = _videos;
        this.playlists = _playlists;
        this.stream = _stream;
        //this.desc = "Artists: " + this.artists + " Songs: " + this.songs + " Albums: " + this.albums;
        this.desc = "Songs: " + this.songs +" Artists: " + this.artists + " Albums: " + this.albums;
    }
});