const globalEvents = createEvents();

function setup() {
  createCanvas(400, 400);

  const generator = createGenerator();
  const { fromPreset, configuration } = createConfigurator();
  createPresets('/assets/presets/presets.json', fromPreset);

  createButton('Use loaded').mousePressed(() => {
    generator.setConfiguration(configuration);
  });

}

function windowResized() {
  globalEvents.emit('resized', [windowWidth, windowHeight]);
}

function draw() {
  background(51);
}
