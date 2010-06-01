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
    initialize: function(_id, _name, _artist, _artist_id, _tracks, _year, _disc, _art) {
        //Mojo.Log.info("--> AlbumModel constructor " + _name);
        this.id = _id;
        this.artist = _artist;
        this.artist_id = _artist_id;
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
    artist: "",
    artist_id: null,
    tracks: "",
    year: "",
    disc: "",
    art: "",
    description: "",
    sortByYearTitleString: function() {
        //This is just for the sort function of the albums scene
        var year;
        if (this.year === "N/A") {
            year = 0x0000;
        } else {
            year = parseInt(this.year, 10);
        }
        return year + "_" + this.name + "_" + this.disc;
    },
    generateDescription: function() {
        this.description = "";
        if (this.year !== "") {
            this.description += "Year: " + this.year + " ";
        }
        if (this.tracks !== "") {
            this.description += "Tracks: " + this.tracks + " ";
        }
        if ((this.disc !== "") && (this.disc !== "0")) {
            this.description += "Disc #: " + this.disc + " ";
        }
    }
});
