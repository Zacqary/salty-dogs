var GameState = new function() {
	
	var currentLoop = function() { };
	var currentCamera;
	
	this.set = function(newLoop){
		currentLoop = newLoop;
		currentLoop.initialize();
	}
	this.loop = function(){
		currentLoop.run();
	}
	this.draw = function(){
		currentLoop.draw();
	}
	
	this.setCamera = function(newCamera){
		currentCamera = newCamera;
	}
	this.getCamera = function(){
		return currentCamera;
	}
}