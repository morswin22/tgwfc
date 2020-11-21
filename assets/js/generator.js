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
  const box = document.createElement('div');
  box.classList.add('generator', 'shown');
  document.body.appendChild(box);

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
        resetWave();
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
  widthInput.box.remove();
  box.appendChild(widthInput.box);
  const heightInput = createInputSlider('Height', nSize*2, windowHeight, nSize, nSize*5, value => emit('resized', height = Math.ceil(value/nSize)*nSize));
  heightInput.box.remove();
  box.appendChild(heightInput.box);

  const updateInputs = configuration => {
    widthInput.updateConfiguration(configuration);
    heightInput.updateConfiguration(configuration);
  };

  const resetButton = document.createElement('span');
  resetButton.innerText = 'Reset';
  box.appendChild(resetButton);

  const solveButton = document.createElement('span');
  solveButton.innerText = 'Solve';
  box.appendChild(solveButton);

  if (globalEvents) {
    globalEvents.on('resized', ([width, height]) => {
      widthInput.updateConfiguration({ max: width });
      heightInput.updateConfiguration({ max: height });
    });
    globalEvents.on('pressed', ([x, y]) => {
      if (x > 0 && x < width && y > 0 && y < height) {
        x = Math.floor(x / nSize);
        y = Math.floor(y / nSize);
        // TODO Add a way to select painting tile
        // wave[y][x] = ['/assets/presets/pipes/pipes-0.png'];
        // wave[y][x] = ['/assets/presets/buch/rocks-top.png'];
        wave[y][x] = ['/assets/presets/buch/none.png'];
        propagate([x, y]);
        emit('update', [wave, tiles]);
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
        wave[i][j] = [ ...tiles ];
      }
    }
    console.log(wave);
  };

  const iterate = () => {
    const minimal = getMinEntropy();
    if (minimal) {
      collapse(minimal);
      propagate(minimal);
      setTimeout(iterate, 0);
      emit('update', [wave, tiles]);
    } else {
      console.log('Complete');
    }
  };

  const getMinEntropy = () => {
    let min = tiles.length + 1;
    let minimal = undefined;
    for (let i = 0; i < wave.length; i++) {
      for (let j = 0; j < wave[i].length; j++) {
        if (min > wave[i][j].length && wave[i][j].length > 1) {
          min = wave[i][j].length;
          minimal = [j, i];
        }
      }
    }
    return minimal;
  };

  const collapse = ([x, y]) => {
    // forces a tile to collapse, with randomness and rules followage
    // ex. pole should have really low chance as well as the rock
    wave[y][x] = [random(wave[y][x])];
  };

  const propagate = (origin) => {
    const checked = [origin];
    const stack = [...getNeighbours(origin)];
    while (stack.length) {
      const current = stack.shift();
      checked.push(current);
      const currentNeighbours = getNeighbours(current);
      const canBe = {n:{},e:{},s:{},w:{}};
      for (const neighbour of currentNeighbours) {
        const dx = neighbour[0] - current[0];
        const dy = neighbour[1] - current[1];
        const connections = dx === 1 ? ['w','e'] : dx === -1 ? ['e','w'] : dy === -1 ? ['s','n'] : dy === 1 ? ['n','s'] : null;
        for (const neighbourTile of wave[neighbour[1]][neighbour[0]]) {
          for (const tile of wave[current[1]][current[0]]) {
            if (hasCommon(configuration[neighbourTile][connections[0]], configuration[tile][connections[1]])) {
              canBe[connections[1]][tile] = true;
            }
          }
        }
      }
      const combined = getCommons(Object.entries(canBe).flatMap(([, value]) => [Object.keys(value)]));
      wave[current[1]][current[0]] = combined;
      if (combined.length < tiles.length) {
        getNeighbours(current).filter(([x, y]) => !checked.find(([sx, sy]) => x === sx && y === sy)).filter(([x, y]) => !stack.find(([sx, sy]) => x === sx && y === sy)).forEach(neighbour => stack.push(neighbour));
      }
    }
  };

  const getNeighbours = ([x, y]) => [[x+1,y],[x-1,y],[x,y-1],[x,y+1]].filter(([x, y]) => y >= 0 && y < wave.length && x >= 0 && x < wave[y].length);

  const hasCommon = (a1, a2) => {
    for (let i = 0; i < a1.length; i++) {
      for (let j = 0; j < a2.length; j++) {
        if (a1[i] === a2[j]) {
          return true;
        }
      }
    }
    return false;
  };

  const getCommons = arrays => {
    const seen = {};
    const max = arrays.reduce((acc, value) => acc + !!value.length, 0);
    for (const array of arrays) {
      for (const item of array) {
        if (item in seen) {
          seen[item] += 1;
        } else {
          seen[item] = 1;
        }
      }
    }
    return Object.entries(seen).filter(([, value]) => max === value).flatMap(([key, ]) => key);
  }

  return { setConfiguration, resetWave, iterate, on, resetButton, solveButton };
}
