/* 
	================================================
	===================GRAPHICS=====================
	================================================
	
	Includes:
	- Graphics
	- Graphics.Camera2D
	- Graphics.EntitySprite
	- Graphics.UI
	
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
	
	//	Texture functions
	//	=================
	
	//	loadTexture - Load a texture into the texture manager.
	loadTexture: function loadTexture(name, extension){
		extension = extension || ".png";
		Graphics.textureManager.load("textures/"+name+extension);
		Graphics.textureManager.map(name, "textures/"+name+extension);
	},
	
	//	loadTextures - Load an array of textures.
	loadTextures: function loadTextures(textureNames){
		for (var i in textureNames){
			Graphics.loadTexture(textureNames[i]);
		}
	},
	
	/*	makeCompositeTexture
			Take a bunch of layers and render them on top of one another to create a texture.
			Layers should be an array of objects that specify name/path and color. They will
			be drawn in order.
	*/
	makeCompositeTexture: function makeCompositeTexture(layers){
		
		Graphics.draw2D.configure({
			scaleMode: 'scale',
			viewportRectangle: undefined
		});
		
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

Graphics.Camera2D.prototype.getViewport = function(){
	var x =  this.x - (this.width/2);
	var y =  this.y - (this.height/2);
	return Math.device.v4Build(x,y,x+this.width,y+this.height);
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
	
	//	============================================================
	
	/*	update
			Update this EntitySprite's position by getting the Entity's position,
			then determining where that corresponds to in the Camera2D's view.
	*/
	es.update = function(){
		this.x = this.parent.x + this.xOffset;
		this.y = this.parent.y + this.yOffset;
	}
	
	//	setOffsets - Sets the x and y offsets at the same time
	es.setOffsets = function(x,y){
		//	Can take a single array argument...
		if (x.length == 2){
			this.xOffset = x[0];
			this.yOffset = x[1];
		}
		//	Or two arguments, one for each coordinate...
		else {
			this.xOffset = x;
			this.yOffset = y;
		}
	}
	
	//	draw - Draws the EntitySprite
	es.draw = function(){
		// Temporary shadow code -- buggy
		/*
		if (this.parent.charType) {
			var lightPos = [300,-300];
			var light = Draw2DSprite.create({
				x: lightPos[0],
				y: lightPos[1],
				texture: null,
				color: [1,0,0,1],
				width: 8,
				height: 8,
			});
			
			var scale = [1,1];
			var shear = [0,0];
			var angle = Math.angleXY(lightPos, [this.parent.x,this.parent.y]) * 180/Math.PI;
			var xOffset = 0;
			var yOffset = 0;
			if (angle >= 180 && angle <= 360){
				scale = [1,-1];
				yOffset = 64;
				var percent = (angle - 260)/45;
				if (angle < 190) {
					var p = 1 - ((angle - 180)/10);
					scale = [1,-1+p];
					yOffset -= 32*p;
				}
				else if (angle > 350) {
					var p = (angle - 350)/10;
					scale = [1,-1+p];
					yOffset -= 32*p;
				}
				shear = [-percent,0];
				xOffset = percent * (this.getWidth() * (2/3));
				
			}
			else {
				var percent = (angle - 80)/45;
				if (angle < 10) {
					var p = 1 - ((angle)/10);
					scale = [1,1-p];
					yOffset += 32*p;
				}
				else if (angle > 170) {
					var p = (angle - 170)/10;
					scale = [1,1-p];
					yOffset += 32*p;
				}
				shear = [percent,0];
				xOffset = -percent * (this.getWidth() * (2/3));
			}
			var shadow = Draw2DSprite.create({
				x: this.x+xOffset,
				y: this.y+yOffset,
				texture: this.getTexture(),
				color: [0,0,0,0.5],
				width: this.getWidth(),
				height: this.getHeight(),
				scale: scale,
				shear: shear,
				textureRectangle: this.getTextureRectangle()
			});

			
			Graphics.draw2D.drawSprite(light);
			Graphics.draw2D.drawSprite(shadow);
		}
		*/
		Graphics.draw2D.drawSprite(this);
	}
	
	return es;
}
Graphics.EntitySprite.prototype = Draw2DSprite.prototype;

Graphics.EntitySprite.create = function(params, parent, xOffset, yOffset){
	return new Graphics.EntitySprite(params, parent, xOffset, yOffset);
}

//	drawEntityPhysics - Draw an Entity's physics object
Graphics.drawEntityPhysics = function(body){
	Graphics.debugDraw.drawRigidBody(body);
}

/*	===========================================================================
	UI Interface
		Code for rendering UI elements
	===========================================================================
*/
Graphics.UI = { };

/*	Bar class - extends Draw2DSprite
		Displays a Spectrum in the form of a horizontal bar
*/
Graphics.UI.Bar = function Bar(params) {
	var emptySprite = Draw2DSprite.create({
		texture: null,
		width: params.width,
		height: params.height,
		x: params.x,
		y: params.y,
		color: params.emptyColor
	});
	var fullSprite = Draw2DSprite.create({
		texture: null,
		width: params.width,
		height: params.height,
		x: params.x,
		y: params.y,
		color: params.fullColor
	});
	this.visible = params.visible;
	if (typeof this.visible === "undefined") this.visible = true;
	
	
	this.draw = function(){
		Graphics.draw2D.drawSprite(emptySprite);
		Graphics.draw2D.drawSprite(fullSprite);
	}
	
	this.setWidth = function(width) {
		emptySprite.setWidth(width);
		fullSprite.setWidth(width);
	}
	this.getWidth = function(){
		return emptySprite.getWidth();
	}
	this.setHeight = function(height) {
		emptySprite.setHeight(height);
		fullSprite.setHeight(height);
	}
	this.getHeight = function(){
		return emptySprite.getHeight();
	}
	this.setPosition = function(x,y){
		emptySprite.x = fullSprite.x = x;
		emptySprite.y = fullSprite.y = y;
	}
	this.getPosition = function(){
		return [emptySprite.x, emptySprite.y];
	}
	
	this.setColor = function(type, color){
		if (type == "empty") emptySprite.setColor(color);
		else if (type == "full") fullSprite.setColor(color);
	}
	this.getColor = function(type){
		if (type == "empty") emptySprite.getColor();
		else if (type == "full") fullSprite.getColor();
	}
	
	
	this.spectrum = params.spectrum;
	this.update = function(){
		var fill = (this.spectrum.get() / this.spectrum.getMax()) * emptySprite.getWidth();
		fullSprite.setWidth(fill);
		for (var i in effects){
			effects[i](this, emptySprite, fullSprite, this.spectrum);
		}
	}
	
	var effects = [];
	this.addEffect = function (name, effect){
		effects[name] = effect;
	}
	this.removeEffect = function(name){
		delete effects[name];
	}
	
};

Graphics.UI.Bar.create = function(params){
	var bar = new Graphics.UI.Bar(params);
	for (var i in params.effects){
		bar.addEffect(i, params.effects[i]);
	}
	return bar;
};


