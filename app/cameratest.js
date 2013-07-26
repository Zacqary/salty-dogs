var CameraTest = new InCharacterLoop();
CameraTest.initializeExtension = function(){
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

	this.avatar.setPosition(0,170);
	this.avatar.createStaminaBar();
	this.avatar.createFocusBar();
	this.avatar.createHitClockBar();
	
	this.NPC = Character.create({});
	this.NPC.setPosition(640,-100);
	this.NPC.makeHostile();
	this.NPC.createEffectRadius(80);
	this.NPC.createEffect({
		types: [ENT_CHARACTER],
		doThis: function(it, me){
			if (it.charType == CHAR_PLAYER) {
				it.affect("speedMult",0.1);
				if (it.cursor) it.cursor.affect("range",48);
				it.affect("inCombat",true);
				me.affect("inCombat",true);
				me.affect("speedMult",0.1);
				me.affectRadius(120);
			}
		}

	});
	this.NPC.createFocusBar();
	this.NPC.createStaminaBar();
	this.NPC.createHitClockBar();
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
}
CameraTest.loadingLoop = function(){
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
			//this.NPC.focus.setMax(15);
		
			/*
			this.NPC2 = this.NPC.clone();
			this.NPC2.setPosition(200, 120);
			this.NPC2.setBodyColor("dedefe");
			this.NPC2.setHead("hat","992370");
			this.NPC2.removeMisc("patchleft");
			this.NPC2.composeDoll();
			this.em.add(this.NPC2);

			this.NPC3 = this.NPC.clone();
			this.NPC3.setPosition(320, 160);
			this.NPC3.setTorso("shirt","dedefe");
			this.NPC3.composeDoll();
			this.em.add(this.NPC3);
			*/
	}
}

CameraTest.runAfterPlayerMoves = function(){
	
	var attackPlayer = function(NPC, avatar){
		NPC.swingAtCharacter(avatar);
		var delay = randomNumber(10,50)/100;
		console.log("delay: "+delay);
		NPC.combat.delay.set(delay);
	}
	
	if(!this.avatar.inCombat) {
		this.avatar.combat = null;
	}
	else {
		if (!this.avatar.combat){
			this.avatar.combat = { };
		}
	}
	
	if (!this.NPC.inCombat) {
		this.NPC.combat = null;
		//this.NPC.overwriteWaypoint(0, this.avatar.x, this.avatar.y, 64);
	}
	else {
		if (!this.NPC.combat){
			this.NPC.combat = { };
			this.NPC.combat.restartDelta = 0;
			this.NPC.combat.delay = new Countdown(0.5);
		}
		if ( (this.NPC.stamina.get() > 1) && (!this.avatar.timers.hit.get()) ) {
			this.NPC.combat.overSwing = false;
			
			if (!this.NPC.combat.delay.get()) {
				if (this.NPC.timers.hit.get()) {
					attackPlayer(this.NPC, this.avatar);
				}
				else {
					var focusPercent = this.NPC.focus.get() / this.NPC.focus.getMax();
					var staminaPercent = this.NPC.stamina.get() / this.NPC.stamina.getMax();
					var maxDelta = (focusPercent * 40) + 15;
					if (this.NPC.restartDelta > maxDelta/100) this.NPC.restartDelta = maxDelta/100;
					if ( (focusPercent <= staminaPercent - this.NPC.combat.restartDelta) || (staminaPercent == 1) ){
						this.NPC.combat.restartDelta = 0;
						attackPlayer(this.NPC, this.avatar);
					}
				}
			}
		}
		else {
			if (!this.NPC.combat.delay.get() && !this.avatar.timers.hit.get() && !this.NPC.combat.overSwing){
				if (randomNumber(0,4) == 4) {
					attackPlayer(this.NPC, this.avatar);
				}
				this.NPC.combat.overSwing = true;
			}
			if (!this.NPC.combat.restartDelta) {
				var focusPercent = this.NPC.focus.get() / this.NPC.focus.getMax();
				var maxDelta = (focusPercent * 40) + 15;
				
				this.NPC.combat.restartDelta = randomNumber(5,maxDelta)/100;
			}
			this.NPC.combat.delay.set(randomNumber(2,5)/60);
		}
	}
	
	
	
}