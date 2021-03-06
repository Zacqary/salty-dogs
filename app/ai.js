/* 
	================================================
	======================AI========================
	================================================
	
	Includes:
	- AI
	- AI.GOAL_TIER
	- AI.Behaviors
	
*/
/*	AI Interface
		Container for various AI behaviors
*/
var AI = { };

//	AI_GOAL_TIERS
AI.GOAL_TIERS = {
	0: ["movement"],
	1: ["rally"],
	2: ["follow"],
}


AI.groups = [];

AI.clearGroups = function(characters){
	AI.groups = [];
	for (var i in characters){
		characters[i].aiGroups = { }
	}
}

AI.assignGroups = function(characters){
	
	var addToGroup = function(character, goal, type){
		var added = false;
		for (var i in AI.groups){
			if (AI.groups[i].value) {
				if (_.isEqual(goal, AI.groups[i].value) && character.charType == AI.groups[i].faction) {
					AI.groups[i].members[character.name] = character;
					character.aiGroups[type] = AI.groups[i];
					added = true;
					break;
				}
			}
		}
		if (!added){
			var group = {
				value: goal,
				faction: character.charType,
				members: [],
				type: type,
			}
			group.members[character.name] = character;
			group.index = AI.groups.length;
			AI.groups.push(group);
			character.aiGroups[type] = group;
		}
	}
	

	for (var i in AI.GOAL_TIERS){
		for (var j in AI.GOAL_TIERS[i]){
			var goal = AI.GOAL_TIERS[i][j];
			for (var k in characters){
				if (characters[k].aiGoals[goal]){
					addToGroup(characters[k], characters[k].aiGoals[goal], goal);
				}
			}
		}
	}
	

}

AI.groupedTogether = function(a, b){
	if (!a.aiGroups) return false;
	if (!b.aiGroups) return false;
	for (var i in a.aiGroups){
		if (a.aiGroups[i] == b.aiGroups[i]) return true; 
	}
	return false;
}

AI.Behaviors = { };
/*	Behaviors.Combat
		AI routine for when a character is in combat
*/
AI.Behaviors.Combat = function(me){
	var stats = { };
	var strategy = { };
	if (!me.aiSkill) me.aiSkill = 20;
	
	var attack = function(overswing){
		if (me.stamina.get() > 1 || overswing) me.swingAtCharacter(stats.enemy);
		
		var delayMin = HIT_CLOCK_GREEN_ZONE*100 - (HIT_CLOCK_GREEN_ZONE*100 - me.aiSkill);
		var delayMax = HIT_CLOCK_GREEN_ZONE*100 + (HIT_CLOCK_GREEN_ZONE*100 - me.aiSkill)/3;
		
		var delay = _.random(delayMin,delayMax)/100;
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
		var endPoint = Math.lineFromXYAtAngle(me.getPosition(), 144, combatAngle.getRadians() - Math.PI);
		stats.backToWall = me.manager.rayCastTestXY(me, endPoint);
		if (stats.backToWall){
			strategy.angle = combatAngle.rotated(180);
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
					if (stats.delay.get() < 0.1 && !stats.overSwing){
						var swingChance = Math.floor(me.aiSkill/5) + 1;
						if (_.random(0,swingChance) == 0) {
							console.log("overswing");
							attack(true);
							
							//	Randomize the time the character will take to over-swing again
							stats.delay.set(_.random(20,30)/100);
						}
						else stats.overSwing = true;
					}
					else {
						//	Randomize the character's reaction time
						stats.delay.set(_.random(2,5)/60);
					}
					//	Recalculate the character's restartDelta for when they're able to attack again
					if (!stats.restartDelta) {
						var focusPercent = me.focus.get() / me.focus.getMax();
						var maxDelta = (focusPercent * 40) + 15;

						stats.restartDelta = _.random(5,maxDelta)/100;
					}
				}
			}
		},
		
	};
	
	var strafeOpponent = function(targetAngle){
		var angle = new Angle();
		var currentAngle = Math.angleXY([stats.enemy.x, stats.enemy.y],[me.x, me.y]);
		var diff = (targetAngle.get() - currentAngle.get());
		if (!me.combat.attacker) me.affect("turnSpeed",me.turnSpeed/6);
		if (Math.abs(diff) < 120){
			if (diff < 0) {
				angle.set(currentAngle.get() - 10);
			}
			else angle.set(currentAngle.get() + 10);
		}
		else {
			if (diff < 0) {
				angle.set(currentAngle.get() + 10);
			}
			else angle.set(currentAngle.get() - 10);
		}
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
				if (stats) { if(stats.delay) stats.delay.delete(); }
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
				if (Math.abs(newAngle.get() - strategy.angle.get()) < 1) strategy.angle = null;
			}
			attackStrategies.standard();
			
			var heading = Math.angleXY([me.x, me.y],[stats.enemy.x,stats.enemy.y]);
			me.affectHeading(heading);
		
		}
		//	If the character is out of combat, reset all of this behavior's stats
		else {
			if (stats) { if(stats.delay) stats.delay.delete(); }
			stats = null;
			strategy = null;
			me.strafing = false;
		}
		
	}
	
} 

