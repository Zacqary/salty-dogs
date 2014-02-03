# Salty Dogs

Open source, open world pirate RPG. With furries.

Prototype is currently running off of app/cameratest.js

To play the prototype, run game.debug.html. Works out of the box in Firefox. Chrome requires the Turbulenz server to be running or it won't load textures.

Built with `makehtml --mode canvas-debug -t . makefile.html makefile.js -o game.debug.html`

HOW TO PLAY:

- Left click or WASD to move, right click or K to attack
- The goal is to deplete your opponent's Focus (green bar). This isn't a health bar, it's more of a "how well can you defend yourself" bar. Once there's animation, characters will automatically parry every attack until their Focus is gone, at which point the next attack will land and kill/stun/incapacitate them.
- You can only attack when you have enough Stamina. The bar is blue when you have enough, and red when you don't.
- Every consecutive attack you land (before your opponent strikes back) will deal extra damage.
- Do not button mash. If you attack too fast, your attacks will cost more stamina and deal less damage.
- Keep an eye on the bottom-most "hit clock" bar to see how fast you can attack. (This information will eventually be 100% conveyed by character animation) If the bar is white, you'll take a penalty if you attack again. If the bar is green or black, you won't take a penalty.
- When the hit clock is black, this gives your opponent an opening to attack. So try and attack as many times as you can while the bar is green.
- Only attack your opponent when their hit clock is black, or you will take a large stamina penalty.