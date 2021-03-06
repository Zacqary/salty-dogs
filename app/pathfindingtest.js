var PathfindingTest = new InCharacterLoop();
PathfindingTest.initializeExtension = function(){
	Graphics.textureManager.load("textures/circle.png");

	Graphics.textureManager.load("textures/body.png");
	Graphics.textureManager.load("textures/hat.png");
	Graphics.textureManager.load("textures/shirt.png");
	Graphics.textureManager.load("textures/tank.png");
	Graphics.textureManager.load("textures/pants.png");
	Graphics.textureManager.load("textures/lsblade.png");
	Graphics.textureManager.load("textures/lshilt.png");
	Graphics.textureManager.load("textures/clblade.png");
	Graphics.textureManager.load("textures/clhilt.png");
	Graphics.textureManager.load("textures/patch.png");
	Graphics.textureManager.load("textures/patchleft.png");

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
	
	this.NPC = Character.create({});
	this.NPC.name = "NPC1";
	this.NPC.setPosition(0,-200);
	
	this.NPC.setMovementAIGoal(0,200);
	
	this.NPC.addBehavior("PathfindingBehavior");
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
PathfindingTest.loadingLoop = function(){
	if (!Graphics.textureManager.getNumPendingTextures()) {
		this.loaded = true;
	}

	if (this.loaded){

			this.avatar.setBodyColor("bf8000");
			this.avatar.setHead("hat","992370");
			this.avatar.setTorso("shirt","cccc99");
			this.avatar.setLegs("pants","77709a");
			this.avatar.setSword("ls","aaaaaa");
			this.avatar.addMisc("patch","000033",2);
			this.avatar.composeDoll();

			this.NPC.setBodyColor("909099");
			this.NPC.setTorso("tank","cccc99");
			this.NPC.setLegs("pants","aa5555");
			this.NPC.setSword("cl","aaaaaa");
			this.NPC.addMisc("patchleft","000033",2);
			this.NPC.composeDoll();
			
			this.NPCs = [this.NPC];
		/*	for (var i = 0; i < 11; i++){
				var newNPC = this.NPC.clone();
				newNPC.setPosition(randomNumber(0,1000)-150, randomNumber(0,500)-270);
				newNPC.addBehavior("PathfindingBehavior");
				this.em.add(newNPC);
				this.NPCs.push(newNPC);
			} */
			
	}
}

PathfindingTest.runAfterPlayerMoves = function(){
	
	PathfindingTest.em.detectCollisions();
	
	PathfindingTest.em.runCharacterBehaviors();
	for (var i in this.NPCs){
		var me = this.NPCs[i];
		if (!me.aiGoals.movement){
			var x = randomNumber (0,1200) - 100;
			var y = randomNumber (0,500) - 270;
			me.setMovementAIGoal(x,y);
		}
	}
}

PathfindingTest.drawExtension = function(){
	Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
	Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
	Graphics.debugDraw.begin();
	Graphics.debugDraw.drawCircle(this.NPC.aiGoals.movement[0],this.NPC.aiGoals.movement[1],12,[0,0,0,1]);
	if (PathfindingTest.drawPath) {
		for (var i =0; i < PathfindingTest.drawPath.length; i++){
			var me = PathfindingTest.drawPath[i];
			Graphics.debugDraw.drawCircle(me[0],me[1],4,[1,0,0,1]);
			if (i < PathfindingTest.drawPath.length-1){
				var next = PathfindingTest.drawPath[i+1];
				Graphics.debugDraw.drawLine(me[0],me[1],next[0],next[1],[0,0,1,1]);
			}	
		}	
	}
	Graphics.debugDraw.end(); 
}