AI.Behaviors.Pathfinding = function(me){
	
	this.run = function(){
		
		if(me.inCombat) return;
		
		//	Only run this behavior if the character has a movement goal
		if (!me.aiGoals.movement) {
			if(me.waypoints[0] && me.waypoints[0].pathfinding) me.aiGoals.movement = [me.waypoints[0].x, me.waypoints[0].y];
			else return;
		}
		if (stallTimer.get()) return;
		//	If the movement goal is closer than the character's "speed" value,
		//	consider the goal achieved
		if (Math.distanceXY(me.getPosition(),me.aiGoals.movement) < me.speed){
			me.aiGoals.movement = null;
			return;
		}
		
		//	If this character's movement goal is not a waypoint, add it
		if (!me.hasWaypoint(me.aiGoals.movement)){
			var index = me.waypoints.length - 1;
			if (index < 0) index = 0;
			me.overwriteWaypoint(index, {x: me.aiGoals.movement[0], y: me.aiGoals.movement[1], range: 64});
		}
		
		//	Check for obstacles between the character and their waypoint
		//	but only within 64 pixels of the character's current position
		var distanceToPoint = Math.distanceXY(me.getPosition(),me.getWaypoint());
		var distanceThreshold = new Spectrum(64);
		distanceThreshold.set(distanceToPoint);
		
		var excludes = [];
		if (me.aiGroups.follow) {
			excludes = me.aiGroups.follow.members;
			excludes.push(me.aiGoals.follow);
		}
		else if (me.aiGroups.rally) excludes = me.aiGroups.rally.members;
		
		var test = me.manager.rayCastTestXY(me, me.getWaypoint(), distanceThreshold.get(),false, excludes);
		if (test){
			
			//	Try to correct the path for 4 iterations
			if (!correctPath(4)) {
				//	If that doesn't work, stall the character
				//	to see if the situation clears up
				me.waypoints = [];
				stallTimer.maxOut();
				//me.aiGoals.movement = null;
				return;
			}
		}
		else {
			//	Only do this if the pathfinding grid's enabled, unless fixing a bounce
			if (!me.aiData.disablePathfindingGrid || bounceFlag) {
				//	If the character has no line of sight to the next waypoint
				var test = me.manager.rayCastTestXY(me, me.getWaypoint(),distanceToPoint,true,excludes);
				if (test) {

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
			//	Ignore collisions with members of the same AI group
			if (!AI.groupedTogether(me, me.collision.body.entity)){
				//	Only check collisions every 0.2 seconds
				//	Otherwise this will be recalculating too much
				if (!collisionTimer.get()){
					bounces.push(me.collision);
					//	Reset collisionTimer
					collisionTimer.maxOut();
					//	Try to correct the path for 4 iterations
					if (!correctPath(4, me.collision.normal)) {
						//	If that doesn't work, stall the character
						//	to see if the situation clears up
						me.waypoints = [];
						stallTimer.maxOut();
						return;
					}
				}
			}
		}
	}
	
	//	collisionTimer -- Check for collisions every 0.2 seconds
	var collisionTimer = new Countdown(0.2);
	
	//	stallTimer -- Activate this to stall a character for half a second if their path is blocked
	var stallTimer = new Countdown(0,0,0.5);
	
	//	stuckTimer -- Every 0.2 seconds, check if the character is stuck
	var stuckTimer = new Countdown(0.2, function() {
		//	Reset stuckTimer
		stuckTimer.maxOut();
		if (!me.aiGoals.movement) return; // Only unstick the character if they're trying to move
		
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
			var dir = new Angle(_.random(0,360));
			var location = Math.lineFromXYAtAngle(me.getPosition(),16,dir);
			me.addWaypoint({x: location[0], y: location[1]});
		}
	});
	var stuckPos = null;
	
	/*	bounceStuckTimer
			Check if the character is stuck bouncing between two walls
			This is done by keeping track of what a character is bouncing off
			of to see if there are multiple bounces in a short period of time 
	*/
	var bounces = [];
	var resetBounces = 0;
	var bounceFlag = false;
	var bounceStuckTimer = new Countdown(0.05, function(){
		//	Only reset the timer if there are bounces to track
		if (bounces.length) {
			bounceStuckTimer.maxOut();
		}
		else {
			me.aiData.bounceFlag = false;
			return;
		}
		//	If a bounce hasn't been detected yet
		if (!bounceFlag){
			//	If there's more than one bounce
			if (bounces.length > 1){
				//	If there are two bounces
				if (bounces.length < 3) {
					//	If both those bounces are off of the same object
					if (bounces[bounces.length-1].body == bounces[bounces.length-2].body) {
						//	Flag the bounce, and reset the counter
						bounceFlag = true;
						resetBounces = 0;
					}
				}
				else {
					//	If the most recent bounce is off the same object as two bounces ago
					//	(For example, bounce from wall A, to wall B, to wall A)
					if (bounces[bounces.length-1].body == bounces[bounces.length-3].body) {
						bounceFlag = true;
						resetBounces = 0;
					}
				}
			}
			//	If the timer has gone on for 1.2 seconds without detecting a bounce, reset everything
			if (resetBounces == 24) {
				bounceFlag = false;
				bounces = [];
				resetBounces = 0;
			}
			else {
				resetBounces++;
			}
		}
		//	If a bounce has been detected, give it 0.5 seconds to resolve
		//	through pathfinding
		else if (resetBounces == 10){
			bounceFlag = false;
			bounces = [];
			resetBounces = 0;
		}
		else {
			resetBounces++;
		}
		//	Expose the bounceFlag to other behaviors
		me.aiData.bounceFlag = bounceFlag;
	});
	
	/*	correctPath
			Attempt to correct this Character's path
	*/
	var correctPath = function(maxIterations, collision){
		var path = null;
		//	Find the angle from the character to the waypoint.
		//	Doing this inside pathAround() caused it to return NaN on second iteration.
		var angle = Math.angleXY(me.getPosition(), me.getWaypoint());
		
		for (var i = 0; i < maxIterations; i++){
			path = pathAround(i, 1, angle, collision);
			if (path) break;
		}
		if (path) {
			pushPath(path);
			return true;
		}
		else if (me.pathfindingGrid){
			path = pathTo(me.getWaypoint());
			if (path) {
				pushPath(path);
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
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
		var gridSize = 32 * (1 * ( 1 + (scope-1)/2 ) );
		var precision = 8 / (1 * scale);
		
		//	Figure out the grid's origin in world coordinates
		var gridOrigin = [me.x - (gridSize*precision)/2, me.y - (gridSize*precision)/2];
		
		//	Find a point in the world that's probably behind the obstruction
		var targetPoint = Math.lineFromXYAtAngle(me.getPosition(),(gridSize*precision)/2,angle);
		//	Now, convert the target point to a tile on the grid
		var targetOnGrid = [targetPoint[0] - gridOrigin[0], targetPoint[1] - gridOrigin[1]];
		var targetTile = [Math.round(targetOnGrid[0]/precision),Math.round(targetOnGrid[1]/precision)];
		//	Make sure the target tile is within the bounds of the grid
		if (targetTile[0] > gridSize - 1) targetTile[0] = gridSize - 1;
		if (targetTile[1] > gridSize - 1) targetTile[1] = gridSize - 1;
		if (targetTile[0] < 0) targetTile[0] = 0;
		if (targetTile[1] < 0) targetTile[1] = 0;
		
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
				negAngle.rotate(180);
			}
			//	Find the point to back up to
			var startPoint = Math.lineFromXYAtAngle(me.getPosition(),64, negAngle);
			//	Then convert this point to a tile
			var startOnGrid =  [startPoint[0] - gridOrigin[0], startPoint[1] - gridOrigin[1]];
			var startTile = [Math.round(startOnGrid[0]/precision),Math.round(startOnGrid[1]/precision)];
			//	Make sure the start tile is within the bounds of the grid
			if (startTile[0] > gridSize - 1) startTile[0] = gridSize - 1;
			if (startTile[1] > gridSize - 1) startTile[1] = gridSize - 1;
			if (startTile[0] < 0) startTile[0] = 0;
			if (startTile[1] < 0) startTile[1] = 0;
			
		}
		
		//	Create a matrix to figure out which grid tiles correspond to obstructed parts of the world
		var matrix = Pathing.createMatrix({
			origin: gridOrigin,
			precision: precision,
			width: gridSize,
			height: gridSize,
			entity: me,
			berth: 12,
		})
		
		//	Run the pathfinding routine on the grid that was just generated
		var path = Pathing.findPath(startTile, targetTile, matrix);
		
		if (!path) return false;
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
				point[0] = ( (precision*path[i][0]) ) + gridOrigin[0];
				point[1] = ( (precision*path[i][1]) ) + gridOrigin[1];
				processedPath.push(point);
			}
			
			me.aiData.tempPathGrid = {
				origin: gridOrigin,
				precision: precision,
				matrix: matrix,
				width: gridSize,
				height: gridSize,
			}
			return processedPath;
		}	
	}
	
	var pathTo = function(target){
		//	Convert the target point to a tile on the grid
		var targetOnGrid = [target[0] - me.pathfindingGrid.origin[0], target[1] - me.pathfindingGrid.origin[1]];
		var targetTile = [Math.round(targetOnGrid[0]/me.pathfindingGrid.precision),Math.round(targetOnGrid[1]/me.pathfindingGrid.precision)];
		//	Make sure the target tile is within the bounds of the grid
		if (targetTile[0] > me.pathfindingGrid.width - 1) targetTile[0] = me.pathfindingGrid.width - 1;
		if (targetTile[1] > me.pathfindingGrid.height - 1) targetTile[1] = me.pathfindingGrid.height - 1;
		if (targetTile[0] < 0) targetTile[0] = 0;
		if (targetTile[1] < 0) targetTile[1] = 0;
		
		//	Convert the character's position to a tile on the grid
		var startOnGrid = [me.x - me.pathfindingGrid.origin[0], me.y - me.pathfindingGrid.origin[1]];
		var startTile = [Math.round(startOnGrid[0]/me.pathfindingGrid.precision),Math.round(startOnGrid[1]/me.pathfindingGrid.precision)];
		//	Make sure the start tile is within the bounds of the grid
		if (startTile[0] > me.pathfindingGrid.width - 1) startTile[0] = me.pathfindingGrid.width - 1;
		if (startTile[1] > me.pathfindingGrid.height - 1) startTile[1] = me.pathfindingGrid.height - 1;
		if (startTile[0] < 0) startTile[0] = 0;
		if (startTile[1] < 0) startTile[1] = 0;
		
		var path = Pathing.findPathUsingGrid(me.getPosition(), target, me.pathfindingGrid, function(path){ path.splice(0,1) });
		
	//	var path = Pathing.findPath(startTile, targetTile, me.pathfindingGrid.matrix);
		if (!path) return false;
		else return path;
	/*	
		else {
			path.splice(0,1);
			if (path.length == 0) return false; 
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
				point[0] = ( (me.pathfindingGrid.precision*path[i][0]) ) + me.pathfindingGrid.origin[0];
				point[1] = ( (me.pathfindingGrid.precision*path[i][1]) ) + me.pathfindingGrid.origin[1];
				processedPath.push(point);
			}
			
			return processedPath;
		} */
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
	
	this.onDelete = function(){
		stuckTimer.delete();
		collisionTimer.delete();
		stallTimer.delete();
		bounceStuckTimer.delete();
	}
}

