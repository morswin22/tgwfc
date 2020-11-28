function createInputSlider(name, min, max, step, initial, callback) {
  const box = document.createElement('div');
  box.classList.add('input-slider')

  const label = document.createElement('label');
  label.innerText = name;
  box.appendChild(label);

  let sliderInterval;
  const slider = document.createElement('input');
  slider.setAttribute('type', 'range');
  slider.setAttribute('min', min);
  slider.setAttribute('max', max);
  slider.setAttribute('step', step);
  slider.setAttribute('value', initial);
  box.appendChild(slider);

  const input = document.createElement('input');
  input.setAttribute('type', 'number');
  input.setAttribute('min', min);
  input.setAttribute('max', max);
  input.setAttribute('step', step);
  input.setAttribute('value', initial);
  box.appendChild(input);

  const getEventHandler = (a, b) => () => {
    let value = parseInt(a.value);
    if (isNaN(value)) value = initial;
    b.value = value;
    callback(value);
  };

  input.addEventListener('change', getEventHandler(input, slider));
  slider.addEventListener('change', getEventHandler(slider, input));
  slider.addEventListener('mousedown', () => {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(getEventHandler(slider, input), 50);
  });
  slider.addEventListener('mouseup', () => {
    clearInterval(sliderInterval);
  });

  const updateConfiguration = configuration => {
    for (const key in configuration) {
      const value = configuration[key];
      switch (key) {
        case 'name':
          label.innerText = value;
          name = value;
          break;
        case 'min':
          slider.setAttribute('min', value);
          input.setAttribute('min', value);
          min = value;
          break;
        case 'max':
          slider.setAttribute('max', value);
          input.setAttribute('max', value);
          max = value;
          break;
        case 'step':
          slider.setAttribute('step', value);
          input.setAttribute('step', value);
          step = value;
          break;
        case 'initial':
          slider.setAttribute('value', value);
          input.setAttribute('value', value);
          initial = value;
          break;
        case 'callback':
          callback = value;
          input.addEventListener('change', getEventHandler(input, slider));
          slider.addEventListener('change', getEventHandler(slider, input));
          slider.addEventListener('mousedown', () => {
            clearInterval(sliderInterval);
            sliderInterval = setInterval(getEventHandler(slider, input), 50);
          });
          slider.addEventListener('mouseup', () => {
            clearInterval(sliderInterval);
          });
          break;
      }
    }
    let value = parseInt(slider.value);
    if (isNaN(value)) value = initial;
    callback(value);
  }

  document.body.appendChild(box);
  callback(initial);
  return { box, updateConfiguration };
}

function createLabeledCheckbox(name, initial, callback) {
  const box = document.createElement('div');
  box.classList.add('labeled-checkbox');

  const label = document.createElement('label');
  label.innerText = name;
  box.appendChild(label);

  const checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');
  checkbox.addEventListener('change', () => callback(checkbox.checked));
  if (initial) checkbox.setAttribute('checked', 'checked');
  label.appendChild(checkbox);

  callback(checkbox.checked);
  return { box };
}

function createPreset(name, fromPreset) {
  const box = document.createElement('div');
  box.classList.add('preset');

  const label = document.createElement('label');
  label.innerText = name;
  box.appendChild(label);

  const items = [];
  let configuration = {};

  const usePreset = () => {
    fromPreset(items, configuration);
    if (globalEvents) globalEvents.emit('reset');
  }

  const usePresetButton = document.createElement('span');
  usePresetButton.innerText = 'Use this preset';
  usePresetButton.addEventListener('click', usePreset);
  box.appendChild(usePresetButton);

  const ul = document.createElement('ul');
  box.appendChild(ul);

  const addItem = item => {
    const li = document.createElement('li');

    const img = document.createElement('img');
    img.setAttribute('src', item);
    img.setAttribute('draggable', 'draggable');
    img.addEventListener('dragstart', event => {
      localStorage.setItem('dragged-preset-item', event.target.getAttribute('src'));
    });
    img.addEventListener('dragend', () => {
      localStorage.removeItem('dragged-preset-item');
    });
    li.appendChild(img);
    
    items.push(item);
    ul.appendChild(li);
  };

  const addItems = items => items.forEach(addItem);

  const applyConfiguration = (baseUrl, name, newConfiguration) => configuration = Object.fromEntries(Object.entries(newConfiguration).map((([key, value]) => [`${baseUrl}/${name}/${key}`, value])));

  document.body.appendChild(box);
  return { box, items, addItem, addItems, applyConfiguration, usePreset };
}

function createPresets(url, fromPreset, callback) {
  const box = document.createElement('div');
  box.classList.add('presets');
  document.body.appendChild(box);
  fetch(url).then(response => response.json()).then(presets => {
    const presetsHandlers = {};
    const baseUrl = url.split('/').slice(0,-1).join('/');
    for (const name in presets) {
      const { addItem, applyConfiguration, box: presetBox, usePreset } = createPreset(name[0].toUpperCase() + name.slice(1), fromPreset);
      for (const path of presets[name].dataset) {
        addItem(`${baseUrl}/${name}/${path}`);
      }
      applyConfiguration(baseUrl, name, presets[name].configuration);
      presetsHandlers['use' + name.charAt(0).toUpperCase() + name.slice(1)] = usePreset;
      presetBox.remove();
      box.appendChild(presetBox);
    }
    if (callback) callback(presetsHandlers);
  });
  return { box };
}

