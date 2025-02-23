import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/* ------------------- HELPER FUNCTIONS ------------------- */
function deepCopy(board) {
  return board.map((row) => row.slice());
}

function countVal(arr, val) {
  return arr.filter((x) => x === val).length;
}

function violatesAdjacent(arr) {
  for (let i = 0; i < arr.length - 2; i++) {
    if (arr[i] !== null && arr[i] === arr[i + 1] && arr[i + 1] === arr[i + 2]) {
      return true;
    }
  }
  return false;
}

function isValidAssignment(board, r, c, val, n) {
  board[r][c] = val;
  const row = board[r];

  // Check row
  if (countVal(row, true) > n / 2 || countVal(row, false) > n / 2) {
    board[r][c] = null;
    return false;
  }
  if (violatesAdjacent(row)) {
    board[r][c] = null;
    return false;
  }

  // Check column
  const col = board.map((row) => row[c]);
  if (countVal(col, true) > n / 2 || countVal(col, false) > n / 2) {
    board[r][c] = null;
    return false;
  }
  if (violatesAdjacent(col)) {
    board[r][c] = null;
    return false;
  }

  board[r][c] = null;
  return true;
}

function generateFullSolution(n) {
  const board = Array.from({ length: n }, () => Array(n).fill(null));

  function backtrack(pos) {
    if (pos === n * n) return true;
    const r = Math.floor(pos / n);
    const c = pos % n;
    const choices = [true, false].sort(() => Math.random() - 0.5);
    for (let choice of choices) {
      if (isValidAssignment(board, r, c, choice, n)) {
        board[r][c] = choice;
        if (backtrack(pos + 1)) return true;
        board[r][c] = null;
      }
    }
    return false;
  }

  return backtrack(0) ? board : null;
}

function generateExtraConstraints(fullBoard, extraCount) {
  const n = fullBoard.length;
  let candidates = [];

  // Possible adjacencies
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (c < n - 1)
        candidates.push([
          [r, c],
          [r, c + 1],
        ]); // horizontal pair
      if (r < n - 1)
        candidates.push([
          [r, c],
          [r + 1, c],
        ]); // vertical pair
    }
  }
  candidates.sort(() => Math.random() - 0.5);

  let equalsConstraints = [];
  let oppositeConstraints = [];
  let added = 0;

  for (let pair of candidates) {
    if (added >= extraCount) break;
    const [[r1, c1], [r2, c2]] = pair;
    if (fullBoard[r1][c1] === fullBoard[r2][c2]) {
      equalsConstraints.push(pair);
      added++;
    } else {
      oppositeConstraints.push(pair);
      added++;
    }
  }
  return { equalsConstraints, oppositeConstraints };
}

function solvePuzzle(board, eqConstraints, oppConstraints, limit = 2) {
  const n = board.length;
  let count = { value: 0 };

  function validAfterAssignment(b, r, c) {
    // Row checks
    const row = b[r];
    if (countVal(row, true) > n / 2 || countVal(row, false) > n / 2)
      return false;
    if (violatesAdjacent(row)) return false;

    // Column checks
    const col = b.map((row) => row[c]);
    if (countVal(col, true) > n / 2 || countVal(col, false) > n / 2)
      return false;
    if (violatesAdjacent(col)) return false;

    // Equality constraints
    for (let pair of eqConstraints) {
      const [[r1, c1], [r2, c2]] = pair;
      if (b[r1][c1] !== null && b[r2][c2] !== null && b[r1][c1] !== b[r2][c2])
        return false;
    }
    // Opposite constraints
    for (let pair of oppConstraints) {
      const [[r1, c1], [r2, c2]] = pair;
      if (b[r1][c1] !== null && b[r2][c2] !== null && b[r1][c1] === b[r2][c2])
        return false;
    }
    return true;
  }

  function backtrack(pos) {
    if (pos === n * n) {
      count.value++;
      return;
    }
    const r = Math.floor(pos / n);
    const c = pos % n;

    if (board[r][c] !== null) {
      backtrack(pos + 1);
      if (count.value >= limit) return;
    } else {
      for (let val of [true, false]) {
        board[r][c] = val;
        if (validAfterAssignment(board, r, c)) {
          backtrack(pos + 1);
          if (count.value >= limit) return;
        }
        board[r][c] = null;
      }
    }
  }

  backtrack(0);
  return count.value;
}

function hasUniqueSolution(puzzle, eqConstraints, oppConstraints) {
  return solvePuzzle(deepCopy(puzzle), eqConstraints, oppConstraints, 2) === 1;
}

