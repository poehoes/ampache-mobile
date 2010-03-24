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

TextselectAssistant = Class.create({
    //UseCustomColor:false,
    //CustomColor:'#FFFFFF',
    setup: function() {

        this.UseCustomColor = AmpacheMobile.settingsManager.settings.UseCustomColor;
        this.CustomColor = AmpacheMobile.settingsManager.settings.CustomColor;
        
        this.textTypeModel = {
            value: 0,
            disabled: false
        };

        this.controller.get('body_wallpaper').style.background = "url('" + AmpacheMobile.settingsManager.settings.BackgroundImage + "')";
        this.controller.get('body_wallpaper').style.backgroundColor = AmpacheMobile.settingsManager.settings.BackgroundColor;
        
        //********************************************************************************************************
        // Use Theme Button
        this.controller.setupWidget("btnThemeDefault", this.attributes = {},
        this.model = {
            label: "Use Theme Default",
            disabled: false
        });
        this.btnThemeDefault = this.btnThemeDefault.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('btnThemeDefault'), Mojo.Event.tap, this.btnThemeDefault);
        
        //********************************************************************************************************
        // Use Background Color Button
       
        this.controller.setupWidget("btnGetBackgroundColor", this.attributes = {},
        this.model = {
            label: "Grab Background Color",
            disabled: false
        });

        this.grabBackgroudColor = this.grabBackgroudColor.bind(this);
        Mojo.Event.listen(this.controller.get('btnGetBackgroundColor'), Mojo.Event.tap, this.grabBackgroudColor);
        
        //********************************************************************************************************
        //Setup Color Selector        
        this.ColorSelector = new ColorPicker(this.controller, this.CustomColor, this.ColorChangedCallback.bind(this));
        this.ColorSelector.makeColorSelectors();


    },

    cleanup: function(event) {
        Mojo.Event.stopListening(this.controller.get('btnThemeDefault'), Mojo.Event.tap, this.btnThemeDefault);
    },

   
    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message) {
        this.controller.showAlertDialog({
            onChoose: function(value) {},
            title: title,
            message: message,
            choices: [{
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    },

    


   

    ColorChangedCallback: function(hexColor) {
        //this.CurrentMode = 0;
        //this.CurrentColor = hexColor;
        //this.UpdateScreen();
        if(this.CustomColor !== hexColor)
        {
            this.UseCustomColor = true;
            this.CustomColor = hexColor;
            
        }
        this.controller.get('example-color-text').style.color = this.UseCustomColor?this.CustomColor : null;
        
        
        
    },
    
    btnThemeDefault: function() {
        
        this.UseCustomColor = false;
        this.controller.get('example-color-text').style.color = null;
        this.ColorSelector.inputBox.value = "";
        
    },
    
    grabBackgroudColor:function() {
        
          if(AmpacheMobile.settingsManager.settings.BackgroundColor !== "")
        {
            this.UseCustomColor = true;
            this.CustomColor = AmpacheMobile.settingsManager.settings.BackgroundColor;
            this.controller.get('example-color-text').style.color = this.CustomColor;
            this.ColorSelector.inputBox.value = this.CustomColor;
            this.ColorSelector.inputBoxChanged();
        }
        else
        {
            this.showDialogBox("No Color", "There is no background color currently selected.");
        }
        
        
        
    },


   

    

    activate: function() {
        //this.redoSolidImages(this.solidIndex);
        //this.myPhotoDivElement.mojo.manualSize('320', '200');

    },

    saveSettings: function(value) {
        if (value === "yes") {
            AmpacheMobile.settingsManager.settings.UseCustomColor = this.UseCustomColor;
            AmpacheMobile.settingsManager.settings.CustomColor = this.CustomColor;
            AmpacheMobile.settingsManager.SaveSettings();
        }
        this.controller.stageController.popScene();
    },

    handleCommand: function(event) {
        //test for Mojo.Event.back, not Mojo.Event.command..
        if (event.type === Mojo.Event.back) {

            if (this.anyChanges()) {
                event.preventDefault();
                event.stopPropagation();

                this.controller.showAlertDialog({
                    onChoose: this.saveSettings.bind(this),
                    title: $L("Save Changes"),
                    message: "Text settings have changed, would you like to save the new settings?",
                    choices: [{
                        label: $L('Yes'),
                        value: 'yes',
                        type: 'affirmative'
                    },
                    {
                        label: $L('No'),
                        value: 'no',
                        type: 'negative'
                    }]
                });

            }
        }
    },

    anyChanges: function() {
        
        var retVal = false;
        if (AmpacheMobile.settingsManager.settings.UseCustomColor !== this.UseCustomColor || AmpacheMobile.settingsManager.settings.CustomColor !== this.CustomColor) {
            retVal = true;
        }
        return retVal;
    },

    deactivate: function() {
        this.controller.get('body_wallpaper').style.background = null;
        this.controller.get('body_wallpaper').style.backgroundColor = null;
        //Mojo.Event.stopListening(this.controller.get('myPhotoDiv'), Mojo.Event.imageViewChanged, this.imageViewChanged);
    }
});