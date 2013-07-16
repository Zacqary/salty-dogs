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
	c.createSprite({width: 48, height: 64}, 0, -18);
	c.createHitbox(48,28);
	c.speed = 8;
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
	
	/*	composeDoll
			Parse the paperDoll objects, and convert them to layers for composeTexture
	*/
	c.composeDoll = function(){
		var layers = [];
		//	Go through all the basic paperDoll components and make them into layers
		for(var i in paperDollZIndex){
			if (paperDollZIndex[i].type !== null) {
				//	If the current component is a sword, create two layers
				if (paperDollZIndex[i].isSword) {
					layers.push({name: paperDollZIndex[i].type+'hilt', color: "c7aa09"});
					layers.push({name: paperDollZIndex[i].type+'blade', color: paperDollZIndex[i].color});
				}
				else {
					layers.push({name: paperDollZIndex[i].type, color: paperDollZIndex[i].color});
				}
				//	See if there are any miscellaneous objects to layer on top of the current component
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

//	paperDoll manipulation functions
//	================================
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

//	Character type functions
//	========================
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

//	Character actions
//	=================

/*	strikeCharacter
		Attack another Character, pushing them away from this Character
*/
Character.prototype.strikeCharacter = function(other){
	//	Get the angle between this character's hitbox and the other character's hitbox
	var myBoxPos = this.hitbox.getPosition();
	var oBoxPos = other.hitbox.getPosition();
	var boxPosDiff = [(oBoxPos[0] - myBoxPos[0]), (oBoxPos[1] - myBoxPos[1])];
	var theta = Math.atan2(-boxPosDiff[1],boxPosDiff[0]);
	if (theta < 0) theta += 2 * Math.PI;
	
	var hitboxWidth = 48;
	var hitboxHeight = 28;
	
	//	Default values for how far to push the other character, and how far this character should stand away
	var push = 30;
	var pushRadius = 64;
	
	//	Calculate the distance between the two characters' sprites
	var myPos = this.getSpriteOffsetPosition();
	var oPos =  other.getSpriteOffsetPosition();
	var xDiff = Math.abs(oPos[0] - myPos[0]);
	var yDiff = Math.abs(oPos[1] - myPos[1]);
	xDiff -= hitboxWidth;
	yDiff -= hitboxHeight;
	if(xDiff < 0) xDiff = 0;
	if(yDiff < 0) yDiff = 0;
	var distance = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
	
	//	If this character is pushing forward, increase the push distance
	var pushForward = false;
	if ( (this.charType == CHAR_PLAYER) && (Input.mouseDown.left) ){
		if (Physics.collisionUtils.intersects(this.cursor.hitbox.shapes[0],other.hitbox.shapes[0]) )
			pushForward = true;
	}
	if (pushForward === true){
		push *= 2;
		pushRadius *= 1.25;
	}
	
	//	Generate the waypoints towards which to push both characters
	var oWaypoint = [];
	var myWaypoint = [];
	//	Push the other character along the angle between the two characters' hitboxes
	oWaypoint[0] = Math.floor(other.x - push*-Math.cos(theta) );
	oWaypoint[1] = Math.floor(other.y - push*Math.sin(theta) );
	//	Push this character along the same angle, but pushRadius pixels away from the other character
	myWaypoint[0] = Math.floor(oWaypoint[0]+(pushRadius*-Math.cos(theta) ) );
	myWaypoint[1] = Math.floor(oWaypoint[1]+(pushRadius*Math.sin(theta) ) );
	
	//	Apply the waypoints 
	other.overwriteWaypoint(0, oWaypoint[0],oWaypoint[1],0.3);
	this.overwriteWaypoint(0, myWaypoint[0],myWaypoint[1],0.3);
}