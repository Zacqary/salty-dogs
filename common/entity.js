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
	
	e.speed = params.speed || 0;
	e.speedMult = params.speedMult || 1; //Multiplier for the speed value
	e.waypoints = [];
	
	e.sprite = params.sprite;
	//	Create a textureInstance for this entity
	Graphics.textureManager.add(e.name, null);
	e.textureInstance = Graphics.textureManager.getInstance(e.name);
	//	Whenever the textureInstance changes, update the EntitySprite's texture
	e.textureInstance.subscribeTextureChanged(function(instance){
		e.sprite.setTexture(instance.getTexture());
		e.sprite.setTextureRectangle([0, 0, e.sprite.getWidth(), e.sprite.getHeight()]);
	});
	
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
	
	this.updatePosition();
}

//	Position
//	========
	
//	setPosition and getPosition
Entity.prototype.setPosition = function(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z || this.z;
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
	this.sprite.update(GameState.getCamera());
	if (this.hitbox) {
		this.hitbox.setPosition([this.sprite.x + this.hitbox.xOffset, this.sprite.y + this.hitbox.yOffset]);
	}
	if (this.effect.radius) {
		this.effect.radius.setPosition([this.sprite.x, this.sprite.y]);
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
Entity.prototype.createSprite = function(spriteParams, x0ffset, yOffset){
	this.sprite = Graphics.EntitySprite.create(spriteParams, this, x0ffset, yOffset);
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
	this.sprite.draw();
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

//	Physics and Movement
//	====================

/*	createHitbox
		Creates a rectangle to serve as this Entity's hitbox.
		Also provides a generic function to create a hitbox independent of an Entity.
*/
Entity.createHitbox = function(width,height,xOffset,yOffset){
	var shape = Physics.device.createPolygonShape({
		vertices: Physics.device.createBoxVertices(width,height) 
	});
 	var hitbox = Physics.createBasicBody(shape);
	hitbox.xOffset = xOffset || 0;
	hitbox.yOffset = yOffset || 0;
	return hitbox;
}
Entity.prototype.createHitbox = function(width,height,xOffset,yOffset){
	xOffset = xOffset || 0;
	yOffset = yOffset || 0;
	this.hitbox = Entity.createHitbox(width,height,xOffset,yOffset);
}
/*	createEffectRadius
		It's like createHitbox, but for a radius.
*/
Entity.createEffectRadius = function(radius){
	var shape = Physics.device.createCircleShape({
		radius: radius,
		origin: [0,0]
	});
	return Physics.createBasicBody(shape, 'dynamic');
}
Entity.prototype.createEffectRadius = function(radius){
	this.effect.radius = Entity.createEffectRadius(radius);
}

Entity.prototype.useHitboxAsEffectRadius = function(hitbox){
	hitbox = hitbox || this.hitbox;
	this.effect.radius = hitbox;
}

/*	approach
		Makes this Entity approach a point. It moves slower the closer it is.
*/
Entity.prototype.approach = function(targetX, targetY, range, speedOverride){
	//	We want to move the Entity at its speed modified by its speedMult, 
	//	unless overridden with a specific speed
	var xSpeed = speedOverride || this.speed * this.speedMult;
	var ySpeed = xSpeed;
	//	Determine how close the Entity is to its target point
	var xDiff = (Math.abs(this.x - targetX) );
	var yDiff = (Math.abs(this.y - targetY) );
	//	Slow the Entity down the closer it is to the target.
	//	The range value determines when to start slowing it down.
	xSpeed *= (xDiff/range);
	ySpeed *= (yDiff/range);
	//	Determine if the entity is above or below, left or right of its target,
	//	and then move it closer
	if (this.x < targetX) {
		this.x += xSpeed;
	}
	else if (this.x > targetX) {
		this.x -= xSpeed;
	}
	if (this.y < targetY) {
		this.y += ySpeed;
	}
	else if (this.y > targetY) {
		this.y -= ySpeed;
	}
	//	Mark the Entity as moving, and at what speed. This gets reset at the end of the frame.
	this.movement = {
		x: xSpeed,
		y: ySpeed,
	}
}

/*	isInRadius
		Determines if an Entity is within the effect radius of another Entity.
*/
Entity.prototype.isInRadius = function(entity){
	// Only perform this check if this Entity has a hitbox and the other Entity has a radius
	if ( (entity.effect.radius) && (this.hitbox) )
		return Physics.collisionUtils.intersects(this.hitbox.shapes[0], entity.effect.radius.shapes[0]);
	else return false;
}
/*	addWaypoint, overwriteWaypoint, and nextWaypoint
		Manipulates this Entity's array of waypoints
*/
Entity.prototype.addWaypoint = function(x, y){
	this.waypoints.push([x,y]);
}

Entity.prototype.overwriteWaypoint = function(index, x, y){
	this.waypoints.splice(0,1,[x,y]);
}

Entity.prototype.nextWaypoint = function(){
	this.waypoints.splice(0,1);
}
/*	approachCurrentWaypoint
		Makes the Entity approach its current waypoint. This is usually called by the EntityManager
		each frame.
*/
Entity.prototype.approachCurrentWaypoint = function(range, override){
	override = override || this.speedMult;
	range = range || 10;
	w = this.waypoints[0];
	//	Approach the current waypoint's x and y
	this.approach(w[0],w[1], range, override);
	//	Determine if the Entity has reached its waypoint
	var pos = this.getPosition();
	var speed = this.speed * this.speedMult;
	if (override) speed = this.speed * override;
	//	If the Entity's speed value is greater than its distance from the waypoint,
	//	move to the next waypoint.
	if ( (Math.abs(pos[0]-w[0]) < speed) && (Math.abs(pos[1]-w[1]) < speed) ) {
		this.nextWaypoint();
	}
}

//	===================
/*	EntityManager Class
		Manages all of the Entities in a level. Stores them in a private array called entities.
*/

var EntityManager = function(){
	
	var entities = [];
	
	this.add = function(e){
		entities[e.name] = e;
	}
	
	this.get = function(name){
		return entities[name];
	}
	
	this.getEntities = function(){
		return entities;
	}
	
	this.createEntity = function(params){
		var e = Entity.create(params);
		entities[e.name] = e;
		return e;
	}
	
	/*	updateAll
			Update all of this manager's Entities. Called just before drawing the frame.
	*/
	this.updateAll = function(){
		for (var i in entities){
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
		for (var i in entities) orderedEnts.push(entities[i]);
		
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

		Graphics.draw2D.begin("alpha");
		//	Draw each entity in order
		for (var i in orderedEnts){
			orderedEnts[i].draw();
		}
		Graphics.draw2D.end();
		
		//	If debug drawing is enabled, draw all the Entities' physics objects
		if(debug) {
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
				entities[i].approachCurrentWaypoint(10,1);
			}
			//	Bounce this Entity off of any hitboxes it collides with
			if (entities[i].movement){
				for (var j in entities) {
					if ( (!entities[j].permeable) && (entities[j] != entities[i]) )
						Physics.entityBounce(entities[i],entities[j]);
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
}

EntityManager.create = function(){
	return new EntityManager();
}