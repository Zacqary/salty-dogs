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
	c.physicsGroup = 2;
	c.alive = true;
	c.createSprite({width: 48, height: 64}, 0, -18);
	c.speed = 6;
	c.turnSpeed = 2;
	c.createHitbox(48,28);
	
	c.damage = 1;
	c.damageInterval = 0.25;
	
	c.focus = new Spectrum(30);
	c.focusRegenRate = 1/180;
	
	c.stamina = new Spectrum(4);
	c.staminaRegenRate = 1/45;
	
	c.inCombat = false;
	
	c.timers = {
		staminaDamage: new Countdown(0, 0.2),
		hit: new Countdown(0, 0.45),
	};
	
	c.aiGoals = { };
	c.aiData = { };
	c.aiGroups = { };
	
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
		c.renderTarget = null;
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
	
	var prevFrame;
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
		
		if (this.model) {
			//	Default direction is down
			var direction = 6;
			//	If the character is heading in a direction
			if (this.heading !== undefined) {
				direction = Math.angleToDirection(this.heading);
			}
			this.setDirection(direction);
			//this.setAnimation("walk");
			var frame = this.getCurrentAnimationFrame();
			//this.advanceAnimationFrame();
			
			//	Update texture
			if (frame != prevFrame) {
				this.composeDoll(frame);
			}
			prevFrame = frame;
			
		}
		
	}
	
	c.drawExtension = function(){
		
		for (var i in bars){
			if (bars[i].visible) bars[i].draw();
		}
	}
	
	//	Model functions
	//	===============
	
	//	setModel - Sets a model and initializes it by applying it to the sprite
	c.setModel = function(model){
		this.model = model;
		this.activeFrame = model.getAnimationFrame("ø",0,6);
	}
	
	//	paperDoll manipulation functions
	//	================================
	
	/*	composeDoll
			Parse the paperDoll objects, and convert them to layers for composeTexture
	*/
	c.composeDoll = function(frame){
		var layers = [];
		//	Go through all the basic paperDoll components and make them into layers
		for(var i in paperDollZIndex){
			var texName = paperDollZIndex[i].type;
			if (paperDollZIndex[i].type !== null) {
				//	If the current component is a sword, create two layers
				if (paperDollZIndex[i].isSword) {
					layers.push({frame: this.model.getFrameLayer(frame, texName+'hilt'), color: "c7aa09", name: texName+'hilt'});
					layers.push({frame: this.model.getFrameLayer(frame, texName+'blade'), color: paperDollZIndex[i].color, name: texName+'blade'});
				}
				else {
					layers.push({frame: this.model.getFrameLayer(frame, texName), color: paperDollZIndex[i].color, name: texName});
				}
				//	See if there are any miscellaneous objects to layer on top of the current component
				for (var j in this.paperDoll.misc){
					me = this.paperDoll.misc[j];
					if (me.zIndex == i)
						layers.push({frame: this.model.getFrameLayer(frame, me.type), color: me.color, name: me.type});
				}
			}
		}
		
		//	Create a render target and start drawing to it
		Graphics.draw2D.configure({
			scaleMode: 'none',
			viewportRectangle: Math.device.v4Build(0,0,frame.width,frame.height)
		});
		
		var target = this.renderTarget;
		if (!target) {
			target = this.renderTarget = Graphics.draw2D.createRenderTarget({
				backBuffer: true,
				width: 256,
				height: 256
			});
		}
		Graphics.draw2D.setRenderTarget(target);
		Graphics.draw2D.clear([1.0, 1.0, 1.0, 0.0]);
		Graphics.draw2D.begin("alpha");
		
		for (var i in layers){
			var color = layers[i].color;
			if (typeof color == "string") color = Graphics.hexToARGB(color);

			Graphics.draw2D.draw({
				texture: layers[i].frame.texture,
				sourceRectangle: frame.rectangle,
				destinationRectangle: Math.device.v4Build(0,0,frame.width,frame.height),
				color: color,
				origin: Math.device.v2BuildZero(),
			});
		}
		
		//	Stop drawing and reset the back buffer, whatever that means
		Graphics.draw2D.end();
		Graphics.draw2D.setBackBuffer();
		
		//	Grab what we just drew, and return it as hot, fresh, delicious texture data
		var tex = Graphics.draw2D.getRenderTargetTexture(target);
		
		this.setTexture(tex);
		this.sprite.setTextureRectangle([0,0,256,256]);
		this.sprite.setOffsets(frame.offsets);
		
		//Determine whether the sprite is currently scaled up or down relative to the model
		var differential = this.sprite.getWidth()/this.activeFrame.width;
		//	Update the sprite's width, scaled proportionately
		this.sprite.setWidth(frame.width*differential);
		
		this.activeFrame = frame;
		
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

	//	Animation functions
	//	===================
	
	var currentAnimation = {
		name: "ø",
		length: 1,
	};
	var currentFrame = 0;
	var currentDirection;
	c.setAnimation = function(name){
		currentAnimation = {
			name: name,
			length: this.model.getAnimationLength(name),
			frameRate: 1/20,
		};
	}
	
	c.setDirection = function(dir){
		currentDirection = dir;
	}
	
	c.setAnimationFrame = function(frame){
		currentFrame = frame;
		if (frame >= currentAnimation.length) currentFrame = 0;
	}
	
	var animationFrameDelta = 0;
	c.advanceAnimationFrame = function(){
		animationFrameDelta += GameState.getFrameDelta();
		
		var frameDelta = ( (1/60)*animationFrameDelta)/currentAnimation.frameRate;
		frameDelta = Math.floor(frameDelta);
		if (frameDelta > 0) {
			currentFrame += frameDelta;
			if (currentFrame >= currentAnimation.length) currentFrame = 0;
			animationFrameDelta = 0;
		}
	}
	
	
	c.getAnimationFrame = function(frame, direction){
		return this.model.getAnimationFrame(currentAnimation.name, frame, direction);
	}
	
	c.getCurrentAnimationFrame = function(){
		return this.getAnimationFrame(currentFrame, currentDirection);
	}

	//	Character type functions
	//	========================
	c.makePlayer = function(){
		this.charType = CHAR_FRIENDLY;
		Player.entity = this;
		this.physicsGroup = 4;
	}
	c.makeNeutral = function(){
		this.charType = CHAR_NEUTRAL;
		this.physicsGroup = 2;
	}
	c.makeHostile = function(){
		this.charType = CHAR_HOSTILE;
		this.physicsGroup = 8;
	}
	c.makeFriendly = function(){
		this.charType = CHAR_FRIENDLY;
		this.physicsGroup = 4;
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
			var rate = this.focusRegenRate;
			if (!this.inCombat) rate *= 6;
			this.focus.plus(rate);
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
		
		this.waypoints = [];
		
		for (var i in behaviors){
			if (behaviors[i].onDelete) behaviors[i].onDelete();
			delete behaviors[i];
		}
		
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
				if (other.pushingForward) d *= 1.25;
				d *= 3;
			}
		}
		
		this.combat.lastAttacker = other;
		
		console.log(d);
		this.focus.plus(-d);
	}
	
	/*	headingTimer and affectHeading
			This system only allows the character's heading value to change
			every 0.05 seconds. Simply using affect("heading") causes flickering
			between directions when AI characters are following waypoints.
	*/
	c.headingTimer = new Countdown(0.05, function(){
		c.heading = c.headingBuffer;
		c.headingTimer.maxOut();
	});
	c.affectHeading = function(dir){
		//this.heading = dir;
		this.affect("headingBuffer",dir);
	}
	
	//	Character actions
	//	=================
	
	c.aPC = c.approachCurrentWaypoint;
	c.approachCurrentWaypoint = function(){
		w = this.waypoints[0];
		if (!w.disableHeading && !this.inCombat) {
			var heading = Math.angleXY([this.x, this.y],[w.x,w.y]);
			this.affectHeading(heading);
		}
		this.aPC();
	}
	
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
		other.overwriteWaypoint(0, {x: oWaypoint[0], y: oWaypoint[1], range: slowRange, override: speed, timer: 0.3, disableHeading: true});
		this.overwriteWaypoint(0, {x: myWaypoint[0], y: myWaypoint[1], range: slowRange, override: speed, timer: 0.3, disableHeading: true});
		
		//	If this character just started attacking, reset the hit counter
		if (!this.combat.attacker) {
			this.combat.attacker = true;
			other.combat.attacker = false;
			this.combat.hits = 0;
		}
		
		
		//	Deal focus damage
		var damageMult = 1;
		damageMult += this.combat.hits * this.damageInterval;
		//	If the character is pushing forward or retreating, halve damage
		if (this.pushingForward || this.retreating) damageMult /= 2;
		//	If the character is attacking too fast, reduce damage significantly
		if (this.timers.hit.get() > this.timers.hit.getMax() * HIT_CLOCK_GREEN_ZONE){
			var maxDiff = this.timers.hit.getMax() - (this.timers.hit.getMax() * HIT_CLOCK_GREEN_ZONE);
			var currentDiff = this.timers.hit.get() - (this.timers.hit.getMax() * HIT_CLOCK_GREEN_ZONE);
			var percentDiff = currentDiff / maxDiff;
			damageMult /= 2.5 + percentDiff;
		}
		
		var damage = this.damage * damageMult;
		other.takeDamage(damage, this);
		
		//	Increase the number of consecutive hits
		this.combat.hits ++;
		// If the character is attacking too fast, reduce the benefits of a consecutive hit
		if (this.timers.hit.get() > this.timers.hit.getMax() * HIT_CLOCK_GREEN_ZONE){
			this.combat.hits -= 1.5;
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
		var behavior = AI.Behaviors[name];
		behaviors[name] = new behavior(this);
	}
	c.removeBehavior = function(behavior){
		if (behaviors[behavior.name].onDelete) behaviors[behavior.name].onDelete();
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
	var characters = [];
	
	for (var i in entities){
		if (entities[i].charType && entities[i].alive) {
			characters.push(entities[i]);
		}
	}
	AI.assignGroups(characters);
	for (var i in characters){
		characters[i].runMyBehaviors();
	}
	AI.clearGroups();
}

