var Graphics = {
	
	initializeEngineReferences: function initializeEngineReferences(){
		Graphics.device = TurbulenzEngine.createGraphicsDevice( { } );
		Graphics.shaderManager = ShaderManager.create(Graphics.device, Protocol.requestHandler);
		Graphics.textureManager = TextureManager.create(Graphics.device, Protocol.requestHandler);
		Graphics.draw2D = Draw2D.create({
			graphicsDevice : Graphics.device
		});
		Graphics.debugDraw = Physics2DDebugDraw.create({
			graphicsDevice : Graphics.device
		});
		Graphics.debugDraw.setPhysics2DViewport([0,0,1280,720]);
		Graphics.WORLD_UP = Math.device.v3Build(0.0, 1.0, 0.0);
	},
	
	clearEngineReferences: function clearEngineReferences(){
		Graphics.device = null;
		Graphics.draw2D = null;
		Graphics.debugDraw = null;
		Graphics.shaderManager = null;
		Graphics.textureManager = null;
		Graphics.WORLD_UP = null;
	},
	
	// ==========================
	
	updateCameraMatrices: function updateCameraMatrices(camera){
		var aspectRatio = (Graphics.device.width / Graphics.device.height);
		if (aspectRatio !== camera.aspectRatio)
		{
			camera.aspectRatio = aspectRatio;
		}
		
		camera.updateProjectionMatrix();
		camera.updateViewProjectionMatrix();
		camera.updateViewMatrix();
	},
	
	
}

// ========
// Camera2D
// ========
Graphics.Camera2D = function Camera2D() {
	this.x = 0;
	this.y = 0;
	this.width = Graphics.device.width;
	this.height = Graphics.device.height;
}
Graphics.Camera2D.create = function(){
	return new Graphics.Camera2D();
}
Graphics.Camera2D.prototype.getViewCenter = function(){
	var x = (this.width/2) - this.x;
	var y = (this.height/2) - this.y;
	return [x,y];
}
Graphics.Camera2D.prototype.xyViewToWorld = function(x, y){
	var center = this.getViewCenter();
	x = x - center[0];
	y = y - center[1];
	return [x,y];
};
Graphics.Camera2D.prototype.mouseToWorld = function(){
	return this.xyViewToWorld(Input.mousePosition.x, Input.mousePosition.y);
};

// ============
// EntitySprite
// ============
Graphics.createEntitySprite = function(params, xOffset, yOffset){
	var es = Draw2DSprite.create(params);
	es.xOffset = xOffset || 0;
	es.yOffset = yOffset || 0;
	return es;
}
Graphics.updateEntitySprite = function(entity, sprite, camera){
	var camCenter = camera.getViewCenter();
	sprite.x = entity.x + sprite.xOffset + camCenter[0];
	sprite.y = entity.y + sprite.yOffset + camCenter[1];
}
Graphics.drawEntitySprite = function(sprite){
	Graphics.draw2D.drawSprite(sprite);
}
Graphics.drawEntityPhysics = function(body){
	Graphics.debugDraw.drawRigidBody(body);
}