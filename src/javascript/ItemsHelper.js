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
ItemsHelper = Class.create({
    //AmpacheServer:null,
    
    
    offset:0,
    count:null,
    LoadingFinished: false,
    Visible : false,
    
    
    initialize : function(ItemsList)
    {
        this.ItemsList = [];
    },
    
    
    setup:function(params)
    {
        
        this.controller = params.controller;
        this.filterList = params.filterList;
        this.getItemsCallback = params.getItemsCallback;
        //this.ItemsList = params.ItemsList;
        
        this.progressModel = params.progressModel;
        this.fetchLimit = params.fetchLimit;
        this.TurnOffSpinner = params.TurnOffSpinner;
        this.ExpectedItems =params.ExpectedItems;
        this.SortFunction = params.SortFunction;
        
        this.listModel = params.listModel;
        this.MatchFunction = params.MatchFunction;
        
        this.PopulateSort = params.PopulateSort;
        
    },
    
    
    
    
    
    GetItems:function()
    {
         if ((this.Visible === true) && (this.LoadingFinished === false)) 
         {
            this.getItemsCallback(this.GotItems.bind(this), this.offset, this.fetchLimit);
         }
    },
    
    
    GotItems: function(_ItemsList)
    {
        
        this.TurnOffSpinner();
        
        if(this.PopulateSort) {
            this.PopulateSort(_ItemsList);
        }
        
        for (var i = 0; i < _ItemsList.length; i++) 
        {
        
            var newItem = _ItemsList[i];
            this.ItemsList.push(newItem);
            
        }
        
        //Update Progress
        var progress = this.ItemsList.length / this.ExpectedItems;
        this.progressModel.value = progress;
        this.controller.modelChanged(this.progressModel);
        
        //Sorting Here
        
        if (this.SortFunction) 
        {
            
            this.ItemsList.sort(this.SortFunction);
        }
        
        //Add to list   
        
        if ((this.filterString === "") || (this.filterString === null)) 
        {
            this.filterList.mojo.noticeUpdatedItems(0, this.ItemsList);
        }
        else //list currently has a filter
         {
            var matches = this.GetAllMatches(this.filterString);
            this.filterList.mojo.noticeUpdatedItems(0, matches);
            this.filterList.mojo.setLength(matches.length);
            this.filterList.mojo.setCount(matches.length);
        }
        
        
        
        
        if (_ItemsList.length  !== this.fetchLimit) 
        {
            this.progressModel.value = 1;
            this.controller.modelChanged(this.progressModel);
            this.LoadingFinished = true;
        }
        else 
        {
            this.offset = this.ItemsList.length;
            this.GetItems();
        }
        
        
        Mojo.Log.info("Progress: " + progress);
        Mojo.Log.info("<-- FinishedGettings");
        
    },
    
    ReSortList:function(){
        //if (this.LoadingFinished) 
        //{
            if (this.PopulateSort) {
                this.PopulateSort(this.ItemsList);
            }
            
            if (this.SortFunction) 
            {
                this.ItemsList.sort(this.SortFunction);
            }
            
            
            
            //Add to list   
            if ((this.filterString === "") || (this.filterString === null)) 
            {
                this.Matches = this.ItemsList;
                this.filterList.mojo.noticeUpdatedItems(0, this.ItemsList);
            }
            else //list currently has a filter
            {
                this.Matches = this.GetAllMatches(this.filterString);
                this.filterList.mojo.noticeUpdatedItems(0, this.Matches);
                this.filterList.mojo.setLength(this.Matches.length);
                this.filterList.mojo.setCount(this.Matches.length);
            }
        //}
    },
    
    
    
    GetAllMatches: function(filterString)
    {
        var subset = [];
        
        if (filterString === "") 
        {
            for (var i = 0; i < this.ItemsList.length; i++) 
            {
            
                subset.push(this.ItemsList[i]);
            }
        }
        else 
        {
            for (var i = 0; i < this.ItemsList.length; i++) 
            {
                if(this.MatchFunction(this.ItemsList[i], filterString))
                {
                    subset.push(this.ItemsList[i]);
                }
            }
        }
        return subset;
    },
    
    
    filterString: null,
    Matches: null,
    LastFilterLength: null,
    
    FilterList: function(filterString, listWidget, offset, count)
    {
        Mojo.Log.info("--> Items Helper FilterList filterString:", filterString, "offset:", offset, "count:", count);
        var subset = [];
        
        
        
        if ((this.ItemsList) && (this.ItemsList.length  !== 0)) 
        {
        
            if ((filterString  !== this.filterString) || (this.LastFilterLength  !== this.ItemsList.length)) 
            {
                this.LastFilterLength = this.ItemsList.length;
                this.Matches = this.GetAllMatches(filterString);
                this.filterString = filterString;
            }
            
            Mojo.Log.info("Filtering: " + filterString);
            
            var Matches = this.Matches;
            
            for (var i = 0; i < count; i++) 
            {
                if ((i + offset) < Matches.length) 
                {
                
                    subset.push(Matches[i + offset]);
                }
                
            }
            
            
            listWidget.mojo.noticeUpdatedItems(offset, subset);
            listWidget.mojo.setLength(Matches.length);
            listWidget.mojo.setCount(Matches.length);
            
        }
        
        
        Mojo.Log.info("<-- Items Helper FilterList:");
        
        
    }


});