//	====================================================================================

/*	CharacterModel Class
		Maps textures to sprites and bounding boxes
*/
var CharacterModel = function () { 
	
	var frames = [];
	
	var directions = [];
	
	var layers = [];
	
	var animations = [];
	
	this.setFrame = function(params){
		var f = {};

		f.name = params.name;
		f.width = params.width;
		f.height = params.height;
		f.rectangle = params.rectangle;
		f.offsets = params.offsets;
		f.direction = params.direction;
		f.animation = params.animation;
		f.frameNum = params.frameNum;
		f.spriteSheet = params.spriteSheet;

		frames[f.name] = f;
		
		if (f.direction !== undefined){
			this.setDirection(f.direction, f.name);
			this.setAnimationFrame(f.animation, f.frameNum, f.direction, f.name);
		}
		
	}

	this.getFrames = function(){
		return frames;
	}
	
	this.getFrame = function (name){
		var f = frames[name];
		if (!f) return false;
		return f;
	}
	
	this.setDirection = function(dir, frameName){
		directions[dir] = frameName;
		frames[frameName].direction = dir;
	}
	
	this.getDirection = function(dir){
		return this.getFrame(directions[dir])
	}
	
	this.setLayer = function(textures, name){
		layers[name] = textures;
	}
	
	this.getLayer = function(name){
		return layers[name];
	}
	
	this.getFrameLayer = function(frame, layer){
		var f = _.cloneDeep(frame);
		f.texture = layers[layer][frame.spriteSheet];
		return f;
	}
	
	this.setAnimationFrame = function(name, frameNum, direction, frameName){
		if (!_.isArray(animations[name])) animations[name] = [];
		if (!_.isArray(animations[name][frameNum])) animations[name][frameNum] = [];
		animations[name][frameNum][direction] = frameName;
	}
	
	this.getAnimationFrame = function(name, number, direction){
		if (_.isUndefined(animations[name])) return false;
		if (_.isUndefined(animations[name][number])) return false;
		return this.getFrame(animations[name][number][direction]);
	}
	
	this.getAnimationLength = function(name){
		return animations[name].length;
	}
	
	this.getAnimations = function(){
		return animations;
	}
	
	this.debugDrawLayer = function(name){
		
		var tex = layers[name][0];
		
		return Draw2DSprite.create({
			texture: tex,
			width: tex.width,
			height: tex.height,
			textureRectangle: [0,0,tex.width,tex.height],
			x: 0,
			y: 0,
			color: [1,0,0,1],
			scale: [0.5,0.5]
		})
	}
	
}

