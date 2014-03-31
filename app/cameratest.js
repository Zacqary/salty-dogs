var CameraTest = new InCharacterLoop();
CameraTest.initializeExtension = function(){
	Graphics.loadTexture("circle");

	var charTextures = ["body-h","hat-h","shirt-h","tank-h","pants-h",
						"ls-hblade","ls-hhilt","patch-h","patchleft-h"];
	Graphics.loadTextures(charTextures);
	
	this.modelH = CharacterModel.create("model-h", ["body","hat", "tank","shirt","patch","patchleft","pants","lshilt","lsblade"]);
	/*this.modelH.setFrame({
		name: "down",
		rectangle: [0,0,110,256],
		offsets: [3,-50],
		direction: 6,
	});
	this.modelH.setFrame({
		name: "right",
		rectangle: [110,0,295,256],
		offsets: [-12,-52],
		direction: 0,
	});
	this.modelH.setFrame({
		name: "left",
		rectangle: [295,0,481,256],
		offsets: [-24,-52],
		direction: 4,
	});
	this.modelH.setFrame({
		name: "up",
		rectangle: [481,0,641,256],
		offsets: [3,-50],
		direction: 2,
	});
	this.modelH.setFrame({
		name: "downRight",
		rectangle: [641,0,778,256],
		offsets: [-6,-50],
		direction: 7,
	});
	this.modelH.setFrame({
		name: "downLeft",
		rectangle: [778,0,916,256],
		offsets: [-6,-50],
		direction: 5,
	});
	this.modelH.setFrame({
		name: "upRight",
		rectangle: [0,258,174,514],
		offsets: [-6,-50],
		direction: 1,
	});
	this.modelH.setFrame({
		name: "upLeft",
		rectangle: [174,258,348,514],
		offsets: [-24,-50],
		direction: 3,
	});*/
	this.avatar.sprite.setHeight(96);
	

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
	
	this.wall5 = this.em.createEntity({});
	this.wall5.setPosition(400,130);
	this.wall5.createHitbox(50,150,0,0);
	this.wall5.hitbox.sleep();
	this.wall5.hitbox.setAsStatic();

	this.wall6 = this.em.createEntity({});
	this.wall6.setPosition(400,-130);
	this.wall6.createHitbox(50,150,0,0);
	this.wall6.hitbox.sleep();
	this.wall6.hitbox.setAsStatic();
	
	this.wall7 = this.em.createEntity({});
	this.wall7.setPosition(100,30);
	this.wall7.createHitbox(50,300,0,0);
	this.wall7.hitbox.sleep();
	this.wall7.hitbox.setAsStatic(); 

	//this.avatar.setPosition(0,120);
	this.avatar.createStaminaBar();
	this.avatar.createFocusBar();
	this.avatar.createHitClockBar();
	
	this.NPC = Character.create({});
	this.NPC.name = "NPC1";
	this.NPC.setPosition(480,0);
	//this.NPC.createEffectRadius(80);
	this.NPC.createEffect({
		types: [ENT_CHARACTER],
		doThis: function(it, me){
			if (it.charType != me.charType || it.charType == CHAR_NEUTRAL) {
				it.affect("speedMult",0.1);
				if (it.cursor) it.cursor.affect("range",64);
				if (it == Player.entity) it.affect("inCombat",true);
				me.affect("inCombat",true);
				me.affect("speedMult",0.1);
				me.affectRadius(140);
			}
		}

	});
	this.NPC.createFocusBar();
	this.NPC.createStaminaBar();
	this.NPC.createHitClockBar();
	this.NPC.addBehavior("Combat");
	this.NPC.addBehavior("Pathfinding");
	this.NPC.addBehavior("Chase");
	this.NPC.addBehavior("Rally");
	this.NPC.sprite.setHeight(96);
	//this.NPC.focus.setMax(5);
	this.em.add(this.NPC);
	
	
	GameState.getCamera().setViewBounds(-300,-380, 1280, 400);
	
	this.cursor = this.em.createEntity({permeable: true});
	this.cursor.range = 48;
	this.cursor.createSprite({
		texture: Graphics.textureManager.get("textures/circle.png"),
		width: 64,
		height: 48,
		textureRectangle: [0,0,64,48],
		color: [0,0,1,1]
	});
	this.cursor.createHitbox(36,36,0,0);
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
	if ( (!Protocol.assetManager.getNumPendingAssets()) ) {
		this.loaded = true;
	}

	if (this.loaded){
			
			this.avatar.setModel(this.modelH);
			this.NPC.setModel(this.modelH);
			
			//this.modelH.setLayer(tex,"body");
			//this.modelH.setLayer(Graphics.textureManager.get("textures/hat-h.png"),"hat");
			// this.modelH.setLayer(Graphics.textureManager.get("textures/tank-h.png"),"tank");
			// 			this.modelH.setLayer(Graphics.textureManager.get("textures/shirt-h.png"),"shirt");
			// 			this.modelH.setLayer(Graphics.textureManager.get("textures/pants-h.png"),"pants");
			// 			this.modelH.setLayer(Graphics.textureManager.get("textures/ls-hhilt.png"),"lshilt");
			// 			this.modelH.setLayer(Graphics.textureManager.get("textures/ls-hblade.png"),"lsblade");
			// 			this.modelH.setLayer(Graphics.textureManager.get("textures/patch-h.png"),"patch");
			// 			this.modelH.setLayer(Graphics.textureManager.get("textures/patchleft-h.png"),"patchleft");
			
			this.avatar.setBody("body","bf8000");
			this.avatar.setHead("hat","992370");
			this.avatar.setTorso("shirt","cccc99");
			this.avatar.setLegs("pants","77709a");
			this.avatar.setSword("ls","aaaaaa");
			this.avatar.addMisc("patch","000033",2);
			this.avatar.addMisc("anim","000033",4);
			this.avatar.composeDoll();
			this.avatar.name = "Player";
			this.avatar.makePlayer();
			
			this.NPC.setBody("body","909099");
			this.NPC.setTorso("tank","cccc99");
			this.NPC.setLegs("pants","aa5555");
			this.NPC.setSword("ls","aaaaaa");
			this.NPC.addMisc("patchleft","000033",2);
			this.NPC.composeDoll();
			//this.NPC.setMovementAIGoal(this.NPC.x, this.NPC.y);
			this.NPC.makeFriendly();
			
			
			this.NPC.makePathfindingGrid(-200, -300, 1200, 300);
			this.NPC.aiGoals.follow = Player.entity;
			
		/*
			this.NPC2 = this.NPC.clone();
			this.NPC2.makeFriendly();
			this.NPC2.sprite.setHeight(96);
			this.NPC2.setPosition(130, 90);
			this.NPC2.setBody("body","dedefe");
			this.NPC2.setHead("hat","992370");
			this.NPC2.removeMisc("patchleft");
			this.NPC2.composeDoll();
			this.NPC2.name = "NPC2";
			this.NPC2.addBehavior("Pathfinding");
			this.NPC2.addBehavior("Chase");
			this.NPC2.addBehavior("Combat");
			this.NPC2.addBehavior("Rally");
			this.em.add(this.NPC2);
			this.NPC2.makePathfindingGrid(-200, -300, 1200, 300);
			this.NPC2.aiGoals.follow = Player.entity;
		

			this.NPC3 = this.NPC.clone();
			this.NPC3.sprite.setHeight(96);
			this.NPC3.setPosition(280, 160);
			this.NPC3.setTorso("shirt","dedefe");
			this.NPC3.composeDoll();
			this.NPC3.makeFriendly();
			this.NPC3.name = "NPC3";
			this.NPC3.addBehavior("Pathfinding");
			this.NPC3.addBehavior("Chase");
			this.NPC3.addBehavior("Rally");
			this.em.add(this.NPC3);
			this.NPC3.makePathfindingGrid(-200, -300, 1200, 300);
			this.NPC3.aiGoals.follow = Player.entity;
		
		
			this.NPC4 = this.NPC.clone();
			this.NPC4.sprite.setHeight(96);
			this.NPC4.setPosition(180, 160);
			this.NPC4.setTorso("shirt","dedefe");
			this.NPC4.makeFriendly();
			this.NPC4.composeDoll();
			this.NPC4.makeFriendly();
			this.NPC4.addBehavior("Pathfinding");
			this.NPC4.addBehavior("Chase");
			this.NPC4.addBehavior("Rally");
			this.em.add(this.NPC4);
			this.NPC4.makePathfindingGrid(-200, -300, 1200, 300);
			this.NPC4.aiGoals.follow = Player.entity; 
			
			this.NPC5 = this.NPC.clone();
			this.NPC5.name = "NPC5";
			this.NPC5.sprite.setHeight(96);
			this.NPC5.setPosition(400, 160);
			this.NPC5.setTorso("shirt","dedefe");
			this.NPC5.makeFriendly();
			this.NPC5.composeDoll();
			this.NPC5.makeFriendly();
			this.NPC5.addBehavior("Pathfinding");
			this.NPC5.addBehavior("Chase");
			this.NPC5.addBehavior("Rally");
			this.em.add(this.NPC5);
			this.NPC5.makePathfindingGrid(-200, -300, 1200, 300);
			this.NPC5.aiGoals.follow = Player.entity; 
			
			this.NPC6 = this.NPC.clone();
			this.NPC6.sprite.setHeight(96);
			this.NPC6.setPosition(500, 260);
			this.NPC6.setTorso("shirt","dedefe");
			this.NPC6.makeFriendly();
			this.NPC6.composeDoll();
			this.NPC6.makeFriendly();
			this.NPC6.addBehavior("Pathfinding");
			this.NPC6.addBehavior("Chase");
			this.NPC6.addBehavior("Rally");
			this.em.add(this.NPC6);
			this.NPC6.makePathfindingGrid(-200, -300, 1200, 300);
			this.NPC6.aiGoals.follow = Player.entity;
			
			this.NPC7 = this.NPC.clone();
			this.NPC7.sprite.setHeight(96);
			this.NPC7.setPosition(600, 200);
			this.NPC7.setTorso("shirt","dedefe");
			this.NPC7.makeFriendly();
			this.NPC7.composeDoll();
			this.NPC7.makeFriendly();
			this.NPC7.addBehavior("Pathfinding");
			this.NPC7.addBehavior("Chase");
			this.NPC7.addBehavior("Rally");
			this.em.add(this.NPC7);
			this.NPC7.makePathfindingGrid(-200, -300, 1200, 300);
			this.NPC7.aiGoals.follow = Player.entity; 
			*/
			this.debugNPC = 0;
			
			this.em.updateAll();
			
	}
}

