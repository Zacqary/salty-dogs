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
		if (me.isAtPosition(me.aiGoals.movement)){
			me.aiGoals.movement = null;
			currentSlice = null;
			return;
		}
		
		if (!me.hasWaypoint(me.aiGoals.movement)){
			me.addWaypoint(me.aiGoals.movement);
		}
		
		var distanceToPoint = new Spectrum(64);
		distanceToPoint.set(Math.distanceXY(me.getPosition(),me.getWaypoint()));
		if(me.manager.rayCastTestXY(me, me.getWaypoint(), distanceToPoint.get())){
			
			var gridSize = 16;
			var tileSize = 16;
			
			var angle = Math.angleXY(me.getPosition(), me.getWaypoint());
			var targetPoint = Math.lineFromXYAtAngle(me.getPosition(),(gridSize*tileSize)/2,angle);
			
			var gridOrigin = [me.x - (gridSize*tileSize)/2, me.y - (gridSize*tileSize)/2];
			var targetOnGrid = [targetPoint[0] - gridOrigin[0], targetPoint[1] - gridOrigin[1]];
			var targetTile = [Math.round(targetOnGrid[0]/tileSize),Math.round(targetOnGrid[1]/tileSize)];
			
			var matrix = [];
			var world = me.manager.getWorld();
			var width = me.hitbox.width;
			var height = me.hitbox.height;
			var blocks = 0;
			for (var i = 0; i < gridSize; i++){
				var row = [];
				var y = ( (tileSize/2)+(tileSize*i) ) + gridOrigin[1];
				for (var j = 0; j < gridSize; j++){
					var x = ( (tileSize/2)+(tileSize*j) ) + gridOrigin[0];
					var rectangle = [x-(width/2), y-(height/2), x+(width/2), y+(height/2)];
					var store = [];
					if (world.bodyRectangleQuery(rectangle,store)) {
						if (store[0] !== me.hitbox) {
							blocks++;
							row.push(1);
						}
						else row.push(0);
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
			var center = (gridSize/2)-1;

			var path = finder.findPath(center,center,targetTile[0]-1,targetTile[1]-1, grid);
			me.waypoints = [];
			PathfindingTest.drawPath = [];
			for (var i in path){
				path[i][0] = ( (tileSize/2) + (tileSize*path[i][0]) ) + gridOrigin[0];
				path[i][1] = ( (tileSize/2) + (tileSize*path[i][1]) ) + gridOrigin[1];
				me.addWaypoint(path[i]);
				PathfindingTest.drawPath.push(path[i]);
			}
		}
		
	}
}

