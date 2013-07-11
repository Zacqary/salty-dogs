/* 
	================================================
	==================GAMESTATE=====================
	================================================
	
	Includes:
	- GameState
	
*/
/*	GameState Interface
		Manages the active Loop object and Camera2D
*/
var GameState = new function() {
	
	var currentLoop = function() { };
	var currentCamera;
	
	//	set - Set a Loop and initialize it
	this.set = function(newLoop){
		currentLoop = newLoop;
		currentLoop.initialize();
	}
	//	loop - Run the game logic for the current Loop, or load it
	this.loop = function(){
		if (currentLoop.loaded)
			currentLoop.run();
		else currentLoop.loadingLoop();
	}
	//	draw - Draw the frame for the current Loop, or its loading screen
	this.draw = function(){
		if (currentLoop.loaded) currentLoop.draw();
		else currentLoop.loadingScreen();
	}
	
	//	Camera
	//	======
	this.setCamera = function(newCamera){
		currentCamera = newCamera;
	}
	this.getCamera = function(){
		return currentCamera;
	}
}