CameraTest.runAfterPlayerMoves = function(){
	
	CameraTest.em.updateCharacterCombatStates();
	CameraTest.em.runCharacterBehaviors();
	
	if (Player.entity.inCombat) {
		if (GameState.getCamera().getZoom() < 1.2)
			GameState.zoomCamera(1.2);
	}
	else if (GameState.getCamera().getZoom() > 1)
		GameState.zoomCamera(1);
	
}

CameraTest.drawExtension = function(){

	
	var debugNPCs = [null, this.NPC, this.NPC2, this.NPC3, this.NPC5];
	
	if (Player.keyData["debug"]) {

		this.debugNPC++;
		console.log(this.debugNPC);
		delete Player.keyData["debug"];
		if (this.debugNPC > debugNPCs.length-1) this.debugNPC = 0;
		
		console.log(this.NPC5.aiGoals.movement);
	}
	
	if (this.debugNPC > 0) {
		
		var NPC = debugNPCs[this.debugNPC];
		
		Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
		Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
		Graphics.debugDraw.begin();
		Graphics.debugDraw.drawCircle(NPC.x,NPC.y,24,[1,0,0,1]);
		Graphics.debugDraw.drawCircle(NPC.x,NPC.y,23,[1,0,0,1]);
		Graphics.debugDraw.drawCircle(NPC.x,NPC.y,22,[1,0,0,1]);
		Graphics.debugDraw.end();
		if (NPC.aiData.tempRallyGrid)  {
			Debug.drawPathfindingGrid(NPC.aiData.tempRallyGrid);
		}
		
	}
	
	Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
	Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
	Graphics.debugDraw.begin();

	var angle; 
	if (!Player.entity.heading) angle = new Angle(270);
	else angle = new Angle(Player.entity.heading.get());
	angle.rotate(113);
	
	var makeOrigin = function(angle) { return Math.lineFromXYAtAngle(Player.entity.getPosition(), 96, angle); }
	var origin = makeOrigin(angle);
	Graphics.debugDraw.drawCircle(origin[0],origin[1], 4, [0,0,0,1]);
	angle.rotate(45);
	origin = makeOrigin(angle);
	Graphics.debugDraw.drawCircle(origin[0],origin[1], 4, [0,0,0,1]);
	angle.rotate(45);
	origin = makeOrigin(angle);
	Graphics.debugDraw.drawCircle(origin[0],origin[1], 4, [0,0,0,1]);
	angle.rotate(45);
	origin = makeOrigin(angle);
	Graphics.debugDraw.drawCircle(origin[0],origin[1], 4, [0,0,0,1]);
	

	Graphics.debugDraw.end();
	
	//Debug.drawPathfindingGrid(this.NPC.pathfindingGrid);
	
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
	var other = Player.getTargetedCombatant();
	if (other) {
		Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
		Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
		Graphics.debugDraw.begin();
		Graphics.debugDraw.drawCircle(other.x,other.y,24,[1,0,0,1]);
		Graphics.debugDraw.end();
	}

/*	Graphics.draw2D.configure({
		scaleMode: 'scale',
		viewportRectangle: GameState.getCamera().getViewport()
	});
	Graphics.draw2D.begin("alpha");
	Graphics.draw2D.drawSprite(Draw2DSprite.create({
		texture: CameraTest.bodTex,
		textureRectangle: [0,0,CameraTest.bodTex.width,CameraTest.bodTex.height],
		width: CameraTest.bodTex.width,
		height: CameraTest.bodTex.height,
		x: 100,
		y: 100,
		color: [1,0,0,1],
		scale: [0.5,0.5]
	}));
	Graphics.draw2D.end(); */
}