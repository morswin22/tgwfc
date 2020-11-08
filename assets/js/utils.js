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

function createPreset(name) {
  const box = document.createElement('div');
  box.classList.add('preset');

  const label = document.createElement('label');
  label.innerText = name;
  box.appendChild(label);

  const items = [];

  const usePresetButton = document.createElement('span');
  usePresetButton.innerText = 'Use this preset';
  usePresetButton.addEventListener('click', () => {
    console.log(items);
  });
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

  const addItems = items => items.forEach(item => addItem(item));

  document.body.appendChild(box);
  return { box, items, addItem, addItems };
}

function createPresets(url, callback) {
  fetch(url).then(response => response.json()).then(presets => {
    const baseUrl = url.split('/').slice(0,-1).join('/');
    for (const name in presets) {
      const { addItem } = createPreset(name[0].toUpperCase() + name.slice(1));
      for (const path of presets[name].dataset) {
        addItem(`${baseUrl}/${name}/${path}`);
      }
    }
    if (callback) callback();
  });
}
