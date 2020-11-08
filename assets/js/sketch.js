let nSize;

function setup() {
  createCanvas(400, 400);
  createPresets('/assets/presets/presets.json');
  // createInputSlider('n size', 2, 64, 2, 16, value => nSize = value);
}

function draw() {
  background(51);
}
