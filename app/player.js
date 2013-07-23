var Player = {
	
	keyboardMovement: 0,
	keyboardReleaseTimer: new Countdown(0,1),
	
	moveButtonDown: false,
	
	entity: null,
	
}

Player.movementLoop = function(){
	
	var camera = GameState.getCamera();
	
	if (Player.entity) {
		if(!Player.keyboardMovement && !Player.keyboardReleaseTimer.get()) {
			var curPos = camera.mouseToWorld();
			var avPos = Player.entity.getPosition();

			curPos = Player.curPosWithinRange(curPos,avPos,Player.entity.cursor.range);
	
			Player.entity.cursor.setPosition(curPos[0],curPos[1]);
		}
		else if (Player.keyboardMovement) {
			Player.keyboardReleaseTimer.maxOut();
			var curPos = Player.entity.cursor.getPosition();
			var delta = 8;
			if (Player.entity.inCombat) {
				delta = Player.entity.cursor.range;
				curPos = Player.entity.getPosition();
			}
			if (Input.keyDown[Input.keyCodes.W]){
				curPos[1] -= delta;
			}
			if (Input.keyDown[Input.keyCodes.A]){
				curPos[0] -= delta;
			}
			if (Input.keyDown[Input.keyCodes.D]){
				curPos[0] += delta;
			}
			if (Input.keyDown[Input.keyCodes.S]){
				curPos[1] += delta;
			}
			if ( (curPos[0] != Player.entity.x) || (curPos[1] != Player.entity.y) ) {
				var avPos = Player.entity.getPosition();
			
				curPos = Player.curPosWithinRange(curPos,avPos,Player.entity.cursor.range);
			
				Player.entity.cursor.setPosition(curPos[0],curPos[1]);
			}
		}
	
		if (Player.moveButtonDown || Player.keyboardMovement || Player.keyboardReleaseTimer.get()) {
			Player.entity.approach(Player.entity.cursor.x, Player.entity.cursor.y, Player.entity.cursor.range);
			
			if ( Math.abs(Player.entity.x - camera.x) > 128) {
				if (camera.x > Player.entity.x) {
					camera.x = Player.entity.x + 128;
				}
				else {
					camera.x = Player.entity.x - 128;
				}
			}
			
		}
		else {
			
			if ( Math.abs(Player.entity.x - camera.x) > 2) {
				if (camera.x > Player.entity.x) {
					camera.x -= 2;
				}
				else {
					camera.x += 2;
				}
			
			}
			
		}
		
	}
	
}

Player.curPosWithinRange = function(curPos, avPos, range){
	if ( Math.abs(curPos[0] - avPos[0]) > range) {
		if (curPos[0] < avPos[0]) curPos[0] = avPos[0] - range;
		else curPos[0] = avPos[0] + range;	
	}

	if ( Math.abs(curPos[1] - avPos[1]) > range ) {
		if (curPos[1] < avPos[1]) curPos[1] = avPos[1] - range;
		else curPos[1] = avPos[1] + range;	
	}
	
	return curPos;
}