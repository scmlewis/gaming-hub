export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Point = { x: number; y: number };

export type SnakeGame = {
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
  gameOver: boolean;
};

export function createInitialSnake(rows: number, cols: number): Point[] {
  const midX = Math.floor(cols / 2);
  const midY = Math.floor(rows / 2);
  return [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
}

export function generateFood(snake: Point[], rows: number, cols: number): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const available: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }
  if (available.length === 0) return { x: 0, y: 0 };
  return available[Math.floor(Math.random() * available.length)];
}

function getNextHead(head: Point, direction: Direction): Point {
  switch (direction) {
    case 'UP':
      return { x: head.x, y: head.y - 1 };
    case 'DOWN':
      return { x: head.x, y: head.y + 1 };
    case 'LEFT':
      return { x: head.x - 1, y: head.y };
    case 'RIGHT':
      return { x: head.x + 1, y: head.y };
  }
}

export function moveSnake(
  snake: Point[],
  direction: Direction,
  food: Point,
  rows: number,
  cols: number
): { snake: Point[]; ate: boolean; gameOver: boolean } {
  const head = snake[0];
  const newHead = getNextHead(head, direction);

  if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
    return { snake, ate: false, gameOver: true };
  }

  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
      return { snake, ate: false, gameOver: true };
    }
  }

  const ate = newHead.x === food.x && newHead.y === food.y;
  const newSnake = [newHead, ...snake];
  if (!ate) {
    newSnake.pop();
  }

  return { snake: newSnake, ate, gameOver: false };
}

export function getSpeed(score: number): number {
  const base = 150;
  const decrement = Math.floor(score / 5) * 10;
  return Math.max(base - decrement, 50);
}
