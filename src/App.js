import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// ---------------- Helper Functions ----------------

// Deep copy a 2D board.
function deepCopy(board) {
  return board.map((row) => row.slice());
}

// Count occurrences of a value in an array.
function countVal(arr, val) {
  return arr.filter((x) => x === val).length;
}

// Check if an array has three consecutive same non-null values.
function violatesAdjacent(arr) {
  for (let i = 0; i < arr.length - 2; i++) {
    if (arr[i] !== null && arr[i] === arr[i + 1] && arr[i + 1] === arr[i + 2]) {
      return true;
    }
  }
  return false;
}

// Validate assignment at (r,c) in board.
function isValidAssignment(board, r, c, val, n) {
  board[r][c] = val;
  const row = board[r];
  if (countVal(row, true) > n / 2 || countVal(row, false) > n / 2) {
    board[r][c] = null;
    return false;
  }
  if (violatesAdjacent(row)) {
    board[r][c] = null;
    return false;
  }
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

// Generate a complete solution board via backtracking.
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

// Generate extra constraints (equal or opposite) from adjacent pairs.
function generateExtraConstraints(fullBoard, extraCount) {
  const n = fullBoard.length;
  let candidates = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (c < n - 1)
        candidates.push([
          [r, c],
          [r, c + 1],
        ]);
      if (r < n - 1)
        candidates.push([
          [r, c],
          [r + 1, c],
        ]);
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

// Backtracking puzzle solver (counts solutions up to a given limit).
function solvePuzzle(board, eqConstraints, oppConstraints, limit = 2) {
  const n = board.length;
  let count = { value: 0 };
  function validAfterAssignment(b, r, c) {
    const row = b[r];
    if (countVal(row, true) > n / 2 || countVal(row, false) > n / 2)
      return false;
    if (violatesAdjacent(row)) return false;
    const col = b.map((row) => row[c]);
    if (countVal(col, true) > n / 2 || countVal(col, false) > n / 2)
      return false;
    if (violatesAdjacent(col)) return false;
    // Check equality constraints
    for (let pair of eqConstraints) {
      const [[r1, c1], [r2, c2]] = pair;
      if (b[r1][c1] !== null && b[r2][c2] !== null && b[r1][c1] !== b[r2][c2])
        return false;
    }
    // Check opposite constraints
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

// Check whether the puzzle has a unique solution.
function hasUniqueSolution(puzzle, eqConstraints, oppConstraints) {
  return solvePuzzle(deepCopy(puzzle), eqConstraints, oppConstraints, 2) === 1;
}

// Validate the board to see which cells (if any) are involved in rule violations.
function validateBoard(board, eqConstraints, oppConstraints) {
  const n = board.length;
  const errors = new Set();
  // Check rows.
  for (let r = 0; r < n; r++) {
    const row = board[r];
    if (countVal(row, true) > n / 2 || countVal(row, false) > n / 2) {
      for (let c = 0; c < n; c++) errors.add(`${r}-${c}`);
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
  // Check columns.
  for (let c = 0; c < n; c++) {
    const col = board.map((r) => r[c]);
    if (countVal(col, true) > n / 2 || countVal(col, false) > n / 2) {
      for (let r = 0; r < n; r++) errors.add(`${r}-${c}`);
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
  // Check extra constraints.
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

/**
 * Returns the board size based on the difficulty.
 * - easy => 4x4
 * - medium => 6x6
 * - hard => 6x6
 * - extreme => 8x8
 */
function getBoardSize(difficulty) {
  if (difficulty === "easy") return 4;
  if (difficulty === "extreme") return 8;
  return 6; // default for medium/hard
}

// Generate a puzzle by removing cells from a full solution.
function generatePuzzle(difficulty) {
  const n = getBoardSize(difficulty);
  const totalCells = n * n;
  let targetGiven, extraCount;

  if (difficulty === "easy") {
    targetGiven = Math.floor(totalCells * 0.6); // ~60% of cells given
    extraCount = 5;
  } else if (difficulty === "medium") {
    targetGiven = Math.floor(totalCells * 0.45);
    extraCount = 3;
  } else if (difficulty === "hard") {
    targetGiven = Math.floor(totalCells * 0.35);
    extraCount = 2;
  } else if (difficulty === "extreme") {
    targetGiven = Math.floor(totalCells * 0.3); // ~30% of cells given
    extraCount = 2;
  } else {
    // fallback
    targetGiven = Math.floor(totalCells * 0.45);
    extraCount = 3;
  }

  const fullBoard = generateFullSolution(n);
  const constraints = generateExtraConstraints(fullBoard, extraCount);
  const puzzle = deepCopy(fullBoard);
  const givens = Array.from({ length: n }, () => Array(n).fill(true));
  let currentGiven = totalCells;

  let positions = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      positions.push([r, c]);
    }
  }

  positions.sort(() => Math.random() - 0.5);
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

// ---------------- React Components ----------------

function PuzzleBoard({ puzzle, givens, onCellClick, errorCells, puzzleData }) {
  const n = puzzleData.size;
  // 2n - 1 is total grid cells in each dimension including constraint spaces
  const gridSize = 2 * n - 1;

  // Build a map for constraints using grid coordinates (unchanged)
  const constraintMap = {};
  if (puzzleData) {
    puzzleData.equalsConstraints.forEach((pair) => {
      const [[r1, c1], [r2, c2]] = pair;
      if (r1 === r2) {
        const row = 2 * r1;
        const col = 2 * Math.min(c1, c2) + 1;
        constraintMap[`${row},${col}`] = "=";
      } else if (c1 === c2) {
        const row = 2 * Math.min(r1, r2) + 1;
        const col = 2 * c1;
        constraintMap[`${row},${col}`] = "=";
      }
    });
    puzzleData.oppositeConstraints.forEach((pair) => {
      const [[r1, c1], [r2, c2]] = pair;
      if (r1 === r2) {
        const row = 2 * r1;
        const col = 2 * Math.min(c1, c2) + 1;
        constraintMap[`${row},${col}`] = "X";
      } else if (c1 === c2) {
        const row = 2 * Math.min(r1, r2) + 1;
        const col = 2 * c1;
        constraintMap[`${row},${col}`] = "X";
      }
    });
  }

  // Build our grid items
  const gridItems = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Puzzle cells (i and j both even)
      if (i % 2 === 0 && j % 2 === 0) {
        const r = i / 2;
        const c = j / 2;
        const isError = errorCells.some((err) => err.r === r && err.c === c);
        gridItems.push(
          <div
            key={`cell-${r}-${c}`}
            className={`puzzle-cell ${givens[r][c] ? "given" : "editable"} ${
              isError ? "error" : ""
            }`}
            onClick={() => onCellClick(r, c)}
          >
            {puzzle[r][c] !== null && (
              <span className={puzzle[r][c] ? "sun" : "moon"}>
                {puzzle[r][c] ? "☀" : "☾"}
              </span>
            )}
          </div>
        );
      }
      // Constraint cells (horizontal or vertical)
      else if ((i % 2 === 0 && j % 2 === 1) || (i % 2 === 1 && j % 2 === 0)) {
        const key = `constraint-${i}-${j}`;
        const symbol = constraintMap[`${i},${j}`] || "";
        gridItems.push(
          <div
            key={key}
            className={`constraint ${
              symbol === "="
                ? "constraint-equal"
                : symbol === "X"
                ? "constraint-opposite"
                : ""
            }`}
          >
            {symbol}
          </div>
        );
      }
      // Intersection/empty squares
      else {
        gridItems.push(
          <div key={`empty-${i}-${j}`} className="constraint-empty"></div>
        );
      }
    }
  }

  return (
    <div
      className="puzzle-board-grid"
      style={{
        "--grid-size": gridSize,
      }}
    >
      {gridItems}
    </div>
  );
}

// Simple Modal
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

// ---------------- Main App ----------------
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

  // Board history (for Undo)
  const [history, setHistory] = useState([]);

  // Generate puzzle on difficulty change
  useEffect(() => {
    generateNewPuzzle();
    // eslint-disable-next-line
  }, [difficulty]);

  // Validate board errors (with 1.5s delay)
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

  // Auto-check solution when all cells are filled
  useEffect(() => {
    if (userBoard && puzzleData) {
      const n = puzzleData.size;
      // Check if board is fully filled
      const complete = userBoard.every((row) =>
        row.every((cell) => cell !== null)
      );
      if (complete) {
        // Compare with full solution
        let correct = true;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
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

  // Generate a new puzzle
  const generateNewPuzzle = () => {
    const data = generatePuzzle(difficulty);
    setPuzzleData(data);
    setUserBoard(deepCopy(data.puzzle));
    setMessage({ text: "", color: "" });
    setErrorCells([]);
    setShowModal(false);
    resetTimer();
    startTimer();
    setHistory([]);
  };

  // Handle cell click (and push state to history for Undo)
  const handleCellClick = (r, c) => {
    if (!puzzleData.givens[r][c]) {
      setHistory((prevHist) => [...prevHist, deepCopy(userBoard)]);
      setUserBoard((prev) => {
        const newBoard = deepCopy(prev);
        if (newBoard[r][c] === null) newBoard[r][c] = true;
        else if (newBoard[r][c] === true) newBoard[r][c] = false;
        else newBoard[r][c] = null;
        return newBoard;
      });
    }
  };

  // Undo
  const handleUndo = () => {
    if (history.length > 0) {
      const prevState = history[history.length - 1];
      setUserBoard(prevState);
      setHistory((oldHist) => oldHist.slice(0, -1));
    }
  };

  // Clear non-given cells
  const handleClear = () => {
    if (!userBoard || !puzzleData) return;
    setHistory((prevHist) => [...prevHist, deepCopy(userBoard)]);
    const newBoard = deepCopy(userBoard);
    for (let r = 0; r < puzzleData.size; r++) {
      for (let c = 0; c < puzzleData.size; c++) {
        if (!puzzleData.givens[r][c]) {
          newBoard[r][c] = null;
        }
      }
    }
    setUserBoard(newBoard);
  };

  // Timer controls
  const startTimer = () => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
  };
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const resetTimer = () => {
    stopTimer();
    setTime(0);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="App">
      <h1 className="main-title">Tango Puzzle</h1>
      <h2 className="subtitle">Place suns and moons to solve the puzzle!</h2>

      {/* Controls at top */}
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

      {/* Timer */}
      <div className="timer-display">
        <strong>Time:</strong> {time} seconds
      </div>

      {/* Undo / Clear */}
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

      {/* Puzzle goes here */}
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

      {/* Inline error message (if not solved) */}
      {message.text && message.color === "red" && (
        <div className="message" style={{ color: message.color }}>
          {message.text}
        </div>
      )}

      {/* Winning modal */}
      {showModal && (
        <Modal message={message.text} time={time} onClose={closeModal} />
      )}

      {/* Instructions now BELOW the puzzle */}
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
