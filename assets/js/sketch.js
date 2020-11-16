const globalEvents = createEvents();

function setup() {
  createCanvas(400, 400);

  const generator = createGenerator();
  const { fromPreset, configuration } = createConfigurator();
  createPresets('/assets/presets/presets.json', fromPreset);

  createButton('Use loaded').mousePressed(() => generator.setConfiguration(configuration));

  createButton('Reset wave').mousePressed(generator.resetWave);
  createButton('Start collapsing').mousePressed(generator.iterate);

  generator.on('redraw', ([wave, tiles]) => {
    background(255);
    for (let i = 0; i < wave.length; i++) {
      for (let j = 0; j < wave[i].length; j++) {
        const possible = Object.entries(wave[i][j]).filter(([, state]) => state).flatMap(([tile, ]) => tile)
        if (possible.length === tiles.length) continue;
        const opacity = 1 - possible.length / tiles.length;
        tint(255, opacity * 255);
        for (const tile of possible) {
          const img = loader.get(tile);
          image(img, img.width * j, img.height * i);
        }
      }
    }
    setTimeout(generator.iterate, 0);
  });
}

function windowResized() {
  globalEvents.emit('resized', [windowWidth, windowHeight]);
}

function mousePressed() {
  globalEvents.emit('pressed', [mouseX, mouseY]);
}
