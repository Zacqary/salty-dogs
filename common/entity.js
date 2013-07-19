/* 
	================================================
	====================ENTITY======================
	================================================
	
	Includes:
	- Entity
	- EntityManager
	
*/

/*	Entity Class
		A game entity, including position coordinates, sprite data, movement data
		and functions, and some physics and area-of-effect stuff
*/
var Entity = function(){ }

// 	Default entity constant. This can be overridden by anything in /app that extends Entity().
//	Helps functions determine what type of Entity they're dealing with.
var ENT_DEFAULT = "ENT_DEFAULT";

Entity.create = function(params){
	var e = new Entity();
	e.name = params.name || makeid(); //Generate a unique ID for the entity
	e.entType = ENT_DEFAULT;
	e.x = params.x || 0.0;
	e.y = params.y || 0.0;
	e.z = params.z || 0.0;
	e.zIndex = params.zIndex || 0;
	
	e.visible = params.visible || true;
	e.permeable = params.permeable || false; 
	//	If permeable, this entity doesn't trigger collision detection

	e.hitbox = params.hitbox;

	e.effect = params.effect || {};
	
	e.speed = params.speed || 1;
	e.speedMult = params.speedMult || 1; //Multiplier for the speed value
	e.waypoints = [];
	
	e.sprite = Graphics.EntitySprite.create({texture: null, width:1, height:1, textureRectangle: [0,0,0,0], color: [0,0,0,0]},e,0,0);
	
	//	Create a textureInstance for this entity
	Graphics.textureManager.add(e.name, null);
	e.textureInstance = Graphics.textureManager.getInstance(e.name);
	//	Whenever the textureInstance changes, update the EntitySprite's texture
	e.textureInstance.subscribeTextureChanged(function(instance){
		e.sprite.setTexture(instance.getTexture());
		e.sprite.setTextureRectangle([0, 0, e.sprite.getWidth(), e.sprite.getHeight()]);
	});

	if (e.hitbox) {
		e.hitbox.setPosition([e.x, e.y]);
	}

	return e;
}

Entity.prototype.clone = function(){
	var e = Entity.create({
		x: this.x, 
		y: this.y,
		z: this.z,
		zIndex: this.zIndex,
		visible: this.visible,
		permeable: this.permeable,
		speed: this.speed,
		speedMult: this.speedMult,
	});
	// 	Physics objects don't clone properly, so we need to do this
	//	whole song and dance.
	e.createEffectRadius(this.effect.radius.shapes[0].getRadius());
	var effect = {types: this.effect.types, doThis: this.effect.doThis};
	e.createEffect(effect);
	
	return e;
}

/*	============================
	=====Entity Functions=======
	============================ 
*/

/*	update
		Update the entity. This is usually called by the EntityManager before drawing.
*/
Entity.prototype.update = function(){
	//	Mark the Entity as no longer moving (which may be reset next frame if it's still moving)
	this.movement = null; 
	this.hitbox.setRotation(0);
	this.updatePosition();
}

//	Position
//	========
	
//	setPosition and getPosition
Entity.prototype.setPosition = function(x,y,z){
	if (x.length) {
		y = x[1];
		z = x[2];
		x = x[0];
	}
	this.x = x;
	this.y = y;
	this.z = z || this.z;
	
	if (this.hitbox) {
		this.hitbox.setPosition([this.x, this.y]);
	}
}

Entity.prototype.getPosition = function(){
	return [this.x,this.y,this.z];
}

Entity.prototype.getSpriteOffsetPosition = function(){
	return[this.x+this.sprite.xOffset, this.y+this.sprite.yOffset];
}

Entity.prototype.getHitboxOffsetPosition = function(){
	return[this.x+this.hitbox.xOffset, this.y+this.hitbox.yOffset];
}

/*	setZIndex and getZIndex
		Set and get the value which determines which entities get drawn first
		and layered on top of one another.
*/
Entity.prototype.setZIndex = function(index){
	this.zIndex = index;
}

Entity.prototype.getZIndex = function(){
	return this.zIndex;
}

/*	updatePosition
		Update the EntitySprite on screen to reflect the Entity's position. 
		Also updates the hitbox and effect radius.
*/
Entity.prototype.updatePosition = function updatePosition(){
	var hbp = this.hitbox.getPosition();
	this.x = hbp[0];
	this.y = hbp[1];
	if (this.sprite) this.sprite.update();
	if (this.effect.radius) {
		this.effect.radius.setPosition([this.x, this.y]);
	}
}


