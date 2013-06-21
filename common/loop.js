var Loop = {

	game: function(){

		GameState.loop();
		
		if (!Graphics.device.beginFrame()) {
			return;
		}
		Graphics.device.clear([0.5,0.5,0.5,1]);
		GameState.draw();
		Graphics.device.endFrame();
	},
	
}