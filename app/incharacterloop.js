/*	InCharacterLoop - extends Loop
		Basic loop for when the player is in control of a character
*/
var InCharacterLoop = function(){
	var l = new Loop();
	l.initialize = function(){
		Debug.initialize();
		Player.loadDefaultMap();
		this.em = EntityManager.create();
		this.camera2D = Graphics.Camera2D.create();
		GameState.setCamera(this.camera2D);
		
		this.avatar = Character.create({});
		this.avatar.makePlayer();
		this.em.add(this.avatar);
		
		if(this.initializeExtension) this.initializeExtension();
	}

	
	l.run = function(){
		this.em.resetAll();
		Player.cursorOnNPC = false;
		if (!GameState.isPaused()) {
			this.em.applyAllEffects();
		
			Player.movementLoop();
			this.em.detectCollisions();
			if(this.runAfterPlayerMoves) this.runAfterPlayerMoves();
		
			this.em.allToCurrentWaypoint();
			this.em.runPhysics();
		}
		this.em.updateAll();
	}
	
	l.draw = function(){
		Graphics.device.clear([1,1,1,1]);
		
		if (Player.keyboardReleaseTimer.get()) {
			Player.entity.cursor.visible = false;
		}
		else {
			Player.entity.cursor.visible = true;
		}
	 	if (Player.moveButtonDown || Player.keyboardMovement) {
			if (Player.cursorOnNPC) Player.entity.cursor.sprite.setColor([1,0,0,1]);
			else Player.entity.cursor.sprite.setColor([0,0,1,1]);
		}
		else {
			if (Player.cursorOnNPC) Player.entity.cursor.sprite.setColor([0.4,0,1,0.7]);
			else Player.entity.cursor.sprite.setColor([0,0.4,1,0.5]);
		}
		Player.entity.cursor.sprite.setTexture(Graphics.textureManager.get("textures/circle.png"));
		Player.entity.cursor.zIndex = Player.entity.zIndex - 1;
		this.em.drawAll(true);
		
		//	Pathfinding debug draw
		this.em.debugDrawAllCharacters();
		
		if (this.drawExtension) this.drawExtension();
	}

	l.onMouseDown = function(mouseCode, x, y){
		Player.keyboardReleaseTimer.set(0);
		Player.onMouseDown(mouseCode);
	}
	
	l.onMouseUp = function(mouseCode, x, y){
	    Player.onMouseUp(mouseCode);
	}
	
	l.onKeyDown = function(keyCode){
		var startKB;
		if (!Player.keyboardMovement) startKB = true;
		Player.onKeyDown(keyCode);
		if ( (startKB) && (Player.keyboardMovement) ){
			Player.entity.cursor.setPosition(Player.entity.x, Player.entity.y);
		}
	}
	
	l.onKeyUp = function(keyCode){
		Player.onKeyUp(keyCode);
	}
	
	return l;
}