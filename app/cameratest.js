var CameraTest = {
	
	loop: {
		
		initialize: function(){
			CameraTest.camera = Camera.create(Math.device);
			CameraTest.camera2D = Graphics.Camera2D.create();
			CameraTest.floor = Floor.create(Graphics.device, Math.device);
			CameraTest.camera.lookAt([0,0,0], Graphics.WORLD_UP, [0,70,240]);
			GameState.setCamera(CameraTest.camera2D);
			
			var circleTex = {
				src: "textures/circles.png",
				mipmaps: true,
				onload: function(texture){
					CameraTest.circleTex = texture;
					CameraTest.avatar.sprite.setTexture(CameraTest.circleTex);
					CameraTest.cursor.sprite.setTexture(CameraTest.circleTex);
					CameraTest.NPC.sprite.setTexture(CameraTest.circleTex);
					CameraTest.loaded = true;
				}
			};
			Graphics.device.createTexture(circleTex);
			CameraTest.em = new EntityManager();
			
			CameraTest.avatar = Entity.create({x: 0, y: 170});
			CameraTest.avatar.speed = 8;
			CameraTest.avatar.createSprite({
					texture: CameraTest.circleTex,
					width: 36,
					height: 48,
					textureRectangle: [0,48,48,112]
			});
			CameraTest.avatar.setSpriteOffset(0,-16);
			CameraTest.avatar.createHitbox(36,28,0,10);
			CameraTest.em.add(CameraTest.avatar);
			
			CameraTest.NPC = Entity.create({x: 640, y: 170});
			CameraTest.NPC.speed = 8;
			CameraTest.NPC.createSprite({
					texture: CameraTest.circleTex,
					width: 36,
					height: 48,
					color: [0,0,0,1],
					textureRectangle: [0,48,48,112]
			});
			CameraTest.NPC.setSpriteOffset(0,-16);
			CameraTest.NPC.createHitbox(36,28,0,10);
			CameraTest.NPC.createEffectRadius(60);
			CameraTest.em.add(CameraTest.NPC);
			
			CameraTest.cursor = Entity.create({});
			CameraTest.cursor.range = 128;
			CameraTest.cursor.upperBound = 40;
			CameraTest.cursor.lowerBound = 280;
			CameraTest.cursor.createSprite({
				texture: CameraTest.circleTex,
				width: 64,
				height: 48,
				textureRectangle: [0,0,64,48]
			});
			CameraTest.cursor.createHitbox(8,8,0,0);
			CameraTest.em.add(CameraTest.cursor);
		
			CameraTest.struck = false;
			console.log(CameraTest.em.getEntities());
		},
		
		run: function() {
			
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
			
			if (Input.mouseDown.left) {
				
				if (CameraTest.avatar.isInRadius(CameraTest.NPC)) {
					CameraTest.avatar.speedMult = 0.1;
					CameraTest.cursor.range = 52;
					CameraTest.NPC.effectRadius.shapes[0].setRadius(96);
				}
				else {
					CameraTest.avatar.speedMult = 1;
					CameraTest.cursor.range = 128;
					CameraTest.NPC.effectRadius.shapes[0].setRadius(64);
				}
			
				CameraTest.avatar.approach(CameraTest.cursor.x, CameraTest.cursor.y, CameraTest.cursor.range);
					
				var normal = [];
				var point = [];
				if( Physics.collisionUtils.sweepTest(CameraTest.avatar.hitbox.shapes[0], CameraTest.NPC.hitbox.shapes[0], 1/60, point, normal) !== undefined){
				
					var boxPos = CameraTest.NPC.hitbox.computeWorldBounds();
			
					if (normal[0] == 1) CameraTest.avatar.x -= CameraTest.avatar.movement.x + (point[0] - boxPos[0]);
					else if (normal[0] == -1) CameraTest.avatar.x += CameraTest.avatar.movement.x + (boxPos[2] - point[0]);
					else if (normal[1] == 1) CameraTest.avatar.y -= CameraTest.avatar.movement.y + (point[1] - boxPos[1]);
					else if (normal[1] == -1) CameraTest.avatar.y += CameraTest.avatar.movement.y + (boxPos[3] - point[1]);
					
				}
				
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
				
					if (Physics.collisionUtils.intersects(CameraTest.avatar.hitbox.shapes[0], CameraTest.NPC.effectRadius.shapes[0])) {
						var avBox = CameraTest.avatar.hitbox.getPosition();
						var NPCBox = CameraTest.NPC.hitbox.getPosition();
						var avNPC = [(NPCBox[0] - avBox[0]), (NPCBox[1] - avBox[1])];
						var theta = Math.atan2(-avNPC[1],avNPC[0]);
						if (theta < 0) theta += 2 * Math.PI;
						
						var hitboxWidth = 36;
						var hitboxHeight = 28;
						
						var push = 24;
						var pushMin = 8;
						var pushRadius = 48;
						var avPos = [CameraTest.avatar.x, CameraTest.avatar.y + CameraTest.avatar.sprite.yOffset];
						var NPCPos =  [CameraTest.NPC.x, CameraTest.NPC.y + CameraTest.NPC.sprite.yOffset];
						var xDiff = Math.abs(NPCPos[0] - avPos[0]);
						var yDiff = Math.abs(NPCPos[1] - avPos[1]);
						xDiff -= hitboxWidth;
						yDiff -= hitboxHeight;
						if(xDiff < 0) xDiff = 0;
						if(yDiff < 0) yDiff = 0;
						var distance = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
						
						
						//push = push * (1 - ( (distance - pushRadius)/pushRadius) );
						if ( (Input.mouseDown.left) && (Physics.collisionUtils.intersects(CameraTest.NPC.hitbox.shapes[0], CameraTest.cursor.hitbox.shapes[0]) ) ){
							push *= 2;
						}
						if (push < pushMin) push = pushMin;
						console.log(push);
						
						var NPCWaypoint = [];
						var avatarWaypoint = [];
					
						NPCWaypoint[0] = CameraTest.NPC.x - push*-Math.cos(theta);
						NPCWaypoint[1] = CameraTest.NPC.y - push*Math.sin(theta);
						NPCWaypoint[0] = Math.floor(NPCWaypoint[0]);
						NPCWaypoint[1] = Math.floor(NPCWaypoint[1]);
						avatarWaypoint[0] = Math.floor(NPCWaypoint[0]+(pushRadius*-Math.cos(theta) ) );
						avatarWaypoint[1] = Math.floor(NPCWaypoint[1]+(pushRadius*Math.sin(theta) ) );
						CameraTest.NPC.overwriteWaypoint(0, NPCWaypoint[0],NPCWaypoint[1]);
						CameraTest.avatar.overwriteWaypoint(0, avatarWaypoint[0],avatarWaypoint[1]);
					}
				}
			}
			else CameraTest.struck = false;
			
			CameraTest.em.allToCurrentWaypoint();
			
		},
		
		draw: function(){

			Graphics.device.clear([1,1,1,1]);
			CameraTest.floor.render(Graphics.device, CameraTest.camera);
			
			if(CameraTest.circleTex) {
				if (Input.mouseDown.left) CameraTest.cursor.sprite.setTextureRectangle([64,0,128,48]);
				else CameraTest.cursor.sprite.setTextureRectangle([0,0,64,48]);
				CameraTest.cursor.zIndex = CameraTest.avatar.zIndex - 1;
				CameraTest.em.drawAll();
			}
			
		}
		
	},
	
}