//	Effects
//	=======
	
/*	createEffect
		Passes an effect object. Should include a types array and a doThis function.
		If the entity already has an effect radius, it applies it to the new effect.
*/
Entity.prototype.createEffect = function(effect){
	var radius;
	if(this.effect.radius)
		radius = this.effect.radius;
	this.effect = effect;
	this.effect.radius = radius;
}

/*	saveState
		Saves a property in memory, to be reset back to after this frame.
		This is used to remember the "old" value before applying an effect. If
		overwrite is false, this will not overwrite an already-existing saved state.
*/
Entity.prototype.saveState = function(property, overwrite){
	if (!this.savedState)
		this.savedState = {};
	if ( (!this.savedState[property]) || (overwrite) ) {
		this.savedState[property] = this[property];
	}
}

/*	resetState
		Restores all of the existing saved states for this Entity. This is usually called
		by the EntityManager at the beginning of each frame.
*/
Entity.prototype.resetState = function(){
	if (this.savedState) {
		for (var i in this.savedState) {
			this[i] = this.savedState[i];
		}
		this.savedState = null;
		if (this.radStore) {
			this.effect.radius.shapes[0].setRadius(this.radStore);
			this.radStore = null;
		}
	}
}

/*	affect
		Apply an effect to a property. This will store it in a saved state, then change it
		to the new value for the remainder of this frame.
*/
Entity.prototype.affect = function(property, value){
	this.saveState(property);
	this[property] = value;
}

/*	affectRadius
		Because physics objects are very temperamental, effect radii need to be coddled to
		with their own special function. And cookies.
*/
Entity.prototype.affectRadius = function(radius){
	this.radStore = this.effect.radius.shapes[0].getRadius();
	this.saveState("radStore");
	this.effect.radius.shapes[0].setRadius(radius);
}

/*	applyMyEffect
		Called when an Entity enters this Entity's effect radius. Determines if it's the type
		of entity that gets affected, and then applies the effect's doThis to it.
*/
Entity.prototype.applyMyEffect = function(it){
	for (var i in this.effect.types){
		if (it.entType === this.effect.types[i])
			this.effect.doThis(it, this);
	} 
}

//	Graphics
//	========

/*	createSprite
		Creates an EntitySprite for this entity.
*/
Entity.prototype.createSprite = function(spriteParams, xOffset, yOffset){
	xOffset = xOffset || 0;
	yOffset = yOffset || 0;
	this.sprite = Graphics.EntitySprite.create(spriteParams, this, xOffset, yOffset);
}

/*	getTexture and setTexture
		Gets and sets this Entity's TextureInstance. Setting it will cause the EntitySprite
		to update its texture.
*/
Entity.prototype.getTexture = function(){
	this.textureInstance.getTexture();
}
Entity.prototype.setTexture = function(texture){
	this.textureInstance.setTexture(texture);
}

/*	composeTexture
		Passes in several layers to make into a composite texture for this Entity.
*/
Entity.prototype.composeTexture = function(layers){
	this.setTexture(Graphics.makeCompositeTexture(layers));
}

/*	setSpriteOffset
		Set the x and y offsets for the EntitySprite. This will cause the sprite to be
		drawn at a different origin than the Entity's position itself.
*/
Entity.prototype.setSpriteOffset = function(x,y) {
	this.sprite.xOffset = x;
	this.sprite.yOffset = y;
}

/*	draw
		Draws this Entity's EntitySprite
*/
Entity.prototype.draw = function draw(){
	if (this.visible) this.sprite.draw();
}

/* 	drawPhysDebug
		Draws this Entity's hitbox and effect radius
*/
Entity.prototype.drawPhysDebug = function drawPhysDebug(){
	if (this.hitbox){
		Graphics.drawEntityPhysics(this.hitbox);
	}
	if (this.effect.radius){
		Graphics.drawEntityPhysics(this.effect.radius);
	}
}

//	Physics
//	=======

