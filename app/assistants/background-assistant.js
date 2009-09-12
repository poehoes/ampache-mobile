
BackgroundAssistant = Class.create({
    CurrentColor: null,
    CurrentImage: null,
	CurrentMode:null,
    
    
    setup: function(){
    
    
       
        
        this.wallpaperTypeModel = {
            value: AmpacheMobile.settingsManager.settings.BackgroundMode,
            disabled: false
        };
        
        this.controller.setupWidget("wallpaperType", this.attributes = {
            choices: [{
                label: "Color",
                value: 0
            }, {
                label: "Image",
                value: 1
            }, ]
        }, this.wallpaperTypeModel);
        
        this.controller.get('wallpaperType').observe(Mojo.Event.propertyChange, this.wallpaperTypeChanged.bind(this));
        
        this.controller.setupWidget("btnChooseWallpaperImage", this.attributes = {}, this.model = {
            label: "Choose Wallpaper Image",
            disabled: false
        });
        
        this.controller.get('btnChooseWallpaperImage').observe(Mojo.Event.tap, this.handleChooseWallpaperImage.bind(this));
        
        
        //***************************************************************
        // Overlay Selector
        
        this.Overlays = new Array()
        
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
            currentOverlay: AmpacheMobile.settingsManager.settings.BackgroundImage,
            choices: this.Overlays
        }
        
        this.overlaySelectorChanged = this.overlaySelectorChanged.bindAsEventListener(this);
        Mojo.Event.listen(this.controller.get('overlaySelector'), Mojo.Event.propertyChange, this.overlaySelectorChanged);
        this.controller.setupWidget('overlaySelector', this.selectorAttributes, this.selectorsModel);
        
        
        
        
        this.controller.get('body_wallpaper').style.background = "url('" + AmpacheMobile.settingsManager.settings.BackgroundImage + "')";
        this.controller.get('body_wallpaper').style.backgroundColor = AmpacheMobile.settingsManager.settings.BackgroundColor;
        
        this.CurrentMode = AmpacheMobile.settingsManager.settings.BackgroundMode;
		this.CurrentColor = AmpacheMobile.settingsManager.settings.BackgroundColor;
        this.CurrentImage = AmpacheMobile.settingsManager.settings.BackgroundImage;
        
        this.ColorSelector = new ColorPicker(this.controller, this.CurrentColor, this.ColorChangedCallback.bind(this));
        this.ColorSelector.makeColorSelectors();
		
		
        this.wallpaperTypeChanged();
    },
    
    
    
    ColorChangedCallback: function(hexColor){
		this.CurrentMode = 0;
        this.CurrentColor = hexColor;
		this.UpdateScreen();
        
    },
    
	
	overlaySelectorChanged: function(event){
        this.CurrentMode = 0;
		this.CurrentImage = event.value;
        this.UpdateScreen();     
    },
    
	UpdateScreen:function()
	{
		this.controller.get('body_wallpaper').style.background = "url('" + this.CurrentImage + "')";
        this.controller.get('body_wallpaper').style.backgroundColor = this.CurrentColor;
	},
	
    
    
    
    
    handleChooseWallpaperImage: function(){
        Mojo.FilePicker.pickFile(
		{
            onSelect: this.photoSelected.bind(this),
            kinds: ['image']
        }, 
		this.controller.stageController);
        
    },
    
    wallpaperTypeChanged: function(event){
        Mojo.Log.info('Wallpaper type changed, this.wallpaperTypeModel.value = ' + this.wallpaperTypeModel.value);
        
        // Color
        if (this.wallpaperTypeModel.value == 0) {
		
			this.controller.get('image-container').style.display = 'none';
			this.controller.get('color-container').style.display = 'block';
		}
		
		// Image
		else {
			if (this.wallpaperTypeModel.value == 1) {
			
			
			
				this.controller.get('color-container').style.display = 'none';
				this.controller.get('image-container').style.display = 'block';
			}
		}
		this.UpdateScreen();      
    },
    
   
    
    photoSelected: function(results){
        
		this.CurrentMode = 1;
		this.CurrentImage = results.fullPath;
        this.UpdateScreen();
		
		
		
    },
    
    
    
    activate: function(){
    
	
	},
	
	saveSettings:function(value)
	{
		if(value=="yes")
		{
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
	
  	anyChanges:function()
	{
		var retVal = false;
		if(AmpacheMobile.settingsManager.settings.BackgroundColor != this.CurrentColor || AmpacheMobile.settingsManager.settings.BackgroundImage != this.CurrentImage)
		{
			retVal = true;	
		}
		return retVal;
	},
	
    
	
    deactivate: function(){
        this.controller.get('body_wallpaper').style.background = null;
        this.controller.get('body_wallpaper').style.backgroundColor = "white";
        
    }
    
});
