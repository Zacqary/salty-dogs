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
			
			CameraTest.avatar = Character.create({});
			CameraTest.avatar.setPosition(0,170);
			CameraTest.avatar.makePlayer();
			CameraTest.em.add(CameraTest.avatar);
			
			CameraTest.NPC = Character.create({});
			CameraTest.NPC.setPosition(640,170);
			CameraTest.NPC.makeHostile();
			CameraTest.NPC.createEffectRadius(80);
			CameraTest.NPC.createEffect({
				types: [ENT_CHARACTER],
				doThis: function(it, me){
					if (it.charType == CHAR_PLAYER) {
						it.affect("speedMult",0.1);
						if (it.cursor) it.cursor.affect("range",48);
						me.affectRadius(120);
					}
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
			CameraTest.cursor.useHitboxAsEffectRadius();
			
			CameraTest.cursor.createEffect({
				types: [ENT_CHARACTER],
				doThis: function(it, me){
					if (it.charType == CHAR_HOSTILE){
						CameraTest.cursorOnNPC = true;
					}
				}
			});
			
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
					
					CameraTest.NPC3 = CameraTest.NPC.clone();
					CameraTest.NPC3.setPosition(320, 160);
					CameraTest.NPC3.setTorso("shirt","dedefe");
					CameraTest.NPC3.composeDoll();
					CameraTest.em.add(CameraTest.NPC3);
				
			}
			
		},
		
		loadingScreen: function(){
			
		},
		
		run: function() {
			CameraTest.em.resetAll();
			CameraTest.cursorOnNPC = false;
			
			CameraTest.em.applyAllEffects();
			
			Graphics.updateCameraMatrices(CameraTest.camera);
			
			var curPos = CameraTest.camera2D.mouseToWorld();
			var avOffsetPos = CameraTest.avatar.getPosition();

			if ( Math.abs(curPos[0] - avOffsetPos[0]) > CameraTest.cursor.range) {
				if (curPos[0] < avOffsetPos[0]) curPos[0] = avOffsetPos[0] - CameraTest.cursor.range;
				else curPos[0] = avOffsetPos[0] + CameraTest.cursor.range;	
			}
			
			if ( Math.abs(curPos[1] - avOffsetPos[1]) > CameraTest.cursor.range ) {
				if (curPos[1] < avOffsetPos[1]) curPos[1] = avOffsetPos[1] - CameraTest.cursor.range;
				else curPos[1] = avOffsetPos[1] + CameraTest.cursor.range;	
			}
			if (curPos[1] < CameraTest.cursor.upperBound) curPos[1] = CameraTest.cursor.upperBound;
			else if (curPos[1] > CameraTest.cursor.lowerBound) curPos[1] = CameraTest.cursor.lowerBound;
			
			CameraTest.cursor.setPosition(curPos[0],curPos[1]);
			
			if (Input.mouseDown.left) {
				CameraTest.avatar.approach(CameraTest.cursor.x, CameraTest.cursor.y, CameraTest.cursor.range);
				
				
				
				if ( Math.abs(CameraTest.avatar.x - CameraTest.camera2D.x) > 128) {
					if (CameraTest.camera2D.x > CameraTest.avatar.x) {
						CameraTest.camera.matrix[9] -= CameraTest.avatar.movement.x/3;
						CameraTest.camera2D.x -= CameraTest.avatar.movement.x;
					}
					else {
						CameraTest.camera.matrix[9] += CameraTest.avatar.movement.x/3;
						CameraTest.camera2D.x += CameraTest.avatar.movement.x;
					}
				}
				
			
			}
			else {
				
				if ( Math.abs(CameraTest.avatar.x - CameraTest.camera2D.x) > 4) {
					if (CameraTest.camera2D.x > CameraTest.avatar.x) {
						CameraTest.camera.matrix[9] -= 1;
						CameraTest.camera2D.x -= 4;
					}
					else {
						CameraTest.camera.matrix[9] += 1;
						CameraTest.camera2D.x += 4;
					}
				
				}
				
			}
			if (Input.mouseDown.right) {
				if (!CameraTest.struck) {
					CameraTest.struck = true;
					
					var imIn = CameraTest.em.radiusSweepTest(CameraTest.avatar);
					for (var i in imIn){
						if (imIn[i].charType != CHAR_HOSTILE)
							imIn.splice(i,1);
					}
					
					if (imIn.length > 0) {
						var distances = [];
						for (var i in imIn){
							var me = imIn[i];
							distances.push({distance: Math.distanceXY([me.x,me.y],[CameraTest.cursor.x,CameraTest.cursor.y]), name: me.name} );
						}
					
						distances.sort(function(a, b){
							return a.distance - b.distance;
						});
						while (1){
							var other = CameraTest.em.get(distances[0].name);
							var ray = {
								origin: [CameraTest.avatar.x,CameraTest.avatar.y],
								direction: [other.x - CameraTest.avatar.x, other.y - CameraTest.avatar.y],
								maxFactor: 2
							}
							var result = CameraTest.em.getWorld().rayCast(ray, true, function(ray, result){
								if (result.shape === CameraTest.avatar.hitbox.shapes[0]){
									return false;
								}
								return true;
							});
							if(result.shape === other.hitbox.shapes[0]) {
								CameraTest.avatar.strikeCharacter(other);
								break;
							}
							else {
								distances.splice(0,1);
								if (!distances.length) break;
							}
						}
			
					}	
				}
			}
			else CameraTest.struck = false;
			
			CameraTest.em.allToCurrentWaypoint();
			CameraTest.em.runPhysics();
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

