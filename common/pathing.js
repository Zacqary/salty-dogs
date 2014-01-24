/* 
	================================================
	====================PATHING=====================
	================================================
	
	Includes:
	- Pathing
	
*/

/*	Pathing Interface
		Handles pathfinding
*/

var Pathing = { }

Pathing.operations = 0;
Pathing.operationsLimit = 9999;
Pathing.operationsResetter = new Countdown(0, function(){
	Pathing.operations = 0;
});
Pathing.findPath = function(startTile, endTile, matrix){
	if (Pathing.operations >= Pathing.operationsLimit) return false;
	var height = matrix.length;
	var width = matrix[0].length;
	var grid = new PF.Grid(width, height, matrix);
	var finder = new PF.BestFirstFinder({
		allowDiagonal: true,
		dontCrossCorners: true,
		heuristic: PF.Heuristic.euclidean,
	});
	
	var path = finder.findPath(startTile[0],startTile[1],endTile[0],endTile[1], grid);

	Pathing.operations++;
	
	delete grid;
	delete finder;
	if (path.length == 0) return false;
	else return path;
	
}

Pathing.createMatrix = function(params){
	var gridOrigin = params.origin;
	var gridWidth = params.width;
	var gridHeight = params.height;
	var tileSize = params.precision;
	var projectionArgs = {
		staticOnly: params.staticOnly,
		berth: params.berth,
	};
	if (!params.entity) {
		projectionArgs.width = params.projectionWidth || tileSize;
		projectionArgs.height = params.projectionHeight || tileSize;
	}
	else {
		var entity = params.entity;
	}
	
	var matrix = [];
	var blocks = 0;
	//	For every row...
	for (var i = 0; i < gridHeight; i++){
		var row = [];
		//	Find the y coordinate in the world that this row corresponds to
		var y = ( (tileSize/2)+(tileSize*i) ) + gridOrigin[1];
		//	For every cell of this row...
		for (var j = 0; j < gridWidth; j++){
			//	Find the x coordinate in the world that this column corresponds to
			var x = ( (tileSize/2)+(tileSize*j) ) + gridOrigin[0];
			//	If the matrix is being created for an Entity
			if (entity) {
				//	Project the Entity's hitbox onto the x and y coordinates to see if it would
				//	fit in the space. If not, mark the cell as obstructed.
				if (entity.manager.hitboxProjectionTest(entity,[x,y],projectionArgs)) {
					row.push(1);
				}
				else row.push(0);
			}
			//	If there's no Entity, just project a rectangle
			else {
				projectionArgs.point = [x,y];
				if (entity.manager.rectangleProjectionTest(projectionArgs)) {
					row.push(1);
				}
				else row.push(0);
			}
		}
		matrix.push(row);
	}
	
	return matrix;
}