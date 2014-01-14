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
		Graphics.debugDraw.drawCircle(me[0],me[1],4,[1,0,0,1]);
		if (i < path.length-1){
			var next = path[i+1];
			Graphics.debugDraw.drawLine(me[0],me[1],next[0],next[1],[0,0,1,1]);
		}	
	}
	Graphics.debugDraw.end();
}