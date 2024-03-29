function NewUsersAssistant(params) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	if(params && params.type)
	{
		this.type = params.type;
	}
}

NewUsersAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
};

NewUsersAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
        //SetCSSTheme(this.controller, THEME_NONE);
	SetText(false, null, AmpacheMobile.settingsManager.settings.CSSTheme);
        SetBackground(this.controller, null, "");
	var scroller = document.getElementById("mojo-scene-new-users-scene-scroller");
	
	if(scroller && this.type)
	{
		if(this.type === "videos")
		{
			scroller.scrollTop = document.getElementById('videos').offsetTop-50;
		}
		else if(this.type === "account")
		{
			scroller.scrollTop = document.getElementById('account').offsetTop-50;
		}
	}
};

NewUsersAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
        //SetCSSTheme(this.controller, AmpacheMobile.settingsManager.settings.CSSTheme);
	SetBackground(this.controller, AmpacheMobile.settingsManager.settings.BackgroundImage, AmpacheMobile.settingsManager.settings.BackgroundColor);
        SetText(AmpacheMobile.settingsManager.settings.UseCustomColor, AmpacheMobile.settingsManager.settings.CustomColor, AmpacheMobile.settingsManager.settings.CSSTheme);

};

NewUsersAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
