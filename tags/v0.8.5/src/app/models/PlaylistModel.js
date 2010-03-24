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
 * <playlist id="1234">
 <name>The Good Stuff</name>
 <owner>Karl Vollmer</owner>
 <items>50</items>
 <tag id="2481" count="2">Rock & Roll</tag>
 <tag id="2482" count="2">Rock</tag>
 <tag id="2483" count="1">Roll</tag>
 <type>Public</type>
 </playlist>
 */
PlaylistModel = Class.create({
    initialize: function(_id, _name, _owner, _items, _type) {
        this.id = _id;
        this.name = _name;
        this.owner = _owner;
        this.items = _items;
        this.type = _type;
        this.desc = "Songs: " + this.items + " Owner: " + this.owner;
    },
    id: null,
    name: null,
    owner: null,
    items: null,
    type: null,
    desc: null
});
