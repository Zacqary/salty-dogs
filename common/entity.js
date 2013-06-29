var Entity = function(){ };

Entity.create = function(params){
	var e = new Entity();
	e.name = params.name || makeid();
	e.x = params.x || 0.0;
	e.y = params.y || 0.0;
	e.z = params.z || 0.0;
	e.zIndex = 0;
	e.visible = params.visible || true;
	e.speed = params.speed || 0;
	e.speedMult = params.speedMult || 1;
	e.hitbox = params.hitbox;
	e.effectRadius = params.effectRadius;
	e.waypoints = [];
	
	e.sprite = params.sprite;
	Graphics.textureManager.add(e.name, null);
	e.textureInstance = Graphics.textureManager.getInstance(e.name);
	e.textureInstance.subscribeTextureChanged(function(instance){
		e.sprite.setTexture(instance.getTexture());
		e.sprite.setTextureRectangle([0, 0, e.sprite.getWidth(), e.sprite.getHeight()]);
	});
	
	return e;
};

Entity.prototype.update = function(){
	this.updatePosition();
};

Entity.prototype.setPosition = function(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
};

Entity.prototype.getPosition = function(){
	return [this.x,this.y,this.z];
};

Entity.prototype.setZIndex = function(index){
	this.zIndex = index;
};

Entity.prototype.getZIndex = function(){
	return this.zIndex;
};

Entity.prototype.createSprite = function(spriteParams, x0ffset, yOffset){
	this.sprite = Graphics.EntitySprite.create(spriteParams, this, x0ffset, yOffset);
};

Entity.prototype.getTexture = function(){
	this.textureInstance.getTexture();
};

Entity.prototype.setTexture = function(texture){
	this.textureInstance.setTexture(texture);
};

Entity.prototype.composeTexture = function(layers){
	this.setTexture(Graphics.makeCompositeTexture(layers));
};

Entity.prototype.setSpriteOffset = function(x,y) {
	this.sprite.xOffset = x;
	this.sprite.yOffset = y;
};

Entity.prototype.draw = function draw(){
	this.movement = null;
	this.updatePosition(this, this.sprite, GameState.getCamera());
	this.sprite.draw();
};

Entity.prototype.drawPhysDebug = function drawPhysDebug(){
	if (this.hitbox){
		Graphics.drawEntityPhysics(this.hitbox);
	}
	if (this.effectRadius){
		Graphics.drawEntityPhysics(this.effectRadius);
	}
};

Entity.prototype.updatePosition = function updatePosition(){
	this.sprite.update(GameState.getCamera());
	if (this.hitbox) {
		this.hitbox.setPosition([this.sprite.x + this.hitbox.xOffset, this.sprite.y + this.hitbox.yOffset]);
	}
	if (this.effectRadius) {
		this.effectRadius.setPosition([this.sprite.x, this.sprite.y]);
	}
}

Entity.prototype.createHitbox = function(width,height,xOffset,yOffset){
	var shape = Physics.device.createPolygonShape({
		vertices: Physics.device.createBoxVertices(width,height) 
	});
	this.hitbox = Physics.createBasicBody(shape);
	this.hitbox.xOffset = xOffset || 0;
	this.hitbox.yOffset = yOffset || 0;
};

Entity.prototype.createEffectRadius = function(radius){
	var shape = Physics.device.createCircleShape({
		radius: radius,
		origin: [0,0]
	});
	this.effectRadius = Physics.createBasicBody(shape, 'dynamic');
};

Entity.prototype.approach = function(targetX, targetY, range, speedOverride){
	var xSpeed = speedOverride || this.speed * this.speedMult;
	var ySpeed = xSpeed;
	var xDiff = (Math.abs(this.x - targetX) );
	var yDiff = (Math.abs(this.y - targetY) );
	xSpeed *= (xDiff/range);
	ySpeed *= (yDiff/range);
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
	this.updatePosition();
	this.movement = {
		x: xSpeed,
		y: ySpeed,
	};
};

Entity.prototype.isInRadius = function(entity){
	return Physics.collisionUtils.intersects(this.hitbox.shapes[0], entity.effectRadius.shapes[0]);
};

Entity.prototype.addWaypoint = function(x, y){
	this.waypoints.push([x,y]);
};

Entity.prototype.overwriteWaypoint = function(index, x, y){
	this.waypoints.splice(0,1,[x,y]);
}

Entity.prototype.nextWaypoint = function(){
	this.waypoints.splice(0,1);
};

Entity.prototype.approachCurrentWaypoint = function(range, override){
	override = override || this.speedMult;
	range = range || 10;
	w = this.waypoints[0];
	this.approach(w[0],w[1], range, override);
	pos = this.getPosition();
	speed = this.speed * this.speedMult;
	if (override) speed = this.speed * override;
	if ( (Math.abs(pos[0]-w[0]) < speed) && (Math.abs(pos[1]-w[1]) < speed) )
		this.nextWaypoint();
};

// =============
// EntityManager
// =============
var EntityManager = function(){
	
	var entities = [];
	
	this.add = function(e){
		entities[e.name] = e;
	};
	
	this.createEntity = function(params){
		var e = Entity.create(params);
		entities[e.name] = e;
	};
	
	this.updateAll = function(){
		for (var i in entities){
			entities[i].update();
		}
	};
	
	this.drawAll = function(debug){
		var orderedEnts = [];
		for (var i in entities) orderedEnts.push(entities[i]);
		orderedEnts.sort(function(a,b){
			if (a.y + a.sprite.yOffset < b.y + b.sprite.yOffset)
				return -1;
			else if (a.y + a.sprite.yOffset > b.y + b.sprite.yOffset)
				return 1;
			else return 0;
		});
		
		orderedEnts.sort(function(a,b){
			if (a.zIndex < b.zIndex)
				return -1;
			else if (a.zIndex > b.zIndex)
				return 1;
			else return 0;
		});
		
		Graphics.draw2D.end();
		Graphics.debugDraw.end();
		
		Graphics.draw2D.begin("alpha");
		for (var i in orderedEnts){
			orderedEnts[i].draw();
		}
		Graphics.draw2D.end();
		
		if(debug) {
			Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
			Graphics.debugDraw.begin();
			for (var i in orderedEnts){
				orderedEnts[i].drawPhysDebug();
			}
			Graphics.debugDraw.end();
		}
	};
	
	this.allToCurrentWaypoint = function(){
		for (var i in entities) {
			if (entities[i].waypoints.length > 0){
				entities[i].approachCurrentWaypoint(10,1);
			}
		}
	};
	
	this.getEntities = function(){
		return entities;
	}
};