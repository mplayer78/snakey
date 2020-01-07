const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const body = document.getElementsByTagName("body")[0];
const playPause = document.getElementById("play-pause");
const message = document.getElementById("message");
const reset_button = document.getElementById("reset");
const score = document.getElementById("score_number");

let c_width = canvas.width;
let c_height = canvas.height;
let GRID = 128;
let sq_size = [c_width / GRID, c_height / GRID];
let pickup_size = sq_size;
let direction = "l";
let speed = 300;
let game_running = false;

let grid_sq = Array.from({ length: GRID }, () =>
  Array.from({ length: GRID }, () => 0)
);

body.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowUp":
      direction = "u";
      break;
    case "ArrowDown":
      direction = "d";
      break;
    case "ArrowLeft":
      direction = "l";
      break;
    case "ArrowRight":
      direction = "r";
      break;
  }
});

playPause.innerText = game_running ? "Pause" : "Play";

playPause.addEventListener("click", e => {
  game_running = !game_running;
  playPause.innerHTML = game_running ? "Pause" : "Play";
  if (game_running) {
    renderLoop();
  }
});

// let game;

// reset_button.addEventListener("click", e => {
//   //game = new Game();
//   alert("New Game");
// });

class Node {
  constructor(coords) {
    this.coords = coords;
    this.next = null;
    this.prev = null;
  }
}

class Deque {
  constructor() {
    this.front = null;
    this.back = null;
    this.length = 0;
  }
  pushBack(coords) {
    let new_node = new Node(coords);
    // edge case, initial node add
    if (this.length < 1) {
      this.front = new_node;
      this.back = new_node;
      this.length += 1;
      return;
    }
    this.back.next = new_node;
    new_node.prev = this.back;
    this.back = new_node;
    this.length += 1;
  }
  pushFront(coords) {
    let new_node = new Node(coords);
    // edge case, initial node add
    if (this.length < 1) {
      this.front = new_node;
      this.back = new_node;
      this.length += 1;
      return;
    }
    this.front.prev = new_node;
    new_node.next = this.front;
    this.front = new_node;
    this.length += 1;
  }
  popBack() {
    // just deallocate the link
    if (this.length > 1) {
      this.back = this.back.prev;
      this.back.next = null;
      // set both front and back to the same
    } else {
      this.front = null;
      this.back = null;
      this.length = 0;
      return;
    }
    this.length -= 1;
  }
  popFront() {
    if (this.length > 1) {
      this.front = this.front.next;
      this.front.prev = null;
      // set both front and back to the same
    } else {
      this.front = null;
      this.back = null;
      this.length = 0;
      return;
    }
    this.length -= 1;
  }
}

class Snake {
  constructor(pos) {
    this.position = pos;
    this.direction = direction;
    let tail = new Deque();
    tail.pushBack(pos);
    this.tail = tail;
  }
  move(collision) {
    this.direction = direction;
    switch (this.direction) {
      case "l":
        this.position = [this.position[0] - 1, this.position[1]];
        break;
      case "r":
        this.position = [this.position[0] + 1, this.position[1]];
        break;
      case "u":
        this.position = [this.position[0], this.position[1] - 1];
        break;
      case "d":
        this.position = [this.position[0], this.position[1] + 1];
        break;
    }
    this.tail.pushFront(this.position);
    if (!collision) {
      this.tail.popBack();
    }
  }
  change_direction(dir) {
    this.direction = dir;
  }
  self_collision() {
    let head = this.tail.front;
    let tail = this.tail.front;
    while (tail.next) {
      tail = tail.next;
      if (
        head.coords[0] === tail.coords[0] &&
        head.coords[1] === tail.coords[1]
      ) {
        return true;
      }
    }
    return false;
  }
  map_iter(func) {
    let head = this.tail.front;
    while (head.next) {
      func(head);
      head = head.next;
    }
    func(head);
  }
}

class Pickup {
  constructor() {
    this.position = [
      Math.floor(Math.random() * GRID),
      Math.floor(Math.random() * GRID)
    ];
    this.size = pickup_size;
  }
  draw(func) {
    func(this);
  }
}

class Game {
  constructor() {
    this.score = 0;
    game_running = true;
    reset_button.style.visibility = "hidden";
  }
  gameOver() {
    message.innerText = "Game Over";
    game_running = false;
    reset_button.style.visibility = "visible";
  }
}
let game = new Game();
let snakey = new Snake([64, 64]);
ctx.fillStyle = "rgb(200,0,0)";
let start = null;

let pickup = new Pickup();

function renderLoop(timestamp) {
  if (!start) {
    start = timestamp;
  }
  ctx.clearRect(0, 0, c_width, c_height);
  snakey.map_iter(x => {
    ctx.fillRect(
      x.coords[0] * sq_size[0],
      x.coords[1] * sq_size[1],
      sq_size[0],
      sq_size[1]
    );
  });
  pickup.draw(x => {
    ctx.fillRect(
      x.position[0] * sq_size[0],
      x.position[1] * sq_size[1],
      x.size[0],
      x.size[1]
    );
  });
  let pickupCollision =
    Math.pow(snakey.position[0] - pickup.position[0], 2) < 2 &&
    Math.pow(snakey.position[1] - pickup.position[1], 2) < 2;
  let wallCollision =
    0 > Math.min(snakey.position[0], snakey.position[1]) ||
    GRID < Math.max(snakey.position[0], snakey.position[1]);
  if (wallCollision || snakey.self_collision()) {
    game.gameOver();
  }
  if (pickupCollision) {
    snakey.move(true);
    pickup = new Pickup();
  }
  if (timestamp - start > 40) {
    snakey.move();
    start = timestamp;
  }
  game.score += snakey.tail.length;
  score.innerText = game.score;
  if (game_running) {
    requestAnimationFrame(renderLoop);
  }
}

renderLoop();
