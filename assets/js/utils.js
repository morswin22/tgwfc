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

  document.body.appendChild(box);
  callback(initial);
  return { box };
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
  const configuration = {};

  const usePresetButton = document.createElement('span');
  usePresetButton.innerText = 'Use this preset';
  usePresetButton.addEventListener('click', () => fromPreset(items, configuration));
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

  const applyConfiguration = newConfiguration => {
    const dirs = ['n','e','s','w'];
    for (const i in newConfiguration) {
      configuration[items[i]] = {};
      for (const dir in newConfiguration[i]) {
        configuration[items[i]][dirs[dir]] = {};
        for (const j in newConfiguration[i][dir]) {
          configuration[items[i]][dirs[dir]][items[j]] = !!newConfiguration[i][dir][j];
        }
      }
    }
  }

  document.body.appendChild(box);
  return { box, items, addItem, addItems, applyConfiguration };
}

function createPresets(url, fromPreset, callback) {
  fetch(url).then(response => response.json()).then(presets => {
    const baseUrl = url.split('/').slice(0,-1).join('/');
    for (const name in presets) {
      const { addItem, applyConfiguration } = createPreset(name[0].toUpperCase() + name.slice(1), fromPreset);
      for (const path of presets[name].dataset) {
        addItem(`${baseUrl}/${name}/${path}`);
      }
      applyConfiguration(presets[name].configuration);
    }
    if (callback) callback();
  });
}

function createConfiguratorBox(name, configuration, resetConfigurationBox) {
  const box = document.createElement('div');
  box.classList.add('configurator-box');
  box.setAttribute('data-url', name);

  for (const direction in configuration[name]) {
    const directionBox = document.createElement('div');
    directionBox.classList.add('direction-box', direction);

    for (const item in configuration[name][direction]) {
      const itemBox = document.createElement('img');
      itemBox.setAttribute('src', item);
      itemBox.setAttribute('data-direction', direction);
      itemBox.addEventListener('click', event => {
        event.stopImmediatePropagation();
        const direction = event.target.getAttribute('data-direction');
        const item = event.target.getAttribute('src');
        configuration[name][direction][item]= !configuration[name][direction][item];
        if (configuration[name][direction][item]) {
          event.target.classList.add('selected');
        } else {
          event.target.classList.remove('selected');
        }
      });
      if (configuration[name][direction][item]) {
        itemBox.classList.add('selected');
      } else {
        itemBox.classList.remove('selected');
      }
      directionBox.appendChild(itemBox);
    }

    box.appendChild(directionBox);
  }

  const img = document.createElement('img');
  img.setAttribute('src', name);
  box.appendChild(img);

  const closeButton = document.createElement('span');
  closeButton.addEventListener('click', resetConfigurationBox);
  box.appendChild(closeButton);

  return { box };
}

function createConfigurator(useTransformations) {
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
  const configuration = {};

  const updateConfigurator = () => {
    const directions = ['n','e','s','w'];
    for (const item in configuration) {
      const previous = configuration[item];
      configuration[item] = {};
      for (const direction of directions) {
        configuration[item][direction] = Object.fromEntries(Object.keys(configuration).map(key => [key, Object.keys(previous).length ? previous[direction][key] : false]))
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

  const { box: labeledCheckbox } = createLabeledCheckbox('Use transformations?', useTransformations, value => { useTransformations = value; updateConfigurator(); });
  box.appendChild(labeledCheckbox);

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
    for (const item in presetConfiguration) {
      configuration[item] = {};
      for (const direction in presetConfiguration[item]) {
        configuration[item][direction] = {};
        for (const key in presetConfiguration[item][direction]) {
          configuration[item][direction][key] = presetConfiguration[item][direction][key];
        }
      }
    }
  };

  document.body.appendChild(box);
  return { configuration, clearItems, fromPreset, addItem, addItems, removeItem, removeItems, box, updateConfigurator, resetConfigurationBox };
}
