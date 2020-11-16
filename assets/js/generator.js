const loader = (() => {
  const cache = {};
  let fallbackImage;
  let pending = 0;

  const { on, off, once, emit } = createEvents();

  const isReady = () => !pending;
  
  const add = url => pending += !!loadImage(url, image => emit('loaded', !(pending -= !!(cache[url] = image))));
  const get = url => cache[url] || fallbackImage;

  const fallback = url => loadImage(url, image => fallbackImage = image);

  return { isReady, fallback, cache, add, get, on, off, once, emit };
})();

function createGenerator() {
  let configuration;
  let tiles;
  let nSize;
  let width;
  let height;
  let wave;

  const { on, emit } = createEvents();

  const setConfiguration = newConfiguration => {
    configuration = newConfiguration;
    tiles = Object.keys(configuration);

    const onReady = ready => {
      if (ready) {
        loader.off('loaded', onReady);
        // TODO If nSize changed then resetWave
        nSize = loader.get(tiles[0]).width;
        updateInputs({ min: nSize*2, step: nSize, initial: nSize*5 });
      }
    };
    loader.on('loaded', onReady);

    for (const tile of tiles) {
      loader.add(tile);
    }
  }

  on('resized', () => width && height && resizeCanvas(width, height));

  // TODO If width or height changed then resetWave
  const widthInput = createInputSlider('Width', nSize*2, windowWidth, nSize, nSize*5, value => emit('resized', width = Math.ceil(value/nSize)*nSize));
  const heightInput = createInputSlider('Height', nSize*2, windowHeight, nSize, nSize*5, value => emit('resized', height = Math.ceil(value/nSize)*nSize));

  const updateInputs = configuration => {
    widthInput.updateConfiguration(configuration);
    heightInput.updateConfiguration(configuration);
  };

  if (globalEvents) {
    globalEvents.on('resized', ([width, height]) => {
      widthInput.updateConfiguration({ max: width });
      heightInput.updateConfiguration({ max: height });
    });
    globalEvents.on('pressed', ([x, y]) => {
      if (x > 0 && x < width && y > 0 && y < height) {
        x = Math.floor(x / nSize);
        y = Math.floor(y / nSize);
        const picked = [random(tiles), random(tiles), random(tiles)];
        for (const tile of tiles) {
          if (picked.indexOf(tile) !== -1) {
            wave[y][x][tile] = false;
          }
        }
        console.log('changed at', x, 'x', y, 'to', picked);
      }
    });
  }

  const resetWave = () => {
    const h = Math.floor(height / nSize);
    const w = Math.floor(width / nSize);
    wave = [];
    for (let i = 0; i < h; i++) {
      wave[i] = [];
      for (let j = 0; j < w; j++) {
        wave[i][j] = Object.fromEntries(tiles.map(tile => [tile, true]));
      }
    }
  };

  const iterate = () => {
    const [x, y] = getMinEntropy();
    if (x !== undefined && y !== undefined) {
      const collapsed = collapse(x, y);
      propagate(x, y, collapsed);
      emit('redraw', [wave, tiles]);
    } else {
      console.log('Algorithm: Contradictory state');
    }
  };

  const getMinEntropy = () => {
    let min = tiles.length;
    let x, y;
    for (let i = 0; i < wave.length; i++) {
      for (let j = 0; j < wave[i].length; j++) {
        const sum = Object.values(wave[i][j]).reduce((value, acc) => acc + value);
        if (sum > 1 && min > sum) {
          min = wave[i][j];
          x = j;
          y = i;
        }
      }
    }
    return [x, y];
  }

  const collapse = (x, y) => {
    // TODO Use distributions for random picking tiles
    const picked = random(Object.entries(wave[y][x]).filter(([, state]) => state).flatMap(([tile, ]) => tile));
    for (const tile of tiles) {
      if (tile !== picked) {
        wave[y][x][tile] = false;
      }
    }
    return picked;
  }

  const propagate = (x, y, collapsed) => {
    const neighboursPossibleStates = Object.values(configuration[collapsed]);
    const neighboursPositions = [[y-1, x], [y, x-1], [y+1, x], [y, x+1]];
    for (let i = 0; i < neighboursPositions.length; i++) {
      const [ny, nx] = neighboursPositions[i];
      if (ny >= 0 && ny < wave.length && nx >= 0 && nx < wave[ny].length) {
        for (const tile in wave[ny][nx]) {
          if (neighboursPossibleStates[i][tile] === false) wave[ny][nx][tile] = false; 
        }
      }
    }
  }

  return { setConfiguration, resetWave, iterate, on };
}
