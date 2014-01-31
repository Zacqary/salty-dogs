/* 
	================================================
	==================GAMESTATE=====================
	================================================
	
	Includes:
	- GameState
	- Countdown
	
*/
/*	GameState Interface
		Manages the active Loop object and Camera2D, and keeps track of time
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
		
		tickCountdowns();
		
		this.updateMouseWorldPosition();
		previousFrameTime = currentTime;
		currentTime = TurbulenzEngine.time;
	}
	//	draw - Draw the frame for the current Loop, or its loading screen
	this.draw = function(){
		if (currentLoop.loaded) currentLoop.draw();
		else currentLoop.loadingScreen();
	}
	
	//	Input
	//	=====
	this.onMouseDown = function(mouseCode, x, y){
		if(currentLoop.onMouseDown)
			currentLoop.onMouseDown(mouseCode, x, y);
	}
	this.onMouseUp = function(mouseCode, x, y){
		if(currentLoop.onMouseUp)
			currentLoop.onMouseUp(mouseCode, x, y);
	}
	this.onKeyDown = function(keyCode){
		if(currentLoop.onKeyDown)
			currentLoop.onKeyDown(keyCode);
	}
	this.onKeyUp = function(keyCode){
		if(currentLoop.onKeyUp)
			currentLoop.onKeyUp(keyCode);
	}
	
	this.updateMouseWorldPosition = function(){
		var pos = this.getCamera().mouseToWorld();
		this.mouseWorldPosition.x = pos[0];
		this.mouseWorldPosition.y = pos[1];
	}
	this.mouseWorldPosition = {
		x: null,
		y: null
	}
	
	//	Timing
	//	======
	var previousFrameTime;
	var currentTime = TurbulenzEngine.time;
	var countdowns = [];
	
	this.getTime = function(){
		return currentTime;
	}
	var getTimeDelta = function(){
		return currentTime - previousFrameTime;
	}
	this.getTimeDelta = getTimeDelta;
	
	var getFrameDelta = function(){
		return Math.round(getTimeDelta() / (1/60) );
	}
	this.getFrameDelta = getFrameDelta;
	
	this.addCountdown = function(countdown){
		countdowns[countdown.guid] = countdown;
	}
	this.removeCountdown = function(countdown){
		if (typeof countdown == "object")
			delete countdowns[countdown.guid];
		else if (typeof countdown == "string")
			delete countdowns[countdown];
	}
	var tickCountdowns = function(){
		for (var i in countdowns){
			countdowns[i].tick();
			if (!countdowns[i].get()) countdowns[i].onZero();
		}
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
	var currentZoomer = null;
	this.zoomCamera = function(value, time){
		time = time || 0.5;
		//	Get the difference between the current zoom level and the target zoom level
		var diff = Math.abs(currentCamera.getZoom() - value);
		//	Calculate how far to zoom each frame in order to zoom to this level in the alotted time
		var speed = diff/(60*time);
		//	If the game is currently trying to zoom
		if (currentZoomer) {
			//	If the target is a different zoom level than already requested,
			//	override the previous zoom command
			if (currentZoomer.target != value) this.removeCountdown(currentZoomer.countdown);
			//	Otherwise, don't produce a duplicate zoomer and let the current one to finish
			else return;
		}
		//	Create a timer to zoom, which should trip every frame
		var zoomer = new Countdown(1/60, function(){
			if (Math.abs(currentCamera.getZoom() - value) < speed) {
				currentCamera.setZoom(value);
				zoomer.delete();
				currentZoomer = null;
			}
			else {
				if (currentCamera.getZoom() > value) {
					currentCamera.zoom(-speed*getFrameDelta());
				}
				else {
					currentCamera.zoom(speed*getFrameDelta());
				}
			}
		});
		currentZoomer = {
			countdown: zoomer,
			target: value,
		
		};
	}
	
}

/*	Countdown - extends Spectrum
		A Spectrum specialized for countdown timers, automatically ticked each frame by GameState
*/
var Countdown = function Countdown(current, a, b, onZero){
	if (_.isFunction(a)){
		onZero = a;
		a = undefined;
	}
	else if (_.isFunction(a)){
		onZero = b;
		b = undefined;
	}
	
	var c = new Spectrum(current, a, b);
	var frozen = false;
	
	c.guid = _.uniqueId("countdown");
	
	c.onZero = function(){
		if (onZero) onZero();
	}
	
	c.maxOut = function(){
		c.set(c.getMax());
	}
	c.tick = function(){
		if (!frozen) c.plus(-GameState.getTimeDelta());
	}
	c.freeze = function(){
		frozen = true;
	}
	c.unfreeze = function(){
		frozen = false;
	}
	
	c.delete = function(){
		GameState.removeCountdown(c);
	}
	
	GameState.addCountdown(c);
	
	return c;
};