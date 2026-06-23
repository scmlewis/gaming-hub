export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Board = (string | null)[][];
export type Position = { x: number; y: number };

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  position: Position;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const PIECE_COLORS: Record<TetrominoType, string> = {
  I: '#06b6d4',
  O: '#eab308',
  T: '#8b5cf6',
  S: '#22c55e',
  Z: '#ef4444',
  J: '#3b82f6',
  L: '#f97316',
};

const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );
}

export function getRandomTetromino(): Tetromino {
  const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
  const shape = TETROMINO_SHAPES[type][0];
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return { type, shape, position: { x, y: 0 } };
}

export function getTetrominoShape(type: TetrominoType, rotation: number): number[][] {
  return TETROMINO_SHAPES[type][((rotation % 4) + 4) % 4];
}

export function rotatePiece(shape: number[][], dir: 1 | -1): number[][] {
  const size = shape.length;
  const rotated: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (dir === 1) {
        rotated[c][size - 1 - r] = shape[r][c];
      } else {
        rotated[size - 1 - c][r] = shape[r][c];
      }
    }
  }
  return rotated;
}

export function isValidPosition(board: Board, shape: number[][], pos: Position): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = pos.x + c;
        const newY = pos.y + r;
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
        if (newY >= 0 && board[newY][newX] !== null) return false;
      }
    }
  }
  return true;
}

export function placePiece(board: Board, shape: number[][], pos: Position, color: string): Board {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = pos.x + c;
        const newY = pos.y + r;
        if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
          newBoard[newY][newX] = color;
        }
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { board: Board; linesCleared: number } {
  const newBoard = board.filter((row) => row.some((cell) => cell === null));
  const linesCleared = BOARD_HEIGHT - newBoard.length;
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
  }
  return { board: newBoard, linesCleared };
}

export function mergeBoard(board: Board, shape: number[][], pos: Position, color: string): Board {
  const merged = board.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = pos.x + c;
        const newY = pos.y + r;
        if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
          merged[newY][newX] = color;
        }
      }
    }
  }
  return merged;
}

export function getGhostPosition(board: Board, shape: number[][], pos: Position): Position {
  let ghostY = pos.y;
  while (isValidPosition(board, shape, { x: pos.x, y: ghostY + 1 })) {
    ghostY++;
  }
  return { x: pos.x, y: ghostY };
}

export function checkGameOver(board: Board, shape: number[][], pos: Position): boolean {
  return !isValidPosition(board, shape, pos);
}

export const LINE_SCORES = [0, 100, 300, 500, 800];
