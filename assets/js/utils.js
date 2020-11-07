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
  return box;
}
