/* 
	================================================
	=====================LOOP=======================
	================================================
	
	Includes:
	- Loop
	
*/

/*	Loop Class
		Basic loop template
*/
var Loop = function(){ }

Loop.prototype.initialize = function() { }
Loop.prototype.run = function() { }
Loop.prototype.draw = function() { }

Loop.prototype.loadingLoop = function() { 
	this.loaded = true;
}
Loop.prototype.loadingScreen = function() { }
Loop.prototype.loaded = false;