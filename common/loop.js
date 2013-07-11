/* 
	================================================
	=====================LOOP=======================
	================================================
	
	Includes:
	- Loop
	
	At some point Loop should probably be changed into a class, and this
	interface can be renamed to something else or folded into Protocol
	
*/

/*	Loop Interface
		Runs the current GameState Loop
*/
var Loop = {

	game: function(){

		GameState.loop();
		
		if (!Graphics.device.beginFrame()) {
			return;
		}
		Graphics.device.clear([0.5,0.5,0.5,1]);
		GameState.draw();
		Graphics.device.endFrame();
	},
	
}