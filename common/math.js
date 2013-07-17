Math.distanceXY = function (a,b){
	var xDiff = Math.abs(b[0] - a[0]);
	var yDiff = Math.abs(b[1] - a[1]);
	return Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
}

Math.angleXY = function(b, a){
	var posDiff = [(a[0] - b[0]), (a[1] - b[1])];
	var theta = Math.atan2(-posDiff[1],posDiff[0]);
	if (theta < 0) theta += 2 * Math.PI;
	return theta;
}

Math.lineFromXYAtAngle = function(origin, length, angle){
	var endpoint = [];
	endpoint[0] = origin[0] - length*-Math.cos(angle);
	endpoint[1] = origin[1] - length*Math.sin(angle);
	return endpoint;
}

Math.vNeg = function(array){
	var a = [];
	for(var i in array){
		a.push(-array[i]);
	}
	return a;
}