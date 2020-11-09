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
  if (initial) checkbox.setAttribute('checked');
  label.appendChild(checkbox);

  callback(checkbox.checked);
  return { box };
}

function createPreset(name, setItems) {
  const box = document.createElement('div');
  box.classList.add('preset');

  const label = document.createElement('label');
  label.innerText = name;
  box.appendChild(label);

  const items = [];

  const usePresetButton = document.createElement('span');
  usePresetButton.innerText = 'Use this preset';
  usePresetButton.addEventListener('click', () => setItems(items));
  box.appendChild(usePresetButton);

  const ul = document.createElement('ul');
  box.appendChild(ul);

  const addItem = item => {
    const li = document.createElement('li');
    li.setAttribute('data-url', item);

    items.push(item);
    
    const img = document.createElement('img');
    img.setAttribute('src', item);
    li.appendChild(img);

    ul.appendChild(li);
  };

  const addItems = items => items.forEach(addItem);

  document.body.appendChild(box);
  return { box, items, addItem, addItems };
}

function createPresets(url, setItems, callback) {
  fetch(url).then(response => response.json()).then(presets => {
    const baseUrl = url.split('/').slice(0,-1).join('/');
    for (const name in presets) {
      const { addItem } = createPreset(name[0].toUpperCase() + name.slice(1), setItems);
      for (const path of presets[name].dataset) {
        addItem(`${baseUrl}/${name}/${path}`);
      }
    }
    if (callback) callback();
  });
}

function createConfiguratorBox(name, configuration) {
  const box = document.createElement('div');
  box.classList.add('configurator-box');

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

  return { box };
}

function createConfigurator(useTransformations) {
  const box = document.createElement('div');
  box.classList.add('configurator');

  const label = document.createElement('label');
  label.innerText = 'Configure tiles connectivity';
  box.appendChild(label);

  let configurationBox;
  const itemsBox = document.createElement('ul');
  const configuration = {};

  const updateConfigurator = () => {
    const directions = ['n','e','s','w'];
    for (const item in configuration) {
      configuration[item] = {};
      for (const direction of directions) {
        // TODO Keep previous state, the following line is resetting the state
        configuration[item][direction] = Object.fromEntries(Object.keys(configuration).map(key => [key, false]))
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
        if (configurationBox) configurationBox.remove();
        configurationBox = createConfiguratorBox(target.getAttribute('data-url'), configuration).box;
        target.appendChild(configurationBox);
      });
    
      const img = document.createElement('img');
      img.setAttribute('src', item);
      itemElement.appendChild(img);

      itemsBox.appendChild(itemElement);
    }
  };
  const addItems = items => {
    items.forEach(addItem);
    updateConfigurator();
  }

  const removeItem = item => {
    if (configuration[item] !== undefined) {
      delete configuration[item];
      for (const child of Array.from(itemsBox.children)) if (child.getAttribute('data-url') === item) child.remove();
    } 
  };
  const removeItems = items => {
    items.forEach(removeItem);
    updateConfigurator();
  }

  const setItems = items => {
    clearItems();
    addItems(items);
  };

  document.body.appendChild(box);
  return { configuration, clearItems, setItems, addItem, addItems, removeItem, removeItems, box, updateConfigurator };
}
