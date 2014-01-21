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
			//	If there's a previous attacker, and it's not this character
			var lastAttacker = stats.enemy.combat.lastAttacker;
			if (lastAttacker && lastAttacker != me) {
				//	Check if the previous attacker is currently attacking
				var lastAttackerTimer = lastAttacker.timers.hit.get();
			}
			//	If neither the enemy isn't attacking, nor is another character attacking them
			if ( !stats.enemy.timers.hit.get() && !lastAttackerTimer ) {
				//	If this character has enough stamina to attack
				if (me.stamina.get() > 1) {
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
					if (!stats.delay.get() && !stats.overSwing){
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
		approachTarget = Math.lineFromXYAtAngle([stats.enemy.x,stats.enemy.y],64,angle);
		me.approach(approachTarget[0], approachTarget[1], 32, me.turnSpeed);
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
			
			var heading = Math.angleXY([me.x, me.y],[stats.enemy.x,stats.enemy.y])*(180/Math.PI);
			me.affectHeading(heading);
		
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
	
	this.run = function(){
		//	Only run this behavior if the character has a movement goal
		if (!me.aiGoals.movement) return;
		//	If the movement goal is closer than the character's "speed" value,
		//	consider the goal achieved
		if (Math.distanceXY(me.getPosition(),me.aiGoals.movement) < me.speed){
			me.aiGoals.movement = null;
			return;
		}
		
		//	If this character's movement goal is not a waypoint, add it
		if (!me.hasWaypoint(me.aiGoals.movement)){
			me.addWaypoint({x: me.aiGoals.movement[0], y: me.aiGoals.movement[1], range: 64});
		}
		
		//	Check for obstacles between the character and their waypoint
		//	but only within 64 pixels of the character's current position
		var distanceToPoint = Math.distanceXY(me.getPosition(),me.getWaypoint());
		var distanceThreshold = new Spectrum(64);
		distanceThreshold.set(distanceToPoint);
		if(me.manager.rayCastTestXY(me, me.getWaypoint(), distanceThreshold.get())){
			//	Try to correct the path for 4 iterations
			if (!correctPath(4)) {
				//	If that doesn't work, the character's probably not
				//	going to reach their goal, so get rid of it
				me.waypoints = [];
				me.aiGoals.movement = null;
				return;
			}
		}
		else {
			if (!me.aiData.disablePathfindingGrid) {
				//	If the character has no line of sight to the next waypoint
				if (me.manager.rayCastTestXY(me, me.getWaypoint(),distanceToPoint)) {
					//	Use the pathfinding grid, if this character has one
					if (me.pathfindingGrid) {
						var path = pathTo(me.getWaypoint());
						if (path) {
							pushPath(path);
						}
					}
				}
			}
		}

		/*
		// If there's an obstacle blocking the character's waypoint, path around it
		if(me.manager.hitboxProjectionTest(me, me.getWaypoint())){
				This function was buggy. I'm not sure why it was here in the first place
				but I'll keep it commented out just in case I figure it out again.
			correctPath();
		}
		*/
		if(me.collision) {
			//	Only check collisions every 0.2 seconds
			//	Otherwise this will be recalculating too much
			if (!collisionTimer.get()){
				//	Reset collisionTimer
				collisionTimer.maxOut();
				//	Try to correct the path for 4 iterations
				if (!correctPath(4, me.collision)) {
					//	If that doesn't work, the character's probably not
					//	going to reach their goal, so get rid of it
					me.waypoints = [];
					me.aiGoals.movement = null;
					return;
				}
			}
		}
	}
	
	//	collisionTimer -- Check for collisions every 0.2 seconds
	var collisionTimer = new Countdown(0.2);
	
	
	//	collsionTimer -- Every 0.2 seconds, check if the character is stuck
	var stuckTimer = new Countdown(0.2, function() {
		//	Reset stuckTimer
		stuckTimer.maxOut();
		//	Convert the character's position to single pixels
		//	Otherwise tiny movements from friction will give us a false negative on being stuck
		var pos = me.getPosition();
		for (var i in pos){
			pos[i] = Math.floor(pos[i]);
		}
		//	Check if the character is in the same spot they were 0.2 seconds ago
		if (!_.isEqual(pos,stuckPos)){
			//	If not, update stuckPos
			stuckPos = pos;
		}
		else {
			//	Otherwise, attempt to unstick the character
			//console.log("Stuck "+pos);
			//	Clear the waypoints
			me.waypoints = [];
			//	Go off in a random direction
			var dir = _.random(0,360)*(Math.PI/180);
			var location = Math.lineFromXYAtAngle(me.getPosition(),16,dir);
			me.addWaypoint({x: location[0], y: location[1]});
		}
	});
	var stuckPos = null;
	
			}
			}
			else {
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
		for (var i in path){
			me.addWaypoint({x: path[i][0], y: path[i][1], pathfinding: true});
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
			//	Optimize the path to remove redundant tiles
			path = optimizePath(path);
			//	For every tile...
			for (var i = 0; i < path.length; i++){
				var point = [];
				//	Convert the tile to world coordinates 
				point[0] = ( (tileSize/2) + (tileSize*path[i][0]) ) + gridOrigin[0];
				point[1] = ( (tileSize/2) + (tileSize*path[i][1]) ) + gridOrigin[1];
				processedPath.push(point);
			}
			
			delete grid;
			delete finder;
			return processedPath;
		}	
	}
	
	var pathTo = function(target){
		
		//	Convert the target point to a tile on the grid
		var targetOnGrid = [target[0] - me.pathfindingGrid.origin[0], target[1] - me.pathfindingGrid.origin[1]];
		var targetTile = [Math.round(targetOnGrid[0]/me.pathfindingGrid.tileSize),Math.round(targetOnGrid[1]/me.pathfindingGrid.tileSize)];
		//	Make sure the target tile is within the bounds of the grid
		if (targetTile[0] > me.pathfindingGrid.width - 1) targetTile[0] = me.pathfindingGrid.width - 1;
		if (targetTile[1] > me.pathfindingGrid.height - 1) targetTile[1] = me.pathfindingGrid.height - 1;
		
		//	Convert the character's position to a tile on the grid
		var startOnGrid = [me.x - me.pathfindingGrid.origin[0], me.y - me.pathfindingGrid.origin[1]];
		var startTile = [Math.round(startOnGrid[0]/me.pathfindingGrid.tileSize),Math.round(startOnGrid[1]/me.pathfindingGrid.tileSize)];
		//	Make sure the start tile is within the bounds of the grid
		if (startTile[0] > me.pathfindingGrid.width - 1) startTile[0] = me.pathfindingGrid.width - 1;
		if (startTile[1] > me.pathfindingGrid.height - 1) startTile[1] = me.pathfindingGrid.height - 1;
		
		var finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true,
			heuristic: PF.Heuristic.euclidean,
		});
		var grid = new PF.Grid(me.pathfindingGrid.width, me.pathfindingGrid.height, me.pathfindingGrid.matrix);
		var path = finder.findPath(startTile[0],startTile[1],targetTile[0],targetTile[1], grid);
		
		if (path.length == 0) return false;
		
		else {
			path.splice(0,1);
			//	Process this path by converting it to waypoints, and eliminating redundant ones
			var processedPath = [];
			//	Keep track of the direction that the path is moving in
			var direction = [0,0];
			//	Optimize the path to remove redundant tiles
			path = optimizePath(path);
			//	For every tile...
			for (var i = 0; i < path.length; i++){
				var point = [];
				//	Convert the tile to world coordinates 
				point[0] = ( (me.pathfindingGrid.tileSize/2) + (me.pathfindingGrid.tileSize*path[i][0]) ) + me.pathfindingGrid.origin[0];
				point[1] = ( (me.pathfindingGrid.tileSize/2) + (me.pathfindingGrid.tileSize*path[i][1]) ) + me.pathfindingGrid.origin[1];
				processedPath.push(point);
			}
			
			delete grid;
			delete finder;
			return processedPath;
		}
	}
	
	var optimizePath = function(path, iteration){
		var p = [];
		//	Calculate the direction of each tile on the path
		var directions = [];
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
			//	Record the direction
			directions.push(newDir);
		}
		//	Add the starting tile
		p.push(path[0]);
		//	If this is the first iteration, remove redundant horizontal or vertical lines
		if (!iteration) {
			//	Now take a look at the direction of each tile to see whether it should be added
			for (var i in directions){
				if (i > 0) {
					//	Check if this tile is moving in the same direction as the previous one
					var me = directions[i];
					var prev = directions[i-1];
					if (!_.isEqual(me,prev)) {
						//	If not, add it
						p.push(path[i]);
					}
				}
			}
		}
		//	If this is another iteration, remove redundant diagonal lines by detecting patterns
		else {
			//	Detect the start of a repeating pattern
			var patternStart = directions[0];
			//	Look at the direction of each tile
			for (var i in directions){
				var reset = false;
				if (i > 0) {
					//	Skip any tile with a direction greater than 1; these are probably already optimized
					if (Math.abs(directions[i][0]) <= 1 && Math.abs(directions[i][1]) <= 1) {
						var me = directions[i];
						//	If this is the start of a new pattern, record it
						if (!patternStart) patternStart = me;
						//	If this tile's direction is not the same as the start of the pattern
						else if (!_.isEqual(me,patternStart)){
							//	Check back iteration+1 tiles
							var prev = directions[i-(iteration+1)];
							//	If this tile's direction isn't the same, the pattern is probably over
							if (!_.isEqual(me,prev)){
								reset = true;
							}
						}
					}
					else reset = true;
					//	If there's no more repeating pattern
					if (reset) {
						patternStart = null;
						p.push(path[i]);
					}
				}
			}
		}
		//	Add the ending tile
		p.push(path[path.length-1]);
		
		if (!iteration) p = optimizePath(p,1);
		
		return p;
	}
	
}

