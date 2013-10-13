var Player = {
	
	keyboardMovement: 0,
	keyboardReleaseTimer: new Countdown(0,1),
	keyData: [],
	
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
				Player.entity.pushingForward = false;
				var other = Player.getCurrentCombatant();
				if (!other.strafing){
					var currentAngle = Math.angleXY([other.x, other.y],[Player.entity.x, Player.entity.y])*(180/Math.PI);
					var approachTarget = Math.lineFromXYAtAngle([other.x,other.y],64,-currentAngle);
					Player.entity.approach(approachTarget[0], approachTarget[1], 32);
				}
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
		//delta = Player.entity.cursor.range; // Move the cursor all the way to its maximum range
		curPos = Player.entity.getPosition();
		
		var other = Player.getCurrentCombatant();
		var currentAngle = Math.angleXY([other.x, other.y],[Player.entity.x, Player.entity.y])*(180/Math.PI);
		
		
		// 	Cursor Functions
		// 	================
		// Rotate the player clockwise
		function cursorClockwise(curPos){
			if (currentAngle < 91)
				return [curPos[0]+10,curPos[1]];
			else if (currentAngle >= 91 && currentAngle < 270)
				return [curPos[0], curPos[1]-10];
			else if (currentAngle >= 270)
				return [curPos[0]-10, curPos[1]];
		}
		// Rotate the player counterclockwise
		function cursorCounterClockwise(curPos){
			if (currentAngle < 91)
				return [curPos[0]-10,curPos[1]];
			else if (currentAngle >= 91 && currentAngle < 270)
				return [curPos[0], curPos[1]+10];
			else if (currentAngle >= 270)
				return [curPos[0]+10, curPos[1]];
		}
		// Make the player retreat
		function cursorRetreat(currentAngle){
			return Math.lineFromXYAtAngle([other.x,other.y],120,currentAngle*(Math.PI/180));
		}
		//	======================
		
		//	Key functions
		//	=============
		var W = function(curPos){
			//	If the player starts to the left of the enemy
			if ((Player.keyData["W"].currentAngle > 135) && (Player.keyData["W"].currentAngle < 240)){
				//	If the player is near the bottom-left, and also holding D, advance
				if (currentAngle > 210 && Input.keyDown[Input.keyCodes.D]){
					curPos = [other.x,other.y];
				}
				//	If the player is near the top-left, and also holding A, retreat
				if (currentAngle < 180 && Input.keyDown[Input.keyCodes.A]){
					curPos = cursorRetreat(Player.keyData["W"].currentAngle);
				}
				//	Otherwise, rotate clockwise
				else {
					curPos = cursorClockwise(curPos, Player.keyData["W"].currentAngle);
					//	If the player has rotated all the way above the enemy, clear the currentAngle and retreat
					if (currentAngle <= 90){
						Player.keyData["W"].currentAngle = currentAngle;
					}
				}
			}
			//	If the player starts below the enemy
			else if ((Player.keyData["W"].currentAngle >= 240) && (Player.keyData["W"].currentAngle < 300)){
				//	Bottom-right and holding D, counterclockwise
				if (currentAngle >= 270 && Input.keyDown[Input.keyCodes.D]) {
					curPos = cursorCounterClockwise(curPos);
					//	Don't preserve this angle if the player releases the rotation key
					Player.keyData["W"].currentAngle = currentAngle;
				}
				//	Bottom-left and holding A, clockwise
				else if (currentAngle <= 270 && Input.keyDown[Input.keyCodes.A]) {
					curPos = cursorClockwise(curPos);
					Player.keyData["W"].currentAngle = currentAngle;
				}
				//	Otherwise, advance
				else {
					curPos = [other.x,other.y];
					//	Don't preserve this angle if the player presses another key to rotate away
					Player.keyData["W"].noPreserve = true;
				}
			}
			//	If the player starts to the right
			else if ((Player.keyData["W"].currentAngle >= 300) || (Player.keyData["W"].currentAngle < 45)){
				//	Bottom-right and holding A, advance
				if (currentAngle >= 300 && Input.keyDown[Input.keyCodes.A]){
					curPos = [other.x,other.y];
				}
				//	Top-right and holding D, retreat
				else if (currentAngle < 45 && Input.keyDown[Input.keyCodes.D]){
					curPos = cursorRetreat(Player.keyData["W"].currentAngle);
				}
				//	Otherwise, counterclockwise
				else {
					curPos = cursorCounterClockwise(curPos);
					//	Rotated above, retreat
					if (currentAngle >= 90){
						Player.keyData["W"].currentAngle = currentAngle;
					}
				}
			}
			//	If the player starts above the enemy, retreat
			else if((Player.keyData["W"].currentAngle >= 45) && (Player.keyData["W"].currentAngle <= 135)){
				curPos = cursorRetreat(Player.keyData["W"].currentAngle);
				Player.keyData["W"].noPreserve = true;
			}
			
			return curPos;
		}
		
		var A = function(curPos){
			//	Left, retreat
			if ((Player.keyData["A"].currentAngle > 135) && (Player.keyData["A"].currentAngle < 225)){
				curPos = cursorRetreat(Player.keyData["A"].currentAngle);
				Player.keyData["A"].noPreserve = true;
			}
			//	Below
			else if ((Player.keyData["A"].currentAngle >= 225) && (Player.keyData["A"].currentAngle < 330)){
				//	Bottom-right and holding W, advance
				if (currentAngle > 300 && Input.keyDown[Input.keyCodes.W]){
					curPos = [other.x,other.y];
				}
				//	Bottom-left and holding S, retreat
				else if (currentAngle < 270 && Input.keyDown[Input.keyCodes.S]){
					curPos = cursorRetreat(Player.keyData["A"].currentAngle);
				}
				//	Otherwise, clockwise
				else {
					curPos = cursorClockwise(curPos);
					//	Rotated left, retreat
					if (currentAngle <= 180){
						Player.keyData["A"].currentAngle = currentAngle;
					}
				}
			}
			//	Right
			else if ((Player.keyData["A"].currentAngle >= 330) || (Player.keyData["A"].currentAngle < 30)){
				//	Top-right and holding W, counterclockwise
				if (currentAngle < 330 && Input.keyDown[Input.keyCodes.W]){
					curPos = cursorCounterClockwise(curPos);
					Player.keyData["A"].currentAngle = currentAngle;
				}
				//	Bottom-right and holding S, clockwise
				else if (currentAngle >= 315 && Input.keyDown[Input.keyCodes.S]){
					curPos = cursorClockwise(curPos);
					Player.keyData["A"].currentAngle = currentAngle;
				}
				//	Otherwise, advance
				else {
					curPos = [other.x,other.y];
				}
				Player.keyData["A"].noPreserve = true;
			}
			//	Above
			else if((Player.keyData["A"].currentAngle >= 30) && (Player.keyData["A"].currentAngle <= 135)){
				//	Top-right and holding S, advance
				if (currentAngle < 60 && Input.keyDown[Input.keyCodes.S]){
					curPos = [other.x,other.y];
				}
				//	Top-left and holding W, retreat
				if (currentAngle > 90 && Input.keyDown[Input.keyCodes.W]){
					curPos = cursorRetreat(Player.keyData["A"].currentAngle);
				}
				//	Otherwise, counterclockwise
				else {
					curPos = cursorCounterClockwise(curPos);
					//	Rotated left, retreat
					if (currentAngle >= 180){
						Player.keyData["A"].currentAngle = currentAngle;
					}
				}
			}
			
			return curPos;
		}
		
		var S = function(curPos){
			//	Left
			if ((Player.keyData["S"].currentAngle > 120) && (Player.keyData["S"].currentAngle < 225)){
				//	Top-left and holding D, advance
				if ((currentAngle < 135) && Input.keyDown[Input.keyCodes.D]){
					curPos = [other.x,other.y];
				}
				//	Bottom-left and holding A, retreat
				else if ((currentAngle > 180) && Input.keyDown[Input.keyCodes.A]){
					curPos = cursorRetreat(Player.keyData["S"].currentAngle);
				}
				//	Otherwise, counterclockwise
				else {
					curPos = cursorCounterClockwise(curPos);
					//	Rotated below, retreat
					if (currentAngle >= 270){
						Player.keyData["S"].currentAngle = currentAngle;
					}
				}
			}
			//	Below, retreat
			else if ((Player.keyData["S"].currentAngle >= 225) && (Player.keyData["S"].currentAngle < 315)){
				curPos = cursorRetreat(Player.keyData["S"].currentAngle);
				Player.keyData["S"].noPreserve = true;
			}
			//	Right
			else if ((Player.keyData["S"].currentAngle >= 315) || (Player.keyData["S"].currentAngle < 60)){
				//	Top-right and holding A, advance
				if ((currentAngle < 60) && Input.keyDown[Input.keyCodes.A]){
					curPos = [other.x,other.y];
				}
				//	Bottom-right and holding D, retreat
				else if ((currentAngle >= 315) && Input.keyDown[Input.keyCodes.D]){
					curPos = cursorRetreat(Player.keyData["S"].currentAngle);
				}
				//	Otherwise, clockwise
				else {
					curPos = cursorClockwise(curPos);
					//	Rotated below, retreat
					if (currentAngle <= 270){
						Player.keyData["S"].currentAngle = currentAngle;
					}
				}
			}
			//	Above
			else if((Player.keyData["S"].currentAngle >= 60) && (Player.keyData["S"].currentAngle <= 120)){
				//	Top-left and holding A, counterclockwise
				if (currentAngle >= 90 && Input.keyDown[Input.keyCodes.A]){
					curPos = cursorCounterClockwise(curPos);
					Player.keyData["S"].currentAngle = currentAngle;
				}
				//	Top-left and holding D, clockwise
				else if (currentAngle <= 90 && Input.keyDown[Input.keyCodes.D]){
					curPos = cursorClockwise(curPos);
					Player.keyData["S"].currentAngle = currentAngle;
				}
				//	Otherwise, advance
				else {
					curPos = [other.x,other.y];
					Player.keyData["S"].noPreserve = true;
				}
			}
			
			return curPos;
		}
		
		var D = function(curPos){
			//	Left
		 	if ((Player.keyData["D"].currentAngle > 150) && (Player.keyData["D"].currentAngle < 210)){
				//	Top-left and holding W, clockwise
				if (currentAngle <= 180 && Input.keyDown[Input.keyCodes.W]){
					curPos = cursorClockwise(curPos);
					Player.keyData["D"].currentAngle = currentAngle;
				}
				//	Bottom-left and holding S, counterclockwise
				else if (currentAngle >= 180 && Input.keyDown[Input.keyCodes.S]){
					curPos = cursorCounterClockwise(curPos);
					Player.keyData["D"].currentAngle = currentAngle;
				}
				//	Otherwise, advance
				else {
					curPos = [other.x,other.y];
					Player.keyData["D"].noPreserve = true;
				}
			}
			//	Below
			else if ((Player.keyData["D"].currentAngle >= 210) && (Player.keyData["D"].currentAngle < 315)){
				//	Bottom-left and holding W, advance
				if ((currentAngle < 240) && Input.keyDown[Input.keyCodes.W]){
					curPos = [other.x,other.y];
				}
				//	Bottom-right and holding S, retreat
				else if ((currentAngle > 270) && Input.keyDown[Input.keyCodes.S]){
					curPos = cursorRetreat(Player.keyData["D"].currentAngle);
				}
				//	Otherwise, counterclockwise
				else {
					curPos = cursorCounterClockwise(curPos);
					if (currentAngle <= 1){
						Player.keyData["D"].currentAngle = currentAngle;
					}
				}
			}
			//	Right, retreat
			else if ((Player.keyData["D"].currentAngle >= 315) || (Player.keyData["D"].currentAngle < 45)){
				curPos = cursorRetreat(Player.keyData["D"].currentAngle);
				Player.keyData["D"].noPreserve = true;
			}
			//	Above
			else if ((Player.keyData["D"].currentAngle > 45) && (Player.keyData["D"].currentAngle < 150)){
				//	Top-left and holding S, advance
				if ((currentAngle > 90) && Input.keyDown[Input.keyCodes.S]){
					curPos = [other.x,other.y];
				}
				//	Top-right and holding W, retreat
				if ((currentAngle < 90) && Input.keyDown[Input.keyCodes.W]){
					curPos = cursorRetreat(Player.keyData["D"].currentAngle);
				}
				//	Otherwise, clockwise
				else {
					curPos = cursorClockwise(curPos);
					//	Rotated right, retreat
					if (currentAngle >= 359){
						Player.keyData["D"].currentAngle = currentAngle;
					}
				}
			}
			
			return curPos;
		}
		//	======================

		//	Initialize key data
		if (Input.keyDown[Input.keyCodes.W]){
			if (!Player.keyData["W"]){
				Player.keyData["W"] = {
					key: "W",
					currentAngle: currentAngle,
					time: GameState.getTime(),
				}
			}
		}
		
		if (Input.keyDown[Input.keyCodes.A]){
			if (!Player.keyData["A"]){
				Player.keyData["A"] = {
					key: "A",
					currentAngle: currentAngle,
					time: GameState.getTime(),
				}
			}
		}
		
		if (Input.keyDown[Input.keyCodes.D]){
			if (!Player.keyData["D"]){
				Player.keyData["D"] = {
					key: "D",
					currentAngle: currentAngle,
					time: GameState.getTime(),
				}
			}
		}
		if (Input.keyDown[Input.keyCodes.S]){
			if (!Player.keyData["S"]){
				Player.keyData["S"] = {
					key: "S",
					currentAngle: currentAngle,
					time: GameState.getTime(),
				}
			}
		}
		
		//	Determine which was the most recently-pressed key
		var keyTimes = [Player.keyData["W"],Player.keyData["A"],Player.keyData["S"],Player.keyData["D"]];
		//	Sort times in descending order
		keyTimes.sort(function(a,b){
			if (a.time < b.time)
				return 1;
			if (a.time > b.time)
				return -1;
			else return 0;
		});
		//	Most recent key supersedes other keys
		if (keyTimes[0].key == "W") curPos = W(curPos);
		if (keyTimes[0].key == "A") curPos = A(curPos);
		if (keyTimes[0].key == "S") curPos = S(curPos);
		if (keyTimes[0].key == "D") curPos = D(curPos);
		//	Clear the currentAngle for any keys that were being used to retreat or advance
		for (var i = 1; i<4; i++){
			if (keyTimes[i] && keyTimes[i].noPreserve) keyTimes[i].currentAngle = currentAngle;
		}

		
		
	}
	
	else {
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
	var speedOverride = undefined;
	// If the player is in combat...
	if (Player.entity.inCombat) {
		Player.entity.strafing = true;
		// Check to see if the player is moving towards or away their foe
		var other = Player.getCurrentCombatant();
		// Compare the distance between foe/player and foe/cursor
		var currentDistance = Math.distanceXY(Player.entity.getPosition(), other.getPosition());
		var targetDistance = Math.distanceXY(Player.entity.cursor.getPosition(), other.getPosition());
		// If the player is moving more than 30 units away, they're probably intending to retreat
		if ( (currentDistance - targetDistance) < -30) {
			// Slow the player down
			Player.entity.affect("speedMult",Player.entity.turnSpeed/2);
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
				angle = currentAngle - 10;
			}
			else angle = currentAngle + 10;
		}
		else {
			if (diff < 0) {
				angle = currentAngle + 10;
			}
			else angle = currentAngle - 10;
		}
		
		
		angle *= Math.PI/180;
		approachTarget = Math.lineFromXYAtAngle([other.x,other.y],84,angle);
		if (Player.cursorOnNPC) {
			approachTarget = Math.lineFromXYAtAngle([other.x,other.y],40,currentAngle*(Math.PI/180));
			Player.entity.pushingForward = true;
		}
		else {
			Player.entity.pushingForward = false;
		}
		if (Player.entity.retreating) approachTarget = Math.lineFromXYAtAngle([other.x,other.y],96,angle);
		CameraTest.drawCircle = approachTarget;
		speedOverride = Player.entity.turnSpeed;
	}
	//	If the player is not in combat, just approach the cursor
	else {
		Player.entity.strafing = false;
		approachTarget = [Player.entity.cursor.x,Player.entity.cursor.y];
	}
	
	Player.entity.approach(approachTarget[0], approachTarget[1], Player.entity.cursor.range, speedOverride);
	
}

//	===============================================
	
//	Actions
//	=======
/*	attack
		Attack the player's current combatant
*/
Player.attack = function(){
		
	var other = Player.getCurrentCombatant(true);
	
	if (other) Player.entity.swingAtCharacter(other);
	
}
/*	getCurrentCombatant
		Figure out who the player's current combatant is, based on avatar and cursor position
*/
Player.getCurrentCombatant = function(forceRayTest){
	var em = Player.entity.manager;
	//	Figure out whose radius the player is in
	var imIn = em.radiusSweepTest(Player.entity);
	//	Now discard the radii that don't belong to hostile characters
	var candidates = [];
	for (var i in imIn){
		if (imIn[i].charType == CHAR_HOSTILE){
			candidates.push(imIn[i]);
		}
	}

	var other = candidates[0]; // The current combatant. If there isn't one, this will return false.
	if (!forceRayTest) var otherStore = other;
	
	//	If the player actually is in an enemy's radius
	if (candidates.length > 0) {
		//	Figure out who's closest to the cursor
		var distances = [];
		for (var i in candidates){
			var me = candidates[i];
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
			if(em.rayCastTestAB(Player.entity, other)) break;
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
