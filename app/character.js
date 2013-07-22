/* 
	================================================
	==================CHARACTER=====================
	================================================
	
	Includes:
	- Character
	
*/

/*	Character Class - extends Entity
		An Entity with specific Character properties and functions
*/
var ENT_CHARACTER = "ENT_CHARACTER";
var CHAR_PLAYER = "CHAR_PLAYER";
var CHAR_HOSTILE = "CHAR_HOSTILE";
var CHAR_NEUTRAL = "CHAR_NEUTRAL";
var CHAR_FRIENDLY = "CHAR_FRIENDLY";

var Character = function (params){
	
	var c = Entity.create(params);
	c.entType = ENT_CHARACTER;
	c.charType = CHAR_NEUTRAL;
	c.alive = true;
	c.createSprite({width: 48, height: 64}, 0, -18);
	c.speed = 8;
	c.createHitbox(48,28);
	c.focus = new Spectrum(30);
	c.stamina = new Spectrum(2.5);
	c.staminaRegenRate = 1/30;
	c.staminaDamageTimer = new Spectrum(1);

	c.bars = { };
	
	c.paperDoll = {
		body: {
			type: "body",
			color: "808080",
		},
		torso: {
			type: null,
			color: null,
		},
		legs: {
			type: null,
			color: null,
		},
		head: {
			type: null,
			color: null,
		},
		sword: {
			type: null,
			color: null,
			isSword: true,
		},
		misc: [],
	}
	
	var paperDollZIndex = [c.paperDoll.body, c.paperDoll.torso, c.paperDoll.legs, c.paperDoll.head, c.paperDoll.sword];
	
	//	===============================================================================================================
	
	c.clone = function(){
		var c = new Character({
			x: this.x, 
			y: this.y,
			z: this.z,
			zIndex: this.zIndex,
			visible: this.visible,
			permeable: this.permeable,
			speed: this.speed,
			speedMult: this.speedMult,
			sprite: this.sprite,
			cloned: true,
		});
		c.createEffectRadius(this.effect.radius.shapes[0].getRadius());
		var effect = {types: this.effect.types, doThis: this.effect.doThis};
		c.createEffect(effect);
		
		c.setPaperDoll(this.paperDoll);
		c.charType = this.charType;
		
		c.stamina = new Spectrum(this.stamina.getMax());
		c.staminaRegenRate = this.staminaRegenRate;
		c.focus = new Spectrum(this.focus.getMax());
		
		if(this.bars.staminaBar) c.createStaminaBar();
		if(this.bars.focusBar) c.createFocusBar();
		
		return c;
	}
	
	c.updateExtension = function(){
		if (this.alive) {
			this.regenerateStamina();
			if (this.focus.get() == 0){
				this.kill();
			}
		}
		for (var i in this.bars){
			this.bars[i].update();
		}
	}
	
	c.drawExtension = function(){
		for (var i in this.bars){
			if (this.bars[i].visible) this.bars[i].draw();
		}
	}
	
	//	paperDoll manipulation functions
	//	================================
	
	/*	composeDoll
			Parse the paperDoll objects, and convert them to layers for composeTexture
	*/
	c.composeDoll = function(){
		var layers = [];
		//	Go through all the basic paperDoll components and make them into layers
		for(var i in paperDollZIndex){
			if (paperDollZIndex[i].type !== null) {
				//	If the current component is a sword, create two layers
				if (paperDollZIndex[i].isSword) {
					layers.push({name: paperDollZIndex[i].type+'hilt', color: "c7aa09"});
					layers.push({name: paperDollZIndex[i].type+'blade', color: paperDollZIndex[i].color});
				}
				else {
					layers.push({name: paperDollZIndex[i].type, color: paperDollZIndex[i].color});
				}
				//	See if there are any miscellaneous objects to layer on top of the current component
				for (var j in this.paperDoll.misc){
					me = this.paperDoll.misc[j];
					if (me.zIndex == i)
						layers.push({name: me.type, color: me.color});
				}
			}
		}
		this.composeTexture(layers);
	}
	
	//	Setters
	c.setPaperDoll = function(doll) {
		this.paperDoll.body.color = doll.body.color;
		this.paperDoll.torso.type = doll.torso.type;
		this.paperDoll.torso.color = doll.torso.color;
		this.paperDoll.legs.type = doll.legs.type;
		this.paperDoll.legs.color = doll.legs.color;
		this.paperDoll.head.type = doll.head.type;
		this.paperDoll.head.color = doll.head.color;
		this.paperDoll.sword.type = doll.sword.type;
		this.paperDoll.sword.color = doll.sword.color;
		for (var i in doll.misc){
			this.addMisc(doll.misc[i].type,doll.misc[i].color,doll.misc[i].zIndex);
		}
	}

	c.setBodyColor = function(color) {
		this.paperDoll.body.color = color;
	}

	c.setTorso = function(type, color){
		this.paperDoll.torso.type = type;
		this.paperDoll.torso.color = color;
	}
	c.removeTorso = function(){
		this.paperDoll.torso.type = null;
		this.paperDoll.torso.color = null;
	}

	c.setLegs = function(type, color){
		this.paperDoll.legs.type = type;
		this.paperDoll.legs.color = color;
	}
	c.removeLegs = function(){
		this.paperDoll.legs.type = null;
		this.paperDoll.legs.color = null;
	}

	c.setHead = function(type, color){
		this.paperDoll.head.type = type;
		this.paperDoll.head.color = color;
	}
	c.removeHead = function(){
		this.paperDoll.head.type = null;
		this.paperDoll.head.color = null;
	}

	c.setSword = function(type, color){
		this.paperDoll.sword.type = type;
		this.paperDoll.sword.color = color;
	}
	c.removeSword = function(){
		this.paperDoll.sword.type = null;
		this.paperDoll.sword.color = null;
	}

	c.addMisc = function(type, color, zIndex){
		this.paperDoll.misc[type] = {type: type, color: color, zIndex: zIndex}	
	}
	c.removeMisc = function(type){
		delete this.paperDoll.misc[type];
	}

	//	Character type functions
	//	========================
	c.makePlayer = function(){
		this.charType = CHAR_PLAYER;
	}
	c.makeNeutral = function(){
		this.charType = CHAR_NEUTRAL;
	}
	c.makeHostile = function(){
		this.charType = CHAR_HOSTILE;
	}
	c.makeFriendly = function(){
		this.charType = CHAR_FRIENDLY;
	}

	//	Character UI functions
	//	======================
	c.createStaminaBar = function(){
		var sdt = this.staminaDamageTimer;
		var sprite = this.sprite;
		this.bars.staminaBar = Graphics.UI.Bar.create({
			width: 48,
			height: 4,
			x: 0,
			y: 0,
			emptyColor: [1,0,0,1],
			fullColor: [0,0,1,1],
			spectrum: this.stamina,
			effects: {
				tooLow: function(bar, emptySprite, fullSprite, spectrum){
					if (spectrum.get() < 1) {
						fullSprite.setColor([0,0,1,0.3]);
					}
					else fullSprite.setColor([0,0,1,1]);
				},
				damageTimer: function(bar, emptySprite){
					emptySprite.setColor([1-sdt.get(),0,0,1]);
				},
				reposition: function(bar){
					bar.setPosition(sprite.x, sprite.y + 36)
				}
			},
		});
	}
	
	c.createFocusBar = function(){
		var sprite = this.sprite;
		this.bars.focusBar = Graphics.UI.Bar.create({
			width: 48,
			height: 4,
			x: 0,
			y: 0,
			emptyColor: [0.6,0,0,1],
			fullColor: [0,1,0,1],
			spectrum: this.focus,
			effects: {
				reposition: function(bar){
					bar.setPosition(sprite.x, sprite.y + 36)
				}
			},
		});
	}

	//	Character passive functions
	//	===========================

	//	regenerateStamina
	c.regenerateStamina = function(){
		if (this.stamina.get() < this.stamina.getMax()) {
			this.stamina.plus(this.staminaRegenRate);
		}
		if (this.staminaDamageTimer.get()) {
			this.staminaDamageTimer.plus(-1/10);
		}
	}
	
	c.kill = function(){
		this.alive = false;
		this.effect = {};
		delete this.radStore;
		delete this.savedState.radStore;
		this.sprite.rotation = Math.PI/2;
		this.sprite.yOffset = 0;
		this.permeable = true;
		this.zIndex--;
		this.bars.focusBar.visible = false;
		this.createHitbox(0,0);
	}

	//	Character actions
	//	=================

	/*	swingAtCharacter
			Try to attack another character, fail if there's not enough stamina
	*/
	c.swingAtCharacter = function(other, checkPushForward){
		//	Deplete this character's stamina
		this.stamina.plus(-1);
		
		//	If there's still enough stamina for a proper attack...
		if (this.stamina.get() > 0) {
			this.strikeCharacter(other, checkPushForward);
		}
		
		//	If not, damage the stamina and fail the attack
		else {
			this.staminaDamageTimer.set(1);
		}
	}
	
	/*	strikeCharacter
			Attack another Character, pushing them away from this Character
	*/
	c.strikeCharacter = function(other, checkPushForward){
		
		//Get the angle between this character's hitbox and the other character's hitbox
		var theta = Math.angleXY(this.hitbox.getPosition(), other.hitbox.getPosition());

		var hitboxWidth = 48;
		var hitboxHeight = 28;

		//	Default values for how far to push the other character, and how far this character should stand away
		var push = 30;
		var pushRadius = 64;
		var speed = 2;
		var slowRange = 10;

		//	Calculate the distance between the two characters' sprites
		var myPos = this.getSpriteOffsetPosition();
		var oPos =  other.getSpriteOffsetPosition();
		var xDiff = Math.abs(oPos[0] - myPos[0]);
		var yDiff = Math.abs(oPos[1] - myPos[1]);
		xDiff -= hitboxWidth;
		yDiff -= hitboxHeight;
		if(xDiff < 0) xDiff = 0;
		if(yDiff < 0) yDiff = 0;
		var distance = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );

		//	If this character is pushing forward, increase the push distance
		var pushForward = false;
		if (checkPushForward){
			if (Physics.collisionUtils.intersects(this.cursor.hitbox.shapes[0],other.hitbox.shapes[0]) )
				pushForward = true;
		}
		if (pushForward === true){
			push *= 2;
			pushRadius *= 1.25;
			speed *= 2;
			slowRange * 2;
		}

		//	Generate the waypoints towards which to push both characters
		var oWaypoint = [];
		var myWaypoint = [];
		//	Push the other character along the angle between the two characters' hitboxes
		oWaypoint = Math.lineFromXYAtAngle([other.x,other.y],push,theta);
		//	Push this character along the same angle, but pushRadius pixels away from the other character
		myWaypoint = Math.lineFromXYAtAngle(Math.vNeg(oWaypoint), pushRadius, theta);
		myWaypoint = Math.vNeg(myWaypoint);

		//	Apply the waypoints 
		other.overwriteWaypoint(0, oWaypoint[0],oWaypoint[1], slowRange, speed, 0.3);
		this.overwriteWaypoint(0, myWaypoint[0],myWaypoint[1], slowRange, speed, 0.3);
		
		//	Deal focus damage
		other.focus.plus(-5);
	}
	
	return c;
}
Character.prototype = Entity.prototype;

Character.create = function(params){
	return new Character(params);
}


