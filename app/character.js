/* 
	================================================
	==================CHARACTER=====================
	================================================
	
	Includes:
	- Character
	- Character-related functions for EntityManager
	- CharacterModel
	
*/

/*	Character Class - extends Entity
		An Entity with specific Character properties and functions
*/
var ENT_CHARACTER = "ENT_CHARACTER";
var CHAR_PLAYER = "CHAR_PLAYER";
var CHAR_HOSTILE = "CHAR_HOSTILE";
var CHAR_NEUTRAL = "CHAR_NEUTRAL";
var CHAR_FRIENDLY = "CHAR_FRIENDLY";

var HIT_CLOCK_GREEN_ZONE = 1/2.5;

var Character = function (params){
	
	var c = Entity.create(params);
	c.entType = ENT_CHARACTER;
	c.charType = CHAR_NEUTRAL;
	c.alive = true;
	c.createSprite({width: 48, height: 64}, 0, -18);
	c.speed = 8;
	c.turnSpeed = 2;
	c.createHitbox(48,28);
	
	c.damage = 1;
	c.damageInterval = 0.25;
	
	c.focus = new Spectrum(30);
	c.focusRegenRate = 1/90;
	
	c.stamina = new Spectrum(4);
	c.staminaRegenRate = 1/45;
	
	c.inCombat = false;
	
	c.timers = {
		staminaDamage: new Countdown(0, 0.2),
		hit: new Countdown(0, 0.45),
	};
	
	c.aiGoals = { };
	
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
	
	var bars = { };
	var behaviors = { };
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
		if (this.effect.radius) {
			c.createEffectRadius(this.effect.radius.shapes[0].getRadius());
			var effect = {types: this.effect.types, doThis: this.effect.doThis};
			c.createEffect(effect);
		}
		
		c.setPaperDoll(this.paperDoll);
		c.composeDoll();
		c.charType = this.charType;
		
		c.stamina = new Spectrum(this.stamina.getMax());
		c.staminaRegenRate = this.staminaRegenRate;
		c.focus = new Spectrum(this.focus.getMax());
		
		if(bars.staminaBar) c.createStaminaBar();
		if(bars.focusBar) c.createFocusBar();
		if(bars.hitClockBar) c.createHitClockBar();
		
		if (this.model) c.setModel(this.model);
		
		return c;
	}
	
	c.updateExtension = function(){
		if (this.alive) {
			//	Handle stats
			if (this.focus.get() == 0){
				this.kill();
				return;
			}
			this.regenerate();
		}
		for (var i in bars){
			bars[i].update();
		}
	}
	
	c.drawExtension = function(){
		if (this.model) {
			//	Default direction is down
			var direction = 6;
			//	If the character is heading in a direction
			if (this.heading !== undefined) {
				direction = Math.angleToDirection(this.heading);
			}
			var frame = this.model.getDirection(direction);
			//	Determine whether the sprite is currently scaled up or down relative to the model
			var differential = this.sprite.getWidth()/this.activeFrame.width;
			//	Update the sprite's width, scaled proportionately
			this.sprite.setWidth(frame.width*differential);
			//	Update texture rectangles and offsets
			this.sprite.setTextureRectangle(frame.rectangle);
			this.sprite.setOffsets(frame.offsets);
			
			this.activeFrame = frame;
		}
		for (var i in bars){
			if (bars[i].visible) bars[i].draw();
		}
	}
	
	//	Model functions
	//	===============
	
	//	setModel - Sets a model and initializes it by applying it to the sprite
	c.setModel = function(model){
		this.model = model;
		this.sprite.setTextureRectangle(this.model.getFrame(0).rectangle);
		this.sprite.setOffsets(this.model.getFrame(0).offsets);
		this.activeFrame = this.model.getFrame(0);
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
			var texName = paperDollZIndex[i].type;
			if (this.model) {
				if (paperDollZIndex[i].type !== null) {
					//	If the current component is a sword, create two layers
					if (paperDollZIndex[i].isSword) {
						layers.push({texture: this.model.getLayer(texName+'hilt'), color: "c7aa09"});
						layers.push({texture: this.model.getLayer(texName+'blade'), color: paperDollZIndex[i].color});
					}
					else {
						layers.push({texture: this.model.getLayer(texName), color: paperDollZIndex[i].color});
					}
					//	See if there are any miscellaneous objects to layer on top of the current component
					for (var j in this.paperDoll.misc){
						me = this.paperDoll.misc[j];
						if (me.zIndex == i)
							layers.push({texture: this.model.getLayer(me.type), color: me.color});
					}
				}
				this.composeTexture(layers);
			}
			/*
			else {
				if (paperDollZIndex[i].type !== null) {
					//	If the current component is a sword, create two layers
					if (paperDollZIndex[i].isSword) {
						layers.push({name: texName+'hilt', color: "c7aa09"});
						layers.push({name: texName+'blade', color: paperDollZIndex[i].color});
					}
					else {
						layers.push({name: texName, color: paperDollZIndex[i].color});
					}
					//	See if there are any miscellaneous objects to layer on top of the current component
					for (var j in this.paperDoll.misc){
						me = this.paperDoll.misc[j];
						var myName = me.type;
						if (me.zIndex == i)
							layers.push({name: myName, color: me.color});
					}
				}
			}
			*/
		}
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
	
	c.setBody = function(type, color) {
		this.paperDoll.body.type = type;
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
		this.charType = CHAR_FRIENDLY;
		Player.entity = this;
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
		var sdt = this.timers.staminaDamage;
		var sprite = this.sprite;
		var myBars = bars;
		bars.staminaBar = Graphics.UI.Bar.create({
			width: 48,
			height: 4,
			x: 0,
			y: 0,
			emptyColor: [0.9,0.9,1,1],
			fullColor: [0,0,1,1],
			spectrum: this.stamina,
			effects: {
				tooLow: function(bar, emptySprite, fullSprite, spectrum){
					if (spectrum.get() < 1) {
						fullSprite.setColor([0,0,1,0.3]);
						emptySprite.setColor([1-(sdt.get()*10),0,0.7,1]);
					}
					else {
						fullSprite.setColor([0,0.5,1,1]);
						emptySprite.setColor([0.6,0.9,1,1]);
					}
				},
				reposition: function(bar){
					var yOff = 18;
					if (myBars.focusBar) yOff = 22;
					bar.setPosition(sprite.x - sprite.xOffset, sprite.y - sprite.yOffset + yOff)
				}
			},
		});
	}
	
	c.createFocusBar = function(){
		var sprite = this.sprite;
		bars.focusBar = Graphics.UI.Bar.create({
			width: 48,
			height: 4,
			x: 0,
			y: 0,
			emptyColor: [0.6,0,0,1],
			fullColor: [0.4,0.9,0.1,1],
			spectrum: this.focus,
			effects: {
				reposition: function(bar){
					bar.setPosition(sprite.x - sprite.xOffset, sprite.y - sprite.yOffset + 18)
				}
			},
		});
	}
	
	c.createHitClockBar = function(){
		var sprite = this.sprite;
		bars.hitClockBar = Graphics.UI.Bar.create({
			width: 48,
			height: 4,
			x: 0,
			y: 0,
			emptyColor: [0,0,0,1],
			fullColor: [0.8,0.8,0.8,1],
			spectrum: this.timers.hit,
			effects: {
				reposition: function(bar){
					bar.setPosition(sprite.x - sprite.xOffset, sprite.y - sprite.yOffset + 26)
				},
				flash: function(bar, emptySprite, fullSprite, spectrum){
					if ( (spectrum.get() <= spectrum.getMax() * HIT_CLOCK_GREEN_ZONE) && (spectrum.get() > 0) ){
						fullSprite.setColor([0.8,1,0.8,1]);
						emptySprite.setColor([0,0.8,0,1]);
					}
					else {
						fullSprite.setColor([0.8,0.8,0.8,1]);
						emptySprite.setColor([0,0,0,1]);
					}
				}
			},
		});
	}

	//	Character passive functions
	//	===========================

	//	regenerate
	c.regenerate = function(){
		if (this.stamina.get() < this.stamina.getMax() && !this.timers.staminaDamage.get()) {
			this.stamina.plus(this.staminaRegenRate);
		}
		if ( this.focus.get() < this.focus.getMax() ){
			this.focus.plus(this.focusRegenRate);
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
		for (var i in bars){
			bars[i].visible = false;
		}
		this.createHitbox(0,0);
		this.charType = CHAR_NEUTRAL;
	}
	
	c.updateCombatState = function(){
		if (!this.inCombat) {
			this.combat = null;
	
		}
		else if (!this.combat) {
			this.combat = { };
		}
	}
	
	c.takeDamage = function(damage, other){
		var d = damage;
		if (this.retreating) d /= 1.5;
		if (this.pushingForward) d *= 1.25;
		else {
			var buffer = 16;
			var angle = Math.angleXY(this.getPosition(),this.getWaypoint());
			var endpoint = Math.lineFromXYAtAngle(this.getWaypoint(),buffer,angle);
			
			var result = this.manager.rayCastTestXY(this,endpoint);
			if (result){
				console.log(result.shape.body.entity);
				console.log("Blocked!");
				if (other.pushingForward) d *= 1.25;
				d *= 3;
			}
		}
		
		console.log(d);
		this.focus.plus(-d);
	}

	//	Character actions
	//	=================

	/*	swingAtCharacter
			Try to attack another character, fail if there's not enough stamina
	*/
	c.swingAtCharacter = function(other){
		//	Deplete this character's stamina
		this.stamina.plus(-1);
		//	Deplete it more if the character's attacking too fast
		if (this.timers.hit.get() > this.timers.hit.getMax() * HIT_CLOCK_GREEN_ZONE){
			var green = this.timers.hit.getMax() * HIT_CLOCK_GREEN_ZONE;
			var diff = this.timers.hit.get() - green;
			var percent = diff/green;
			this.stamina.plus(-percent);
		}
		
		//	If there's still enough stamina for a proper attack...
		if (this.stamina.get() > 0) {
			//	Deplete the stamina even more if breaking an attack chain
			if (other.timers.hit.get()) this.stamina.plus(-1);
			this.strikeCharacter(other);
		}
		
		//	If not, damage the stamina and fail the attack
		else {
			this.timers.staminaDamage.maxOut();
		}
		
		//	If the character's out of stamina, reset the consecutive hit counter
		if (this.stamina.get < 1){
			if (!this.combat.hitResetTimer.get()) {
				this.combat.hits = 0;
				this.combat.hitResetTimer = null;
			}
			else if (!this.combat.hitResetTimer) {
				this.combat.hitResetTimer = new Countdown(0.5);
			}
		}
	}
	
	/*	strikeCharacter
			Attack another Character, pushing them away from this Character
	*/
	c.strikeCharacter = function(other){
		
		//Get the angle between this character's hitbox and the other character's hitbox
		var theta = Math.angleXY(this.hitbox.getPosition(), other.hitbox.getPosition());

		var hitboxWidth = 48;
		var hitboxHeight = 28;

		//	Default values for how far to push the other character, and how far this character should stand away
		var push = 45;
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
		var doublePush = function(){
			push *= 2;
			pushRadius *= 1.25;
			speed *= 2;
			slowRange * 2;
		}
		if (this.pushingForward){
			doublePush();
		}
		//	Also double (or double again) if the other character is retreating
		if (other.retreating){
			doublePush();
		}
		//	Quarter the push distance if the other character is refusing to give up ground
		if (other.pushingForward){
			push *= .25;
			pushRadius *= .5;
			speed *= .25;
			slowRange * .25;
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
		
		//	If this character just started attacking, reset the hit counter
		if (!this.combat.attacker) {
			this.combat.attacker = true;
			other.combat.attacker = false;
			this.combat.hits = 0;
		}
		
		
		//	Deal focus damage
		var damageMult = 1;
		damageMult += this.combat.hits * this.damageInterval;
		if (this.pushingForward) damageMult /= 2;
		
		var damage = this.damage * damageMult;
		other.takeDamage(damage, this);
		
		//	Increase the number of consecutive hits
		this.combat.hits ++;
		// If the character is attacking too fast, reduce the benefits of a consecutive hit
		if (this.timers.hit.get() > this.timers.hit.getMax() * HIT_CLOCK_GREEN_ZONE){
			this.combat.hits -= 0.5;
		}
		
		//	Set the hit chain timer
		this.timers.hit.maxOut();
		
	}
	
	//	AI handling
	//	===========
	c.runMyBehaviors = function(){
		for (var i in behaviors){
			behaviors[i].run();
		}
	}
	c.addBehavior = function(name){
		var behavior = AI[name];
		behaviors[name] = new behavior(this);
	}
	c.removeBehavior = function(behavior){
		delete behaviors[behavior.name];
	}
	
	c.setMovementAIGoal = function(x,y){
		this.aiGoals.movement = [x,y];
	}
	
	return c;
}
Character.prototype = Entity.prototype;

Character.create = function(params){
	return new Character(params);
}

//	====================================================================================
	
//	EntityManager extensions
//	========================
EntityManager.prototype.updateCharacterCombatStates = function(){
	var entities = this.getEntities();
	for (var i in entities){
		if (entities[i].charType) {
			entities[i].updateCombatState();
		}
	}
}
EntityManager.prototype.runCharacterBehaviors = function(){
	var entities = this.getEntities();
	for (var i in entities){
		if (entities[i].charType) {
			entities[i].runMyBehaviors();
		}
	}
}

//	====================================================================================

/*	CharacterModel Class
		Maps textures to sprites and bounding boxes
*/
var CharacterModel = function () { 
	
	var frames = [];
	var frameIndex = [];
	
	var directions = [];
	
	var layers = [];
	
	this.setFrame = function(params){
		var f = {};

		f.name = params.name;
		f.rectangle = params.rectangle;
		f.offsets = params.offsets;

		var index = frames.length;
		frames.push(f);
		frameIndex[f.name] = index;
		
		if (params.direction !== undefined){
			this.setDirection(params.direction, f.name);
		}
	}

	this.getFrame = function (name){
		var f = frames[name] || frames[frameIndex[name]];
		f.width = f.rectangle[2] - f.rectangle[0];
		f.height = f.rectangle[1] - f.rectangle[3];
		return f;
	}
	
	this.setDirection = function(dir, frameName){
		directions[dir] = frameIndex[frameName];
		frames[frameIndex[frameName]].direction = dir;
	}
	
	this.getDirection = function(dir){
		return this.getFrame(directions[dir])
	}
	
	this.setLayer = function(texture, name){
		name = name || texture.name;
		layers[name] = texture;
	}
	
	this.getLayer = function(name){
		return layers[name];
	}
	
}

CharacterModel.create = function(){
	return new CharacterModel();
}