


var MediaEventsService = Class.create(
{
	parsePlaylist: function(playlistFilename, callback)
	{
		var parameters = {};
		parameters.filename = playlistFilename;

		return new Mojo.Service.Request(
				MediaEventsService.identifier,
				{
					method: 'parsePlaylist',
					onSuccess: callback,
					parameters: parameters

				}
			);
	},
	

	registerForMediaEvents: function(callback)
	{
		var parameters = {};
		parameters.appName = Mojo.appName;
		parameters.subscribe = "true";

		return new Mojo.Service.Request(
				MediaEventsService.identifier,
				{
					method: 'mediaEvents',
					onSuccess: callback,
					parameters: parameters

				}, true
			);
	},
	
	
	/**
	 * 
	 * Fetch the music store on the current rom
	 * 
	 * @param {Object} callback (response), populates response.name and id
	 */
	getMusicStore: function(callback)
	{
		return new Mojo.Service.Request(
				MediaEventsService.identifier,
				{
					method: 'getCurrentMusicStore',
					onSuccess: callback,
					onFailure: callback
				}
			);
	},
	
	markAppForeground: function(callback)
	{
		
		var parameters = {};
		parameters.subscribe = true;
		parameters.foregroundApp = true;
		
		return new Mojo.Service.Request(
				"palm://com.palm.audio/media",
				{
					method: 'lockVolumeKeys',					
					onSuccess: callback,
					parameters: parameters
				}
			);
	},
	


});

MediaEventsService.identifier = 'palm://com.palm.mediaevents';

