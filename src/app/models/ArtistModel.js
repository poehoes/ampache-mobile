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

ArtistModel = Class.create({
    initialize: function(_id, _name, _albums, _songs) {
        //Mojo.Log.info("Arist model: " + _name);
        this.id = _id;
        this.name = _name;
        this.albums = _albums;
        this.songs = _songs;
    },
    id: null,
    name: null,
    albums: null,
    songs: null
});
