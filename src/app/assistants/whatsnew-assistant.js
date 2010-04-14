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

WhatsnewAssistant = Class.create({
    initialize: function(params) {
    this.label = params.label;
    },

    setup: function() {
        //this.controller.get('old-versions').hide().addClassName('not-used');
        this.aboutDrawer = this.controller.get('old-version-drawer').hide();
        this.handleDrawerSelection = this.handleDrawerSelection.bind(this, this.aboutDrawer);
        
	this.controller.get('title').innerHTML = this.label;
	
        this.controller.listen('old-versions', Mojo.Event.tap, this.handleDrawerSelection);
        this.controller.get('old-version-text').innerHTML = Mojo.View.render({template: 'whatsnew/old-versions'});
	this.controller.get('new-version-text').innerHTML = Mojo.View.render({template: 'whatsnew/new-version'});
        
        
        this.controller.setupWidget(Mojo.Menu.appMenu,
            this.attributes = {
                omitDefaultItems: true
            },
            this.model = {
                visible: false,
                items: [ StageAssistant.preferencesMenu,
                        StageAssistant.aboutApp,
			StageAssistant.helpMenu
                        ]
            }
         );

    },

    cleanup: function(event) {
        Mojo.Event.stopListening(this.controller.get('old-versions'), Mojo.Event.listTap, this.handleDrawerSelection);
    },

    handleDrawerSelection: function(drawer, event) {

        Mojo.Log.info("handleDrawerSelection ");
        var targetRow = this.controller.get(event.target);
        if (!targetRow.hasClassName("selection_target")) {
            Mojo.Log.info("handleSoftwareSelection !selection_target");
            targetRow = targetRow.up('.selection_target');
        }

        if (targetRow) {
            var toggleButton = targetRow.down("div.arrow_button");
            if (!toggleButton.hasClassName('palm-arrow-expanded') && !toggleButton.hasClassName('palm-arrow-closed')) {
                return;
            }
            //var show = !drawer.mojo.getOpenState()
            var show = toggleButton.className;

            Mojo.Log.info("handleSoftwareSelection open/close " + show);
            this.toggleShowHideFolders(targetRow, this.controller.window.innerHeight);
        }
    },

    toggleShowHideFolders: function(rowElement, viewPortMidway, noScroll) {
        if (!rowElement.hasClassName("details")) {
            return;
        }

        var toggleButton = rowElement.down("div.arrow_button");
        if (!toggleButton.hasClassName('palm-arrow-expanded') && !toggleButton.hasClassName('palm-arrow-closed')) {
            return;
        }

        var showFavorites = toggleButton.hasClassName('palm-arrow-closed');
        var folderContainer = rowElement.down('.collapsor');
        var maxHeight = folderContainer.getHeight();
        if (showFavorites) {
            toggleButton.addClassName('palm-arrow-expanded');
            toggleButton.removeClassName('palm-arrow-closed');
            folderContainer.setStyle({
                height: '1px'
            });
            folderContainer.show();

            // See if the div should scroll up a little to show the contents
            var elementTop = folderContainer.viewportOffset().top;
            var scroller = Mojo.View.getScrollerForElement(folderContainer);
            if (elementTop > viewPortMidway && scroller && !noScroll) {
                //Using setTimeout to give the animation time enough to give the div enough height to scroll to
                var scrollToPos = scroller.mojo.getScrollPosition().top - (elementTop - viewPortMidway);
                setTimeout(function() {
                    scroller.mojo.scrollTo(undefined, scrollToPos, true);
                },
                200);
            }
        } else {
            folderContainer.setStyle({
                height: maxHeight + 'px'
            });
            toggleButton.addClassName('palm-arrow-closed');
            toggleButton.removeClassName('palm-arrow-expanded');
        }
        var options = {
            reverse: !showFavorites,
            onComplete: this.animationComplete.bind(this, showFavorites, rowElement.id, maxHeight),
            curve: 'over-easy',
            from: 1,
            to: maxHeight,
            duration: 0.4
        };
        Mojo.Animation.animateStyle(folderContainer, 'height', 'bezier', options);
    },

    animationComplete: function(show, accountId, listHeight, folderContainer, cancelled) {
        if (!show) {
            folderContainer.hide();
        }
        folderContainer.setStyle({
            height: 'auto'
        });
    },





    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message) {
        this.controller.showAlertDialog({
            onChoose: null,
            title: title,
            message: message,
            choices: [{
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    },

    activate: function(event) {
        SetCSSTheme(this.controller, THEME_NONE);
	SetText(false, null, AmpacheMobile.settingsManager.settings.CSSTheme);
        SetBackground(this.controller, null, "");
    },

    deactivate: function(event) {

        SetCSSTheme(this.controller, AmpacheMobile.settingsManager.settings.CSSTheme);
	SetBackground(this.controller, AmpacheMobile.settingsManager.settings.BackgroundImage, AmpacheMobile.settingsManager.settings.BackgroundColor);
        SetText(AmpacheMobile.settingsManager.settings.UseCustomColor, AmpacheMobile.settingsManager.settings.CustomColor, AmpacheMobile.settingsManager.settings.CSSTheme);
 
    },

    showNowPlaying: function() {
        Mojo.Controller.stageController.pushScene({
            transition: AmpacheMobile.Transition,
            name: "now-playing"
        },
        {
            type: "display"
        });
    }

});

