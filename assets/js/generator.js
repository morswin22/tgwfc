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

  const { on, emit } = createEvents();

  const setConfiguration = newConfiguration => {
    configuration = newConfiguration;
    tiles = Object.keys(configuration);

    const onReady = ready => {
      if (ready) {
        loader.off('loaded', onReady);
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
  }

  return { setConfiguration };
}
