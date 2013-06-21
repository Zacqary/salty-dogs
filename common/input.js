var Input = {

	device: null,
	mousePosition: {
		x: null,
		y: null
	},
	clickPosition: {
		x: null,
		y: null
	},
	mouseDown: {
		left: false,
		right: false
	},
	
	initializeEngineReferences: function initializeEngineReferences(){
		Input.device = TurbulenzEngine.createInputDevice( { } );
		Input.device.addEventListener('mouseover', Input.onMouseOver);
		Input.device.addEventListener('mouseup', Input.onMouseUp);
		Input.device.addEventListener('mousedown', Input.onMouseDown);
	},
	
	clearEngineReferences: function clearEngineReferences(){
		Input.device = null;	
	},

	// ==========================

	onMouseOver: function onMouseOver(x, y){
		Input.mousePosition.x = x;
		Input.mousePosition.y = y;
		if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
		{
			Input.mousePosition.x -= document.getElementById('turbulenz_game_engine_canvas').offsetLeft;
			Input.mousePosition.y -= document.getElementById('turbulenz_game_engine_canvas').offsetTop;
		}
	},
	
	onMouseDown: function onMouseDownFn(mouseCode, x, y)
	{
	    Input.clickPosition.x = x;
	    Input.clickPosition.y = y;
		if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
		{
			Input.clickPosition.x -= document.getElementById('turbulenz_game_engine_canvas').offsetLeft;
			Input.clickPosition.y -= document.getElementById('turbulenz_game_engine_canvas').offsetTop;
		}

	    if (mouseCode === Input.device.mouseCodes.BUTTON_0)
	    {
	        Input.mouseDown.left = true;
	    }
		else if (mouseCode === Input.device.mouseCodes.BUTTON_1)
	    {
	        Input.mouseDown.right = true;
	    }
	},
	
	onMouseUp: function onMouseDownFn(mouseCode, x, y)
	{
	    Input.clickPosition.x = x;
	    Input.clickPosition.y = y;
		if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
		{
			Input.clickPosition.x -= document.getElementById('turbulenz_game_engine_canvas').offsetLeft;
			Input.clickPosition.y -= document.getElementById('turbulenz_game_engine_canvas').offsetTop;
		}

	    if (mouseCode === Input.device.mouseCodes.BUTTON_0)
	    {
	        Input.mouseDown.left = false;
	    }
		else if (mouseCode === Input.device.mouseCodes.BUTTON_1)
	    {
	        Input.mouseDown.right = false;
	    }
	},
}