var CameraTest = {
	
	loop: {
		
		initialize: function(){
			CameraTest.camera = Camera.create(Math.device);
			CameraTest.camera2D = Graphics.Camera2D.create();
			CameraTest.floor = Floor.create(Graphics.device, Math.device);
			CameraTest.camera.lookAt([0,0,0], Graphics.WORLD_UP, [0,70,240]);
			GameState.setCamera(CameraTest.camera2D);
			
			
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
			
			CameraTest.em = EntityManager.create();
			
			CameraTest.avatar = Character.create({x: 0, y: 170});
			CameraTest.avatar.makePlayer();
			CameraTest.avatar.speed = 8;
			CameraTest.em.add(CameraTest.avatar);
			
			CameraTest.NPC = Character.create({x: 640, y: 170});
			CameraTest.NPC.makeHostile();
			CameraTest.NPC.speed = 8;
			CameraTest.NPC.createEffectRadius(80);
			CameraTest.NPC.createEffect({
				types: [ENT_CHARACTER],
				doThis: function(it, me){
					it.affect("speedMult",0.1);
					if (it.cursor) it.cursor.affect("range",52);
					me.affectRadius(120);
				}
				
			});
			CameraTest.em.add(CameraTest.NPC);
			
			CameraTest.cursor = CameraTest.em.createEntity({permeable: true});
			CameraTest.cursor.range = 128;
			CameraTest.cursor.upperBound = 40;
			CameraTest.cursor.lowerBound = 280;
			CameraTest.cursor.createSprite({
				texture: Graphics.textureManager.get("textures/circle.png"),
				width: 64,
				height: 48,
				textureRectangle: [0,0,64,48],
				color: [0,0,1,1]
			});
			CameraTest.cursor.createHitbox(8,24,0,0);
			CameraTest.avatar.cursor = CameraTest.cursor;
		
			CameraTest.struck = false;
			
		},
		
		loadingLoop: function(){
			if (!Graphics.textureManager.getNumPendingTextures()) {
				CameraTest.loop.loaded = true;
			}
			
			if (CameraTest.loop.loaded){
					
					CameraTest.avatar.setBodyColor("bf8000");
					CameraTest.avatar.setHead("hat","992370");
					CameraTest.avatar.setTorso("shirt","cccc99");
					CameraTest.avatar.setLegs("pants","77709a");
					CameraTest.avatar.setSword("ls","aaaaaa");
					CameraTest.avatar.addMisc("patch","000033",2);
					CameraTest.avatar.composeDoll();

					CameraTest.NPC.setBodyColor("909099");
					CameraTest.NPC.setTorso("tank","cccc99");
					CameraTest.NPC.setLegs("pants","aa5555");
					CameraTest.NPC.setSword("cl","aaaaaa");
					CameraTest.NPC.addMisc("patchleft","000033",2);
					CameraTest.NPC.composeDoll();
					
					CameraTest.NPC2 = CameraTest.NPC.clone();
					CameraTest.NPC2.setPosition(200, 120);
					CameraTest.NPC2.setBodyColor("dedefe");
					CameraTest.NPC2.setHead("hat","992370");
					CameraTest.NPC2.removeMisc("patchleft");
					CameraTest.NPC2.composeDoll();
					CameraTest.em.add(CameraTest.NPC2);
				
			}
			
		},
		
		loadingScreen: function(){
			
		},
		
		run: function() {
			CameraTest.em.resetAll();
			
			CameraTest.em.applyAllEffects();
			
			Graphics.updateCameraMatrices(CameraTest.camera);
			
			var mouseToWorld = CameraTest.camera2D.mouseToWorld();
			CameraTest.cursor.x = mouseToWorld[0];
			CameraTest.cursor.y = mouseToWorld[1];
			
			if ( Math.abs(CameraTest.cursor.x - CameraTest.avatar.x) > CameraTest.cursor.range ) {
				if (CameraTest.cursor.x < CameraTest.avatar.x) CameraTest.cursor.x = CameraTest.avatar.x - CameraTest.cursor.range;
				else CameraTest.cursor.x = CameraTest.avatar.x + CameraTest.cursor.range;	
			}
			
			if ( Math.abs(CameraTest.cursor.y - CameraTest.avatar.y) > CameraTest.cursor.range ) {
				if (CameraTest.cursor.y < CameraTest.avatar.y) CameraTest.cursor.y = CameraTest.avatar.y - CameraTest.cursor.range;
				else CameraTest.cursor.y = CameraTest.avatar.y + CameraTest.cursor.range;	
			}
			if (CameraTest.cursor.y < CameraTest.cursor.upperBound) CameraTest.cursor.y = CameraTest.cursor.upperBound;
			else if (CameraTest.cursor.y > CameraTest.cursor.lowerBound) CameraTest.cursor.y = CameraTest.cursor.lowerBound;
			
			
			if (Physics.collisionUtils.intersects(CameraTest.NPC.hitbox.shapes[0], CameraTest.cursor.hitbox.shapes[0]) )
				CameraTest.cursorOnNPC = true;
			else CameraTest.cursorOnNPC = false;
			
			if (Input.mouseDown.left) {
			
				CameraTest.avatar.approach(CameraTest.cursor.x, CameraTest.cursor.y, CameraTest.cursor.range);
				
				if (CameraTest.avatar.sprite.x < 512) {
					CameraTest.camera.matrix[9] -= CameraTest.avatar.movement.x/3;
					CameraTest.camera2D.x -= CameraTest.avatar.movement.x;
				}
				if (CameraTest.avatar.sprite.x > 768) {
					CameraTest.camera.matrix[9] += CameraTest.avatar.movement.x/3;
					CameraTest.camera2D.x += CameraTest.avatar.movement.x;
				}
			
			}
			else {
				
				if (CameraTest.avatar.sprite.x < 636) {
					CameraTest.camera.matrix[9] -= 1;
					CameraTest.camera2D.x -= 4;
				}
				else if (CameraTest.avatar.sprite.x > 644) {
					CameraTest.camera.matrix[9] += 1;
					CameraTest.camera2D.x += 4;
				}
				
			}
			if (Input.mouseDown.right) {
				if (!CameraTest.struck) {
					CameraTest.struck = true;
					
					if (CameraTest.avatar.isInRadius(CameraTest.NPC)) {
						CameraTest.avatar.strikeCharacter(CameraTest.NPC);
					}
					else if (CameraTest.avatar.isInRadius(CameraTest.NPC2)) {
						CameraTest.avatar.strikeCharacter(CameraTest.NPC2);
					}
				}
			}
			else CameraTest.struck = false;
			
			CameraTest.em.allToCurrentWaypoint();
			CameraTest.em.updateAll();
			
			
		},
		
		draw: function(){

			Graphics.device.clear([1,1,1,1]);
			CameraTest.floor.render(Graphics.device, CameraTest.camera);
			
			if (Input.mouseDown.left) {
				if (CameraTest.cursorOnNPC) CameraTest.cursor.sprite.setColor([1,0,0,1]);
				else CameraTest.cursor.sprite.setColor([0,0,1,1]);
			}
			else {
				if (CameraTest.cursorOnNPC) CameraTest.cursor.sprite.setColor([0.4,0,1,0.7]);
				else CameraTest.cursor.sprite.setColor([0,0.4,1,0.5]);
			}
			CameraTest.cursor.sprite.setTexture(Graphics.textureManager.get("textures/circle.png"));
			CameraTest.cursor.zIndex = CameraTest.avatar.zIndex - 1;
			CameraTest.em.drawAll(true);
		},
		
	},
	
}

