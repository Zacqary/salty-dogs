/*	InCharacterLoop - extends Loop
		Basic loop for when the player is in control of a character
*/
var InCharacterLoop = function(){
	var l = new Loop();
	l.initialize = function(){
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
		
		this.em.applyAllEffects();
		
		Player.movementLoop();
		
		if(this.runAfterPlayerMoves) this.runAfterPlayerMoves();
		
		this.em.allToCurrentWaypoint();
		this.em.runPhysics();
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
		
		if (this.drawExtension) this.drawExtension();
	}

	l.onMouseDown = function(mouseCode, x, y){
		Player.keyboardReleaseTimer.set(0);
		if (mouseCode === Input.MOUSE_0)
	    {
	        Player.moveButtonDown = true;
	    }
		else if (mouseCode === Input.MOUSE_1)
	    {
	        Player.attack();
	    }
	}
	
	l.onMouseUp = function(mouseCode, x, y){
		if (mouseCode === Input.MOUSE_0)
	    {
	        Player.moveButtonDown = false;
	    }
		else if (mouseCode === Input.MOUSE_1)
	    {
	        
	    }
	}
	
	l.onKeyDown = function(keyCode){
		var startKB;
		if (!Player.keyboardMovement) startKB = true;
		if (keyCode === Input.keyCodes.W) {
			Player.keyboardMovement += 1;
		}
		if (keyCode === Input.keyCodes.A) {
			Player.keyboardMovement += 2;
		}
		if (keyCode === Input.keyCodes.S) {
			Player.keyboardMovement += 4;
		}
		if (keyCode === Input.keyCodes.D) {
			Player.keyboardMovement += 8;
		}
		if ( (startKB) && (Player.keyboardMovement) ){
			Player.entity.cursor.setPosition(Player.entity.x, Player.entity.y);
		}
		if (keyCode === Input.keyCodes.K) {
			Player.attack();
		}
	}
	
	l.onKeyUp = function(keyCode){
		if (keyCode === Input.keyCodes.W) {
			Player.keyboardMovement -= 1;
			delete Player.keyData["W"];
		}
		if (keyCode === Input.keyCodes.A) {
			Player.keyboardMovement -= 2;
			delete Player.keyData["A"];
		}
		if (keyCode === Input.keyCodes.S) {
			Player.keyboardMovement -= 4;
			delete Player.keyData["S"];
		}
		if (keyCode === Input.keyCodes.D) {
			Player.keyboardMovement -= 8;
			delete Player.keyData["D"];
		}
	}
	
	return l;
}