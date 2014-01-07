var CameraTest = new InCharacterLoop();
CameraTest.initializeExtension = function(){
	Graphics.loadTexture("circle");

	var charTextures = ["body","hat","shirt","tank","pants",
						"lsblade","lshilt","clblade","clhilt",
						"patch","patchleft"];
	Graphics.loadTextures(charTextures);
	charTextures = ["body-h","hat-h","shirt-h","tank-h","pants-h",
						"ls-hblade","ls-hhilt","patch-h","patchleft-h"];
	Graphics.loadTextures(charTextures);
	
	this.modelHData = {
		down: [0,0,110,256],
		right: [110,0,295,256],
		left: [295,0,481,256],
		up: [481,0,641,256],
		downRight: [641,0,778,256],
		downLeft: [778,0,916,256],
		upRight: [0,258,174,514],
		upLeft:[174,258,348,514],
	}
	this.modelHOffsets = {
		down: [3,-50],
		right: [-12,-52],
		left: [-24,-52],
		up: [3,-50],
		downRight: [-6,-50],
		downLeft: [-6,-50],
		upRight: [-6,-50],
		upLeft: [-24,-50],
		
	}

	this.wall1 = this.em.createEntity({});
	this.wall1.setPosition(500,-300);
	this.wall1.createHitbox(1400,1,0,0);
	this.wall1.hitbox.sleep();
	this.wall1.hitbox.setAsStatic();
	
	this.wall2 = this.em.createEntity({});
	this.wall2.setPosition(500,320);
	this.wall2.createHitbox(1400,1,0,0);
	this.wall2.hitbox.sleep();
	this.wall2.hitbox.setAsStatic();
	
	this.wall3 = this.em.createEntity({});
	this.wall3.setPosition(-200,10);
	this.wall3.createHitbox(1,620,0,0);
	this.wall3.hitbox.sleep();
	this.wall3.hitbox.setAsStatic();
	
	this.wall4 = this.em.createEntity({});
	this.wall4.setPosition(1200,10);
	this.wall4.createHitbox(1,620,0,0);
	this.wall4.hitbox.sleep();
	this.wall4.hitbox.setAsStatic();

	//this.avatar.setPosition(0,120);
	this.avatar.createStaminaBar();
	this.avatar.createFocusBar();
	this.avatar.createHitClockBar();
	
	this.NPC = Character.create({});
	this.NPC.name = "NPC1";
	this.NPC.setPosition(200,0);
	this.NPC.makeHostile();
	this.NPC.createEffectRadius(80);
	this.NPC.createEffect({
		types: [ENT_CHARACTER],
		doThis: function(it, me){
			if (it.charType != me.charType || it.charType == CHAR_NEUTRAL) {
				it.affect("speedMult",0.1);
				if (it.cursor) it.cursor.affect("range",72);
				if (it == Player.entity) it.affect("inCombat",true);
				me.affect("inCombat",true);
				me.affect("speedMult",0.1);
				me.affectRadius(120);
			}
		}

	});
	this.NPC.createFocusBar();
	this.NPC.createStaminaBar();
	this.NPC.createHitClockBar();
	this.NPC.addBehavior("CombatBehavior");
	this.em.add(this.NPC);

	this.cursor = this.em.createEntity({permeable: true});
	this.cursor.range = 128;
	this.cursor.createSprite({
		texture: Graphics.textureManager.get("textures/circle.png"),
		width: 64,
		height: 48,
		textureRectangle: [0,0,64,48],
		color: [0,0,1,1]
	});
	this.cursor.createHitbox(8,24,0,0);
	this.cursor.useHitboxAsEffectRadius();

	this.cursor.createEffect({
		types: [ENT_CHARACTER],
		doThis: function(it, me){
			if (it.charType == CHAR_HOSTILE){
				Player.cursorOnNPC = true;
			}
		}
	});

	this.avatar.cursor = this.cursor;

	this.struck = false;
	
	this.em.updateAll();
}
CameraTest.loadingLoop = function(){
	if (!Graphics.textureManager.getNumPendingTextures()) {
		this.loaded = true;
	}

	if (this.loaded){
			
			this.avatar.setBody("body-h","bf8000");
			this.avatar.setHead("hat-h","992370");
			this.avatar.setTorso("tank-h","cccc99");
			this.avatar.setLegs("pants-h","77709a");
			this.avatar.setSword("ls-h","aaaaaa");
			this.avatar.addMisc("patch-h","000033",2);
			this.avatar.composeDoll();
			this.avatar.sprite.setHeight(96);
			this.avatar.sprite.setTextureRectangle(this.modelHData.down);
			this.avatar.sprite.yOffset = this.modelHOffsets.down[1];
			this.avatar.sprite.xOffset = this.modelHOffsets.down[0];

			this.NPC.setBodyColor("909099");
			this.NPC.setTorso("tank","cccc99");
			this.NPC.setLegs("pants","aa5555");
			this.NPC.setSword("cl","aaaaaa");
			this.NPC.addMisc("patchleft","000033",2);
			this.NPC.composeDoll();
			//this.NPC.focus.setMax(15);
		
			
			this.NPC2 = this.NPC.clone();
			this.NPC2.setPosition(130, 90);
			this.NPC2.setBodyColor("dedefe");
			this.NPC2.setHead("hat","992370");
			this.NPC2.removeMisc("patchleft");
			this.NPC2.composeDoll();
			this.NPC2.name = "NPC2";
			//this.NPC2.addBehavior("CombatBehavior");
			this.em.add(this.NPC2);
			
			
			this.em.updateAll();
			/*
			
			this.NPC3 = this.NPC.clone();
			this.NPC3.setPosition(280, 160);
			this.NPC3.setTorso("shirt","dedefe");
			this.NPC3.composeDoll();
			this.NPC3.makeFriendly();
			this.NPC3.addBehavior(AI.CombatBehavior);
			this.NPC3.name = "NPC3";
			this.em.add(this.NPC3);
			this.NPC3.debug = true;
			
			this.NPC4 = this.NPC.clone();
			this.NPC4.setPosition(180, 160);
			this.NPC4.setTorso("shirt","dedefe");
			this.NPC4.composeDoll();
			this.NPC4.makeFriendly();
			this.NPC4.addBehavior(AI.CombatBehavior);
			this.em.add(this.NPC4);
			this.NPC4.debug = true; */
			
			
	}
}

