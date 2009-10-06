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

BackgroundAssistant = Class.create({
    CurrentColor: null,
    CurrentImage: null,
    CurrentMode: null,
    
    
    setup: function(){
    
        this.CurrentSolid = AmpacheMobile.settingsManager.settings.BackgroundSolid;
        this.CurrentColor = AmpacheMobile.settingsManager.settings.BackgroundColor;
        this.CurrentImage = AmpacheMobile.settingsManager.settings.BackgroundImage;
        this.CurrentOverlay = AmpacheMobile.settingsManager.settings.BackgroundOverlay;
        this.CurrentMode = AmpacheMobile.settingsManager.settings.BackgroundMode;
        
        if (this.CurrentMode == null) {
			this.CurrentMode = 0;
		}
		
        this.wallpaperTypeModel = {
            value: this.CurrentMode,
            disabled: false
        };
        
        this.controller.setupWidget("wallpaperType", this.attributes = {
            choices: [{
                label: "Color",
                value: 0
            }, {
                label: "Image",
                value: 1
            }]
        }, this.wallpaperTypeModel);
        
        this.controller.get('wallpaperType').observe(Mojo.Event.propertyChange, this.wallpaperTypeChanged.bind(this));
        
        this.controller.setupWidget("btnChooseWallpaperImage", this.attributes = {}, this.model = {
            label: "Image From Device",
            disabled: false
        });
        
        this.controller.get('btnChooseWallpaperImage').observe(Mojo.Event.tap, this.handleChooseWallpaperImage.bind(this));
        
        //***************************************************************
        // Included Photo picker
        
        var photoAttributes = { //noExtractFS : true	//optional, turn off using extractfs to speed up renders.
};
        this.photoModel = {
            //backgroundImage : 'images/glacier.png',
            //background: 'black',		//You can set an image or a color
            onLeftFunction: this.wentLeft.bind(this),
            onRightFunction: this.wentRight.bind(this)
        };
		
        this.controller.setupWidget('myPhotoDiv', photoAttributes, this.photoModel);
        this.myPhotoDivElement = $('myPhotoDiv');
        
        this.imageViewChanged = this.imageViewChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('myPhotoDiv'), Mojo.Event.imageViewChanged, this.imageViewChanged);
        
        this.solidImages = [];
        
		for (var i = 0; i < 7; i++) 
		{
			var imgSource = 'images/backgrounds/solids/background' + (i+1) +'.png'
			this.solidImages[i] = 
			{
				source: imgSource
			};
		}
        
        
        
        
        
        this.solidIndex = 0;
        
        //***************************************************************
        // Overlay Selector
        
        this.Overlays = [];
        
        this.Overlays[0] = {
            label: "None",
            value: "images/backgrounds/overlay/no_background.png"
        };
        this.Overlays[1] = {
            label: "Overlay 1",
            value: "images/backgrounds/overlay/overlay1.png"
        };
        this.Overlays[2] = {
            label: "Overlay 2",
            value: "images/backgrounds/overlay/overlay2.png"
        };
        this.Overlays[3] = {
            label: "Overlay 3",
            value: "images/backgrounds/overlay/overlay3.png"
        };
        this.Overlays[4] = {
            label: "Overlay 4",
            value: "images/backgrounds/overlay/overlay4.png"
        };
        this.Overlays[5] = {
            label: "Overlay 5",
            value: "images/backgrounds/overlay/overlay5.png"
        };
        
        
        this.selectorAttributes = {
            label: 'Overlay',
            modelProperty: 'currentOverlay'
        }
        
        this.selectorsModel = {
            currentOverlay: this.CurrentOverlay,
            choices: this.Overlays
        }
        
        this.overlaySelectorChanged = this.overlaySelectorChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('overlaySelector'), Mojo.Event.propertyChange, this.overlaySelectorChanged);
        this.controller.setupWidget('overlaySelector', this.selectorAttributes, this.selectorsModel);
        
        
        
        
        this.controller.get('body_wallpaper').style.background = "url('" + AmpacheMobile.settingsManager.settings.BackgroundImage + "')";
        this.controller.get('body_wallpaper').style.backgroundColor = AmpacheMobile.settingsManager.settings.BackgroundColor;
        
        
        
        
        
        this.ColorSelector = new ColorPicker(this.controller, this.CurrentColor, this.ColorChangedCallback.bind(this));
        this.ColorSelector.makeColorSelectors();
        
        
        this.wallpaperTypeChanged();
    },
    
    imageViewChanged: function(event){
        /* Do something when the image view changes */
        //this.showDialogBox("Image View Changed", "Flick image left and/or right to see other images.");
    
        //this.CurrentMode = 1;
        //this.CurrentImage = event.url;
        //this.UpdateScreen();
    },
    
    
    // This function will popup a dialog, displaying the message passed in.
    showDialogBox: function(title, message){
        this.controller.showAlertDialog({
            onChoose: function(value){
            },
            title: title,
            message: message,
            choices: [{
                label: 'OK',
                value: 'OK',
                type: 'color'
            }]
        });
    },
    
    wentLeft: function(event){
        this.solidIndex = (this.solidIndex - 1) % this.solidImages.length;
        if (this.solidIndex == -1) 
            this.solidIndex = this.solidImages.length - 1;
        this.redoSolidImages(this.solidIndex);
        
        this.CurrentMode = 1;
        this.CurrentSolid = this.solidImages[this.solidIndex].source;
        this.UpdateScreen();
    },
    
    wentRight: function(event){
        /* Do something when the user flicks to the left 
         * like picking a different image for the right image.
         */
        this.solidIndex = (this.solidIndex + 1) % this.solidImages.length;
        this.redoSolidImages(this.solidIndex);
        
        this.CurrentMode = 1;
        this.CurrentSolid = this.solidImages[this.solidIndex].source;
        this.UpdateScreen();
        
        //this.showDialogBox("Image View Changed", "Flicked left to see right picture.");
    },
    
    
    redoSolidImages: function(centerIndex){
        var leftIndex = (centerIndex - 1) % this.solidImages.length;
        if (leftIndex == -1) 
            leftIndex = this.solidImages.length - 1;
        var rightIndex = (centerIndex + 1) % this.solidImages.length;
        
        this.myPhotoDivElement.mojo.leftUrlProvided(this.solidImages[leftIndex].source, this.solidImages[leftIndex].source);
        this.myPhotoDivElement.mojo.centerUrlProvided(this.solidImages[centerIndex].source, this.solidImages[centerIndex].source);
        this.myPhotoDivElement.mojo.rightUrlProvided(this.solidImages[rightIndex].source, this.solidImages[rightIndex].source);
    },
    
    
    ColorChangedCallback: function(hexColor){
        this.CurrentMode = 0;
        this.CurrentColor = hexColor;
        this.UpdateScreen();
        
    },
    
    
    overlaySelectorChanged: function(event){
        this.CurrentMode = 0;
        this.CurrentOverlay = event.value;
        this.UpdateScreen();
    },
    
    UpdateScreen: function(){
        if (this.CurrentMode == 0) {
            this.CurrentImage = this.CurrentOverlay;
        }
        else {
            this.CurrentImage = this.CurrentSolid;
        }
        
        this.controller.get('body_wallpaper').style.background = "url('" + this.CurrentImage + "')";
        this.controller.get('body_wallpaper').style.backgroundColor = this.CurrentColor;
    },
    
    
    
    
    
    handleChooseWallpaperImage: function(){
        Mojo.FilePicker.pickFile({
            onSelect: this.photoSelected.bind(this),
            kinds: ['image']
        }, this.controller.stageController);
        
    },
    
    wallpaperTypeChanged: function(event){
        Mojo.Log.info('Wallpaper type changed, this.wallpaperTypeModel.value = ' + this.wallpaperTypeModel.value);
        
        // Color
        if (this.wallpaperTypeModel.value == 0) {
        
            this.controller.get('image-container').style.display = 'none';
            this.controller.get('color-container').style.display = 'block';
            
            if (this.needToSelectOverlay()) {
                this.CurrentMode = 0;
                this.selectorsModel.currentOverlay = this.CurrentOverlay;
                this.controller.modelChanged(this.selectorsModel, this);
                
            }
        }
        
        // Image
        else {
            if (this.wallpaperTypeModel.value == 1) {
            
                this.CurrentMode = 1;
                
                
                this.controller.get('color-container').style.display = 'none';
                this.controller.get('image-container').style.display = 'block';
            }
        }
        this.UpdateScreen();
    },
    
    
    needToSelectOverlay: function(){
        var retVal = true;
        for (var i = 0; i < this.Overlays.length; i++) {
            if (this.Overlays[i].value == this.CurrentImage) 
                retVal = false;
            
        };
        return retVal;
    },
    
    
    photoSelected: function(results){
    
        this.CurrentMode = 1;
        this.CurrentSolid = results.fullPath.replace(/\s/g,"%20");
        this.UpdateScreen();
        
        
        
    },
    
    
    
    activate: function(){
        this.redoSolidImages(this.solidIndex);
        this.myPhotoDivElement.mojo.manualSize('320', '200');
        
    },
    
    saveSettings: function(value){
        if (value == "yes") {
            AmpacheMobile.settingsManager.settings.BackgroundSolid = this.CurrentSolid;
            AmpacheMobile.settingsManager.settings.BackgroundOverlay = this.CurrentOverlay;
            AmpacheMobile.settingsManager.settings.BackgroundColor = this.CurrentColor;
            AmpacheMobile.settingsManager.settings.BackgroundImage = this.CurrentImage;
            AmpacheMobile.settingsManager.settings.BackgroundMode = this.CurrentMode;
            AmpacheMobile.settingsManager.SaveSettings();
        }
        this.controller.stageController.popScene();
    },
    
    
    handleCommand: function(event){
        //test for Mojo.Event.back, not Mojo.Event.command..
        if (event.type == Mojo.Event.back) {
        
            if (this.anyChanges()) {
                event.preventDefault();
                event.stopPropagation();
                
                this.controller.showAlertDialog({
                    onChoose: this.saveSettings.bind(this),
                    title: $L("Save Changes"),
                    message: "Background settings have changed, would you like to save the new settings?",
                    choices: [{
                        label: $L('Yes'),
                        value: 'yes',
                        type: 'affirmative'
                    }, {
                        label: $L('No'),
                        value: 'no',
                        type: 'negative'
                    }]
                });
                
            }
        }
    },
    
    anyChanges: function(){
        var retVal = false;
        if (AmpacheMobile.settingsManager.settings.BackgroundColor != this.CurrentColor || AmpacheMobile.settingsManager.settings.BackgroundImage != this.CurrentImage) {
            retVal = true;
        }
        return retVal;
    },
    
    
    
    deactivate: function(){
        this.controller.get('body_wallpaper').style.background = null;
        this.controller.get('body_wallpaper').style.backgroundColor = PREF_COLOR;
        
        Mojo.Event.stopListening(this.controller.get('myPhotoDiv'), Mojo.Event.imageViewChanged, this.imageViewChanged);
        
    }
    
});
