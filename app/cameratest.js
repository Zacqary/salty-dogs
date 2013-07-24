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

	this.wall2 = this.em.createEntity({});
	this.wall2.setPosition(500,320);
	this.wall2.createHitbox(1400,1,0,0);

	this.wall3 = this.em.createEntity({});
	this.wall3.setPosition(-200,10);
	this.wall3.createHitbox(1,620,0,0);
	this.wall4 = this.em.createEntity({});
	this.wall4.setPosition(1200,10);
	this.wall4.createHitbox(1,620,0,0);

	this.avatar.setPosition(0,170);
	this.avatar.createStaminaBar();
	this.avatar.createFocusBar();

	this.NPC = Character.create({});
	this.NPC.setPosition(640,170);
	this.NPC.makeHostile();
	this.NPC.createEffectRadius(80);
	this.NPC.createEffect({
		types: [ENT_CHARACTER],
		doThis: function(it, me){
			if (it.charType == CHAR_PLAYER) {
				it.affect("speedMult",0.1);
				if (it.cursor) it.cursor.affect("range",48);
				it.affect("inCombat",true);
				me.affectRadius(120);
			}
		}

	});
	this.NPC.createFocusBar();
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
				this.cursorOnNPC = true;
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

	}
}