# Scripting

The engine's biggest feature yet, scripting. Currently, you can script in HScript *(haxe scripting language)*, or in NDLL format *(compiled C++ code)*, but mainly in HScript, which should make the experience similar to coding in source code.<br>
Scripting can change not only gameplay, but also menus and other engine functions.<br>

We will focus on writting in HScript, so whenever you have to create a script, the filename has to end with an ``.hx``.<br>
*(you can also use ``.hscript``, ``.hxc`` and ``.hxs``)*

### Scripting relies heavily on having a console opened at all times.
The console helps you track down errors and bugs with your script. To access it, you can either:
- Press F2 to open a window, or
- Start the game in a cmd or powershell window (or in terminal for linux/mac users)

### Our HScript accepts special syntax from Haxe 4.3.x
Things like ``?.``, ``??`` and ``??=`` are accepted in our HScript language.<br>
Using those is beneficial as they prove to be very useful to keeping your code clean.<br>
Example usage:
```hx
if (FlxG.sound.music != null) trace(FlxG.sound.music.time);

trace(FlxG.sound?.music);
```
```hx
var time:Float;
if (FlxG.sound.music != null) time = FlxG.sound.music.time;
else time = 0;

time = FlG.sound?.music ?? 0;
```
```hx
if (FlxG.save.data.isOpen == null) FlxG.save.data.isOpen = true;

FlxG.save.data.isOpen ??= true;
```

## To start on basic scripting, you can follow these articles here:
- <a href="./PlayState Scripts/Gameplay Scripts.md">Gameplay Scripts</a>
- <a href="./PlayState Scripts/Events or Notetype Scripts.md">Events/Notetype Scripts</a>
- <a href="./State or Substate Scripts.md">State/Substate Scripts</a><br><br>
- <a href="./Useful script snippets for modders.md">Useful script snippets for modders</a>
- <a href="./All of the script calls.md">All of the script calls</a>

And if you wanna go advanced, follow the rest of the articles here:
- <a href="./PlayState Scripts/Pause or Game Over Scripts.md">Pause/Game Over Scripts</a>
- <a href="./PlayState Scripts/Cutscenes or Dialogue Scripts.md.md">Cutscenes/Dialogue Scripts</a>
- <a href="./PlayState Scripts/Character or Stage Scripts.md.md">Character/Stage Scripts</a><br><br>
- <a href="./Global Scripts.md">Global Scripts</a>
- <a href="./Custom options.md">Custom options</a>
- <a href="./Shaders.md">Shaders</a>
- <a href="./3D rendering.md">3D rendering</a>
- <a href="./Using hxvlc for videos.md">Using hxvlc for videos</a><br><br>
- <a href="./Scripted Assets Libraries.md">Scripted Assets Libraries</a>
- <a href="./Custom Classes.md">Custom Classes</a>
- <a href="./NDLL Scripting.md">NDLL Scripting</a>