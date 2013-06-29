var GameState = new function() {
	
	var currentLoop = function() { };
	var currentCamera;
	
	this.set = function(newLoop){
		currentLoop = newLoop;
		currentLoop.initialize();
	}
	this.loop = function(){
		if (currentLoop.loaded)
			currentLoop.run();
		else currentLoop.loadingLoop();
	}
	this.draw = function(){
		if (currentLoop.loaded) currentLoop.draw();
		else currentLoop.loadingScreen();
	}
	
	this.setCamera = function(newCamera){
		currentCamera = newCamera;
	}
	this.getCamera = function(){
		return currentCamera;
	}
}