/*	Behaviors.Chase
		Have the character chase a moving target
*/
AI.Behaviors.Chase = function(me){
	var goalPosition = null;
	
	this.run = function(){
		if (me.inCombat) return;
		if (!me.aiGoals.follow) return;
		if (!me.aiGroups.follow) return;
		if (me.distanceTo(me.aiGoals.follow) < 64) {
			me.aiGoals.movement = null;
			me.waypoints = [];
			return;
		}
		if (me.aiData.followTarget && me.distanceTo(me.aiData.followTarget) < 64) {
			return;
		}
	
		if (!me.aiGroups.follow.run) runMyGroup();
		var target = me.aiData.followTarget;
		if (!target) return;
		var goal = me.aiGoals.follow;
		
		//	Check if the character has line of sight to the target
		var distance = Math.distanceXY(me.getPosition(),goal.getPosition());
		var excludes = _.uniq(me.aiGroups.follow.members);
		excludes.push(goal);
		
		var noLineOfSight = me.manager.rayCastTestXY(me, goal.getPosition(),distance, false, excludes);

		if (noLineOfSight){
			//	If the target has moved since the last check
			if (!_.isEqual(goalPosition, [goal.x, goal.y]) ) {
				goalPosition = [goal.x, goal.y];
				me.aiGoals.rally = goalPosition;
			}
		}
		else {
			var angle = me.angleFrom(target);
			var followPoint = Math.lineFromXYAtAngle(target.getPosition(), 64, angle);
			if (me.aiGroups.follow && me.aiGroups.follow.members.length > 1){
				var group = me.aiGroups.follow.members;
				for (var i in group){
					if (group[i] != me && group[i].aiData.followPoint && Math.distanceXY(group[i].aiData.followPoint, followPoint) < 36){
					angle.rotate(45);
					followPoint = Math.lineFromXYAtAngle(target.getPosition(), 64, angle);
					}
				}
			}
			
			me.aiData.followPoint = followPoint;
			
			
			me.addUpdateFunction(function() {
				if (me.waypoints[0] && !me.waypoints[0].pathfinding) {
					me.waypoints = [];
				}
				me.aiGoals.movement = followPoint;
				me.aiGoals.rally = null;
				me.aiData.followPoint = null;
			});
			
		}
		
	}
	
	var runMyGroup = function(){
		var group = me.aiGroups.follow.members;
		var goal = me.aiGroups.follow.value;
		if (!goal) return;
		
		var distSortedGroup = [];
		for (var i in group){
			var entry = {
				character: group[i],
			}
			entry.distance = entry.character.distanceTo(goal);
			distSortedGroup.push(entry);
		}
		distSortedGroup = _.sortBy(distSortedGroup, 'distance');
		
		var followTree = [];
		
		for (var i in distSortedGroup){
			var character = distSortedGroup[i].character;
			if (i > 1){
				var iterationGroup = Math.floor(Math.log(Number(i)+2) / Math.log(2)) - 1;
				var numberOfParents = Math.pow(2, iterationGroup);
				var parentIndex = 2 * (-1 + Math.pow(2, iterationGroup - 1) );
				
				for (var j = 0; j < numberOfParents; j++){
					var parent = j + parentIndex;
					if (!followTree[parent] || followTree[parent].length < 2){
						if (!followTree[parent]) followTree[parent] = [];
						followTree[parent].push(character);
						character.aiData.followTarget = distSortedGroup[parent].character;
					}
				}
				
			}
			else {
				character.aiData.followTarget = goal;
			}

		}
		
		me.aiGroups.follow.run = true;
	}
	
	this.onDelete = function(){
		updateTimer.delete();
	}
	
}

