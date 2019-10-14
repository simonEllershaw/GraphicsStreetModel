Hallgarth WebGl Model

To run open ‘HallgarthModel.html’ in a browser, such as FireFox, that allows locally stored textures to be loaded. 
All keyboard controls are displayed on the HTML page.

The model contains complex objects including; streetlights, garages, bins and a house along with a landscape 
including grass, road, hedges, kerbs and pavement. These are modelled using textures either as repeatedly mirrored 
mipmaps, or clamped textures in the case of the windows and doors.

The bin lids, garage and front doors open and close on keyboard input. These work off rotational geometrical 
transformations and in the case of the garage a sinusoidal vertical translation also.

The camera has 1st and 3rd person perspectives. 1st person moves in the x-z plane according to the current 
camera angle. The camera can also be rotated according to polar geometry about the current position. The 
3rd person camera moves in a large 3D sphere centred at the origin.

The lighting has two sources. The sun’s light (directional) has circular path about the x-axis and its intensity 
and the model’s background colour vary with the sun’s position. At night 2 street lights (point) turn on and can 
be manually toggled on and off.

Link to the reference images used to create the model is included at the bottom of the HTML page.
