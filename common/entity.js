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
	this.hitbox.setRotation(0);
	
	//	Mark the Entity as no longer moving (which may be reset next frame if it's still moving)
	this.movement = null; 
	this.updatePosition();
	
	//	Run anything that's not supposed to happen until the final update phase
	if (this.updateFunctions) {
		for (var i in this.updateFunctions) {
			this.updateFunctions[i]();
		}
		//	Delete the one-time update functions
		delete this.updateFunctions;
	}
	
	if (this.updateExtension) this.updateExtension();
}

/*	addUpdateFunction
		Reserve some code for a one-time trigger during the update phase.
		Used in case a function called before e.g. waypoints or physics
		needs to wait until after these are finished before executing.
*/
Entity.prototype.addUpdateFunction = function(fun){
	if (!this.updateFunctions) this.updateFunctions = [];
	this.updateFunctions.push(fun);
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
Entity.prototype.isAtPosition = function(x,y,z){
	if (x.length) {
		y = x[1];
		z = x[2];
		x = x[0];
	}
	z = z || 0;
	var truth = 0;
	if (Math.abs(x-this.x) < 1) truth++;
	if (Math.abs(y-this.y) < 1) truth++;
	if (Math.abs(z-this.z) < 1) truth++;
	if (truth == 3) return true;
	else return false;
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
	if ( !_.has(this.savedState,property) || overwrite ) {
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
	if (this.drawExtension) this.drawExtension();
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
	hitbox.setAngularDrag(1);
	return hitbox;
}
Entity.prototype.createHitbox = function(width,height,xOffset,yOffset){
	xOffset = xOffset || 0;
	yOffset = yOffset || 0;
	this.hitbox = Entity.createHitbox(width,height,xOffset,yOffset);
	this.hitbox.entity = this;
	this.hitbox.width = width;
	this.hitbox.height = height;
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
	range = range || this.speed;
	var speed = speedOverride || this.speed * this.speedMult;
	//	Slow the Entity down the closer it gets to its target
	var distance = Math.distanceXY([targetX,targetY],[this.x,this.y]);
	var slowdown = (distance/range);
	if (slowdown < 1) {
		speed *= slowdown;
	}
	
	//	Calculate the velocity destination in order to achieve the appropriate speed
	var tick = 60/(distance/speed);
	//	Avoid dividing by zero
	if (speed == 0) tick = 60;
	
	//	Push the Entity towards the destination
	this.hitbox.setVelocityFromPosition([targetX,targetY],0,1/tick);
	//	Mark the Entity as moving. This gets reset at the end of the frame.
	this.movement = true;

}

/*	addWaypoint, overwriteWaypoint, and nextWaypoint
		Manipulates this Entity's array of waypoints
*/
Entity.prototype.addWaypoint = function(params){
	this.waypoints.push(params);
}

Entity.prototype.overwriteWaypoint = function(index, params){
	this.waypoints.splice(index,1,params);
}

Entity.prototype.nextWaypoint = function(){
	this.waypoints.splice(0,1);
}

Entity.prototype.getWaypoint = function(index){
	index = index || 0;
	if (this.waypoints[index])
		return ([this.waypoints[index].x,this.waypoints[index].y]);
	else return false;
}

Entity.prototype.hasWaypoint = function(x, y){
	if (x.length) {
		y = x[1];
		x = x[0];
	}
	var result = false;
	for (var i in this.waypoints){
		var me = this.waypoints[i];
		if ( (me.x == x) && (me.y == y) ) {
			result = true;
		}
	}
	return result;
}

/*	approachCurrentWaypoint
		Makes the Entity approach its current waypoint. This is usually called by the EntityManager
		each frame.
*/
Entity.prototype.approachCurrentWaypoint = function(){
	w = this.waypoints[0];
	//	Approach the current waypoint's x and y
	this.approach(w.x,w.y, w.range, w.override);
	
	//	Determine if the Entity has reached its waypoint
	var pos = this.getPosition();
	var maxDistance = 1;
	if (this.waypoints[0].range && this.waypoints.length > 1) maxDistance = this.speed;
	if ( Math.distanceXY(pos,[w.x,w.y]) < maxDistance){
		this.nextWaypoint();
	}
	// If the waypoint has a timer, lower it (used mostly for collision handling)
	if (typeof w.timer != "undefined") {
		w.timer -= GameState.getTimeDelta();
		// If the timer has expired, move to the next waypoint
		if (w.timer <= 0) {
			this.nextWaypoint();
		}
	}
}

Entity.prototype.makePathfindingGrid = function(x1, y1, x2, y2){
	var gridOrigin = [x1, y1];
	var tileSize = 32;
	var gridWidth = Math.round((x2-x1)/tileSize);
	var gridHeight = Math.round((y2-y1)/tileSize);
	
	var matrix = [];
	var width = this.hitbox.width;
	var height = this.hitbox.height;
	var blocks = 0;
	//	For every row...
	for (var i = 0; i < gridHeight; i++){
		var row = [];
		//	Find the y coordinate in the world that this row corresponds to
		var y = ( (tileSize/2)+(tileSize*i) ) + gridOrigin[1];
		//	For every cell of this row...
		for (var j = 0; j < gridWidth; j++){
			//	Find the x coordinate in the world that this column corresponds to
			var x = ( (tileSize/2)+(tileSize*j) ) + gridOrigin[0];
			//	Project this character's hitbox onto the x and y coordinates to see
			//	if it would fit in the space. If not, mark the cell as obstructed.
			if (this.manager.hitboxProjectionTest(this,[x,y],true)) {
				row.push(1);
			}
			else row.push(0);
		}
		matrix.push(row);
	}
	
	this.pathfindingGrid = { 
		origin: gridOrigin,
		width: gridWidth,
		height: gridHeight,
		tileSize: tileSize,
		matrix: matrix,
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
		e.manager = this;
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
				if(entities[i].permeable) {
					if (entities[i].hitbox.world == world) {
						world.removeRigidBody(entities[i].hitbox);
					}
				}
				else if (entities[i].hitbox.world != world) {
					world.addRigidBody(entities[i].hitbox);
				}
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
			if (entities[i].hitbox && entities[i].hitbox.isDynamic()) {
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
	
	/*	detectCollisions
			Detect if Entities are colliding, and t hen mark them as such.
	*/
	this.detectCollisions = function(){
		var detect = function(arbiters) {
			if (arbiters.length){
				for (var i in arbiters){
					var me = arbiters[i];
					if(me.contacts[0].getPenetration() > 0) {
						var normal = Math.vNeg(me.getNormal());


						me.bodyA.entity.affect("collision", me.getNormal());
						me.bodyB.entity.affect("collision", Math.vNeg(me.getNormal()));
					}
				}
			}
		}
		detect(world.dynamicArbiters);
		detect(world.staticArbiters);
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
	/*	sweepTestRaidus
			Return all the Entities that intersect an effect radius
	*/
	this.sweepTestRadius = function(entity){
		var intersects = [];
		for (var i in entities){
			if (entities[i].isInRadius(entity))
				intersects.push(entities[i]);
		}
		return intersects;
	}
	
	/*	rayCastTestAB
			Determines if Entity A has an unobstructed line to Entity B
	*/
	this.rayCastTestAB = function(a, b, maxFactor){
		var ray = {
			origin: [a.x,a.y],
			direction: Math.unitVector(a.getPosition(), b.getPosition()),
			maxFactor: maxFactor || Math.distanceXY(a.getPosition(), b.getPosition()),
		}
		var result = world.rayCast(ray, true, function(ray, tempResult){
			if (tempResult.shape === a.hitbox.shapes[0]){
				return false;
			}
			return true;
		});
		
		
		
		if (result !== null) {
			return (result.shape === b.hitbox.shapes[0]);
		}
		else return false;
	}
	
	/*	rayCastTestXY
			Determines if an Entity has an unobstructed line to a point
	*/
	this.rayCastTestXY = function(a, point, maxFactor){
		var ray = {
			origin: [a.x,a.y],
			direction: Math.unitVector(a.getPosition(), point),
			maxFactor: maxFactor || Math.distanceXY(a.getPosition(), point),
		}

		var result = world.rayCast(ray, true, function(ray, tempResult){
			if (tempResult.shape === a.hitbox.shapes[0]){
				return false;
			}
			return true;
		});
	
		return result;
	}
	
	this.hitboxProjectionTest = function(a, point, staticOnly){
		var store = [];
		var rectangle = [point[0] - (a.hitbox.width/2), point[1] - (a.hitbox.height/2), point[0] + (a.hitbox.width/2), point[1] + (a.hitbox.height/2)];
		if (world.bodyRectangleQuery(rectangle,store)) {
			for (var i in store){
				if (store[i] == a.hitbox) store.splice(i,1);
				else if (staticOnly && store[i]){
					if(!store[i].isStatic()) store.splice(i,1);
				} 
			}
			return store.length;
		}
		else return false;
	}
	
	this.getWorld = function(){
		return world;
	}
	
}

EntityManager.create = function(){
	return new EntityManager();
}