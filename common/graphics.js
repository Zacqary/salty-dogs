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
		
		//	Initialize non-power-of-two drawing
		Graphics.shaderManager.load("shaders/npot2D.cgfx.json", function(){
			var npot2D = Graphics.shaderManager.get("shaders/npot2D.cgfx.json").getTechnique('opaque');
			var npot2Dalpha = Graphics.shaderManager.get("shaders/npot2D.cgfx.json").getTechnique('alpha');
			Graphics.draw2D = Draw2D.create({
				graphicsDevice : Graphics.device,
				blendModes : {
					"npot" : npot2D,
					"npot-alpha" : npot2Dalpha,
				},
			});
		});
		
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
		Graphics.textureManager.load(TEXTURE_ROOT+name+TEXTURE_EXT);
		Graphics.textureManager.map(name, TEXTURE_ROOT+name+TEXTURE_EXT);
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
		
		//	Check if the layers specify texture data, texture path or just a texture name.
		for (var i in layers){
			if (!layers[i].texture){
				//	If it's just a name, turn this into a path.
				if (!layers[i].path) {
					layers[i].path = TEXTURE_ROOT + layers[i].name + TEXTURE_EXT;
				}
				layers[i].texture = Graphics.textureManager.get(layers[i].path);
			}
		}
		//	Determine how big the texture is.
		var pixWidth = layers[0].texture.width;
		var pixHeight = layers[0].texture.height;
		
		//	Create a render target and start drawing to it
		Graphics.draw2D.configure({
			scaleMode: 'scale',
			viewportRectangle: [0,0,pixWidth,pixHeight]
		});
		
		var target = Graphics.draw2D.createRenderTarget({
			name: "newTarget",
			backBuffer: true,
			width: pixWidth,
			height: pixHeight
		});
		Graphics.draw2D.setRenderTarget(target);
		Graphics.draw2D.begin("alpha");
		
		//	Take each layer, parse its color, then draw it
		for (var i in layers){
			var color = layers[i].color;
			if (typeof color == "string") color = Graphics.hexToARGB(color);
			
			Graphics.draw2D.drawSprite(Draw2DSprite.create({
				texture: layers[i].texture,
				textureRectangle: Math.device.v4Build(0, 0, pixWidth, pixHeight),
				width: pixWidth,
				height: pixHeight,
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
	var camX = 0;
	var camY = 0;
	var cWidth = Graphics.device.width;
	var cHeight = Graphics.device.height;
	var zoom = 1;
	var viewBounds = Math.device.v4Build(NaN,NaN,NaN,NaN);
	
	var getViewport = function(){
		var width = Math.floor(cWidth / zoom);
		var height = Math.floor(cHeight / zoom);

		var x1 =  camX - width/2;
		var y1 =  camY - height/2;
		return Math.device.v4Build(x1,y1,x1+width,y1+height);

	}
	this.getViewport = getViewport;
	
	var validatePosition = function(){
		if (zoom >= 1) {
			var viewport = getViewport();
			var width = viewport[2] - viewport[0];
			var height = viewport[3] - viewport[1];
		
			if ( (viewBounds[0] !== NaN) && (viewport[0] < viewBounds[0]) ){
				camX = viewBounds[0] + width/2;
			}
			if ( (viewBounds[1] !== NaN) && (viewport[1] < viewBounds[1]) ){
				camY = viewBounds[1] + height/2;
			}
			if ( (viewBounds[2] !== NaN) && (viewport[2] > viewBounds[2]) ){
				camX = viewBounds[2] - width/2;
			}
			if ( (viewBounds[3] !== NaN) && (viewport[3] > viewBounds[3]) ){
				camY = viewBounds[3] - height/2;
			}
		}
	}
	
	//	Positioning functions
	this.move = function(x, y){
		camX += x;
		camY += y;
		validatePosition();
	}
	
	this.setPos = function(x, y){
		if (x !== null) camX = x;
		if (y !== null) camY = y;
		validatePosition();
	}
	
	this.getPos = function(){
		return Math.device.v2Build(camX, camY);
	}
	
	this.getZoom = function(){
		return zoom;
	}
	
	this.setZoom = function(value){
		zoom = value;
	}
	
	this.zoom = function(change){
		zoom += change;
	}
	
	this.getWidth = function(){
		return cWidth;
	}
	this.getHeight = function(){
		return cHeight;
	}
	
	this.getViewBounds = function(){
		return viewBounds;
	}
	
	this.setViewBounds = function(x1, y1, x2, y2){
		if (x1 === undefined) x1 = NaN;
		if (y1 === undefined) y1 = NaN;
		if (x2 === undefined) x2 = NaN;
		if (y2 === undefined) y2 = NaN;
		viewBounds = Math.device.v4Build(x1, y1, x2, y2);
		validatePosition();
	}
		
}
Graphics.Camera2D.create = function(){
	return new Graphics.Camera2D();
}

/*	getViewCenter
		Get the center of the Camera2D's view by finding the center of the screen,
		then offsetting it by the camera's position in the world.
*/
Graphics.Camera2D.prototype.getViewCenter = function(){
	var pos = this.getPos();
	var x = (this.getWidth()/2) - pos[0];
	var y = (this.getHeight()/2) - pos[1];
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


// Override Draw2DSprite.create to avoid NPOT error
Draw2DSprite.create = function (params) {
    if ((params.width === undefined || params.height === undefined) && !params.texture) {
        return null;
    }

    // data:
    // ---
    // First 16 values reserved for Draw2DSpriteData.
    //   includes colour and texture coordinates.
    //
    // 16    : old_rotation (for lazy evaluation)
    // 17,18 : width/2, height/2 (changed by user via function)
    // 19,20 : scaleX, scaleY    (changed by user via function)
    // 21,22 : shearX, shearY    (changed by user via function)
    // 23,24 : originX, originY  (changed by user via function)
    // 25,26 : cx, cy // locally defined position of true center of sprite relative to origin
    //    (dependant on scale/shear/center/dimension)
    // 27,28 : u1, v1 // locally defined position of top-left vertex relative to center of sprite.
    //    (dependant on scale/shear/dimension)
    // 29,30 : u2, v2 // locally defined position of top-right vertex relative to center of sprite.
    //    (dependant on scale/shear/dimension)
    // 31,32 : px, py // relative defined position of true center of sprite relative to origin
    //    (dependant on rotation and cx,cy)
    // 33,34 : x1, y1 // relative defined position of top-left vertex relative to center of sprite.
    //    (dependant on rotation and u1,v1)
    // 35,36 : x2, y2 // relative defined position of top-right vertex relative to center of sprite.
    //    (dependant on rotation and u2,v2)
    // 37 : Squared epsilon to consider rotations equal based on dimensions.
    var s = new Draw2DSprite();
    var data = s.data = new Draw2D.floatArray(38);

    // texture (not optional)
    var texture = s._texture = params.texture || null;

    // position (optional, default 0,0)
    s.x = (params.x || 0.0);
    s.y = (params.y || 0.0);

    // rotation (optional, default 0)
    s.rotation = data[16] = (params.rotation || 0.0);

    // colour (optional, default [1,1,1,1])
    var color = params.color;
    data[8] = (color ? color[0] : 1.0);
    data[9] = (color ? color[1] : 1.0);
    data[10] = (color ? color[2] : 1.0);
    data[11] = (color ? color[3] : 1.0);

    // uvRect (optional, default texture rectangle)
    var uvRect = params.textureRectangle;
    var iwidth = (texture ? 1 / texture.width : 1);
    var iheight = (texture ? 1 / texture.height : 1);
    data[12] = (uvRect ? (uvRect[0] * iwidth) : 0.0);
    data[13] = (uvRect ? (uvRect[1] * iheight) : 0.0);
    data[14] = (uvRect ? (uvRect[2] * iwidth) : 1.0);
    data[15] = (uvRect ? (uvRect[3] * iheight) : 1.0);

    // dimensions / 2 (default texture dimensions)
    data[17] = ((params.width !== undefined) ? params.width : texture.width) * 0.5;
    data[18] = ((params.height !== undefined) ? params.height : texture.height) * 0.5;

    // scale (default [1,1])
    var scale = params.scale;
    data[19] = (scale ? scale[0] : 1.0);
    data[20] = (scale ? scale[1] : 1.0);

    // shear (default [0,0])
    var shear = params.shear;
    data[21] = (shear ? shear[0] : 0.0);
    data[22] = (shear ? shear[1] : 0.0);

    // origin (default dimensions / 2)
    var origin = params.origin;
    data[23] = (origin ? origin[0] : data[17]);
    data[24] = (origin ? origin[1] : data[18]);

    s._invalidate();
    return s;
};

