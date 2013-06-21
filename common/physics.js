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
	}
}