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
	this.name = "CombatBehavior";
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
		for (var i in imIn){
			if (imIn[i].charType == (me.charType || CHAR_NEUTRAL) )
				imIn.splice(i,1);
		}

		return imIn[0];
	}
	
	this.run = function(){
		//	Only run the behavior if the character is in combat
		if (me.inCombat) {
			//	Recreate the stats if character just entered combat
			if (!stats){
				stats = { };
				stats.restartDelta = 0; // How much more %stamina than %focus character needs to start attacking 
				stats.delay = new Countdown(0.5);
				stats.enemy = getCurrentCombatant();
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


