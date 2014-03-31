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

Pathing.findUnprocessedPathUsingGrid = function(startPoint, endPoint, grid){
	var pointToTile = function(point){
		var pointOnGrid = [point[0] - grid.origin[0], point[1] - grid.origin[1]];
		var tile = [Math.round(pointOnGrid[0]/grid.precision), Math.round(pointOnGrid[1]/grid.precision)];
		if (tile[0] > grid.width - 1) tile[0] = grid.width - 1;
		if (tile[1] > grid.height - 1) tile[1] = grid.height - 1;
		if (tile[0] < 0) tile[0] = 0;
		if (tile[1] < 1) tile[1] = 0;
		return tile;
	}
	if (!startPoint || !endPoint) return false;
	var startTile = pointToTile(startPoint);
	var endTile = pointToTile(endPoint);
	
	var path = Pathing.findPath(startTile, endTile, grid.matrix);
	if (!path) return false;
	else return path;
}

Pathing.findPathUsingGrid = function(startPoint, endPoint, grid, beforeOptimization){
	var path = Pathing.findUnprocessedPathUsingGrid(startPoint, endPoint, grid);
	if (!path) return false;
	if (_.isFunction(beforeOptimization)) beforeOptimization(path);
	if (path.length == 0) return false;
	path = Pathing.optimizePath(path);
	return Pathing.processPathUsingGrid(path, grid);
	
}

Pathing.processPathUsingGrid = function(path, grid){
	//	Process this path by converting it to waypoints, and eliminating redundant ones
	var processedPath = [];
	//	For every tile...
	for (var i = 0; i < path.length; i++){
		var point = [];
		//	Convert the tile to world coordinates 
		point[0] = ( (grid.precision*path[i][0]) ) + grid.origin[0];
		point[1] = ( (grid.precision*path[i][1]) ) + grid.origin[1];
		processedPath.push(point);
	}
	
	return processedPath;
}

Pathing.optimizePath = function(path, iteration){
	var p = [];
	//	Calculate the direction of each tile on the path
	var directions = [];
	//	For every tile...
	for (var i = 0; i < path.length; i++){
		var newDir = [];
		//	If this isn't the last tile, measure the difference between this tile and the next one
		if (i < path.length-1) {
			newDir = [
				(path[i+1][0] - path[i][0]),
				(path[i+1][1] - path[i][1]),
			];
		}
		//	Record the direction
		directions.push(newDir);
	}
	//	Add the starting tile
	p.push(path[0]);
	//	If this is the first iteration, remove redundant horizontal or vertical lines
	if (!iteration) {
		//	Now take a look at the direction of each tile to see whether it should be added
		for (var i in directions){
			if (i > 0) {
				//	Check if this tile is moving in the same direction as the previous one
				var me = directions[i];
				var prev = directions[i-1];
				if (!_.isEqual(me,prev)) {
					//	If not, add it
					p.push(path[i]);
				}
			}
		}
	}
	//	If this is another iteration, remove redundant diagonal lines by detecting patterns
	else {
		//	Detect the start of a repeating pattern
		var patternStart = directions[0];
		//	Look at the direction of each tile
		for (var i in directions){
			var reset = false;
			if (i > 0) {
				//	Skip any tile with a direction greater than 1; these are probably already optimized
				if (Math.abs(directions[i][0]) <= 1 && Math.abs(directions[i][1]) <= 1) {
					var me = directions[i];
					//	If this is the start of a new pattern, record it
					if (!patternStart) patternStart = me;
					//	If this tile's direction is not the same as the start of the pattern
					else if (!_.isEqual(me,patternStart)){
						//	Check back iteration+1 tiles
						var prev = directions[i-(iteration+1)];
						//	If this tile's direction isn't the same, the pattern is probably over
						if (!_.isEqual(me,prev)){
							reset = true;
						}
					}
				}
				else reset = true;
				//	If there's no more repeating pattern
				if (reset) {
					patternStart = null;
					p.push(path[i]);
				}
			}
		}
	}
	//	Add the ending tile
	p.push(path[path.length-1]);
	
	if (!iteration) p = Pathing.optimizePath(p,1);
	
	return p;
}

Pathing.createMatrix = function(params){
	var gridOrigin = params.origin;
	var gridWidth = params.width;
	var gridHeight = params.height;
	var precision = params.precision;
	var projectionArgs = {
		staticOnly: params.staticOnly,
		berth: params.berth,
		exclude: [],
	};
	if (!params.entity) {
		projectionArgs.width = params.projectionWidth || precision;
		projectionArgs.height = params.projectionHeight || precision;
	}
	else {
		var entity = params.entity;
	}
	if (params.ghosts){
		if (params.ghosts.length) {
			var em = params.ghosts[0].entity.manager;
			for (var i in params.ghosts){
				var me = params.ghosts[i].entity;
				var width = me.hitbox.width;
				var height = me.hitbox.height;
				var body = Entity.createHitbox(width, height);
				body.setPosition(params.ghosts[i].position);
				em.addGhost(body);
				projectionArgs.exclude.push(me.hitbox);
			}
		}
	}
	
	var matrix = [];
	var blocks = 0;
	//	For every row...
	for (var i = 0; i < gridHeight; i++){
		var row = [];
		//	Find the y coordinate in the world that this row corresponds to
		var y = ( (precision/2)+(precision*i) ) + gridOrigin[1];
		//	For every cell of this row...
		for (var j = 0; j < gridWidth; j++){
			//	Find the x coordinate in the world that this column corresponds to
			var x = ( (precision/2)+(precision*j) ) + gridOrigin[0];
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
	
	if (params.ghosts && params.ghosts.length){
		params.ghosts[0].entity.manager.clearGhosts();
	}
	
	return matrix;
}

Pathing.createGrid = function(params){
	var origin = params.origin;
	if (params.centerOrigin) {
		origin = [params.origin[0] - (params.width*params.precision)/2, params.origin[1] - (params.height*params.precision)/2];
	}
	var matrix = Pathing.createMatrix({
		origin: origin,
		precision: params.precision,
		width: params.width,
		height: params.height,
		entity: params.entity,
		berth: params.berth,
		staticOnly: params.staticOnly,
		ghosts: params.ghosts,
	});
	return {
		origin: origin,
		width: params.width,
		height: params.height,
		matrix: matrix,
		precision: params.precision,
	}
}

Pathing.isBlocked = function(target, grid){
	//	Convert the target point to a tile on the grid
	var targetOnGrid = [target[0] - grid.origin[0], target[1] - grid.origin[1]];
	var targetTile = [Math.round(targetOnGrid[0]/grid.precision),Math.round(targetOnGrid[1]/grid.precision)];
	//	Make sure the target tile is within the bounds of the grid
	if (targetTile[0] > grid.width - 1) targetTile[0] = grid.width - 1;
	if (targetTile[1] > grid.height - 1) targetTile[1] = grid.height - 1;
	if (targetTile[0] < 0) targetTile[0] = 0;
	if (targetTile[1] < 0) targetTile[1] = 0;
		
	var x = targetTile[0];
	var y = targetTile[1];
	return(grid.matrix[y][x]);
}
