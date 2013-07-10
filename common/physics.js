var Physics = {
	
	initializeEngineReferences: function initializeEngineReferences(){
		Physics.device = Physics2DDevice.create();
		Physics.collisionUtils = Physics.device.createCollisionUtils();
	},
	
	clearEngineReferences: function clearEngineReferences(){
		Physics.device = null;
		Physics.collisionUtils = null;
	},
	
	createBasicBody: function createBasicBody(shape, type){
		type = type || 'kinematic';
		return Physics.device.createRigidBody({
			shapes: [shape],
			position: [0, 0],
			type: type
		});
	},
	
	entityBounce: function entityBounce(a, b){
		var normal = [];
		var point = [];
		if (Physics.collisionUtils.sweepTest(a.hitbox.shapes[0], b.hitbox.shapes[0], 1/60, point, normal) !== undefined) {
			a.nextWaypoint();
			var boxPos = b.hitbox.computeWorldBounds();
			if (normal[0] == 1) a.x -= a.movement.x + (point[0] - boxPos[0]);
			else if (normal[0] == -1) a.x += a.movement.x + (boxPos[2] - point[0]);
			else if (normal[1] == 1) a.y -= a.movement.y + (point[1] - boxPos[1]);
			else if (normal[1] == -1) a.y += a.movement.y + (boxPos[3] - point[1]);
		}
	},
}