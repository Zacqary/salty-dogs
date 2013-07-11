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
//	makeid - Creates a random string of gibberish in order to name something
var makeid = function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 12; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
// objSize - Gets the number of properties in an object
var objSize = function objSize(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};