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
		previousFrameTime = currentTime;
		currentTime = TurbulenzEngine.time;
	}
	//	draw - Draw the frame for the current Loop, or its loading screen
	this.draw = function(){
		if (currentLoop.loaded) currentLoop.draw();
		else currentLoop.loadingScreen();
	}
	
	//	Timing
	//	======
	var previousFrameTime;
	var currentTime = TurbulenzEngine.time;
	
	this.getTime = function(){
		return currentTime;
	}
	this.getTimeDelta = function(){
		return currentTime - previousFrameTime;
	}
	
	//	Camera
	//	======
	var currentCamera;
	this.setCamera = function(newCamera){
		currentCamera = newCamera;
	}
	this.getCamera = function(){
		return currentCamera;
	}
	
}