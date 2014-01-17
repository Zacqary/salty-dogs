/* 
	================================================
	===================PROTOCOL=====================
	================================================
	
	Includes:
	- Protocol
	- AssetManager
	- Generic global functions
	
*/

/*	Protocol Interface
		A redundantly-named interface that initializes the engine and starts it looping
*/
var Protocol = {

	initializeEngineReferences: function(){
	
		Protocol.requestHandler = RequestHandler.create( { } );
		
		Math.device = TurbulenzEngine.createMathDevice( { } );
		Graphics.initializeEngineReferences();
		Input.initializeEngineReferences();
		Physics.initializeEngineReferences();
		
		Protocol.assetManager = AssetManager.create();
		
		Protocol.intervalID = TurbulenzEngine.setInterval(Protocol.loop, 1000 / INITIAL_FRAMERATE);
		
	},
	
	clearEngineReferences: function(){
		Protocol.requestHandler = null;
		Protocol.resourceLoader = null;
		Math.device = null;
		Graphics.clearEngineReferences();
		Input.clearEngineReferences();
		Physics.clearEngineReferences();

		Protocol.intervalID = null;
		delete UUIDs;
	},
	
	loop: function(){
		GameState.loop();
		
		if (!Graphics.device.beginFrame()) {
			return;
		}
		Graphics.device.clear([0.5,0.5,0.5,1]);
		GameState.draw();
		Graphics.device.endFrame();
	},

}
var AssetManager = function(){
	
	var pendingJSON = 0;
	
	this.loadJSON = function(src, onLoadFn){
		pendingJSON++;
		var data;
		Protocol.requestHandler.request({
			src: src,
			onload: function(response, status, callContext){
				pendingJSON--;
				onLoadFn(JSON.parse(response));
				data = response;
			}
		});
		return data;
	};
	
	this.getNumPendingJSON = function(){
		return pendingJSON;
	}
	
	this.getNumPendingAssets = function(){
		var pending = pendingJSON;
		pending += Graphics.textureManager.getNumPendingTextures();
		pending += Graphics.shaderManager.getNumPendingShaders();
		return pending;
	}
	
}
AssetManager.create = function(){
	var m = new AssetManager();
	return m;
}

//	randomNumber - Generates a random number
var randomNumber = function(lower, upper){
	var mult = upper - lower;
	mult++;
	return Math.floor( Math.random()*mult ) + lower;
}
//	randomBool - Flips a coin, basically
var randomBool = function(){
	num = randomNumber(0,5);
	if (num >= 3) return true;
	else return false;
}
//	makeid - Creates a UUID
var UUIDs = [];
var makeid = function(){
	var id = guid();
	while(id in UUIDs) id = guid();
	UUIDs.push(id);
	return id;
}
var s4 = function() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};
var guid = function() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

var arraysEqual = function(a, b){
	if (!Array.isArray(a) || !Array.isArray(b)) return false;
	else if (a.length != b.length) return false;
	var truth = 0;
	for (var i in a){
		if (a[i] == b[i]) truth++;
	}
	if (truth == a.length) return true;
	else return false;
}

// objSize - Gets the number of properties in an object
var objSize = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


/*	Spectrum
		A number that can be between two values
*/
var Spectrum = function(current, a, b){
	var min;
	var max;
	var current = current;
	
	if (typeof b === "undefined"){
		if (typeof a === "undefined") {
			min = 0;
			max = current;
		}
		else {
			min = 0;
			max = a;
		}
	}
	else {
		min = a;
		max = b;
	}
	
	this.getMax = function(){
		return max;
	}
	this.getMin = function(){
		return min;
	}
	this.setMax = function(v){
		max = v;
		set(current);
	}
	this.setMin = function(v){
		min = v;
		set(current);
	}
	
	this.get = function(){
		return current;
	}
	var set = this.set = function(v){
		if ( (v <= max) && (v >= min) ) current = v;
		else if (v > max) current = max;
		else if (v < min) current = min;
	}
	this.plus = function(v){
		set(current + v);
	}

};