/*	createHitbox
		Creates a rectangle to serve as this Entity's hitbox.
		Also provides a generic function to create a hitbox independent of an Entity.
*/
Entity.createHitbox = function(width,height){
	var shape = Physics.device.createPolygonShape({
		vertices: Physics.device.createBoxVertices(width,height) 
	});
 	var hitbox = Physics.createBasicBody(shape);
	return hitbox;
}
Entity.prototype.createHitbox = function(width,height,xOffset,yOffset){
	xOffset = xOffset || 0;
	yOffset = yOffset || 0;
	this.hitbox = Entity.createHitbox(width,height,xOffset,yOffset);
	this.hitbox.setPosition([this.x,this.y]);
}
/*	createEffectRadius
		It's like createHitbox, but for a radius.
*/
Entity.createEffectRadius = function(radius){
	var shape = Physics.device.createCircleShape({
		radius: radius,
		origin: [0,0]
	});
	return Physics.createBasicBody(shape, 'kinematic');
}
Entity.prototype.createEffectRadius = function(radius){
	this.effect.radius = Entity.createEffectRadius(radius);
}

Entity.prototype.useHitboxAsEffectRadius = function(hitbox){
	hitbox = hitbox || this.hitbox;
	this.effect.radius = hitbox;
}

//	Positioning
//	===========
	
/*	isInRadius
		Determines if an Entity is within the effect radius of another Entity.
*/
Entity.prototype.isInRadius = function(entity){
	if (entity == this) return false;
	
	// Only perform this check if this Entity has a hitbox and the other Entity has a radius
	if ( (entity.effect.radius) && (this.hitbox) )
		return Physics.collisionUtils.intersects(this.hitbox.shapes[0], entity.effect.radius.shapes[0]);
	else return false;
}

//	Movement
//	====================

/*	approach
		Makes this Entity approach a point. It moves slower the closer it is.
*/
Entity.prototype.approach = function(targetX, targetY, range, speedOverride){
	//	We want to move the Entity at its speed modified by its speedMult, 
	//	unless overridden with a specific speed
	var xSpeed = speedOverride || this.speed * this.speedMult;
	var ySpeed = xSpeed;

	var distance = Math.distanceXY([targetX,targetY],[this.x,this.y]);
	var speed = speedOverride || this.speed * this.speedMult;
	var slowdown = (distance/range);
	if (slowdown < 1) {
		speed *= slowdown;
	}
	
	var tick = 60/(distance/speed);
	
	//	Push the Entity towards the destination
	var pos = this.hitbox.getPosition();
	if ( (targetX != pos[0]) || (targetY != pos[1]) ){
		this.hitbox.setVelocityFromPosition([targetX,targetY],0,1/tick);
		//	Mark the Entity as moving, and at what speed. This gets reset at the end of the frame.
		this.movement = {
			x: xSpeed,
			y: ySpeed,
		}
	}
}

/*	addWaypoint, overwriteWaypoint, and nextWaypoint
		Manipulates this Entity's array of waypoints
*/
Entity.prototype.addWaypoint = function(x, y, range, override, timer){
	this.waypoints.push([x,y,range, override, timer]);
}

Entity.prototype.overwriteWaypoint = function(index, x, y, range, override, timer){
	this.waypoints.splice(0,1,[x,y,range, override, timer]);
}

Entity.prototype.nextWaypoint = function(){
	this.waypoints.splice(0,1);
}
/*	approachCurrentWaypoint
		Makes the Entity approach its current waypoint. This is usually called by the EntityManager
		each frame.
*/
Entity.prototype.approachCurrentWaypoint = function(){
	w = this.waypoints[0];
	//	Approach the current waypoint's x and y
	this.approach(w[0],w[1], w[2], w[3]);
	
	//	Determine if the Entity has reached its waypoint
	var pos = this.getPosition();
	if ( Math.distanceXY(pos,w) < 1){
		this.nextWaypoint();
	}
	// If the waypoint has a timer, lower it (used mostly for collision handling)
	if (typeof w[4] != "undefined") {
		w[4] -= GameState.getTimeDelta();
		// If the timer has expired, move to the next waypoint
		if (w[4] <= 0) {
			this.nextWaypoint();
		}
	}
}

//	===================
/*	EntityManager Class
		Manages all of the Entities in a level. Stores them in a private array called entities.
*/

