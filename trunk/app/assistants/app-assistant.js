/*  AppAssistant - AmpacheMobile
*/    

//  ---------------------------------------------------------------
//    GLOBALS
//  ---------------------------------------------------------------

//  AmpacheMobile namespace
AmpacheMobile = {};


AmpacheMobile.MenuAttr = {omitDefaultItems: true};

AmpacheMobile.MenuModel = {
    visible: true,
    items: [ 
        {label: $L("About News..."), command: "do-aboutNews"},
        Mojo.Menu.editItem,
        {label: $L("Preferences..."), command: "do-Prefs"},    
        {label: $L("Help..."), command: "do-Help"}            
    ]
};







function AppAssistant(appController) {
	Mojo.Log.info("--> AppAssistant Constructor");
	
	//Creating Audio Player
	AmpacheMobile.AppController = appController;
	AppAssistant.audioPlayer = new AudioPlayer(appController);
	
	
	
	Mojo.Log.info("<-- AppAssistant Constructor");
	
}




AppAssistant.prototype.setup = function() 
{
	Mojo.Log.info("Enter AppAssistant.prototype.setup");
	
	
	Mojo.Log.info("Exit AppAssistant.prototype.setup");
}



AppAssistant.prototype.handleLaunch = function(launchParams){
	Mojo.Log.info("--> AppAssistant.prototype.handleLaunch");
	
	Mojo.Log.info("<-- AppAssistant.prototype.handleLaunch");
	
}



	
	
	