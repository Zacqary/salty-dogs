var Entity = function(){ };

Entity.create = function(params){
	var e = new Entity();
	e.name = params.name || makeid();
	e.x = params.x || 0.0;
	e.y = params.y || 0.0;
	e.z = params.z || 0.0;
	e.visible = params.visible || true;
	e.speed = params.speed || 0;
	e.speedMult = params.speedMult || 1;
	e.sprite = params.sprite;
	e.hitbox = params.hitbox;
	e.effectRadius = params.effectRadius; 
	return e;
};

Entity.prototype.update = function(){
	this.updatePosition();
}

Entity.prototype.setPosition = function(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
};

Entity.prototype.getPosition = function(){
	return [this.x,this.y,this.z];
};

Entity.prototype.createSprite = function(spriteParams, x0ffset, yOffset){
	this.sprite = Graphics.createEntitySprite(spriteParams, x0ffset, yOffset);
};

Entity.prototype.setSpriteOffset = function(x,y) {
	this.sprite.xOffset = x;
	this.sprite.yOffset = y;
};

Entity.prototype.draw = function draw(){
	this.movement = null;
	this.updatePosition(this, this.sprite, GameState.getCamera());
	Graphics.drawEntitySprite(this.sprite);
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
	Graphics.updateEntitySprite(this, this.sprite, GameState.getCamera());
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
}

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
	
	this.drawAll = function(){
		var orderedEnts = [];
		for (var i in entities) orderedEnts.push(entities[i]);
		orderedEnts.sort(function(a,b){
			if (a.y + a.sprite.yOffset < b.y + b.sprite.yOffset)
				return -1;
			else if (a.y + a.sprite.yOffset > b.y + b.sprite.yOffset)
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
		
		Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
		Graphics.debugDraw.begin();
		for (var i in orderedEnts){
			orderedEnts[i].drawPhysDebug();
		}
		Graphics.debugDraw.end();
		
	};
	
	this.getEntities = function(){
		return entities;
	}
};