/* 
	================================================
	===================GRAPHICS=====================
	================================================
	
	Includes:
	- Graphics
	- Graphics.Camera2D
	- Graphics.EntitySprite
	
*/
/*	Graphics Interface
		Handles all aspects of drawing stuff on the screen. Interfaces with Turbulenz's
		draw2D, debugDraw, graphicsDevice, etc.
*/
var Graphics = {
	
	//	initializeEngineReferences - Initialize all the Turbulenz graphics devices
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
	
	// ##############################################################
	
	/*	hexToARGB
			Takes a 6-digit RGB value or 8-digit ARGB value and turns it into
			a Vector4 of color data.
	*/
	hexToARGB: function hexToARGB(string){
		var a;var r;var g;var b;
		//	If there are 8 digits, parse ARGB
		if (string.length == 8) {
			a = string.substr(0,2);
			r = string.substr(2,2);
			g = string.substr(4,2);
			b = string.substr(6,2);
		}
		//	Otherwise, parse RGB and set alpha to 100%
		else {
			r = string.substr(0,2);
			g = string.substr(2,2);
			b = string.substr(4,2);
			a = "ff";
		}
		//	Convert the hex values to decimal
		a = parseInt(a.toUpperCase(), 16);
		r = parseInt(r.toUpperCase(), 16);
		g = parseInt(g.toUpperCase(), 16);
		b = parseInt(b.toUpperCase(), 16);
		//	Divide them by 255 and put them in a Vector4
		return Math.device.v4Build(r/255, g/255, b/255, a/255);
	},
	
	//	updateCameraMatrices - Update the matrices for a 3D camera
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
	
	/*	makeCompositeTexture
			Take a bunch of layers and render them on top of one another to create a texture.
			Layers should be an array of objects that specify name/path and color. They will
			be drawn in order.
	*/
	makeCompositeTexture: function makeCompositeTexture(layers){
		//	Check if the layers specify explicit path or just a texture name.
		//	If it's just a name, turn this into a path.
		for (var i in layers){
			if (!layers[i].path) {
				layers[i].path = TEXTURE_ROOT + layers[i].name + TEXTURE_EXT;
			}
		}
		//	Determine how big the texture is. This will only work with
		//	power of 2 textures, so don't do anything weird.
		var pixels = Graphics.textureManager.get(layers[0].path).width;
		
		//	Create a render target and start drawing to it
		var target = Graphics.draw2D.createRenderTarget({
			name: "newTarget",
			backBuffer: true,
		});
		Graphics.draw2D.setRenderTarget(target);
		Graphics.draw2D.begin("alpha");
		
		//	Take each layer, parse its color, then draw it
		for (var i in layers){
			var color = layers[i].color;
			if (typeof color == "string") color = Graphics.hexToARGB(color);
			
			Graphics.draw2D.drawSprite(Draw2DSprite.create({
				texture: Graphics.textureManager.get(layers[i].path),
				textureRectangle: Math.device.v4Build(0, 0, pixels, pixels),
				width: pixels,
				height: pixels,
				color: color,
				origin: Math.device.v2BuildZero(),
			}));
		}
		
		//	Stop drawing and reset the back buffer, whatever that means
		Graphics.draw2D.end();
		Graphics.draw2D.setBackBuffer();
		
		//	Grab what we just drew, and return it as hot, fresh, delicious texture data
		var tex = Graphics.draw2D.getRenderTargetTexture(target);
		return tex;
	},
	
}


/*	Camera2D Class
		A 2D camera that will take the positions of a bunch of 2D Entities, and then
		determine where to place their EntitySprites based on what it can see.
*/
Graphics.Camera2D = function Camera2D() {
	this.x = 0;
	this.y = 0;
	this.width = Graphics.device.width;
	this.height = Graphics.device.height;
}
Graphics.Camera2D.create = function(){
	return new Graphics.Camera2D();
}
/*	getViewCenter
		Get the center of the Camera2D's view by finding the center of the screen,
		then offsetting it by the camera's position in the world.
*/
Graphics.Camera2D.prototype.getViewCenter = function(){
	var x = (this.width/2) - this.x;
	var y = (this.height/2) - this.y;
	return Math.device.v2Build(x,y);
}
/*	xyViewToWorld
		Take some on-screen coordinates, and figure out where they are in the world
		based on the Camera2D's center.
*/
Graphics.Camera2D.prototype.xyViewToWorld = function(x, y){
	var center = this.getViewCenter();
	x = x - center[0];
	y = y - center[1];
	return Math.device.v2Build(x,y);
}
//	mouseToWorld - A quick way of getting the mouse's xyViewToWorld
Graphics.Camera2D.prototype.mouseToWorld = function(){
	return this.xyViewToWorld(Input.mousePosition.x, Input.mousePosition.y);
}

/*	EntitySprite Class - extends Draw2DSprite
		A Draw2DSprite with some Entity-specific properties and functions
*/
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

/*	update
		Update this EntitySprite's position by getting the Entity's position,
		then determining where that corresponds to in the Camera2D's view.
*/
Graphics.EntitySprite.prototype.update = function(camera){
	var camCenter = camera.getViewCenter();
	this.x = this.parent.x + this.xOffset + camCenter[0];
	this.y = this.parent.y + this.yOffset + camCenter[1];
}
//	draw - Draws the EntitySprite
Graphics.EntitySprite.prototype.draw = function(){
	Graphics.draw2D.drawSprite(this);
}
//	drawEntityPhysics - Draw an Entity's physics object
Graphics.drawEntityPhysics = function(body){
	Graphics.debugDraw.drawRigidBody(body);
}