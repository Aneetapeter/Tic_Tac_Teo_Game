import { useMemo, useRef, useState } from "react";
import "./App.css";
import {
  EMPTY,
  O,
  X,
  cloneBoard,
  createEmptyBoard,
  findBestMove,
  resolveBoard,
} from "./gameLogic";

function App() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [round, setRound] = useState(1);
  const [result, setResult] = useState(resolveBoard(createEmptyBoard()));
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [score, setScore] = useState({ human: 0, ai: 0, draw: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [humanMark, setHumanMark] = useState(null);
  const [gameMode, setGameMode] = useState("ai");
  const [currentTurn, setCurrentTurn] = useState(X);
  const aiMark = humanMark === X ? O : X;
  const aiTimer = useRef(null);
  const secondPlayerLabel = gameMode === "ai" ? "AI" : "Player 2";

  const winningCells = useMemo(
    () => new Set(result.line.map(([row, col]) => `${row}-${col}`)),
    [result.line],
  );

  const statusText = useMemo(() => {
    if (!humanMark) {
      return "CHOOSE MARK";
    }

    if (result.winner === humanMark) {
      return "PLAYER WINS";
    }

    if (result.winner === aiMark) {
      return gameMode === "ai" ? "AI WINS" : "PLAYER 2 WINS";
    }

    if (result.winner === "draw") {
      return "DRAW ROUND";
    }

    if (gameMode === "two") {
      return currentTurn === humanMark ? "PLAYER 1 MOVE" : "PLAYER 2 MOVE";
    }

    return isAiThinking ? "AI SCANNING" : "YOUR MOVE";
  }, [aiMark, currentTurn, gameMode, humanMark, isAiThinking, result.winner]);

  const lineClass = useMemo(() => {
    const lineKey = result.line.map(([row, col]) => `${row}${col}`).join("-");

    return {
      "00-01-02": "win-row-0",
      "10-11-12": "win-row-1",
      "20-21-22": "win-row-2",
      "00-10-20": "win-col-0",
      "01-11-21": "win-col-1",
      "02-12-22": "win-col-2",
      "00-11-22": "win-diag-main",
      "02-11-20": "win-diag-alt",
    }[lineKey];
  }, [result.line]);

  function applyResult(nextBoard) {
    const nextResult = resolveBoard(nextBoard);

    setBoard(nextBoard);
    setResult(nextResult);
    setMoveCount((count) => Math.min(count + 1, 5));

    if (!nextResult.winner) {
      setCurrentTurn((turn) => (turn === X ? O : X));
      return nextResult;
    }

    setScore((previousScore) => ({
      human:
        nextResult.winner === humanMark
          ? previousScore.human + 1
          : previousScore.human,
      ai:
        nextResult.winner === aiMark
          ? previousScore.ai + 1
          : previousScore.ai,
      draw:
        nextResult.winner === "draw"
          ? previousScore.draw + 1
          : previousScore.draw,
    }));

    return nextResult;
  }

  function makeAiMove(nextBoard) {
    const move = findBestMove(cloneBoard(nextBoard), aiMark);

    if (!move) {
      setIsAiThinking(false);
      return;
    }

    const aiBoard = cloneBoard(nextBoard);
    aiBoard[move.row][move.col] = aiMark;
    setIsAiThinking(false);
    applyResult(aiBoard);
  }

  function scheduleAiMove(nextBoard) {
    setIsAiThinking(true);
    window.clearTimeout(aiTimer.current);
    aiTimer.current = window.setTimeout(() => makeAiMove(nextBoard), 420);
  }

  function openWithAi(nextBoard) {
    setIsAiThinking(true);
    window.clearTimeout(aiTimer.current);
    aiTimer.current = window.setTimeout(() => {
      const move = findBestMove(cloneBoard(nextBoard), X);
      const aiBoard = cloneBoard(nextBoard);

      if (move) {
        aiBoard[move.row][move.col] = X;
      }

      setIsAiThinking(false);
      applyResult(aiBoard);
    }, 420);
  }

  function playHumanMove(row, col) {
    if (
      !humanMark ||
      board[row][col] !== EMPTY ||
      result.winner ||
      isAiThinking ||
      (gameMode === "ai" && currentTurn !== humanMark)
    ) {
      return;
    }

    setHistory((previousHistory) => [
      ...previousHistory,
      {
        board: cloneBoard(board),
        moveCount,
        result,
        score,
        currentTurn,
      },
    ]);

    const nextBoard = cloneBoard(board);
    nextBoard[row][col] = gameMode === "ai" ? humanMark : currentTurn;
    const nextResult = applyResult(nextBoard);

    if (gameMode === "ai" && !nextResult.winner) {
      scheduleAiMove(nextBoard);
    }
  }

  function playHintMove() {
    if (!humanMark || result.winner || isAiThinking) {
      return;
    }

    const move = findBestMove(
      cloneBoard(board),
      gameMode === "ai" ? humanMark : currentTurn,
    );

    if (!move) {
      return;
    }

    playHumanMove(move.row, move.col);
  }

  function undoTurn() {
    if (history.length === 0) {
      return;
    }

    window.clearTimeout(aiTimer.current);

    const previousState = history[history.length - 1];
    setBoard(cloneBoard(previousState.board));
    setResult(previousState.result);
    setScore(previousState.score);
    setMoveCount(previousState.moveCount);
    setCurrentTurn(previousState.currentTurn);
    setIsAiThinking(false);
    setHistory((previousHistory) => previousHistory.slice(0, -1));
  }

  function startNextRound() {
    window.clearTimeout(aiTimer.current);
    const emptyBoard = createEmptyBoard();

    setBoard(emptyBoard);
    setResult(resolveBoard(emptyBoard));
    setIsAiThinking(false);
    setMoveCount(0);
    setHistory([]);
    setCurrentTurn(X);
    setRound((currentRound) => currentRound + 1);

    if (gameMode === "ai" && humanMark === O) {
      scheduleAiMove(emptyBoard);
    }
  }

  function resetMatch() {
    window.clearTimeout(aiTimer.current);
    const emptyBoard = createEmptyBoard();

    setBoard(emptyBoard);
    setResult(resolveBoard(emptyBoard));
    setIsAiThinking(false);
    setMoveCount(0);
    setHistory([]);
    setCurrentTurn(X);
    setRound(1);
    setScore({ human: 0, ai: 0, draw: 0 });

    if (gameMode === "ai" && humanMark === O) {
      scheduleAiMove(emptyBoard);
    }
  }

  function chooseMark(mark) {
    window.clearTimeout(aiTimer.current);
    const emptyBoard = createEmptyBoard();

    setHumanMark(mark);
    setBoard(emptyBoard);
    setResult(resolveBoard(emptyBoard));
    setIsAiThinking(false);
    setMoveCount(0);
    setHistory([]);
    setCurrentTurn(X);
    setRound(1);
    setScore({ human: 0, ai: 0, draw: 0 });

    if (gameMode === "ai" && mark === O) {
      openWithAi(emptyBoard);
    }
  }

  function newGame() {
    window.clearTimeout(aiTimer.current);
    const emptyBoard = createEmptyBoard();

    setBoard(emptyBoard);
    setResult(resolveBoard(emptyBoard));
    setIsAiThinking(false);
    setMoveCount(0);
    setHistory([]);
    setCurrentTurn(X);
    setRound(1);
    setScore({ human: 0, ai: 0, draw: 0 });
    setHumanMark(null);
  }

  function restartWithSettings(nextMark, nextMode = gameMode) {
    window.clearTimeout(aiTimer.current);
    const emptyBoard = createEmptyBoard();

    setHumanMark(nextMark);
    setGameMode(nextMode);
    setBoard(emptyBoard);
    setResult(resolveBoard(emptyBoard));
    setIsAiThinking(false);
    setMoveCount(0);
    setHistory([]);
    setCurrentTurn(X);
    setRound(1);
    setScore({ human: 0, ai: 0, draw: 0 });

    if (nextMode === "ai" && nextMark === O) {
      openWithAi(emptyBoard);
    }
  }

  function switchMark() {
    if (!humanMark) {
      return;
    }

    restartWithSettings(humanMark === X ? O : X);
  }

  function switchMode() {
    if (!humanMark) {
      setGameMode((mode) => (mode === "ai" ? "two" : "ai"));
      return;
    }

    restartWithSettings(humanMark, gameMode === "ai" ? "two" : "ai");
  }

  function renderMark(mark) {
    return mark === X ? <span className="token token-x" /> : <span className="token token-o" />;
  }

  function renderAvatar(mark) {
    return mark === X ? (
      <div className="avatar-x" aria-hidden="true" />
    ) : (
      <div className="avatar-ring" aria-hidden="true" />
    );
  }

  return (
    <main className="game-shell">
      <div className="scanlines" />
      <div className="floor-grid" />

      <section className="phone-frame" aria-label="Tic Tac Toe arena">
        <header className="top-bar">
          <button className="icon-button" type="button" aria-label="Back">
            <span aria-hidden="true">&lt;</span>
          </button>

          <div className="round-pill">ROUND {String(round).padStart(2, "0")}</div>

          <button
            className="icon-button"
            type="button"
            aria-label="Reset match"
            onClick={resetMatch}
          >
            <span aria-hidden="true">R</span>
          </button>
        </header>

        <section className="versus-row" aria-label="Score">
          <div className="avatar-block human-block">
            {renderAvatar(humanMark ?? O)}
            <span>Player</span>
            <strong>{score.human}</strong>
          </div>

          <div className="versus-core">
            <span>VS</span>
            <div className="charge-track" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((charge) => (
                <i key={charge} className={charge < moveCount ? "charged" : ""} />
              ))}
            </div>
          </div>

          <div className="avatar-block ai-block">
            {renderAvatar(humanMark ? aiMark : X)}
            <span>{secondPlayerLabel}</span>
            <strong>{score.ai}</strong>
          </div>
        </section>

        <div className="status-strip">
          <strong>{statusText}</strong>
          <span>
            {gameMode === "ai" ? "AI MODE" : "2 PLAYER"} / EVAL{" "}
            {result.evaluation > 0 ? `+${result.evaluation}` : result.evaluation}
          </span>
        </div>

        <section className="settings-dock" aria-label="Game settings">
          <button type="button" disabled={!humanMark} onClick={switchMark}>
            Mark {humanMark ? humanMark.toUpperCase() : "--"}
          </button>
          <button type="button" onClick={switchMode}>
            {gameMode === "ai" ? "AI Mode" : "2 Player"}
          </button>
        </section>

        <section className="board-panel">
          <div className="board-grid" role="grid" aria-label="Tic Tac Toe board">
            {lineClass ? <div className={`winning-beam ${lineClass}`} /> : null}

            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isWinning = winningCells.has(`${rowIndex}-${colIndex}`);

                return (
                  <button
                    aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}`}
                    className={[
                      "cell",
                      cell === humanMark ? "cell-human" : "",
                      cell === aiMark ? "cell-ai" : "",
                      isWinning ? "cell-winning" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={
                      !humanMark || cell !== EMPTY || Boolean(result.winner) || isAiThinking
                    }
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => playHumanMove(rowIndex, colIndex)}
                    type="button"
                  >
                    {cell !== EMPTY ? renderMark(cell) : null}
                  </button>
                );
              }),
            )}
          </div>
        </section>

        <section className="analysis-bar" aria-label="Game analysis">
          <div>
            <span>Player</span>
            <strong>{humanMark === X ? "+10" : humanMark === O ? "-10" : "--"}</strong>
          </div>
          <div>
            <span>Draws</span>
            <strong>{score.draw}</strong>
          </div>
          <div>
            <span>{secondPlayerLabel}</span>
            <strong>{humanMark === X ? "-10" : humanMark === O ? "+10" : "--"}</strong>
          </div>
        </section>

        <section className="tool-dock" aria-label="Actions">
          <button
            type="button"
            aria-label="Undo last turn"
            disabled={history.length === 0}
            onClick={undoTurn}
          >
            <span aria-hidden="true">U</span>
          </button>
          <button
            type="button"
            aria-label="Play suggested move"
            disabled={!humanMark || Boolean(result.winner) || isAiThinking}
            onClick={playHintMove}
          >
            <span aria-hidden="true">!</span>
          </button>
          <button
            type="button"
            aria-label="Next round"
            disabled={!humanMark}
            onClick={startNextRound}
          >
            <span aria-hidden="true">N</span>
          </button>
        </section>

        {!humanMark ? (
          <div className="choice-overlay" role="dialog" aria-modal="true">
            <div className="choice-panel">
              <span>Choose your mark</span>
              <div className="mode-choice" aria-label="Game mode">
                <button
                  type="button"
                  className={gameMode === "ai" ? "selected-mode" : ""}
                  onClick={() => setGameMode("ai")}
                >
                  AI
                </button>
                <button
                  type="button"
                  className={gameMode === "two" ? "selected-mode" : ""}
                  onClick={() => setGameMode("two")}
                >
                  2P
                </button>
              </div>
              <div className="choice-actions">
                <button type="button" onClick={() => chooseMark(X)}>
                  X
                </button>
                <button type="button" onClick={() => chooseMark(O)}>
                  O
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {result.winner === "draw" ? (
          <div className="choice-overlay" role="dialog" aria-modal="true">
            <div className="choice-panel">
              <span>Draw round</span>
              <div className="draw-actions">
                <button type="button" onClick={startNextRound}>
                  Continue
                </button>
                <button type="button" onClick={newGame}>
                  New Game
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default App;