function createConfiguratorBox(name, configuration, resetConfigurationBox) {
  const box = document.createElement('div');
  box.classList.add('configurator-box');
  box.setAttribute('data-url', name);
  const humanDirections = {n: 'North', e: 'East', w: 'West', s: 'South'};

  for (const direction in configuration[name]) {
    const directionBox = document.createElement('input');
    directionBox.classList.add('direction-box', direction);
    directionBox.value = configuration[name][direction].join(' ');
    directionBox.setAttribute('placeholder', humanDirections[direction]);
    directionBox.setAttribute('data-direction', direction);
    directionBox.addEventListener('click', event => event.stopImmediatePropagation());
    directionBox.addEventListener('keyup', event => configuration[name][event.target.getAttribute('data-direction')] = event.target.value.split(/\W+/));
    box.appendChild(directionBox);
  }

  const img = document.createElement('img');
  img.setAttribute('src', name);
  box.appendChild(img);

  const closeButton = document.createElement('img');
  closeButton.setAttribute('src', '/assets/images/check.svg');
  closeButton.addEventListener('click', event => {
    event.stopImmediatePropagation();
    resetConfigurationBox();
  });
  box.appendChild(closeButton);

  return { box };
}

function createConfigurator() {
  const box = document.createElement('div');
  box.classList.add('configurator');

  const label = document.createElement('label');
  label.innerText = 'Configure tiles connectivity';
  box.appendChild(label);

  let configurationBox;
  const resetConfigurationBox = () => {
    if (configurationBox) configurationBox.remove();
    configurationBox = undefined;
  }

  const itemsBox = document.createElement('ul');
  itemsBox.addEventListener('drop', event => {
    event.preventDefault();
    const received = localStorage.getItem('dragged-preset-item');
    if (received) {
      addItem(received);
      updateConfigurator();
    }
  });
  itemsBox.addEventListener('dragover', event => {
    event.preventDefault();
  })
  let configuration = {};
  const getConfiguration = () => configuration;

  const updateConfigurator = () => {
    const directions = ['n','e','s','w'];
    for (const item in configuration) {
      const previous = configuration[item];
      configuration[item] = {};
      for (const direction of directions) {
        configuration[item][direction] = previous[direction] && previous[direction].length ? previous[direction] : [];
      }
    }
    if (configurationBox) {
      const attachedTo = configurationBox.getAttribute('data-url');
      const parent = document.querySelector(`.configurator > ul > li[data-url="${attachedTo}"]`);
      if (parent) {
        configurationBox.remove();
        configurationBox = createConfiguratorBox(attachedTo, configuration, resetConfigurationBox).box;
        parent.appendChild(configurationBox);
      }
    }
  }

  globalEvents.on('saveConfiguration', () => console.log(JSON.stringify(Object.fromEntries(Object.entries(configuration).map(([key, value]) => [key.split('/').pop(), value])))));

  box.appendChild(itemsBox);

  const clearItems = () => {
    for (const item in configuration) delete configuration[item];
    for (const child of Array.from(itemsBox.children)) child.remove();
  }

  const addItem = item => {
    if (configuration[item] === undefined) {
      configuration[item] = {};
      const itemElement = document.createElement('li');
      itemElement.setAttribute('data-url', item);
      itemElement.addEventListener('click', ({ target }) => {
        resetConfigurationBox();
        configurationBox = createConfiguratorBox(target.getAttribute('data-url'), configuration, resetConfigurationBox).box;
        target.appendChild(configurationBox);
      });
    
      const img = document.createElement('img');
      img.setAttribute('src', item);
      itemElement.appendChild(img);

      itemsBox.appendChild(itemElement);
    }
  };
  const addItems = items => items.forEach(addItem);

  const removeItem = item => {
    if (configuration[item] !== undefined) {
      delete configuration[item];
      for (const child of Array.from(itemsBox.children)) if (child.getAttribute('data-url') === item) child.remove();
    } 
  };
  const removeItems = items => items.forEach(removeItem);

  const fromPreset = (items, presetConfiguration) => {
    clearItems();
    resetConfigurationBox();
    addItems(items);
    if (Object.keys(presetConfiguration).length) {
      configuration = { ...presetConfiguration };
    } else {
      updateConfigurator();
    }
  };

  document.body.appendChild(box);
  return { getConfiguration, clearItems, fromPreset, addItem, addItems, removeItem, removeItems, box, updateConfigurator, resetConfigurationBox };
}

function createEvents() {
  const listeners = {};

  const on = (event, callback) => listeners[event] ? listeners[event].push(callback) : listeners[event] = [callback];
  const off = (event, callback) => listeners[event]?.splice(listeners[event]?.findIndex(listener => listener === callback), 1);
  const once = (event, callback) => on(event, value => off(event, callback, callback(value)));
  const emit = (event, value) => listeners[event]?.forEach(listener => listener(value)); 

  return { on, off, once, emit };
}

function createMenu() {
  const box = document.createElement('div');
  box.classList.add('menu');
  document.body.appendChild(box);

  const selectors = {};

  const add = (imageURL, title, selector) => {
    const selected = document.querySelector(selector);
    const image = document.createElement('img');
    image.setAttribute('src', imageURL);
    image.setAttribute('alt', title);
    image.setAttribute('title', title);
    image.addEventListener('click', () => {
      if (selected.classList.contains('shown')) {
        selected.classList.remove('shown');
      } else {
        selected.classList.add('shown');
      }
    });
    box.appendChild(image);
    return selectors[selector] = image;
  }

  return { box, add };
}