/*	ChaseBehavior
		Have the character chase a moving target
*/
AI.ChaseBehavior = function(me){
	//	Track the target once every 0.3 seconds
	var updateTimer = new Countdown(0.3);
	
	this.run = function(){
		if (!me.aiGoals.follow) return;
		if (me.inCombat) return;
		
		//	Recalculate the target's position if it's not a movement goal, or
		//	whenever updateTimer runs out
		if(!me.aiGoals.movement || !updateTimer.get()){
			//	If the target has moved since the last check
			if (me.aiGoals.movement != [me.aiGoals.follow.x, me.aiGoals.follow.y]) {
				//	Check if the character has line of sight to the target
				var distance = Math.distanceXY(me.getPosition(),me.aiGoals.follow.getPosition());
				var noLineOfSight = me.manager.rayCastTestXY(me, me.aiGoals.follow.getPosition(),distance);
				if (noLineOfSight){
					if (noLineOfSight.shape == me.aiGoals.follow.hitbox.shapes[0]){
						noLineOfSight = false;
						me.aiData.disablePathfindingGrid = true;
					}
					else me.aiData.disablePathfindingGrid = false;
				}
				else {
					me.aiData.disablePathfindingGrid = true;
				}
				//	Clear this character's waypoints, unless they're pathfinding around an object
				//	Override pathfinding if the character has line of sight to the target
				if ( !noLineOfSight || me.waypoints.length < 2 || !me.waypoints[1].pathfinding ){
					//	Don't clear the waypoints until the update phase, otherwise the character
					//	will be without waypoints for a frame and "flicker" to the default direction
					me.addUpdateFunction(function() { 
						me.waypoints = [];
						//	Set the movement goal to the target's position
						me.setMovementAIGoal(me.aiGoals.follow.x, me.aiGoals.follow.y);
					});
				}
			}
			//	Reset the updateTimer
			updateTimer.maxOut();
		}
	}
	
}