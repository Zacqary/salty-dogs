var ENT_CHARACTER = "ENT_CHARACTER";
var Character = function(params){
	
	var c = Entity.create(params);
	c.entType = ENT_CHARACTER;
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