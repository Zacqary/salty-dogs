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
	var strategy = { };
	var attack = function(){
		me.swingAtCharacter(stats.enemy);
		var delay = randomNumber(10,50)/100;
		stats.delay.set(delay);
	}
	var getCurrentCombatant = function(){
		//	Figure out whose radius the character is in
		var imIn = me.manager.sweepTestRadius(me);
		//	Now discard the radii that don't belong to enemy characters
		var candidates = [];
		for (var i in imIn){
			if ( (imIn[i].entType == ENT_CHARACTER) && (imIn[i].charType != me.charType) && (imIn[i].charType != CHAR_NEUTRAL) ){
				candidates.push(imIn[i])
			}
		}
		return candidates[0];
	}
	var getSituation = function(){
		//	Get the angle between this character and the enemy
		var combatAngle = Math.angleXY(me.getPosition(), stats.enemy.getPosition());
		var endPoint = Math.lineFromXYAtAngle(me.getPosition(), 144, combatAngle - Math.PI);
		stats.backToWall = me.manager.rayCastTestXY(me, endPoint);
		if (stats.backToWall){
			strategy.angle = combatAngle - (Math.PI/2);
		}
		
	}
	
	var attackStrategies = {
		
		standard: function(){
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
		},
		
	};
	
	var strafeOpponent = function(targetAngle){
		var angle = null;
		targetAngle *= 180/Math.PI;
		var currentAngle = Math.angleXY([stats.enemy.x, stats.enemy.y],[me.x, me.y])*(180/Math.PI);
		var diff = (targetAngle - currentAngle);
		if (!me.combat.attacker) me.affect("turnSpeed",me.turnSpeed/6);
		if (Math.abs(diff) < 120){
			if (diff < 0) {
				angle = currentAngle - me.turnSpeed;
			}
			else angle = currentAngle + me.turnSpeed;
		}
		else {
			if (diff < 0) {
				angle = currentAngle + me.turnSpeed;
			}
			else angle = currentAngle - me.turnSpeed;
		}
		angle *= Math.PI/180;
		approachTarget = Math.lineFromXYAtAngle([stats.enemy.x,stats.enemy.y],84,angle);
		me.approach(approachTarget[0], approachTarget[1], 32);
		CameraTest.rayCastPoints = [me.getPosition(), approachTarget];
		me.strafing = true;
		return angle;
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
				
				strategy = { };
			}
			me.strafing = false;
			getSituation();
			
			if (strategy.angle) {
				var newAngle = strafeOpponent(strategy.angle);
				if (Math.abs(newAngle - strategy.angle) < 1) strategy.angle = null;
			}
			attackStrategies.standard();
		
		}
		//	If the character is out of combat, reset all of this behavior's stats
		else {
			stats = null;
			strategy = null;
			me.strafing = false;
		}
		
	}
	
} 