CharacterModel.create = function(archive, layers){
	var m = new CharacterModel();
	Graphics.textureManager.loadArchive(TEXTURE_ROOT+archive+".tar", true, null, function(textures){
		//	Load the JSON data for offsets
		Protocol.assetManager.loadJSON(TEXTURE_ROOT+archive+".json", function(params) {
			//	Store the coordinates for the bottom layer, and apply these to all the others
			//	This ensures all the textures will line up
			var spriteCoords = [];
			
			var animations = params.animations;
			//	Add ø to animations object to signify a lack of animation
			if (!_.isUndefined(animations)) animations.ø = 1;
			else animations = {ø: 1};
			
			//	Create a texture for each layer
			for (var i in params.layers) {
				//	Define a list of sprites that will be drawn next to each other
				var sprites = [];
				
				var layerName = params.layers[i];
			
				var coords = { x: 0, y: 0, sheet: 0 };
				var previousSprite;
				
				//	Create each animation rectangle
				for (var anim in animations){

					//	If this is the first layer, set up spriteCoords for this animation
					if (!spriteCoords[anim]) spriteCoords[anim] = { };

					for (var frame = 0; frame < animations[anim]; frame++) {

						if (!spriteCoords[anim][frame]) spriteCoords[anim][frame] = {};
						
						//	For each direction, create a sprite for this frame
						for (var dir = 0; dir < 8; dir++){
							
							//	If this isn't the first layer, coords should be defined already
							if (spriteCoords[anim][frame][dir]) coords = spriteCoords[anim][frame][dir];
							else spriteCoords[anim][frame][dir] = { };
		
							//	Check if this direction is blanked for the layer
							//	This is done in multiple lines rather than with a simple
							//	if(indexOf) to avoid running into undefined "blanks" arrays
							var blankIndex = -1;
							if (params.blanks[layerName]) {
								//	Blanks in Ω will nullify this direction for all animations
								if (_.isArray(params.blanks[layerName].Ω) )
									blankIndex = params.blanks[layerName].Ω.indexOf(dir);
								//	If Ω doesn't nullify the direction, check the current animation
								if (blankIndex == -1) {
									if (_.isArray(params.blanks[layerName][anim]) )
										blankIndex = params.blanks[layerName][anim].indexOf(dir);
								}
							}
							//	If the direction isn't blanked, proceed
							if (blankIndex == -1){
								//	Generate the filename of the layer
								var path;
								if (anim == "ø") path = layerName+"-"+dir+TEXTURE_EXT;
								else path = layerName+"-"+dir+"-"+anim+"-"+frame+TEXTURE_EXT;
					
								//	If this texture is missing, try the un-animated texture,
								//	or log an error if that doesn't work
								if (Graphics.textureManager.isTextureMissing(path)) {
									if (anim !== "ø") {
										path = layerName+"-"+dir+TEXTURE_EXT;
										if (Graphics.textureManager.isTextureMissing(path)) {
											console.log("ERROR: "+path+" is missing");
										}
									}
									else console.log("ERROR: "+path+" is missing");
								}
								//	Even if the texture is missing, still proceed as normal
								//	so that the debug texture will be displayed
						
								//	Load the texture
								var thisFrameTex = Graphics.textureManager.get(path);
								
								//	If adding this texture will exceed a width of 2048, move it down
								if (coords.x + thisFrameTex.width > 2048){
									coords.x = 0;
									coords.y += previousSprite.getHeight();
								}
								//	If adding this texture will exceed a height of 2048, start a new sprite sheet
								if (coords.y + thisFrameTex.height > 2048){
									coords.x = 0;
									coords.y = 0;
									coords.sheet += 1;
								}
								
								//	Check if the current sprite sheet exists
								if (!_.isArray(sprites[coords.sheet])) sprites[coords.sheet] = [];
								
								//	Create a sprite from the texture, and then push it into the list of sprites to draw
								var sprite = Draw2DSprite.create({
									texture: thisFrameTex,
									textureRectangle: Math.device.v4Build(0,0,thisFrameTex.width,thisFrameTex.height),
									width: thisFrameTex.width,
									height: thisFrameTex.height,
									x: coords.x,
									y: coords.y,
									color: Math.device.v4BuildOne(),
									origin: Math.device.v2BuildZero(),
								});
								sprites[coords.sheet].push(sprite);
								previousSprite = sprite;
							}
						
							//	If this is the first layer, set up the frame for the model
							if (!m.getAnimationFrame(anim, frame, dir)){
								m.setFrame({
									name: dir+"-"+anim+"-"+frame,
									rectangle: [coords.x,coords.y,coords.x+thisFrameTex.width,coords.y+thisFrameTex.height],
									width: thisFrameTex.width,
									height: thisFrameTex.height,
									offsets: params.offsets[dir],
									spriteSheet: coords.sheet,
									direction: dir,
									animation: anim,
									frameNum: frame,
								});
								//	Store this sprite's coordinates and then move it to the right of the previous frame
								spriteCoords[anim][frame][dir].x = coords.x;
								spriteCoords[anim][frame][dir].y = coords.y;
								spriteCoords[anim][frame][dir].sheet = coords.sheet;
								coords.x += thisFrameTex.width;
							}
						} // End of frame sprite creation
						
					} // End of animation sprite creation
					
				}
				//	Draw all the sprites into the sprite sheets
				Graphics.draw2D.configure({
					scaleMode: 'scale',
					viewportRectangle: [0,0,2048,2048]
				});
				var sheets = [];
				for (var i in sprites){
					var target = Graphics.draw2D.createRenderTarget({
						backBuffer: true,
						width:2048,
						height:2048,
					});
					Graphics.draw2D.setRenderTarget(target);
					Graphics.draw2D.begin("npot-alpha");
					for (var j in sprites[i]){
						Graphics.draw2D.drawSprite(sprites[i][j]);
					}
					Graphics.draw2D.end();
					Graphics.draw2D.setBackBuffer();
					var tex = Graphics.draw2D.getRenderTargetTexture(target);
					Graphics.draw2D.getRenderTarget(target).destroy();
					sheets.push(tex);
					
					
				}
				m.setLayer(sheets, layerName);
			}	
		});
	});
	
	return m;
}