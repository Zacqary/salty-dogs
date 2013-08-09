/* 
	================================================
	======================AI========================
	================================================
	
	Includes:
	- AI
	- AI.CombatBehavior
	
*/
/*	AI Interface
		Container for various AI behaviors
*/
var AI = { };

/*	CombatBehavior
		AI routine for when a character is in combat
*/
AI.CombatBehavior = function(me){
	var stats = { };
	var attack = function(){
		me.swingAtCharacter(stats.enemy);
		var delay = randomNumber(10,50)/100;
		stats.delay.set(delay);
	}
	var getCurrentCombatant = function(){
		var em = me.manager;
		//	Figure out whose radius the character is in
		var imIn = em.sweepTestRadius(me);
		//	Now discard the radii that don't belong to enemy characters
		var candidates = [];
		for (var i in imIn){
			if ( (imIn[i].entType == ENT_CHARACTER) && (imIn[i].charType != me.charType) && (imIn[i].charType != CHAR_NEUTRAL) ){
				candidates.push(imIn[i])
			}
		}
		return candidates[0];
	}
	
	this.run = function(){
		//	Only run the behavior if the character is in combat
		if (me.inCombat) {
			//	Recreate the stats if character just entered combat, or if the wrong enemy is targeted
			if (!stats || !stats.enemy.inCombat){
				stats = { };
				stats.restartDelta = 0; // How much more %stamina than %focus character needs to start attacking 
				stats.delay = new Countdown(0.5);
				stats.enemy = getCurrentCombatant();
				if (!stats.enemy) {
					me.inCombat = false;
					console.log(me.name+" bug");
					return;
				}
			}
			//	If this character has enough stamina to attack, and enemy isn't currently attacking
			if ( (me.stamina.get() > 1) && (!stats.enemy.timers.hit.get()) ) {
				//	Reset the over-swing tracker
				stats.overSwing = false;
				//	If the character is ready to attack again
				if (!stats.delay.get()) {
					//	If the character is in the middle of an attack chain, keep attacking
					if (me.timers.hit.get()) {
						attack();
					}
					//	Otherwise, determine whether to start the attack chain
					else {
						//	Get the percentages of the character's focus and stamina
						var focusPercent = me.focus.get() / me.focus.getMax();
						var staminaPercent = me.stamina.get() / me.stamina.getMax();
						//	Measure the difference between the two to determine whether to start
						var maxDelta = (focusPercent * 40) + 15;
						if (stats.restartDelta > maxDelta/100) stats.restartDelta = maxDelta/100;
						if ( (focusPercent <= staminaPercent - stats.restartDelta) || (staminaPercent == 1) ){
							stats.restartDelta = 0;
							attack();
						}
					}
				}
			}
			//	If this character doesn't have the stamina or opening to attack
			else {
				//	If the character is out of stamina, 1 in 4 chance that they'll over-swing
				if (!stats.delay.get() && !stats.enemy.timers.hit.get() && !stats.overSwing){
					if (randomNumber(0,4) == 4) {
						attack();
					}
					stats.overSwing = true;
				}
				//	Recalculate the character's restartDelta for when they're able to attack again
				if (!stats.restartDelta) {
					var focusPercent = me.focus.get() / me.focus.getMax();
					var maxDelta = (focusPercent * 40) + 15;

					stats.restartDelta = randomNumber(5,maxDelta)/100;
				}
				//	Randomize the character's reaction time
				stats.delay.set(randomNumber(2,5)/60);
			}
			
		}
		//	If the character is out of combat, reset all of this behavior's stats
		else {
			stats = null;
		}
		
	}
	
} 