AI.Behaviors.Rally = function(me){
	
	var lastRallyPosition = null;
	var myRallyPosition = null;
	
	this.run = function(){
		if (!me.aiGoals.rally) return;
		if (!me.aiGroups.rally) return;
		if (myRallyPosition == null) myRallyPosition = me.aiGoals.rally;
		
		if (me.distanceTo(me.aiGoals.rally) <= 65) {
			me.addUpdateFunction(function() {
				me.waypoints = [];
				me.aiGoals.movement = null;
				me.aiData.rallyPosition = null;
			})
			return;
		}

		lastRallyPosition = me.aiGoals.rally;
		
		if (!me.aiGroups.rally.run) runMyGroup();
		/*
		else if (_.isEqual(me.aiGoals.rally, lastRallyPosition)) {
			var grid = makeRallyPointGrid();
			me.aiData.tempRallyGrid = grid;
			if (!Pathing.isBlocked(myRallyPosition, grid)) return;
		}
		
		//	Check if the character has line of sight to the target
		var distance = Math.distanceXY(me.getPosition(),me.aiGoals.rally);
		var noLineOfSight = me.manager.rayCastTestXY(me, me.aiGoals.rally,distance);
		if (noLineOfSight){
			if (me.aiGoals.follow) {
				if (noLineOfSight.shape == me.aiGoals.follow.hitbox.shapes[0]){
					noLineOfSight = false;
					me.aiData.disablePathfindingGrid = true;
				}
				else me.aiData.disablePathfindingGrid = false;
			}
			else me.aiData.disablePathfindingGrid = false;
		}
		else {
			me.aiData.disablePathfindingGrid = true;
		}
		//	Clear this character's waypoints and move them to the rally point, unless they're pathfinding around an object
		//	Override pathfinding if the character has line of sight to the target
		if ( (!noLineOfSight && !me.aiData.bounceFlag) || me.waypoints.length < 2 || !me.waypoints[1].pathfinding){
			
			var point = findSpotNearRallyPoint();
			
			myRallyPosition = point;
			me.aiData.rallyPosition = myRallyPosition;
			
			//	Don't clear the waypoints until the update phase, otherwise the character
			//	will be without waypoints for a frame and "flicker" to the default direction
			me.addUpdateFunction(function() { 
				me.waypoints = [];
				//	Set this point as a movement goal
				me.setMovementAIGoal(point[0],point[1]);
				//me.aiData.rallyPosition = null;
			});
		}
		*/
	
	}
	
	var runMyGroup = function(){
		var group = me.aiGroups.rally.members;
		var goal = me.aiGroups.rally.value;
		if (!goal) return;
	
		var distSortedGroup = [];
		for (var i in group){
			var entry = {
				character: group[i],
			}
			entry.distance = entry.character.distanceTo(goal);
			distSortedGroup.push(entry);
		}
		distSortedGroup = _.sortBy(distSortedGroup, 'distance');
		
		var paths = [];
		
		for (var i in distSortedGroup){
			var character = distSortedGroup[i].character;
			
			if ( (character.waypoints.length < 1 || !character.waypoints[0].pathfinding) && character.distanceTo(goal) > 96){
				var point = findSpotNearRallyPoint(character);
				character.aiData.rallyPosition = point;
				character.addUpdateFunction(function() {
					character.aiGoals.movement = _.each(point, Math.round);
				});
				var newPath = true;
			
				if (paths.length) {
					var pathDistances = [];
					for (var i in paths){
						var entry = {path: paths[i]};
						entry.distance = character.distanceTo(paths[i][0]);
						pathDistances.push(entry);
					}
					pathDistances = _.sortBy(pathDistances, 'distance');
					
					if (pathDistances[0].distance <= character.distanceTo(point)) {
						newPath = false;
						var path = pathDistances[0].path;
						var grid = makeRallyPointGrid(character);
						var splitPath = Pathing.findPathUsingGrid(path[path.length-1], point, grid, function(){path.splice(0,1)});
						character.aiData.tempRallyGrid = grid;
						character.waypoints = [];
						for (var i in path){
							character.addWaypoint({x: path[i][0], y: path[i][1], pathfinding: true});
						}
						for (var i in splitPath){
							character.addWaypoint({x: splitPath[i][0], y: splitPath[i][1], pathfinding: true});
						}
					}
				}
			
				if (newPath) {
				
					var path = Pathing.findPathUsingGrid(character.getPosition(), point, character.pathfindingGrid);
					if (path) {
						path.splice(-1, 1);
						var updatePath = _.uniq(path);
						path.splice(-1, 1);
						paths.push(path);
						character.waypoints = [];
						for (var i in updatePath){
							character.addWaypoint({x: updatePath[i][0], y: updatePath[i][1], pathfinding: true});
						}
					}
				}
				
			}
		}
		
		me.aiGroups.rally.run = true;
	}
	
	var findAIGroupGhosts = function(me){
		var ghosts = [];
		
		if (me.aiGroups.rally){
			var group = me.aiGroups.rally.members;
			for (var i in group){
				if (group[i].aiData.rallyPosition && group[i] != me){
					var ghost = {
						entity: group[i],
						position: group[i].aiData.rallyPosition,
					}
					ghosts.push(ghost);
				}
			}
		}
		
		return ghosts;
	}
	
	var makeRallyPointGrid = function(me){
		var ghosts = findAIGroupGhosts(me);
		var grid = Pathing.createGrid({
			origin: me.aiGroups.rally.value, // Always pull from the group; if aiGoals.rally is null, this will crash
			centerOrigin: true,
			width: 32,
			height: 32,
			precision: 16,
			berth: 12,
			entity: me,
			ghosts: ghosts,
		});
		return grid;
	}
	
	var findSpotNearRallyPoint = function(me){
		
		var point = me.aiGoals.rally;
		var grid = makeRallyPointGrid(me);
		me.aiData.tempRallyGrid = grid;
		
		if (Pathing.isBlocked(me.aiGroups.rally.value,grid)) {
			//	Find a walkable point near the target's position
			//	First try calculating the angle between the target and this character
			var angle = me.angleFrom(me.aiGroups.rally.value);
			point = Math.lineFromXYAtAngle(me.aiGroups.rally.value, 64, angle);
		
			//	If that angle is blocked, rotate around until an unblocked point is found
			var angleCount = 0;
			
			var pointIsBlocked = function(point){
				var blocked = Pathing.isBlocked(point,grid);
				if (!blocked) {
					var group = me.aiGroups.rally.members;
					for (var i in group){
						if (group[i] != me && group[i].aiData.rallyPosition && Math.distanceXY(group[i].aiData.rallyPosition, point) <= 18) {
							blocked = true;
							break;
						}
					}
				}
				return blocked;
			}
			
			while (pointIsBlocked(point)) {
				angleCount ++;
				angle.rotate(1);
				point = Math.lineFromXYAtAngle(me.aiGroups.rally.value, 64, angle);
				if (angleCount == 360) break;
			}
		}
		
		return point;
		
	}
		
}

