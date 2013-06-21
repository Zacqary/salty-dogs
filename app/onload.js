TurbulenzEngine.onload = function onloadFn() 
{
	var errorCallback = function errorCallback(msg) 
	{
		window.alert(msg);
	};
	TurbulenzEngine.onerror = errorCallback;

	TurbulenzEngine.onunload = function onunloadFn() 
	{
		// Clear the interval to stop update from being called
		TurbulenzEngine.clearInterval(Device.intervalID);

		// Tell the Turbulenz Engine to force the js virtual machine
		// to free as much memory as possible
		TurbulenzEngine.flush();

		// Clear each native engine reference
		Protocol.clearEngineReferences();
		
		TurbulenzEngine.onunload = null;
	};
	
	Protocol.initializeEngineReferences();
	// ==================
	// Game-specific code 
	// ==================
	
	GameState.set(CameraTest.loop);
	
};
