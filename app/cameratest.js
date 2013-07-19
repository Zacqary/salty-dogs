var CameraTest = {
	
	loop: {
		
		initialize: function(){
			CameraTest.camera = Camera.create(Math.device);
			CameraTest.camera2D = Graphics.Camera2D.create();
			CameraTest.floor = Floor.create(Graphics.device, Math.device);
			CameraTest.camera.lookAt([0,0,0], Graphics.WORLD_UP, [0,70,240]);
			GameState.setCamera(CameraTest.camera2D);
			
			CameraTest.keyboardMovement = 0;
			
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
			
			CameraTest.staminaBar = Draw2DSprite.create({
				texture: null,
				width: 48,
				height: 4,
				x: 1142,
				y: 700,
				color: [1,0,0,1]
			});
			CameraTest.staminaFill = Draw2DSprite.create({
				texture: null,
				width: 48,
				height: 4,
				x: 1142,
				y: 700,
				color: [0,0,1,1]
			});
			CameraTest.staminaDamageTimer = 0;
			
			CameraTest.em = EntityManager.create();
			
			CameraTest.wall1 = CameraTest.em.createEntity({});
			CameraTest.wall1.setPosition(500,-300);
			CameraTest.wall1.createHitbox(1400,1,0,0);
			
			CameraTest.wall2 = CameraTest.em.createEntity({});
			CameraTest.wall2.setPosition(500,320);
			CameraTest.wall2.createHitbox(1400,1,0,0);
			
			CameraTest.wall3 = CameraTest.em.createEntity({});
			CameraTest.wall3.setPosition(-200,10);
			CameraTest.wall3.createHitbox(1,620,0,0);
			CameraTest.wall4 = CameraTest.em.createEntity({});
			CameraTest.wall4.setPosition(1200,10);
			CameraTest.wall4.createHitbox(1,620,0,0);
			
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
			
			if(!CameraTest.keyboardMovement) {
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
			
				CameraTest.cursor.setPosition(curPos[0],curPos[1]);
			}
			else {
				var curPos = CameraTest.avatar.getPosition();
				var range = CameraTest.cursor.range;
				if (Input.keyDown[Input.keyCodes.W]){
					curPos[1] -= range;
				}
				if (Input.keyDown[Input.keyCodes.A]){
					curPos[0] -= range;
				}
				if (Input.keyDown[Input.keyCodes.D]){
					curPos[0] += range;
				}
				if (Input.keyDown[Input.keyCodes.S]){
					curPos[1] += range;
				}
				
				CameraTest.cursor.setPosition(curPos[0],curPos[1]);
			}
			
			if (CameraTest.movePlayer || CameraTest.keyboardMovement) {
				CameraTest.avatar.approach(CameraTest.cursor.x, CameraTest.cursor.y, CameraTest.cursor.range);
					
				if ( Math.abs(CameraTest.avatar.x - CameraTest.camera2D.x) > 128) {
					if (CameraTest.camera2D.x > CameraTest.avatar.x) {
						//CameraTest.camera.matrix[9] -= CameraTest.avatar.movement.x/3;
						CameraTest.camera2D.x = CameraTest.avatar.x + 128;
					}
					else {
						//CameraTest.camera.matrix[9] += CameraTest.avatar.movement.x/3;
						CameraTest.camera2D.x = CameraTest.avatar.x - 128;
					}
				}
				
			
			}
			else {
				
				if ( Math.abs(CameraTest.avatar.x - CameraTest.camera2D.x) > 2) {
					if (CameraTest.camera2D.x > CameraTest.avatar.x) {
						//CameraTest.camera.matrix[9] -= 1;
						CameraTest.camera2D.x -= 2;
					}
					else {
						//CameraTest.camera.matrix[9] += 1;
						CameraTest.camera2D.x += 2;
					}
				
				}
				
			}
			
			CameraTest.em.allToCurrentWaypoint();
			CameraTest.em.runPhysics();
			CameraTest.em.updateAll();
			
			if (CameraTest.staminaDamageTimer){
				CameraTest.staminaDamageTimer -= 1/10;
				if (CameraTest.staminaDamageTimer < 0)
					CameraTest.staminaDamageTimer = 0;
			}
			
			
		},
		
		attack: function(){
			CameraTest.avatar.stamina.plus(-1);
			if(CameraTest.avatar.stamina.get() > 0) {
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
						if(CameraTest.em.rayCastTest(CameraTest.avatar, other)) {
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
			else {
				CameraTest.staminaDamageTimer = 1;
			}
		},
		
		onMouseDown: function(mouseCode, x, y){
			if (mouseCode === Input.MOUSE_0)
		    {
		        CameraTest.movePlayer = true;
		    }
			else if (mouseCode === Input.MOUSE_1)
		    {
		        this.attack();
		    }
		},
		
		onMouseUp: function(mouseCode, x, y){
			if (mouseCode === Input.MOUSE_0)
		    {
		        CameraTest.movePlayer = false;
		    }
			else if (mouseCode === Input.MOUSE_1)
		    {
		        
		    }
		},
		
		onKeyDown: function(keyCode){
			if (keyCode === Input.keyCodes.W) {
				CameraTest.keyboardMovement += 1;
			}
			if (keyCode === Input.keyCodes.A) {
				CameraTest.keyboardMovement += 2;
			}
			if (keyCode === Input.keyCodes.S) {
				CameraTest.keyboardMovement += 4;
			}
			if (keyCode === Input.keyCodes.D) {
				CameraTest.keyboardMovement += 8;
			}
			if (keyCode === Input.keyCodes.K) {
				this.attack();
			}
		},
		
		onKeyUp: function(keyCode){
			if (keyCode === Input.keyCodes.W) {
				CameraTest.keyboardMovement -= 1;
			}
			if (keyCode === Input.keyCodes.A) {
				CameraTest.keyboardMovement -= 2;
			}
			if (keyCode === Input.keyCodes.S) {
				CameraTest.keyboardMovement -= 4;
			}
			if (keyCode === Input.keyCodes.D) {
				CameraTest.keyboardMovement -= 8;
			}
		},
		
		draw: function(){

			Graphics.device.clear([1,1,1,1]);
			//CameraTest.floor.render(Graphics.device, CameraTest.camera);
			
			if (CameraTest.keyboardMovement) {
				CameraTest.cursor.visible = false;
			}
			else {
				CameraTest.cursor.visible = true;
			}
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
			
			var fill = (CameraTest.avatar.stamina.get() / CameraTest.avatar.stamina.getMax()) * 48;
			CameraTest.staminaFill.setWidth(fill);
			if (CameraTest.avatar.stamina.get() < 1) {
				CameraTest.staminaFill.setColor([0,0,1,0.3]);
			}
			else CameraTest.staminaFill.setColor([0,0,1,1]);
			
			CameraTest.staminaBar.setColor([1-CameraTest.staminaDamageTimer,0,0,1]);
			
			CameraTest.staminaBar.x = CameraTest.avatar.sprite.x;
			CameraTest.staminaBar.y = CameraTest.avatar.sprite.y + 36;
			CameraTest.staminaFill.x = CameraTest.staminaBar.x;
			CameraTest.staminaFill.y = CameraTest.staminaBar.y;
			
			Graphics.draw2D.begin("alpha");
			Graphics.draw2D.drawSprite(CameraTest.staminaBar);
			Graphics.draw2D.drawSprite(CameraTest.staminaFill);
			Graphics.draw2D.end();
		},
		
	},
	
}

