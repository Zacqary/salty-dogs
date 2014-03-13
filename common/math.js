Math.distanceXY = function (a,b){
	var xDiff = Math.abs(b[0] - a[0]);
	var yDiff = Math.abs(b[1] - a[1]);
	return Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
}

Math.angleXY = function(b, a){
	var posDiff = [(a[0] - b[0]), (a[1] - b[1])];
	var theta = Math.atan2(-posDiff[1],posDiff[0]);
	if (theta < 0) theta += 2 * Math.PI;
	return new Angle(theta*180/Math.PI);
}

Math.lineFromXYAtAngle = function(origin, length, angle){
	var rads = angle.getRadians();
	var endpoint = [];
	endpoint[0] = origin[0] - length*-Math.cos(rads);
	endpoint[1] = origin[1] - length*Math.sin(rads);
	return endpoint;
}

Math.vNeg = function(array){
	var a = [];
	for(var i in array){
		a.push(-array[i]);
	}
	return a;
}

Math.unitVectorToAngle = function(vector){
	var theta = Math.atan2(vector[1],vector[0]);
	if (theta < 0) theta += 2 * Math.PI;
	return new Angle(theta*180/Math.PI);
}

Math.angleToUnitVector = function(angle){
	var rads = angle.getRadians();
	if (rads > Math.PI) rads -= 2 * Math.PI;
	return [Math.cos(rads), -Math.sin(rads)];
}

Math.unitVector = function(a, b){
	var vector = [b[0] - a[0], b[1] - a[1]];
	var magnitude = Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2));
	var unitVector = [vector[0]/magnitude, vector[1]/magnitude];
	return unitVector;
}

Math.angleToDirection = function(angle){
	var degrees = angle.get();
	var direction;
	if (degrees >= 22 && degrees < 68) {
		direction = 1;
	}
	else if (degrees >= 68 && degrees < 112) {
		direction = 2;
	}
	else if (degrees >= 112 && degrees < 158) {
		direction = 3;
	}
	else if (degrees >= 158 && degrees < 202) {
		direction = 4;
	}
	else if (degrees >= 202 && degrees < 248) {
		direction = 5;
	}
	else if (degrees >= 248 && degrees < 292) {
		direction = 6;
	}
	else if (degrees >= 292 && degrees < 338) {
		direction = 7;
	}
	else if (degrees >= 338 || degrees < 22) {
		direction = 0;
	}
	return direction;
}

var Angle = function(value) {
	
	if (_.isFunction(value)) value = value.get();
	
	var degrees = value;
	if (degrees >= 360) degrees -= 360;
	else if (degrees < 0) degrees += 360;
	var radians = degrees * Math.PI/180;
	
	this.get = function(){
		return degrees;
	}
	
	this.getRadians = function(){
		return radians;
	}
	
	this.set = function(value){
		degrees = value;
		if (degrees >= 360) degrees -= 360;
		else if (degrees < 0) degrees += 360;
		radians = degrees * Math.PI/180;
	}
	
	this.rotate = function(value){
		this.set(degrees + value);
	}
	
	this.rotated = function(value){
		var a = new Angle(degrees);
		a.rotate(value);
		return a;
	}
	
}
