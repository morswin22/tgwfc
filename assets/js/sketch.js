const globalEvents = createEvents();
let redraw = false;

function setup() {
  createCanvas(20, 20);

  const generator = createGenerator();
  generator.on('update', event => redraw = event);

  const { fromPreset, getConfiguration } = createConfigurator();
  createPresets('/assets/presets/presets.json', fromPreset, ({ usePipes }) => usePipes());
  
  const { add: addButton } = createMenu();
  addButton('/assets/images/presets.svg', 'Presets', '.presets');
  addButton('/assets/images/generator.svg', 'Generator', '.generator');
  addButton('/assets/images/configurator.svg', 'Configurator', '.configurator');

  generator.resetButton.addEventListener('click', () => globalEvents.emit('reset'));
  generator.solveButton.addEventListener('click', generator.iterate);

  globalEvents.on('reset', () => generator.setConfiguration(getConfiguration()));
}

function windowResized() {
  globalEvents.emit('resized', [windowWidth, windowHeight]);
}

function mousePressed() {
  globalEvents.emit('pressed', [mouseX, mouseY]);
}

function draw() {
  if (!redraw) return;
  background(255);
  const [ wave, tiles ] = redraw;
  for (let i = 0; i < wave.length; i++) {
    for (let j = 0; j < wave[i].length; j++) {
      if (wave[i][j].length === tiles.length) continue;
      tint(255, 255 / wave[i][j].length);
      for (const tile of wave[i][j]) {
        const img = loader.get(tile);
        image(img, img.width * j, img.height * i);
      }
    }
  }
  redraw = false;
}