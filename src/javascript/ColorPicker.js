// A few configuration settings
var CROSSHAIRS_LOCATION = 'images/colorselector/crosshairs.png';
var HUE_SLIDER_LOCATION = 'images/colorselector/h.png';
var HUE_SLIDER_ARROWS_LOCATION = 'images/colorselector/position.png';
var SAT_VAL_SQUARE_LOCATION = 'images/colorselector/sv.png';


	function pageCoords(node){
        var x = node.offsetLeft;
        var y = node.offsetTop;
        var parent = node.offsetParent;
        while (parent != null) {
            x += parent.offsetLeft;
            y += parent.offsetTop;
            parent = parent.offsetParent;
        }
        return {
            x: x,
            y: y
        };
    }

ColorPicker = Class.create({

    // Here are some boring utility functions. The real code comes later.
    colorPicker:null,
	
	
    hexToRgb: function(hex_string, default_){
        if (default_ == undefined) {
            default_ = null;
        }
        
        if (hex_string.substr(0, 1) == '#') {
            hex_string = hex_string.substr(1);
        }
        
        var r;
        var g;
        var b;
        if (hex_string.length == 3) {
            r = hex_string.substr(0, 1);
            r += r;
            g = hex_string.substr(1, 1);
            g += g;
            b = hex_string.substr(2, 1);
            b += b;
        }
        else 
            if (hex_string.length == 6) {
                r = hex_string.substr(0, 2);
                g = hex_string.substr(2, 2);
                b = hex_string.substr(4, 2);
            }
            else {
                return default_;
            }
        
        r = parseInt(r, 16);
        g = parseInt(g, 16);
        b = parseInt(b, 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return default_;
        }
        else {
            return {
                r: r / 255,
                g: g / 255,
                b: b / 255
            };
        }
    },
    
    rgbToHex: function(r, g, b, includeHash){
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
        if (includeHash == undefined) {
            includeHash = true;
        }
        
        r = r.toString(16);
        if (r.length == 1) {
            r = '0' + r;
        }
        g = g.toString(16);
        if (g.length == 1) {
            g = '0' + g;
        }
        b = b.toString(16);
        if (b.length == 1) {
            b = '0' + b;
        }
        return ((includeHash ? '#' : '') + r + g + b).toUpperCase();
    },
    

    
    fixPNG: function(myImage){
        if ((this.version >= 5.5) && (this.version < 7) && (document.body.filters)) {
            var node = document.createElement('span');
            node.id = myImage.id;
            node.className = myImage.className;
            node.title = myImage.title;
            node.style.cssText = myImage.style.cssText;
            node.style.setAttribute('filter', "progid:DXImageTransform.Microsoft.AlphaImageLoader" +
            "(src=\'" +
            myImage.src +
            "\', sizingMethod='scale')");
            node.style.fontSize = '0';
            node.style.width = myImage.width.toString() + 'px';
            node.style.height = myImage.height.toString() + 'px';
            node.style.display = 'inline-block';
            return node;
        }
        else {
            return myImage.cloneNode(false);
        }
    },
    
	/*
	fixCoords:function (x, y, node){
            var nodePageCoords = this.pageCoords(node);
            x = (x - nodePageCoords.x) + document.documentElement.scrollLeft;
            y = (y - nodePageCoords.y) + document.documentElement.scrollTop;
            if (x < 0) 
                x = 0;
            if (y < 0) 
                y = 0;
            if (x > node.offsetWidth - 1) 
                x = node.offsetWidth - 1;
            if (y > node.offsetHeight - 1) 
                y = node.offsetHeight - 1;
            return {
                x: x,
                y: y
            };
        },
	
	mouseDown:function (ev) {
            var coords = this.fixCoords(ev.clientX, ev.clientY, ev);
            var lastX = coords.x;
            var lastY = coords.y;
            handler(coords.x, coords.y);
            
            function moveHandler(ev){
                var coords = fixCoords(ev.clientX, ev.clientY);
                if (coords.x != lastX || coords.y != lastY) {
                    lastX = coords.x;
                    lastY = coords.y;
                    handler(coords.x, coords.y);
                }
            }
            function upHandler(ev){
                this.myRemoveEventListener(document, 'mouseup', upHandler);
                this.myRemoveEventListener(document, 'mousemove', moveHandler);
                this.myAddEventListener(node, 'mousedown', mouseDown);
            }
            this.myAddEventListener(document, 'mouseup', upHandler);
            this.myAddEventListener(document, 'mousemove', moveHandler);
            this.myRemoveEventListener(node, 'mousedown', mouseDown);
            if (ev.preventDefault) 
                ev.preventDefault();
        },
	
	node:null,
    trackDrag: function(node, handler){
       
        
        this.myAddEventListener(node, 'mousedown', this.mouseDown.bind(this));
        node.onmousedown = function(e){
            return false;
        };
        node.onselectstart = function(e){
            return false;
        };
        node.ondragstart = function(e){
            return false;
        };
    },
    */
	

	
	trackDrag: function(node, handler){
		function fixCoords(x, y){
			var nodePageCoords = pageCoords(node);
			x = (x - nodePageCoords.x) + document.documentElement.scrollLeft;
			y = (y - nodePageCoords.y) + document.documentElement.scrollTop;
			if (x < 0) 
				x = 0;
			if (y < 0) 
				y = 0;
			if (x > node.offsetWidth - 1) 
				x = node.offsetWidth - 1;
			if (y > node.offsetHeight - 1) 
				y = node.offsetHeight - 1;
			return {
				x: x,
				y: y
			};
		}
		function mouseDown(ev){
			
			console.log("mouseDown");
			var coords = fixCoords(ev.clientX, ev.clientY);
			var lastX = coords.x;
			var lastY = coords.y;
			handler(coords.x, coords.y, this);
			
			var mouseIsDown = true;
			
			function moveHandler(ev){
				console.log("mousemove");
				var coords = fixCoords(ev.clientX, ev.clientY);
				if (coords.x != lastX || coords.y != lastY) {
					lastX = coords.x;
					lastY = coords.y;
					handler(coords.x, coords.y, this);
				}
			}
			function upHandler(ev){
				console.log("-->upHandler");
				this.myRemoveEventListener(document, 'mouseup', upHandler);
				this.myRemoveEventListener(document, 'mousemove', moveHandler);
				this.myAddEventListener(node, 'mousedown', mouseDown.bind(this), mouseDown);
				mouseIsDown = false;
				console.log("<--upHandler");
			}
			
			function noDrag(event){
				if (mouseIsDown) {
					console.log("Drag Stopped");
					event.stop();
				}
			}
			
			this.controller.get('colorPicker').observe(Mojo.Event.dragStart, noDrag.bindAsEventListener(this));	
			
			this.myAddEventListener(document, 'mouseup', upHandler.bind(this), upHandler);
			this.myAddEventListener(document, 'mousemove', moveHandler.bind(this), moveHandler);
			this.myRemoveEventListener(node, 'mousedown', mouseDown);
			if (ev.preventDefault) 
				ev.preventDefault();
		}
		this.myAddEventListener(node, 'mousedown', mouseDown.bind(this), mouseDown);
		node.onmousedown = function(e){
			return false;
		};
		node.onselectstart = function(e){
			return false;
		};
		node.ondragstart = function(e){
			return false;
		};
	},

	
	
    eventListeners: [],
    
    findEventListener: function(node, event, handler){
        var i;
		
		
        for (i = 0; i < this.eventListeners.length; i++) {
			var eventListener =  this.eventListeners[i];
			if (eventListener.node == node) {
				if (eventListener.event == event) {
					if (eventListener.handlerFunc == handler) {
						return i;
					}
				}
			}
		}
        return null;
    },
    myAddEventListener: function(node, event, handler, handlerFunc){
        if (this.findEventListener(node, event, handlerFunc) != null) {
            console.log("found:" + event)
			return;
        }
        
		console.log("add listener " + event)
		
        if (!node.addEventListener) {
            node.attachEvent('on' + event, handler);
        }
        else {
            node.addEventListener(event, handler, false);
        }
        
        this.eventListeners.push({
            node: node,
            event: event,
            handler: handler,
			handlerFunc: handlerFunc,
        });
		
		console.log("events: " + this.eventListeners.length)
		
    },
    
    removeEventListenerIndex: function(index){
        var removedListener = this.eventListeners.splice(index,1);
        var eventListener = removedListener[0];
		
		console.log("remove listener " + eventListener.event)
		
        if (!eventListener.node.removeEventListener) {
            eventListener.node.detachEvent('on' + eventListener.event, eventListener.handler);
        }
        else {
            eventListener.node.removeEventListener(eventListener.event, eventListener.handler, false);
        }
		
		console.log("events: " + this.eventListeners.length)
		
    },
    
    myRemoveEventListener: function(node, event, handler){
        this.removeEventListenerIndex(this.findEventListener(node, event, handler));
    },
    
    cleanupEventListeners: function(){
        var i;
        for (i = this.eventListeners.length; i > 0; i--) {
            if (this.eventListeners[i] != undefined) {
                this.removeEventListenerIndex(i);
            }
        }
    },
    
    cleanup: function(){
        this.cleanupEventListeners();
    },
    // This copyright statement applies to the following two functions,
    // which are taken from MochiKit.
    //
    // Copyright 2005 Bob Ippolito <bob@redivi.com>
    //
    // Permission is hereby granted, free of charge, to any person obtaining
    // a copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to
    // permit persons to whom the Software is furnished to do so, subject
    // to the following conditions:
    //
    // The above copyright notice and this permission notice shall be
    // included in all copies or substantial portions of the Software.
    // 
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    // NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
    // BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    // ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    // CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    
    hsvToRgb: function(hue, saturation, value){
        var red;
        var green;
        var blue;
        if (value == 0.0) {
            red = 0;
            green = 0;
            blue = 0;
        }
        else {
            var i = Math.floor(hue * 6);
            var f = (hue * 6) - i;
            var p = value * (1 - saturation);
            var q = value * (1 - (saturation * f));
            var t = value * (1 - (saturation * (1 - f)));
            switch (i) {
                case 1:
                    red = q;
                    green = value;
                    blue = p;
                    break;
                case 2:
                    red = p;
                    green = value;
                    blue = t;
                    break;
                case 3:
                    red = p;
                    green = q;
                    blue = value;
                    break;
                case 4:
                    red = t;
                    green = p;
                    blue = value;
                    break;
                case 5:
                    red = value;
                    green = p;
                    blue = q;
                    break;
                case 6: // fall through
                case 0:
                    red = value;
                    green = t;
                    blue = p;
                    break;
            }
        }
        return {
            r: red,
            g: green,
            b: blue
        };
    },
    
    rgbToHsv: function(red, green, blue){
        var max = Math.max(Math.max(red, green), blue);
        var min = Math.min(Math.min(red, green), blue);
        var hue;
        var saturation;
        var value = max;
        if (min == max) {
            hue = 0;
            saturation = 0;
        }
        else {
            var delta = (max - min);
            saturation = delta / max;
            if (red == max) {
                hue = (green - blue) / delta;
            }
            else 
                if (green == max) {
                    hue = 2 + ((blue - red) / delta);
                }
                else {
                    hue = 4 + ((red - green) / delta);
                }
            hue /= 6;
            if (hue < 0) {
                hue += 1;
            }
            if (hue > 1) {
                hue -= 1;
            }
        }
        return {
            h: hue,
            s: saturation,
            v: value
        };
    },
    
   
    
    huePositionImg: null,
    hueSelectorImg: null,
    satValImg: null,
    crossHairsImg: null,
    arVersion: null,
    version: null,
	ColorChangedCallback:null,
	controller:null,    
	
    initialize: function(controller, currentHexColor, colorChangedCallBack){
		this.controller = controller;
		this.ColorChangedCallback = colorChangedCallBack;
		
		this.currentColor = currentHexColor;
		
		this.colorPicker = this;
		this.arVersion= navigator.appVersion.split("MSIE"),
        this.version= parseFloat(this.arVersion[1]),
		
        // The real code begins here.
        this.huePositionImg = document.createElement('img');
        this.huePositionImg.galleryImg = false;
        this.huePositionImg.width = 35;
        this.huePositionImg.height = 11;
        this.huePositionImg.src = HUE_SLIDER_ARROWS_LOCATION;
        this.huePositionImg.style.position = 'absolute';
        
        this.hueSelectorImg = document.createElement('img');
        this.hueSelectorImg.galleryImg = false;
        this.hueSelectorImg.width = 35;
        this.hueSelectorImg.height = 200;
        this.hueSelectorImg.src = HUE_SLIDER_LOCATION;
        this.hueSelectorImg.style.display = 'block';
        
        this.satValImg = document.createElement('img');
        this.satValImg.galleryImg = false;
        this.satValImg.width = 200;
        this.satValImg.height = 200;
        this.satValImg.src = SAT_VAL_SQUARE_LOCATION;
        this.satValImg.style.display = 'block';
        
        this.crossHairsImg = document.createElement('img');
        this.crossHairsImg.galleryImg = false;
        this.crossHairsImg.width = 21;
        this.crossHairsImg.height = 21;
        this.crossHairsImg.src = CROSSHAIRS_LOCATION;
        this.crossHairsImg.style.position = 'absolute';
    },
    
	inputBox:null,
	previewDiv:null,
	colorSelectorDiv:null,
	satValDiv:null,
	hueDiv:null, 
	huePos:null,
	crossHairs:null,
	rgb:null,
	hsv:null,
	

	
    makeColorSelector: function(inputBox){
        this.inputBox = inputBox;
		
		
        
        
        this.colorSelectorDiv = document.createElement('div');
        this.colorSelectorDiv.style.padding = '15px';
        this.colorSelectorDiv.style.position = 'relative';
        this.colorSelectorDiv.style.height = '275px';
        this.colorSelectorDiv.style.width = '250px';
        
        this.satValDiv = document.createElement('div');
        this.satValDiv.style.position = 'relative';
        this.satValDiv.style.width = '200px';
        this.satValDiv.style.height = '200px';
        var newSatValImg = this.fixPNG(this.satValImg);
        this.satValDiv.appendChild(newSatValImg);
        this.crossHairs = this.crossHairsImg.cloneNode(false);
        this.satValDiv.appendChild(this.crossHairs);
        
        this.trackDrag(this.satValDiv, this.satValDragged.bind(this))
        this.colorSelectorDiv.appendChild(this.satValDiv);
        
        this.hueDiv = document.createElement('div');
        this.hueDiv.style.position = 'absolute';
        this.hueDiv.style.left = '230px';
        this.hueDiv.style.top = '15px';
        this.hueDiv.style.width = '35px';
        this.hueDiv.style.height = '200px';
        this.huePos = this.fixPNG(this.huePositionImg);
        this.hueDiv.appendChild(this.hueSelectorImg.cloneNode(false));
        this.hueDiv.appendChild(this.huePos);
        
        this.trackDrag(this.hueDiv, this.hueDragged);
        this.colorSelectorDiv.appendChild(this.hueDiv);
        
        this.previewDiv = document.createElement('div');
        this.previewDiv.style.height = '50px'
        this.previewDiv.style.width = '50px';
        this.previewDiv.style.position = 'absolute';
        this.previewDiv.style.top = '225px';
        this.previewDiv.style.left = '15px';
        this.previewDiv.style.border = '1px solid black';
        this.colorSelectorDiv.appendChild(this.previewDiv);
        
        
        this.inputBox.value = this.currentColor;
		this.myAddEventListener(this.inputBox, 'change', this.inputBoxChanged.bind(this));
        this.inputBox.size = 8;
        this.inputBox.style.position = 'absolute';
        this.inputBox.style.right = '15px';
        this.inputBox.style.top = (225 + (25 - (this.inputBox.offsetHeight / 2))).toString() + 'px';
        
		
		this.colorSelectorDiv.appendChild(this.inputBox);
        
		
		
        this.inputBoxChanged();
        
        return this.colorSelectorDiv;
    },
    
	satValDragged: function (x, y, context){
            context.hsv.s = 1 - (y / 199);
            context.hsv.v = (x / 199);
            context.hsvChanged();
    },

	hueDragged: function (x, y, context){
            context.hsv.h = y / 199;
            context.hsvChanged();
     },
	
	
	currentColor:null,
	
	colorChanged: function(){
		var hex = this.rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
		var hueRgb = this.hsvToRgb(this.hsv.h, 1, 1);
		var hueHex = this.rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);
		this.previewDiv.style.background = hex;
		this.inputBox.value = hex;
		this.satValDiv.style.background = hueHex;
		this.crossHairs.style.left = ((this.hsv.v * 199) - 10).toString() + 'px';
		this.crossHairs.style.top = (((1 - this.hsv.s) * 199) - 10).toString() + 'px';
		this.huePos.style.top = ((this.hsv.h * 199) - 5).toString() + 'px';
		
		this.ColorChangedCallback(this.inputBox.value);
		this.currentColor = this.inputBox.value;
		
	},
		
    rgbChanged: function(){
		this.hsv = this.rgbToHsv(this.rgb.r, this.rgb.g, this.rgb.b);
		this.colorChanged();
	},
	
    hsvChanged: function(){
		this.rgb = this.hsvToRgb(this.hsv.h, this.hsv.s, this.hsv.v);
		this.colorChanged();
	},
	
	
	inputBoxChanged:function (){
            this.rgb = this.hexToRgb(this.inputBox.value, {
                r: 0,
                g: 0,
                b: 0
            });
            this.rgbChanged();
     },
	
    makeColorSelectors: function(ev){
        var inputNodes = document.getElementsByTagName('input');
        var i;
        for (i = 0; i < inputNodes.length; i++) {
            var node = inputNodes[i];
            if (node.className != 'color') {
                continue;
            }
            var parent = node.parentNode;
            var prevNode = node.previousSibling;
            var selector = this.makeColorSelector(node);
            parent.insertBefore(selector, (prevNode ? prevNode.nextSibling : null));
        }
    },

});
