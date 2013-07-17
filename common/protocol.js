/* 
	================================================
	===================PROTOCOL=====================
	================================================
	
	Includes:
	- Protocol
	- Generic global functions
	
*/

/*	Protocol Interface
		A redundantly-named interface that initializes the engine and starts it looping
*/
var Protocol = {

	initializeEngineReferences: function initializeEngineReferences(){
		
		Protocol.requestHandler = RequestHandler.create( { } );
		
		Math.device = TurbulenzEngine.createMathDevice( { } );
		Graphics.initializeEngineReferences();
		Input.initializeEngineReferences();
		Physics.initializeEngineReferences();
	
		Protocol.intervalID = TurbulenzEngine.setInterval(INITIAL_LOOP, 1000 / INITIAL_FRAMERATE);
		
	},
	
	clearEngineReferences: function clearEngineReferences(){
		Protocol.requestHandler = null;
		Math.device = null;
		Graphics.clearEngineReferences();
		Input.clearEngineReferences();
		Physics.clearEngineReferences();

		Protocol.intervalID = null;
		delete UUIDs;
	},

}

//	randomNumber - Generates a random number
var randomNumber = function randomNumber(lower, upper){
	var mult = upper - lower;
	mult++;
	return Math.floor( Math.random()*mult ) + lower;
}
//	randomBool - Flips a coin, basically
var randomBool = function randomBool(){
	num = randomNumber(0,5);
	if (num >= 3) return true;
	else return false;
}
//	makeid - Creates a UUID
var UUIDs = [];
var makeid = function makeid(){
	var id = guid();
	while(id in UUIDs) id = guid();
	UUIDs.push(id);
	return id;
}
var s4 = function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};
var guid = function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

// objSize - Gets the number of properties in an object
var objSize = function objSize(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

Math.distanceXY = function (a,b){
	var xDiff = Math.abs(b[0] - a[0]);
	var yDiff = Math.abs(b[1] - a[1]);
	return Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
}