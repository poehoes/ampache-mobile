var RepeatModeType = {
    "no_repeat": 0,
    "repeat_forever": 1,
    "repeat_once": 2
};

PlayList = Class.create({

    songs: null,
    //Array of songs in the order they were added to the class
    playback: null,
    //Array of indexes into the songs array, this array stores the playback order.
    current: null,
    //Index into the playback array

    repeat: 0,
    shuffle: false,

    initialize: function(songsList, shuffle, repeat, startIndex) {
        this.songs = songsList;
        this.shuffle = shuffle;
        this.repeat = repeat;

        this.playback = this.getSequentialIntArray();
        this.current = startIndex;

        for (var i = 0; i < this.songs.length; i++) {
            this.songs[i].index = i+1;
        }

        if (this.shuffle === true) {
            //if shuffled is on, then user couldnt have selected a track, so 
            this.current = Math.floor(Math.random() * this.songs.length);
            this.shuffleOn();
        }

    },

    enqueueSongs: function(songsList, shuffleMode) {
        if (this.songs) {
            //Combine lists
           
            
            offset = this.songs.length;
            for (var i = 0; i < songsList.length; i++) {
            
                this.songs[i+offset] = songsList[i].clone();
                this.songs[i+offset] = i+offset+1;
            }
            
            this.playback = this.getSequentialIntArray();
            
            if (_shuffleOn || this.shuffleOn === true) {
                this.shuffleOn();
            }

        }

},

removeSong: function(index){
        //if(index === this.currentPlayingTrack)
        //{
        //    this.play_next(false);
        //}
        
        
        var playlist = this.songs;        
        playlist.splice(index,1);
        
        for (var i = 0; i < playlist.length; i++) {
            playlist[i].index = i+1;
        }
        this.songs = playlist;
        this.playback = this.getSequentialIntArray();
        
        if(index < this.current)
        {
            this.current--;
        }
        
        if(this.shuffle===true)
        {
            this.shuffleOn();
        }
        
        //this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
        
        
    },

    /********************************************/
    /**
    *  Function to be called in response to a reorder list mojo event.
    *
    *  \param mojo reorder list event
    *  \return 
    ***********************************************/
    reorder:function(event)
    {
        var item = this.songs[event.fromIndex];
        if(event.fromIndex<event.toIndex) 
        {   //Dragging down list
            
            this.songs.splice(event.fromIndex,1);
            this.songs.splice(event.toIndex,0,item);
            if(event.fromIndex ===this.current)
            {
                this.current=event.toIndex;
            }
            else if((event.fromIndex<this.current)&&(event.toIndex>=this.current))
            {
                this.current--;
            }
            
        }
        else
        {   //Dragging up list
            this.songs.splice(event.fromIndex,1);
            this.songs.splice(event.toIndex,0,item);
            if(event.fromIndex ===this.current)
            {
                this.current=event.toIndex;
            }
            else if((event.fromIndex>this.current)&&(event.toIndex<=this.current))
            {
                this.current++;
            }
        }
        
        for (var i = 0; i < this.songs.length; i++) {
            this.songs[i].index = i+1;
        }
        
        this.playback = this.getSequentialIntArray();
        if(this.shuffle===true)
        {
            this.shuffleOn();
        }
        
        //this.NowPlayingUpdateSongInfo(this.currentPlayingTrack);
        //_updateBuffering();
        
    },

    shuffleOn: function() {
        this.playback.sort(this.randBool);
        var i = this.playback.length;
        do {
            if (this.playback[i] === this.playback[this.current]) {
                temp = this.playback[0];
                this.playback[0] = this.playback[this.current];
                this.playback[i] = temp;
                break;
            }
        } while (-- i );
        this.current = 0;
        this.shuffle = true;

    },

    shuffleOff: function() {
        var temp = this.playback[this.current];
        this.playback = this.getSequentialIntArray();
        this.current = temp;
        this.shuffle = false;
    },

    randBool: function() {
        return (Math.round(Math.random()) - 0.5);
    },

    /********************************************/
    /**
    *  Build an array of sequential intergers starting a 0
    *
    *  \return array of size songs array
    ***********************************************/
    getSequentialIntArray: function() {
        //Inititialize an array to randomize;
        var newList = [];
        for (var i = 0; i < this.songs.length; i++) {
            newList[i] = i;
        }
        return newList;
    },

    /********************************************/
    /**
    *  Returns the song object this.current is pointing to.
    *  
    *  \return null if there is no current song, song object if there is a current
    ***********************************************/
    getCurrentSong: function() {
        var song = null;
        if (this.current != null) {
            song = this.songs[this.playback[this.current]];
        }
        return song;
    },

    /********************************************/
    /**
    *  Determines if we are pointing to the end of a playlist
    *  
    *  \return true if we are at the end
    ************************************************/
    atPlaylistEnd: function() {
        return ((this.current + 1) === this.song.length) ? true: false;
    },

    /********************************************/
    /**
    *  Moves the current song pointer to the next based on current position and repeat mode.
    *
    *  \return true if has occured
    ***********************************************/
    moveCurrentToNext: function() {

        var moved = true;

        switch (this.repeat) {
        case RepeatModeType.no_repeat:
            if ((this.current + 1) < this.songs.length) {
                this.current = this.current + 1;
            } else {
                moved = false;
            }
            break;
        case RepeatModeType.repeat_forever:
            this.current = (this.current + 1) % this.songs.length;
            break;
        case RepeatModeType.repeat_once:
            this.current = (this.current + 1) % this.songs.length;
            this.repeat = RepeatModeType.no_repeat;
            //need a way to change the button here
            break;
        }
        
        return moved;
    },

    /********************************************/
    /**
    *  Moves the current song pointer to the previous based on current position and repeat mode.
    *
    *  \return true if has occured
    ***********************************************/
    moveCurrentToPrevious: function() {

        var moved = true;

        if (this.current !== 0) {
            this.current = this.current - 1;
        } else {
            switch (this.repeat) {
                case RepeatModeType.no_repeat:
                    moved = false;
                    break;
                case RepeatModeType.repeat_once:
                case RepeatModeType.repeat_forever:
                    this.current = (this.current - 1) % this.songs.length;
                    break;
            }
        }
        return moved;
    },
    
    /********************************************/
    /**
    *  Given a song this will find the next song in the playback array
    *
    *  \returns Returns song is there is next song, null if not
    ***********************************************/
    peekNextSong:function(song)
    {
        searchIndex =song.index-1;
        nextSong = null;
        for(var i =0; i<this.playback.length; i++)
        {
            if(searchIndex == this.playback[i])
            {
                if(i+1 != this.playback.length)
                {
                   return this.songs[this.playback[i+1]]; 
                }
                else
                {
                    return null;
                }
            }
            
        }
       return null;
    }
    

});