CameraTest.runAfterPlayerMoves = function(){
	
	var angle = Math.angleXY([Player.entity.x, Player.entity.y],[Player.entity.cursor.x,Player.entity.cursor.y])*(180/Math.PI);
	var rect = this.modelHData.down;
	var offsets = this.modelHOffsets.down;
	if (angle > 22.5 && angle < 67.5) {
		rect = this.modelHData.upRight;
		offsets = this.modelHOffsets.upRight;
	}
	else if (angle > 68.5 && angle < 112.5) {
		rect = this.modelHData.up;
		offsets = this.modelHOffsets.up;
	}
	else if (angle > 112.5 && angle < 157.5) {
		rect = this.modelHData.upLeft;
		offsets = this.modelHOffsets.upLeft;
	}
	else if (angle > 157.5 && angle < 202.5) {
		rect = this.modelHData.left;
		offsets = this.modelHOffsets.left;
	}
	else if (angle > 202.5 && angle < 247.5) {
		rect = this.modelHData.downLeft;
		offsets = this.modelHOffsets.downLeft;
	}
	else if (angle > 247.5 && angle < 292.5) {
		rect = this.modelHData.down;
		offsets = this.modelHOffsets.down;
	}
	else if (angle > 292.5 && angle < 337.5) {
		rect = this.modelHData.downRight;
		offsets = this.modelHOffsets.downRight;
	}
	else if (angle > 337.5 || angle < 22.5) {
		rect = this.modelHData.right;
		offsets = this.modelHOffsets.right;
	}
	this.avatar.sprite.setTextureRectangle(rect);
	this.avatar.sprite.setWidth((rect[2]-rect[0])*0.43636363);
	this.avatar.sprite.xOffset = offsets[0];
	this.avatar.sprite.yOffset = offsets[1];
	
	
	CameraTest.em.updateCharacterCombatStates();
	CameraTest.em.runCharacterBehaviors();
	
	
}

CameraTest.drawExtension = function(){
	if (CameraTest.rayCastPoints) {
		var points = CameraTest.rayCastPoints;
		Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
		Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
		Graphics.debugDraw.begin();
		Graphics.debugDraw.drawLine(points[0][0],points[0][1],points[1][0],points[1][1],[0,0,1,1]);
		Graphics.debugDraw.end();
	}
	if (CameraTest.drawCircle) {
		var points = CameraTest.drawCircle;
		Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
		Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
		Graphics.debugDraw.begin();
		Graphics.debugDraw.drawCircle(points[0],points[1],3,[0,0,1,1]);
		Graphics.debugDraw.end();
	}
}