AI.PathfindingBehavior = function(me){
	
	this.run = function(){
		if (!me.aiGoals.movement) return;
		if (Math.distanceXY(me.getPosition(),me.aiGoals.movement) < me.speed){
			me.aiGoals.movement = null;
			return;
		}
		
		if (!me.hasWaypoint(me.aiGoals.movement)){
			me.addWaypoint(me.aiGoals.movement, 64);
		}
		
		var distanceToPoint = new Spectrum(64);
		distanceToPoint.set(Math.distanceXY(me.getPosition(),me.getWaypoint()));
		if(me.manager.rayCastTestXY(me, me.getWaypoint(), distanceToPoint.get())){
			if (!correctPath(10)) {
				me.aiGoals.movement = null;
				return;
			}
		}
	/*	if(me.manager.hitboxProjectionTest(me, me.getWaypoint())){
			correctPath();
		}*/
		if(me.collision) {
			if (!correctPath(10, me.collision)) {
				me.aiGoals.movement = null;
				return;
			}
		}

		
	}
	
	
	var correctPath = function(maxIterations, collision){
		var iterations = 0;
		var path = null;
		var angle = Math.angleXY(me.getPosition(), me.getWaypoint());
		while (iterations < maxIterations){
			iterations++;
			console.log(iterations);
			path = pathAround(iterations, 1, angle, collision);
			if (path) break;
		}
		if (path) {
			pushPath(path);
			return true;
		}
		else return false;
	}
	
	
	var pushPath = function(path){
		for (var i in path){
			me.addWaypoint(path[i]);
			PathfindingTest.drawPath.push(path[i]);
		}
	}
	
	var pathAround = function(scope, scale, angle, backAway){
		scope = scope || 1;
		scale = scale || 1;
		var gridSize = 16 * (1*scope);
		var tileSize = 16 / (1*scale);
		
		var targetPoint = Math.lineFromXYAtAngle(me.getPosition(),(gridSize*tileSize)/2,angle);
		
		var gridOrigin = [me.x - (gridSize*tileSize)/2, me.y - (gridSize*tileSize)/2];
		var targetOnGrid = [targetPoint[0] - gridOrigin[0], targetPoint[1] - gridOrigin[1]];
		var targetTile = [Math.round(targetOnGrid[0]/tileSize),Math.round(targetOnGrid[1]/tileSize)];
		
		var matrix = [];
		var width = me.hitbox.width;
		var height = me.hitbox.height;
		var blocks = 0;
		for (var i = 0; i < gridSize; i++){
			var row = [];
			var y = ( (tileSize/2)+(tileSize*i) ) + gridOrigin[1];
			for (var j = 0; j < gridSize; j++){
				var x = ( (tileSize/2)+(tileSize*j) ) + gridOrigin[0];
				if (me.manager.hitboxProjectionTest(me,[x,y])) {
					row.push(1);
				}
				else row.push(0);
			}
			matrix.push(row);
		}

		var grid = new PF.Grid(gridSize,gridSize,matrix);
		var finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true,
			heuristic: PF.Heuristic.euclidean,
		});
		if (targetTile[0] > gridSize - 1) targetTile[0] = gridSize - 1;
		if (targetTile[1] > gridSize - 1) targetTile[1] = gridSize - 1;
			
		var startTile = [(gridSize/2)-1,(gridSize/2)-1];
		if (backAway){
			var negAngle = Math.unitVectorToAngle(backAway);
			if (Math.abs(backAway[0]) == 1){
				if (backAway[0] == -1) negAngle = 0;
				else negAngle = Math.PI;
			}
			var startPoint = Math.lineFromXYAtAngle(me.getPosition(),(gridSize*tileSize)/4, negAngle);
			var startOnGrid =  [startPoint[0] - gridOrigin[0], startPoint[1] - gridOrigin[1]];
			var startTile = [Math.round(startOnGrid[0]/tileSize),Math.round(startOnGrid[1]/tileSize)];
		}
		var path = finder.findPath(startTile[0],startTile[1],targetTile[0],targetTile[1], grid);
		targetTile = null;
		
		me.waypoints = [];
		PathfindingTest.drawPath = [];
		
		if (path.length == 0) return false;
		else {
			if (!backAway) path.splice(0,1);
			var processedPath = [];
			var direction = [0,0];
			for (var i = 0; i < path.length; i++){
				var newDir = [];
				if (i < path.length-1) {
					newDir = [
						(path[i+1][0] - path[i][0]),
						(path[i+1][1] - path[i][1]),
					];
				}

				if (!arraysEqual(newDir,direction)) {
					direction = newDir;
					var point = [];
					point[0] = ( (tileSize/2) + (tileSize*path[i][0]) ) + gridOrigin[0];
					point[1] = ( (tileSize/2) + (tileSize*path[i][1]) ) + gridOrigin[1];
					processedPath.push(point);
				}
			}

			return processedPath;
		}	
	}
}

