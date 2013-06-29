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
	
	hexToARGB: function hexToARGB(string){
		var a;var r;var g;var b;
		if (string.length == 8) {
			a = string.substr(0,2);
			r = string.substr(2,2);
			g = string.substr(4,2);
			b = string.substr(6,2);
		}
		else {
			r = string.substr(0,2);
			g = string.substr(2,2);
			b = string.substr(4,2);
			a = "ff";
		}
		a = parseInt(a.toUpperCase(), 16);
		r = parseInt(r.toUpperCase(), 16);
		g = parseInt(g.toUpperCase(), 16);
		b = parseInt(b.toUpperCase(), 16);
		return [r/255, g/255, b/255, a/255];
	},
	
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
	
	makeCompositeTexture: function makeCompositeTexture(layers){
		for (var i in layers){
			if (!layers[i].path) {
				layers[i].path = TEXTURE_ROOT + layers[i].name + TEXTURE_EXT;
			}
		}
		var pixels = Graphics.textureManager.get(layers[0].path).width;
		var target = Graphics.draw2D.createRenderTarget({
			name: "newTarget",
			backBuffer: true,
		});
		Graphics.draw2D.setRenderTarget(target);
		Graphics.draw2D.begin("alpha");
		for (var i in layers){
			var color = layers[i].color;
			if (typeof color == "string") color = Graphics.hexToARGB(color);
			
			Graphics.draw2D.drawSprite(Draw2DSprite.create({
				texture: Graphics.textureManager.get(layers[i].path),
				textureRectangle: [0, 0, pixels, pixels],
				width: pixels,
				height: pixels,
				color: color,
				origin: [0,0],
			}));
		}
		Graphics.draw2D.end();
		Graphics.draw2D.setBackBuffer();
		var tex = Graphics.draw2D.getRenderTargetTexture(target);
		return tex;
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
Graphics.EntitySprite = function(params, parent, xOffset, yOffset){
	var es = Draw2DSprite.create(params);
	es.xOffset = xOffset || 0;
	es.yOffset = yOffset || 0;
	es.parent = parent;
	return es;
}

Graphics.EntitySprite.prototype = Draw2DSprite.prototype;

Graphics.EntitySprite.create = function(params, xOffset, yOffset){
	return new Graphics.EntitySprite(params, xOffset, yOffset);
}

Graphics.EntitySprite.prototype.update = function(camera){
	var camCenter = camera.getViewCenter();
	this.x = this.parent.x + this.xOffset + camCenter[0];
	this.y = this.parent.y + this.yOffset + camCenter[1];
}
Graphics.EntitySprite.prototype.draw = function(){
	Graphics.draw2D.drawSprite(this);
}
Graphics.drawEntityPhysics = function(body){
	Graphics.debugDraw.drawRigidBody(body);
}