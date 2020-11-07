let nSize;

function setup() {
  createCanvas(400, 400);
  createInputSlider('n size', 0, 10, 1, 5, value => nSize = value);
}

function draw() {
  background(51);
  console.log(nSize);
}