var EntityManager = function(){
	
	var entities = [];
	var world = Physics.device.createWorld({ 
			gravity: [0, 0]
		});
	
	this.add = function(e){
		entities[e.name] = e;
		//if (e.hitbox && !e.permeable) world.addRigidBody(e.hitbox);
	}
	
	this.get = function(name){
		return entities[name];
	}
	
	this.getEntities = function(){
		return entities;
	}
	
	this.getWorld = function(){
		return world;
	}
	
	this.createEntity = function(params){
		var e = Entity.create(params);
		this.add(e);
		return e;
	}
	
	this.runPhysics = function(){
		while(world.simulatedTime < GameState.getTime()){
			world.step(1/60);
		}
	}
	
	/*	updateAll
			Update all of this manager's Entities. Called just before drawing the frame.
	*/
	this.updateAll = function(){
		for (var i in entities){
			if(entities[i].hitbox) {
				if(entities[i].permeable) world.removeRigidBody(entities[i].hitbox);
				else world.addRigidBody(entities[i].hitbox);
			}
			entities[i].update();
		}
	}
	/*	resetAll
			Reset all of this manager's Entities to their saved states. Called at the beginning
			of each frame.
	*/	
	this.resetAll = function(){
		for (var i in entities){
			entities[i].resetState();
		}
	}
	/*	drawAll
			Draws all of this manager's Entities.
	*/	
	this.drawAll = function(debug){
		//	Copy the entities array into a new one so we can reorder them
		var orderedEnts = [];
		for (var i in entities) {
			if (entities[i].sprite)
				orderedEnts.push(entities[i]);
		}
		
		//	Layer the Entities on top of each other based on their y value.
		//	Things further down the screen get drawn on top of things further up.
		orderedEnts.sort(function(a,b){
			if (a.y + a.sprite.yOffset < b.y + b.sprite.yOffset)
				return -1;
			else if (a.y + a.sprite.yOffset > b.y + b.sprite.yOffset)
				return 1;
			else return 0;
		});
		
		//	Now sort them by zIndex
		orderedEnts.sort(function(a,b){
			if (a.zIndex < b.zIndex)
				return -1;
			else if (a.zIndex > b.zIndex)
				return 1;
			else return 0;
		});
		
		//	Make sure we're not drawing anything
		Graphics.draw2D.end();
		Graphics.debugDraw.end();
		
		Graphics.draw2D.configure({
			scaleMode: 'scale',
			viewportRectangle: GameState.getCamera().getViewport()
		});
		Graphics.draw2D.begin("alpha");
		//	Draw each entity in order
		for (var i in orderedEnts){
			orderedEnts[i].draw();
		}
		Graphics.draw2D.end();
		
		//	If debug drawing is enabled, draw all the Entities' physics objects
		if(debug) {
			Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
			Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
			Graphics.debugDraw.begin();
			for (var i in orderedEnts){
				orderedEnts[i].drawPhysDebug();
			}
			Graphics.debugDraw.end();
		}
	}
	
	/*	allToCurrentWaypoint
			Make all the Entities appraoch their current waypoint. Usually called just before updateAll.
	*/
	this.allToCurrentWaypoint = function(){
		for (var i in entities) {
			//	If an Entity has a waypoint, make it approach it
			if (entities[i].waypoints.length > 0){
				entities[i].approachCurrentWaypoint();
			}
			//	Allow the physics simulation to move moving entities, and to hold static ones in place
			if (entities[i].hitbox) {
				if (entities[i].movement){
					entities[i].hitbox.setLinearDrag(0);
					entities[i].hitbox.setMass(1);
				}
				else {
					entities[i].hitbox.setLinearDrag(1);
					entities[i].hitbox.setMass(9999);
				}
			}
		}
	}
	
	/*	applyAllEffects
			Apply all the Entities' effects to anything in their radii. Usually called after resetAll.
	*/
	this.applyAllEffects = function(){
		for (var i in entities) {
			var me = entities[i];
			for (var j in entities) {
				var it = entities[j];
				if ( (me.isInRadius(it)) && (me != it) )
					it.applyMyEffect(me);
			}
		}
	}
	
	/*	radiusSweepTest
			Return all the effect radii that an Entity intersects
	*/
	this.radiusSweepTest = function(entity){
		var intersects = [];
		for (var i in entities){
			if (entity.isInRadius(entities[i]))
				intersects.push(entities[i]);
		}
		return intersects;
	}
	
	/*	rayCastTest
			Determines if two Entities have a clear line to one another
	*/
	this.rayCastTest = function(a, b){
		var ray = {
			origin: [a.x,a.y],
			direction: [b.x - a.x, b.y - a.y],
			maxFactor: 2
		}
		var result = world.rayCast(ray, true, function(ray, result){
			if (result.shape === a.hitbox.shapes[0]){
				return false;
			}
			return true;
		});
		return (result.shape === b.hitbox.shapes[0]);
	}
	
}

EntityManager.create = function(){
	return new EntityManager();
}