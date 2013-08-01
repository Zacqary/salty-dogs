var Player = {
	
	keyboardMovement: 0,
	keyboardReleaseTimer: new Countdown(0,1),
	
	moveButtonDown: false,
	
	entity: null,
	
}

//	Movement
//	========
/*	movementLoop
		Every frame, reposition the cursor, and move the player if a movement
		button is being pressed
*/
Player.movementLoop = function(){
	
	if (Player.entity) {
		// If no keys have been pressed down for at least 1 second
		if(!Player.keyboardMovement && !Player.keyboardReleaseTimer.get()) {
			Player.positionMouseCursor(); // Use the mouse to position the cursor
		}
		else if (Player.keyboardMovement) {
			Player.parseWASD(); // Use the keys to position the cursor
		}
		
		// If the mouse button is down, or keys have been down less than 1 second ago
		if (Player.moveButtonDown || Player.keyboardMovement || Player.keyboardReleaseTimer.get()) {
			Player.goToCursor();
			
			// Follow the player with the camera
			var camera = GameState.getCamera();
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
			
			//	If in combat, bring the player back to standard distance
			if (Player.entity.inCombat) {
				var other = Player.getCurrentCombatant();
				var currentAngle = Math.angleXY([other.x, other.y],[Player.entity.x, Player.entity.y])*(180/Math.PI);
				var approachTarget = Math.lineFromXYAtAngle([other.x,other.y],64,-currentAngle);
				Player.entity.approach(approachTarget[0], approachTarget[1], 32);
			}
			
			// Center the camera back on the player if it's not there
			var camera = GameState.getCamera();
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

//	===============================================

/*	positionMouseCursor
		Reposition the cursor based on the mouse position
*/
Player.positionMouseCursor = function(){
	var curPos = GameState.getCamera().mouseToWorld();
	var avPos = Player.entity.getPosition();

	curPos = Player.curPosWithinRange(curPos,avPos,Player.entity.cursor.range);

	Player.entity.cursor.setPosition(curPos[0],curPos[1]);
}
/*	parseWASD
		Handle keyboard movement
*/
Player.parseWASD = function(){
	// Reset the 1 second timer for momentum
	Player.keyboardReleaseTimer.maxOut();
	
	// Gradually move the cursor 8 pixels to create a sense of momentum
	var curPos = Player.entity.cursor.getPosition();
	var delta = 8;
	
	// Turn off momentum if the player is in combat
	if (Player.entity.inCombat) {
		Player.keyboardReleaseTimer.set(0); // Cursor will jump back to mouse immediately on key release
		delta = Player.entity.cursor.range; // Move the cursor all the way to its maximum range
		curPos = Player.entity.getPosition();
	}
	
	// Move based on direction
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
	
	// Only reposition the cursor if movement isn't cancelled out
	// (Failing to do this check causes the avatar to move to NaN for some reason)
	if ( (curPos[0] != Player.entity.x) || (curPos[1] != Player.entity.y) ) {
		var avPos = Player.entity.getPosition();
	
		curPos = Player.curPosWithinRange(curPos,avPos,Player.entity.cursor.range);
	
		Player.entity.cursor.setPosition(curPos[0],curPos[1]);
	}
}
/*	curPosWithinRange
		Make sure the a set of curPos coordinates are within a given range from the
		player's avatar
*/
Player.curPosWithinRange = function(curPos, avPos, range){
	//	Keep the cursor within a radius (equal to the range value) of the avatar
	if (Math.distanceXY(avPos,curPos) > range){
		var angle = Math.angleXY(avPos,curPos);
		curPos = Math.lineFromXYAtAngle(avPos,range,angle);
	}
	
	return curPos;
}
/*	goToCursor
		Move the player towards the cursor, after performing some situational checks
*/
Player.goToCursor = function(){
	
	var approachTarget = [];
	if (Player.entity.inCombat) {
		// Check to see if the player is moving towards or away their foe
		var other = Player.getCurrentCombatant();
		// Compare the distance between foe/player and foe/cursor
		var currentDistance = Math.distanceXY(Player.entity.getPosition(), other.getPosition());
		var targetDistance = Math.distanceXY(Player.entity.cursor.getPosition(), other.getPosition());
		// If the player is moving more than 30 units away, they're probably intending to retreat
		if ( (currentDistance - targetDistance) < -30) {
			// Slow the player down
			Player.entity.affect("speedMult",Player.entity.speedMult/2);
			Player.entity.affect("retreating",true);
		}
		
		// If the player is defending, slow down their turning speed
		if (Player.entity.combat && !Player.entity.combat.attacker){
			Player.entity.affect("turnSpeed",Player.entity.turnSpeed/2);
		}
		
		
		var angle = Math.angleXY([other.x, other.y],[Player.entity.cursor.x,Player.entity.cursor.y])*(180/Math.PI);
		var currentAngle = Math.angleXY([other.x, other.y],[Player.entity.x, Player.entity.y])*(180/Math.PI);
		var diff = (angle - currentAngle);
		if (Math.abs(diff) < 120){
			if (diff < 0) {
				angle = currentAngle - Player.entity.turnSpeed;
			}
			else angle = currentAngle + Player.entity.turnSpeed;
		}
		else {
			if (diff < 0) {
				angle = currentAngle + Player.entity.turnSpeed;
			}
			else angle = currentAngle - Player.entity.turnSpeed;
		}
		
		angle *= Math.PI/180;
		
		approachTarget = Math.lineFromXYAtAngle([other.x,other.y],84,angle);
		if (Player.cursorOnNPC) approachTarget = Math.lineFromXYAtAngle([other.x,other.y],40,-currentAngle);
		if (Player.entity.retreating) approachTarget = Math.lineFromXYAtAngle([other.x,other.y],128,angle);

	}
	else approachTarget = [Player.entity.cursor.x,Player.entity.cursor.y];
	
	Player.entity.approach(approachTarget[0], approachTarget[1], Player.entity.cursor.range);
	
}

//	===============================================
	
//	Actions
//	=======
/*	attack
		Attack the player's current combatant
*/
Player.attack = function(){
		
	var checkPushForward = false;
	if (Player.moveButtonDown || Player.keyboardMovement) checkPushForward = true;
	var other = Player.getCurrentCombatant(true);
	
	if (other) Player.entity.swingAtCharacter(other, checkPushForward);
	
}
/*	getCurrentCombatant
		Figure out who the player's current combatant is, based on avatar and cursor position
*/
Player.getCurrentCombatant = function(forceRayTest){
	var em = Player.entity.manager;
	//	Figure out whose radius the player is in
	var imIn = em.radiusSweepTest(Player.entity);
	//	Now discard the radii that don't belong to hostile characters
	for (var i in imIn){
		if (imIn[i].charType != CHAR_HOSTILE){
			imIn.splice(i,1);
		}
	}

	var other = imIn[0]; // The current combatant. If there isn't one, this will return false.
	if (!forceRayTest) var otherStore = other;
	
	//	If the player actually is in an enemy's radius
	if (imIn.length > 0) {
		//	Figure out who's closest to the cursor
		var distances = [];
		for (var i in imIn){
			var me = imIn[i];
			//	Push both the distance and the Entity's name so we can retrieve it later
			distances.push({distance: Math.distanceXY([me.x,me.y],[CameraTest.cursor.x,CameraTest.cursor.y]), name: me.name} );
		}
		//	Sort them so the enemy closest to the cursor is first
		distances.sort(function(a, b){
			return a.distance - b.distance;
		});
		//	Test each enemy until we find the closest enemy that the player can actually touch
		while (1){
			other = em.get(distances[0].name);
			if(em.rayCastTest(Player.entity, other)) break;
			else {
				distances.splice(0,1);
				other = false;
				if (!distances.length) break;
			}
		}
	}
	if (!forceRayTest && !other) other = otherStore;
	
	return other;
	
}