function validateBoard(board, eqConstraints, oppConstraints) {
  const n = board.length;
  const errors = new Set();

  // Rows
  for (let r = 0; r < n; r++) {
    const row = board[r];
    if (countVal(row, true) > n / 2 || countVal(row, false) > n / 2) {
      for (let c = 0; c < n; c++) {
        errors.add(`${r}-${c}`);
      }
    }
    for (let c = 0; c < n - 2; c++) {
      if (
        row[c] !== null &&
        row[c] === row[c + 1] &&
        row[c + 1] === row[c + 2]
      ) {
        errors.add(`${r}-${c}`);
        errors.add(`${r}-${c + 1}`);
        errors.add(`${r}-${c + 2}`);
      }
    }
  }

  // Columns
  for (let c = 0; c < n; c++) {
    const col = board.map((row) => row[c]);
    if (countVal(col, true) > n / 2 || countVal(col, false) > n / 2) {
      for (let r = 0; r < n; r++) {
        errors.add(`${r}-${c}`);
      }
    }
    for (let r = 0; r < n - 2; r++) {
      if (
        col[r] !== null &&
        col[r] === col[r + 1] &&
        col[r + 1] === col[r + 2]
      ) {
        errors.add(`${r}-${c}`);
        errors.add(`${r + 1}-${c}`);
        errors.add(`${r + 2}-${c}`);
      }
    }
  }

  // Equality constraints
  for (let pair of eqConstraints) {
    const [[r1, c1], [r2, c2]] = pair;
    if (
      board[r1][c1] !== null &&
      board[r2][c2] !== null &&
      board[r1][c1] !== board[r2][c2]
    ) {
      errors.add(`${r1}-${c1}`);
      errors.add(`${r2}-${c2}`);
    }
  }

  // Opposite constraints
  for (let pair of oppConstraints) {
    const [[r1, c1], [r2, c2]] = pair;
    if (
      board[r1][c1] !== null &&
      board[r2][c2] !== null &&
      board[r1][c1] === board[r2][c2]
    ) {
      errors.add(`${r1}-${c1}`);
      errors.add(`${r2}-${c2}`);
    }
  }

  return Array.from(errors).map((str) => {
    const [r, c] = str.split("-").map(Number);
    return { r, c };
  });
}

function getBoardSize(difficulty) {
  if (difficulty === "easy") return 4;
  if (difficulty === "extreme") return 8;
  return 6; // fallback for medium/hard
}

function generatePuzzle(difficulty) {
  const n = getBoardSize(difficulty);
  const totalCells = n * n;
  let targetGiven, extraCount;

  if (difficulty === "easy") {
    targetGiven = Math.floor(totalCells * 0.6);
    extraCount = 5;
  } else if (difficulty === "medium") {
    targetGiven = Math.floor(totalCells * 0.45);
    extraCount = 3;
  } else if (difficulty === "hard") {
    targetGiven = Math.floor(totalCells * 0.35);
    extraCount = 2;
  } else if (difficulty === "extreme") {
    targetGiven = Math.floor(totalCells * 0.3);
    extraCount = 2;
  } else {
    targetGiven = Math.floor(totalCells * 0.45);
    extraCount = 3;
  }

  const fullBoard = generateFullSolution(n);
  const constraints = generateExtraConstraints(fullBoard, extraCount);

  const puzzle = deepCopy(fullBoard);
  const givens = Array.from({ length: n }, () => Array(n).fill(true));
  let currentGiven = totalCells;

  // Randomize positions
  let positions = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      positions.push([r, c]);
    }
  }
  positions.sort(() => Math.random() - 0.5);

  // Remove cells while puzzle remains uniquely solvable
  for (let [r, c] of positions) {
    if (currentGiven <= targetGiven) break;
    const temp = puzzle[r][c];
    puzzle[r][c] = null;
    givens[r][c] = false;

    if (
      hasUniqueSolution(
        deepCopy(puzzle),
        constraints.equalsConstraints,
        constraints.oppositeConstraints
      )
    ) {
      currentGiven--;
    } else {
      puzzle[r][c] = temp;
      givens[r][c] = true;
    }
  }

  return {
    size: n,
    puzzle,
    givens,
    equalsConstraints: constraints.equalsConstraints,
    oppositeConstraints: constraints.oppositeConstraints,
    fullBoard,
  };
}

/* ------------------- ICON COMPONENTS ------------------- */
function SunIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FFA726" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#sunGradient)" />
    </svg>
  );
}

function MoonIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(256,256) scale(-1.4,1.4) translate(-256,-256)">
        <path
          fill="#4A90E2"
          stroke="none"
          d="
            M349.852,343.15
              c-49.875,49.916-131.083,49.916-181,0
              c-49.916-49.918-49.916-131.125,0-181.021
              c13.209-13.187,29.312-23.25,47.832-29.812
              c5.834-2.042,12.293-0.562,16.625,3.792
              c4.376,4.375,5.855,10.833,3.793,16.625
              c-12.542,35.375-4,73.666,22.25,99.917
              c26.209,26.228,64.5,34.75,99.916,22.25
              c5.792-2.062,12.271-0.582,16.625,3.793
              c4.376,4.332,5.834,10.812,3.771,16.625
              C373.143,313.838,363.06,329.941,349.852,343.15
            z
          "
        />
      </g>
    </svg>
  );
}

/* ------------------- PUZZLE BOARD ------------------- */
function PuzzleBoard({ puzzle, givens, onCellClick, errorCells, puzzleData }) {
  const n = puzzleData.size;

  // We render an n×n grid for puzzle cells
  // Then overlay absolute-positioned constraints on top
  return (
    <div className="board-wrapper">
      {/* Actual puzzle cells in a grid */}
      <div
        className="puzzle-grid"
        style={{
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          gridTemplateRows: `repeat(${n}, 1fr)`,
        }}
      >
        {puzzle.map((row, r) =>
          row.map((val, c) => {
            const isError = errorCells.some(
              (err) => err.r === r && err.c === c
            );
            return (
              <div
                key={`cell-${r}-${c}`}
                className={`puzzle-cell ${
                  givens[r][c] ? "given" : "editable"
                } ${isError ? "error" : ""}`}
                onClick={() => onCellClick(r, c)}
              >
                {val !== null &&
                  (val ? <SunIcon size={22} /> : <MoonIcon size={22} />)}
              </div>
            );
          })
        )}
      </div>

      {/* Absolute layer for constraints on edges between cells */}
      <div className="constraints-layer">
        {/* Render "=" or "X" for each adjacency */}
        {puzzleData.equalsConstraints.map((pair, idx) => {
          return (
            <ConstraintLine key={`eq-${idx}`} pair={pair} n={n} symbol="=" />
          );
        })}
        {puzzleData.oppositeConstraints.map((pair, idx) => {
          return (
            <ConstraintLine key={`op-${idx}`} pair={pair} n={n} symbol="X" />
          );
        })}
      </div>
    </div>
  );
}

/** A small component that places a symbol ("=" or "X") on the
 * shared border line between two adjacent cells.
 * We compute top/left in percentages, then translate(-50%, -50%)
 * to center it exactly on the line.
 */
function ConstraintLine({ pair, n, symbol }) {
  const [[r1, c1], [r2, c2]] = pair;

  // If same row => horizontal adjacency => vertical line between them
  // The line is between col c1 and col c2 => whichever is min or max
  // We place symbol in the middle of that line
  let topPercent = 0;
  let leftPercent = 0;

  if (r1 === r2) {
    // Horizontal adjacency => c1, c2 differ by 1
    const row = r1;
    const minCol = Math.min(c1, c2);

    // Middle of the boundary => top = (row + 0.5)/n * 100,
    // left = (minCol + 1)/n * 100
    topPercent = ((row + 0.5) / n) * 100;
    leftPercent = ((minCol + 1) / n) * 100;
  } else {
    // Vertical adjacency => r1, r2 differ by 1
    const col = c1;
    const minRow = Math.min(r1, r2);

    // Middle of the boundary => left = (col + 0.5)/n * 100,
    // top = (minRow + 1)/n * 100
    topPercent = ((minRow + 1) / n) * 100;
    leftPercent = ((col + 0.5) / n) * 100;
  }

  const style = {
    top: `${topPercent}%`,
    left: `${leftPercent}%`,
    transform: "translate(-50%, -50%)",
  };

  return (
    <div className="constraint-marker" style={style}>
      {symbol}
    </div>
  );
}

