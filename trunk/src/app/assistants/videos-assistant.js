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

var VideosSortType = {
    "alpha": 0,
    "mime": 1,
    "size": 2
};

VideosAssistant = Class.create({

    initialize: function(params) {
        this.SceneTitle = params.SceneTitle;
        this.DisplayArtistInfo = params.DisplayArtistInfo;
        this.ExpectedVideos = params.ExpectedVideos;

        this.Search = null;
        if (params.Search) {
            this.Search = params.Search;
        }

        if(params.SceneTitle)
        {
            this.title = params.SceneTitle;
        }
        
        if(params.FromDate)
        {
            this.FromDate = params.FromDate;
        }

        this.itemsHelper = new ItemsHelper();

        this.sortType = VideosSortType.alpha;
        this.sortOrder = SortOrder.descending;
    },

    setup: function() {

        if(this.title)
        {
           this.controller.get("title").innerHTML =this.title;
        }

        //*********************************************************************************************************
        //  Setup Filter List
        this.listAttributes = {
            itemTemplate: 'videos/listitem',
            dividerTemplate: 'videos/divider',
            dividerFunction: this.dividerFunc.bind(this),
            filterFunction: this.itemsHelper.FilterList.bind(this.itemsHelper),
            hasNoWidgets: true
        };
        this.listModel = {
            disabled: false,
            items: this.itemsHelper.ItemsList
        };
        this.controller.setupWidget('videosFilterList', this.listAttributes, this.listModel);

        //*********************************************************************************************************
        // Items Helper
        var params = {
            controller: this.controller,
            //TurnOffSpinner: this.TurnOffSpinner.bind(this),
            filterList: this.controller.get('videosFilterList'),
            getItemsCallback: this.GetVideos.bind(this),
            listModel: this.listModel,
            //progressModel: this.playlistLoadModel,
            fetchLimit: AmpacheMobile.FetchSize,
            ExpectedItems: this.ExpectedVideos,
            SortFunction: null,
            MatchFunction: this.IsMatch

        };
        this.itemsHelper.setup(params);

        this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);

        //*********************************************************************************************************
        // Events
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('videosFilterList'), Mojo.Event.listTap, this.listTapHandler);

        this.header = this.controller.get('header');
        this.sortSelector = this.sortSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.hold, this.sortSelector);

        this.jumpSelector = this.jumpSelect.bindAsEventListener(this);
        Mojo.Event.listen(this.header, Mojo.Event.tap, this.jumpSelector);

    },

    cleanup: function(event) {

        Mojo.Log.info("--> cleanup");

        Mojo.Event.stopListening(this.controller.get('videosFilterList'), Mojo.Event.listTap, this.listTapHandler);
        Mojo.Event.stopListening(this.header, Mojo.Event.hold, this.sortSelector);
        Mojo.Event.stopListening(this.header, Mojo.Event.tap, this.jumpSelector);
        this.itemsHelper.cleanup();
        this.itemsHelper = null;
        Mojo.Log.info("<-- cleanup");

    },

    GetVideos: function(GotItems, offset, limit) {
        params = {};
        params.offset = offset;
        params.limit = limit;
        params.callback = GotItems;
        params.search = this.Search;
        params.FromDate = this.FromDate;
        
        AmpacheMobile.ampacheServer.GetVideos(params);
    },

    IsMatch: function(item, filterString) {
        var matchString = item.title;
        if (matchString.toLowerCase().include(filterString.toLowerCase())) {
            return true;
        }
        return false;
    },

    handleCommand: function(event) {
        this.itemsHelper.handleCommand(event);
    },

    listTapHandler: function(event) {
        supportedTypes = [{
            "extn": "mp4",
            "mime": "video/mp4-generic",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "mp4",
            "mime": "video/quicktime",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "mp4",
            "mime": "video/mp4",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "mp4",
            "mime": "video/mpeg4",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "m4v",
            "mime": "video/mp4-generic",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "m4v",
            "mime": "video/quicktime",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "m4v",
            "mime": "video/mp4",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "m4v",
            "mime": "video/mpeg4",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "3gp",
            "mime": "video/3gp",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "3gpp",
            "mime": "video/3gp",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "3g2",
            "mime": "video/3gpp2",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "3gp2",
            "mime": "video/3gpp2",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        },
        {
            "extn": "sdp",
            "mime": "application/sdp",
            "appId": "com.palm.app.videoplayer",
            "streamable": true
        }];

        var supported = false;
        for (var i = 0; i < supportedTypes.length; i++) {
            if (supportedTypes[i].mime == event.item.mime) {
                supported = true;
            }
        }

        this.item = event.item;

        if (supported === true) {
            this.controller.serviceRequest("palm://com.palm.applicationManager", {
                method: "launch",
                parameters: {
                    id: "com.palm.app.videoplayer",
                    params: {
                        target: event.item.url
                    }
                }

            });
        } else {

            var message = "webOS does not support playback of this video format (" + event.item.mime + ").";
            message += "<br><br>To enable playback of this video it will need to be converted.";

            var controller = Mojo.Controller.getAppController().getFocusedStageController().topScene();
            controller.showAlertDialog({

                allowHTMLMessage: true,
                title: $L("Unsupported Video"),
                onChoose: this.Unsupported.bind(this),

                message: message,
                choices: [{
                    label: "User Guide (Videos)",
                    value: 'user-guide-video',
                    type: 'secondary'
                },
                {
                    label: "Try Anyway",
                    value: 'try-anyway',
                    type: 'negative'
                },
                {
                    label: $L('OK'),
                    value: 'ok',
                    type: 'affirmative'
                }]
            });

        }
        //this.RequestedPlaylist = event.item;
        //this.controller.stageController.pushScene({
        //    transition: AmpacheMobile.Transition,
        //    name: "songs"
        //},
        //{
        //    SceneTitle: event.item.name,
        //    Type: "playlist",
        //    Playlist_id: event.item.id,
        //    Item: event.item
        //});
    },

    Unsupported: function(event) {
        switch(event){
            case 'user-guide-video':
            this.controller.stageController.pushScene({
                transition: AmpacheMobile.Transition,
                name: "new-users"
            },
            {
                type: "videos"

            });
            break;
            case "try-anyway":
            this.controller.serviceRequest("palm://com.palm.applicationManager", {
                method: "launch",
                parameters: {
                    id: "com.palm.app.videoplayer",
                    params: {
                        target: this.item.url
                    }
                }

            });
            break;
        }
        
    },

    //**************************************************************************
    // List Jump Functions
    //**************************************************************************
    jumpSelect: function(event) {
        var commands = [];

        commands[0] = {
            label: "Top",
            command: "jumpTo-top"
        };

        commands[1] = {
            label: "Bottom",
            command: "jumpTo-bottom"
        };

        this.controller.popupSubmenu({
            onChoose: this.jumpHandler.bindAsEventListener(this),
            placeNear: this.header,
            items: commands
        });
    },

    jumpHandler: function(event) {
        if (Object.isString(event) && event.match("jumpTo")) {
            filterList = this.controller.get('videosFilterList');
            var list = filterList.mojo.getList();

            if (event === "jumpTo-top") {
                list.mojo.revealItem(0, false);
            } else if (event === "jumpTo-bottom") {
                list.mojo.revealItem(list.mojo.getLength() - 1, false);
            }
        }
    },

    //**************************************************************************
    // Sorting Functions
    //**************************************************************************
    imgEmpty: "images/player/empty.png",
    imgUp: "images/up.png",
    imgDown: "images/down.png",

    sortSelect: function(event) {
        var commands = [];

        commands[0] = {
            label: "Alpha",
            command: "doSort-alpha",
            secondaryIconPath: (this.sortType === VideosSortType.alpha) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp: this.imgDown) : this.imgEmpty
        };

        commands[1] = {
            label: "mime",
            command: "doSort-mime",
            secondaryIconPath: (this.sortType === VideosSortType.mime) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp: this.imgDown) : this.imgEmpty
        };

        commands[2] = {
            label: "Size",
            command: "doSort-size",
            secondaryIconPath: (this.sortType === VideosSortType.size) ? ((this.sortOrder === SortOrder.ascending) ? this.imgUp: this.imgDown) : this.imgEmpty
        };

        this.controller.popupSubmenu({
            onChoose: this.doSort.bindAsEventListener(this),
            placeNear: this.header,
            items: commands
        });

        event.stop();
        event.stopPropagation();
    },

    doSort: function(sort) {
        var reSortList = false;

        this.itemsHelper.SortFunction = this.sortList.bind(this);

        switch (sort) {
        case "doSort-size":
            if (this.sortType !== VideosSortType.size) {
                this.sortType = VideosSortType.size;
                this.sortOrder = SortOrder.ascending;
                reSortList = true;
            } else {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        case "doSort-alpha":
            if (this.sortType !== VideosSortType.alpha) {
                this.sortType = VideosSortType.alpha;
                this.sortOrder = SortOrder.descending;
                reSortList = true;
            } else {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        case "doSort-mime":
            if (this.sortType !== VideosSortType.mime) {
                this.sortType = VideosSortType.mime;
                this.sortOrder = SortOrder.descending;
                reSortList = true;
            } else {
                this.sortOrder = this.sortOrder * -1;
                reSortList = true;
            }
            break;
        }

        if (reSortList) {
            this.itemsHelper.ReSortList();
        }
    },

    sortList: function(a, b) {
        switch (this.sortType) {
        case VideosSortType.size:
            return (this.sortAlpha(a.size, b.size) * this.sortOrder);
            //break;
        case VideosSortType.mime:
            return (this.sortAlpha(a.mime, b.mime) * this.sortOrder);
            //break;
        case VideosSortType.alpha:
            return (this.sortAlpha(a.title.toLowerCase(), b.title.toLowerCase()) * this.sortOrder);
            //break;
        }
        return 0;
    },

    sortAlpha: function(a, b) {
        if (a === b) {
            return 0;
        }

        if (a < b) {
            return - 1;
        } else {
            return 1;
        }
    },

    dividerFunc: function(itemModel) {
        return itemModel.year;
    },

    activate: function(event) {
        this.itemsHelper.Activate();
    },

    deactivate: function(event) {
        this.itemsHelper.Deactivate();
    }

});