export const EMPTY = "_";
export const X = "x";
export const O = "o";

export function createEmptyBoard() {
  return [
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY],
  ];
}

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function evaluate(b) {
  for (let row = 0; row < 3; row += 1) {
    if (b[row][0] === b[row][1] && b[row][1] === b[row][2]) {
      if (b[row][0] === "x") {
        return 10;
      } else if (b[row][0] === "o") {
        return -10;
      }
    }
  }

  for (let col = 0; col < 3; col += 1) {
    if (b[0][col] === b[1][col] && b[1][col] === b[2][col]) {
      if (b[0][col] === "x") {
        return 10;
      } else if (b[0][col] === "o") {
        return -10;
      }
    }
  }

  if (b[0][0] === b[1][1] && b[1][1] === b[2][2]) {
    if (b[0][0] === "x") {
      return 10;
    } else if (b[0][0] === "o") {
      return -10;
    }
  }

  if (b[0][2] === b[1][1] && b[1][1] === b[2][0]) {
    if (b[0][2] === "x") {
      return 10;
    } else if (b[0][2] === "o") {
      return -10;
    }
  }

  return 0;
}

export function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== EMPTY));
}

export function getAvailableMoves(board) {
  const moves = [];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      if (board[row][col] === EMPTY) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
}

export function getWinningLine(board) {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  return (
    lines.find((line) => {
      const [first, second, third] = line;
      const value = board[first[0]][first[1]];

      return (
        value !== EMPTY &&
        value === board[second[0]][second[1]] &&
        value === board[third[0]][third[1]]
      );
    }) ?? []
  );
}

function minimax(board, depth, isMaximizingTurn) {
  const score = evaluate(board);

  if (score === 10) {
    return score - depth;
  }

  if (score === -10) {
    return score + depth;
  }

  if (isBoardFull(board)) {
    return 0;
  }

  if (isMaximizingTurn) {
    let best = -Infinity;

    for (const move of getAvailableMoves(board)) {
      board[move.row][move.col] = X;
      best = Math.max(best, minimax(board, depth + 1, false));
      board[move.row][move.col] = EMPTY;
    }

    return best;
  }

  let best = Infinity;

  for (const move of getAvailableMoves(board)) {
    board[move.row][move.col] = O;
    best = Math.min(best, minimax(board, depth + 1, true));
    board[move.row][move.col] = EMPTY;
  }

  return best;
}

export function findBestMove(board, mark) {
  let bestMove = null;
  let bestValue = mark === X ? -Infinity : Infinity;

  for (const move of getAvailableMoves(board)) {
    board[move.row][move.col] = mark;
    const moveValue = minimax(board, 0, mark === O);
    board[move.row][move.col] = EMPTY;

    if (
      (mark === X && moveValue > bestValue) ||
      (mark === O && moveValue < bestValue)
    ) {
      bestValue = moveValue;
      bestMove = move;
    }
  }

  return bestMove;
}
export function resolveBoard(board) {
  const value = evaluate(board);

  if (value === 10) {
    return { evaluation: value, line: getWinningLine(board), winner: X };
  }

  if (value === -10) {
    return { evaluation: value, line: getWinningLine(board), winner: O };
  }

  if (isBoardFull(board)) {
    return { evaluation: 0, line: [], winner: "draw" };
  }

  return { evaluation: value, line: [], winner: null };
}