/* ------------------- MODAL ------------------- */
function Modal({ message, time, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Congratulations!</h2>
        <p>{message}</p>
        <p>You solved it in {time} seconds.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ------------------- MAIN APP ------------------- */
function App() {
  const [difficulty, setDifficulty] = useState("medium");
  const [puzzleData, setPuzzleData] = useState(null);
  const [userBoard, setUserBoard] = useState(null);
  const [message, setMessage] = useState({ text: "", color: "" });
  const [errorCells, setErrorCells] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Timer
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  // Board history for Undo
  const [history, setHistory] = useState([]);

  // Generate puzzle on difficulty change
  useEffect(() => {
    generateNewPuzzle();
    // eslint-disable-next-line
  }, [difficulty]);

  // Validate board errors (1.5s delay)
  useEffect(() => {
    if (userBoard && puzzleData) {
      const timer = setTimeout(() => {
        const errors = validateBoard(
          userBoard,
          puzzleData.equalsConstraints,
          puzzleData.oppositeConstraints
        );
        setErrorCells(errors);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userBoard, puzzleData]);

  // Auto-check solution when board is full
  useEffect(() => {
    if (userBoard && puzzleData) {
      const filled = userBoard.every((row) =>
        row.every((cell) => cell !== null)
      );
      if (filled) {
        let correct = true;
        for (let r = 0; r < puzzleData.size; r++) {
          for (let c = 0; c < puzzleData.size; c++) {
            if (userBoard[r][c] !== puzzleData.fullBoard[r][c]) {
              correct = false;
              break;
            }
          }
          if (!correct) break;
        }
        if (correct) {
          setMessage({
            text: "You have successfully completed the puzzle!",
            color: "green",
          });
          stopTimer();
          setShowModal(true);
        } else {
          setMessage({ text: "Solution is not correct.", color: "red" });
        }
      } else {
        setMessage({ text: "", color: "" });
      }
    }
  }, [userBoard, puzzleData]);

  function generateNewPuzzle() {
    const data = generatePuzzle(difficulty);
    setPuzzleData(data);
    setUserBoard(deepCopy(data.puzzle));
    setMessage({ text: "", color: "" });
    setErrorCells([]);
    setShowModal(false);
    resetTimer();
    startTimer();
    setHistory([]);
  }

  function handleCellClick(r, c) {
    if (!puzzleData.givens[r][c]) {
      setHistory((prev) => [...prev, deepCopy(userBoard)]);
      setUserBoard((prev) => {
        const newBoard = deepCopy(prev);
        if (newBoard[r][c] === null) newBoard[r][c] = true;
        else if (newBoard[r][c] === true) newBoard[r][c] = false;
        else newBoard[r][c] = null;
        return newBoard;
      });
    }
  }

  function handleUndo() {
    if (history.length > 0) {
      const prevBoard = history[history.length - 1];
      setUserBoard(prevBoard);
      setHistory((old) => old.slice(0, -1));
    }
  }

  function handleClear() {
    if (!userBoard || !puzzleData) return;
    setHistory((prev) => [...prev, deepCopy(userBoard)]);
    const newBoard = deepCopy(userBoard);
    for (let r = 0; r < puzzleData.size; r++) {
      for (let c = 0; c < puzzleData.size; c++) {
        if (!puzzleData.givens[r][c]) {
          newBoard[r][c] = null;
        }
      }
    }
    setUserBoard(newBoard);
  }

  // Timer controls
  function startTimer() {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
  }
  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
  function resetTimer() {
    stopTimer();
    setTime(0);
  }

  function closeModal() {
    setShowModal(false);
  }

  return (
    <div className="App">
      <h1 className="main-title">Tango Puzzle</h1>
      <h2 className="subtitle">Place suns and moons to solve the puzzle!</h2>

      <div className="controls">
        <label>
          Difficulty:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy (4x4)</option>
            <option value="medium">Medium (6x6)</option>
            <option value="hard">Hard (6x6)</option>
            <option value="extreme">Extreme (8x8)</option>
          </select>
        </label>
        <button className="new-puzzle-button" onClick={generateNewPuzzle}>
          New Puzzle
        </button>
      </div>

      <div className="timer-display">
        <strong>Time:</strong> {time} seconds
      </div>

      <div className="buttons">
        <button
          className="undo-button"
          onClick={handleUndo}
          disabled={history.length === 0}
        >
          Undo
        </button>
        <button className="clear-button" onClick={handleClear}>
          Clear
        </button>
      </div>

      <div className="puzzle-container">
        {puzzleData && userBoard && (
          <PuzzleBoard
            puzzle={userBoard}
            givens={puzzleData.givens}
            onCellClick={handleCellClick}
            errorCells={errorCells}
            puzzleData={puzzleData}
          />
        )}
      </div>

      {message.text && message.color === "red" && (
        <div className="message" style={{ color: message.color }}>
          {message.text}
        </div>
      )}

      {showModal && (
        <Modal message={message.text} time={time} onClose={closeModal} />
      )}

      <div className="instructions">
        <p>
          <strong>Rules:</strong>
        </p>
        <ul>
          <li>No more than half of each row or column can be suns or moons.</li>
          <li>Avoid having three of the same symbol in a row or column.</li>
          <li>
            Cells connected by <span className="equal-hint">"="</span> must have
            the same symbol.
          </li>
          <li>
            Cells connected by <span className="opposite-hint">"X"</span> must
            have different symbols.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