AI.PathfindingBehavior = function(me){
	
	var collisionTimer = new Countdown(0.2);
	
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
			if (!correctPath(4)) {
				me.waypoints = [];
				me.aiGoals.movement = null;
				return;
			}
		}
	/*	if(me.manager.hitboxProjectionTest(me, me.getWaypoint())){
			correctPath();
		}*/
		else if(me.collision) {
			if (!collisionTimer.get()){
				collisionTimer.maxOut();
				if (!correctPath(4, me.collision)) {
					me.waypoints = [];
					me.aiGoals.movement = null;
					return;
				}
			}
		}

		
	}
	
	/*	correctPath
			Attempt to correct this Character's path
	*/
	var correctPath = function(maxIterations, collision){
		var iterations = 0;
		var path = null;
		//	Find the angle from the character to the waypoint.
		//	Doing this inside pathAround() caused it to return NaN on second iteration.
		var angle = Math.angleXY(me.getPosition(), me.getWaypoint());
		
		while (iterations < maxIterations){
			iterations++;
			path = pathAround(iterations, 1, angle, collision);
			if (path) break;
		}
		if (path) {
			pushPath(path);
			return true;
		}
		else return false;
	}
	
	/*	pushPath
			Push a new path into this Character's waypoints
	*/
	var pushPath = function(path){
		me.waypoints = [];
		PathfindingTest.drawPath = [];
		for (var i in path){
			me.addWaypoint(path[i]);
			PathfindingTest.drawPath.push(path[i]);
		}
	}
	
	/*	pathAround
			Try to find a path around nearby obstacles
	*/
	var pathAround = function(scope, scale, angle, backAway){
		//	Compute the size of the grid, and the precision of its tiles in world units
		scope = scope || 1;
		scale = scale || 1;
		var gridSize = 16 * (1*scope);
		var tileSize = 16 / (1*scale);
		
		//	Figure out the grid's origin in world coordinates
		var gridOrigin = [me.x - (gridSize*tileSize)/2, me.y - (gridSize*tileSize)/2];
		
		//	Find a point in the world that's probably behind the obstruction
		var targetPoint = Math.lineFromXYAtAngle(me.getPosition(),(gridSize*tileSize)/2,angle);
		//	Now, convert the target point to a tile on the grid
		var targetOnGrid = [targetPoint[0] - gridOrigin[0], targetPoint[1] - gridOrigin[1]];
		var targetTile = [Math.round(targetOnGrid[0]/tileSize),Math.round(targetOnGrid[1]/tileSize)];
		//	Make sure the target tile is within the bounds of the grid
		if (targetTile[0] > gridSize - 1) targetTile[0] = gridSize - 1;
		if (targetTile[1] > gridSize - 1) targetTile[1] = gridSize - 1;
		
		//	Now figure out the starting tile...
		//	Normally, this is the center of the grid, where the character is standing
		var startTile = [(gridSize/2)-1,(gridSize/2)-1];
		//	But if we're resolving a collision, the starting tile is where the character must back up to
		if (backAway){
			//	If the collision was vertical, find the back-up angle from the collision normal
			var negAngle = Math.unitVectorToAngle(backAway);
			//	If the collision was horizontal, resolve the angle manually
			if (Math.abs(Math.round(backAway[0])) == 1){
				negAngle = Math.unitVectorToAngle([-backAway[1],-backAway[0]]);
				negAngle -= Math.PI/2;
			}
			console.log(negAngle * 180/Math.PI);
			//	Find the point to back up to
			var startPoint = Math.lineFromXYAtAngle(me.getPosition(),64, negAngle);
			//	Then convert this point to a tile
			var startOnGrid =  [startPoint[0] - gridOrigin[0], startPoint[1] - gridOrigin[1]];
			var startTile = [Math.round(startOnGrid[0]/tileSize),Math.round(startOnGrid[1]/tileSize)];
		}
		
		//	Create a matrix to figure out which grid tiles correspond to obstructed parts of the world
		var matrix = [];
		var width = me.hitbox.width;
		var height = me.hitbox.height;
		var blocks = 0;
		//	For every row...
		for (var i = 0; i < gridSize; i++){
			var row = [];
			//	Find the y coordinate in the world that this row corresponds to
			var y = ( (tileSize/2)+(tileSize*i) ) + gridOrigin[1];
			//	For every cell of this row...
			for (var j = 0; j < gridSize; j++){
				//	Find the x coordinate in the world that this column corresponds to
				var x = ( (tileSize/2)+(tileSize*j) ) + gridOrigin[0];
				//	Project this character's hitbox onto the x and y coordinates to see
				//	if it would fit in the space. If not, mark the cell as obstructed.
				if (me.manager.hitboxProjectionTest(me,[x,y])) {
					row.push(1);
				}
				else row.push(0);
			}
			matrix.push(row);
		}
	
		
		//	Run the pathfinding routine on the grid that was just generated
		var grid = new PF.Grid(gridSize,gridSize,matrix);
		var finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true,
			heuristic: PF.Heuristic.euclidean,
		});
		var path = finder.findPath(startTile[0],startTile[1],targetTile[0],targetTile[1], grid);
		
		if (path.length == 0) return false;
		else {
			//	If the character isn't backing up to anywhere, we don't need the first tile of the path
			if (!backAway) path.splice(0,1);
			//	Process this path by converting it to waypoints, and eliminating redundant ones
			var processedPath = [];
			//	Keep track of the direction that the path is moving in
			var direction = [0,0];
			//	For every tile...
			for (var i = 0; i < path.length; i++){
				var newDir = [];
				//	If this isn't the last tile, measure the difference between this tile and the next one
				if (i < path.length-1) {
					newDir = [
						(path[i+1][0] - path[i][0]),
						(path[i+1][1] - path[i][1]),
					];
				}
				//	If the direction has changed, don't ignore this tile
				if (!arraysEqual(newDir,direction)) {
					direction = newDir;
					var point = [];
					//	Convert the tile to world coordinates
					point[0] = ( (tileSize/2) + (tileSize*path[i][0]) ) + gridOrigin[0];
					point[1] = ( (tileSize/2) + (tileSize*path[i][1]) ) + gridOrigin[1];
					processedPath.push(point);
				}
			}

			return processedPath;
		}	
	}
}

