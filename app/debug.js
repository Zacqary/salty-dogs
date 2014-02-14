/* 
	================================================
	====================DEBUG=======================
	================================================
	
*/

var Debug = { };

Debug.drawPath = function(path){
	Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
	Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
	Graphics.debugDraw.begin();
	for (var i = 0; i < path.length; i++){
		var me = path[i];
		Graphics.debugDraw.drawCircle(me.x,me.y,4,[1,0,0,1]);
		if (i < path.length-1){
			var next = path[i+1];
			Graphics.debugDraw.drawLine(me.x,me.y,next.x,next.y,[0,0,1,1]);
		}	
	}
	Graphics.debugDraw.end();
}

Debug.drawPathfindingGrid = function(grid){
	Graphics.debugDraw.setPhysics2DViewport(Graphics.draw2D.getViewport());
	Graphics.debugDraw.setScreenViewport(Graphics.draw2D.getScreenSpaceViewport());
	Graphics.debugDraw.begin();
	var matrix = grid.matrix;
	var tileSize = grid.tileSize;
	for (var i in matrix){
		var row = matrix[i];
		var y = grid.origin[1] + (i*tileSize);
		for (var j in row){
			var x = grid.origin[0] + (j*tileSize);
			var color = [1,0,1,1];
			if (row[j] == 1) color = [1,1,0,1];
			//Graphics.debugDraw.drawCircle(x,y,2,color);
			Graphics.debugDraw.drawRectangle(x - (tileSize/2), y - (tileSize/2), x + (tileSize/2), y + (tileSize/2),color);
		}
	}
	Graphics.debugDraw.end();
}

EntityManager.prototype.debugDrawAllCharacters = function(){
	var entities = this.getEntities();
	for (var i in entities){
		if (entities[i].charType && entities[i].waypoints) {
			var path = _(entities[i].waypoints).uniq();
			path.splice(0,0,{x: entities[i].x, y: entities[i].y});
			Debug.drawPath(path);
		}
	}
}