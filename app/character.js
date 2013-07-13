/* 
	================================================
	==================CHARACTER=====================
	================================================
	
	Includes:
	- Character
	
*/

/*	Character Class - extends Entity
		An Entity with specific Character properties and functions
*/
var ENT_CHARACTER = "ENT_CHARACTER";
var CHAR_PLAYER = "CHAR_PLAYER";
var CHAR_HOSTILE = "CHAR_HOSTILE";
var CHAR_NEUTRAL = "CHAR_NEUTRAL";
var CHAR_FRIENDLY = "CHAR_FRIENDLY";

var Character = function(params){
	
	var c = Entity.create(params);
	c.entType = ENT_CHARACTER;
	c.charType = CHAR_NEUTRAL;
	c.createSprite({width: 48, height: 64}, 0, -16);
	c.createHitbox(48,28,0,18);
	c.paperDoll = {
		body: {
			type: "body",
			color: "808080",
		},
		torso: {
			type: null,
			color: null,
		},
		legs: {
			type: null,
			color: null,
		},
		head: {
			type: null,
			color: null,
		},
		sword: {
			type: null,
			color: null,
			isSword: true,
		},
		misc: [],
	}
	
	var paperDollZIndex = [c.paperDoll.body, c.paperDoll.torso, c.paperDoll.legs, c.paperDoll.head, c.paperDoll.sword];
	
	c.composeDoll = function(){
		var layers = [];
		for(var i in paperDollZIndex){
			if (paperDollZIndex[i].type !== null) {
				if (paperDollZIndex[i].isSword) {
					layers.push({name: paperDollZIndex[i].type+'hilt', color: "c7aa09"});
					layers.push({name: paperDollZIndex[i].type+'blade', color: paperDollZIndex[i].color});
				}
				else {
					layers.push({name: paperDollZIndex[i].type, color: paperDollZIndex[i].color});
				}
				for (var j in this.paperDoll.misc){
					me = this.paperDoll.misc[j];
					if (me.zIndex == i)
						layers.push({name: me.type, color: me.color});
				}
			}
		}
		this.composeTexture(layers);
	}
	
	return c;
}
Character.prototype = Entity.prototype;

Character.create = function(params){
	return new Character(params);
}

Character.prototype.clone = function(){
	var c = new Character({
		x: this.x, 
		y: this.y,
		z: this.z,
		zIndex: this.zIndex,
		visible: this.visible,
		permeable: this.permeable,
		speed: this.speed,
		speedMult: this.speedMult,
		sprite: this.sprite
	});
	c.createEffectRadius(this.effect.radius.shapes[0].getRadius());
	var effect = {types: this.effect.types, doThis: this.effect.doThis};
	c.createEffect(effect);
	
	c.setPaperDoll(this.paperDoll);
	c.charType = this.charType;
	return c;
}

Character.prototype.setPaperDoll = function(doll) {
	this.paperDoll.body.color = doll.body.color;
	this.paperDoll.torso.type = doll.torso.type;
	this.paperDoll.torso.color = doll.torso.color;
	this.paperDoll.legs.type = doll.legs.type;
	this.paperDoll.legs.color = doll.legs.color;
	this.paperDoll.head.type = doll.head.type;
	this.paperDoll.head.color = doll.head.color;
	this.paperDoll.sword.type = doll.sword.type;
	this.paperDoll.sword.color = doll.sword.color;
	for (var i in doll.misc){
		this.addMisc(doll.misc[i].type,doll.misc[i].color,doll.misc[i].zIndex);
	}
}

Character.prototype.setBodyColor = function(color) {
	this.paperDoll.body.color = color;
}

Character.prototype.setTorso = function(type, color){
	this.paperDoll.torso.type = type;
	this.paperDoll.torso.color = color;
}
Character.prototype.removeTorso = function(){
	this.paperDoll.torso.type = null;
	this.paperDoll.torso.color = null;
}

Character.prototype.setLegs = function(type, color){
	this.paperDoll.legs.type = type;
	this.paperDoll.legs.color = color;
}
Character.prototype.removeLegs = function(){
	this.paperDoll.legs.type = null;
	this.paperDoll.legs.color = null;
}

Character.prototype.setHead = function(type, color){
	this.paperDoll.head.type = type;
	this.paperDoll.head.color = color;
}
Character.prototype.removeHead = function(){
	this.paperDoll.head.type = null;
	this.paperDoll.head.color = null;
}

Character.prototype.setSword = function(type, color){
	this.paperDoll.sword.type = type;
	this.paperDoll.sword.color = color;
}
Character.prototype.removeSword = function(){
	this.paperDoll.sword.type = null;
	this.paperDoll.sword.color = null;
}

Character.prototype.addMisc = function(type, color, zIndex){
	this.paperDoll.misc[type] = {type: type, color: color, zIndex: zIndex}	
}
Character.prototype.removeMisc = function(type){
	delete this.paperDoll.misc[type];
}


Character.prototype.makePlayer = function(){
	this.charType = CHAR_PLAYER;
}
Character.prototype.makeNeutral = function(){
	this.charType = CHAR_NEUTRAL;
}
Character.prototype.makeHostile = function(){
	this.charType = CHAR_HOSTILE;
}
Character.prototype.makeFriendly = function(){
	this.charType = CHAR_FRIENDLY;
}

Character.prototype.strikeCharacter = function(other){
	var myBoxPos = this.hitbox.getPosition();
	var oBoxPos = other.hitbox.getPosition();
	var boxPosDiff = [(oBoxPos[0] - myBoxPos[0]), (oBoxPos[1] - myBoxPos[1])];
	var theta = Math.atan2(-boxPosDiff[1],boxPosDiff[0]);
	if (theta < 0) theta += 2 * Math.PI;
	
	var hitboxWidth = 48;
	var hitboxHeight = 28;
	
	var push = 30;
	var pushRadius = 64;
	var myPos = [this.x, this.y + this.sprite.yOffset];
	var oPos =  [other.x, other.y + other.sprite.yOffset];
	var xDiff = Math.abs(oPos[0] - myPos[0]);
	var yDiff = Math.abs(oPos[1] - myPos[1]);
	xDiff -= hitboxWidth;
	yDiff -= hitboxHeight;
	if(xDiff < 0) xDiff = 0;
	if(yDiff < 0) yDiff = 0;
	var distance = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
	
	var pushForward = false;
	if ( (this.charType == CHAR_PLAYER) && (Input.mouseDown.left) ){
		if (Physics.collisionUtils.intersects(this.cursor.hitbox.shapes[0],other.hitbox.shapes[0]) )
			pushForward = true;
	}
	
	if (pushForward === true){
		push *= 2;
		pushRadius *= 1.25;
	}
	
	var oWaypoint = [];
	var myWaypoint = [];

	oWaypoint[0] = other.x - push*-Math.cos(theta);
	oWaypoint[1] = other.y - push*Math.sin(theta);
	oWaypoint[0] = Math.floor(oWaypoint[0]);
	oWaypoint[1] = Math.floor(oWaypoint[1]);
	myWaypoint[0] = Math.floor(oWaypoint[0]+(pushRadius*-Math.cos(theta) ) );
	myWaypoint[1] = Math.floor(oWaypoint[1]+(pushRadius*Math.sin(theta) ) );
	
	other.overwriteWaypoint(0, oWaypoint[0],oWaypoint[1]);
	this.overwriteWaypoint(0, myWaypoint[0],myWaypoint[1]);
}