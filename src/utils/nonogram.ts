export type CellState = 'empty' | 'filled' | 'marked';
export type Board = CellState[][];
export type Puzzle = {
  solution: boolean[][];
  rowClues: number[][];
  colClues: number[][];
  size: number;
};

export function computeClues(line: boolean[]): number[] {
  const clues: number[] = [];
  let count = 0;
  for (const cell of line) {
    if (cell) {
      count++;
    } else if (count > 0) {
      clues.push(count);
      count = 0;
    }
  }
  if (count > 0) clues.push(count);
  return clues.length > 0 ? clues : [0];
}

export function generatePuzzle(size: number): Puzzle {
  const solution: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.random() < 0.5)
  );

  const rowClues = solution.map((row) => computeClues(row));
  const colClues: number[][] = [];
  for (let c = 0; c < size; c++) {
    const col = solution.map((row) => row[c]);
    colClues.push(computeClues(col));
  }

  return { solution, rowClues, colClues, size };
}

export function createEmptyBoard(size: number): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'empty' as CellState)
  );
}

export function checkWin(board: Board, solution: boolean[][]): boolean {
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      const isFilled = board[r][c] === 'filled';
      if (isFilled !== solution[r][c]) return false;
    }
  }
  return true;
}

export function getHint(board: Board, solution: boolean[][]): { row: number; col: number } | null {
  const candidates: { row: number; col: number }[] = [];
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      if (solution[r][c] && board[r][c] !== 'filled') {
        candidates.push({ row: r, col: c });
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
