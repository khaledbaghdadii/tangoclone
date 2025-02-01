import React, { useState, useEffect } from "react";
import "./App.css";

const BOARD_SIZE = 6;

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
    for (let pair of eqConstraints) {
      const [[r1, c1], [r2, c2]] = pair;
      if (b[r1][c1] !== null && b[r2][c2] !== null && b[r1][c1] !== b[r2][c2])
        return false;
    }
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

// Generate a puzzle by removing cells from a full solution.
function generatePuzzle(n, difficulty) {
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
  } else {
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
    puzzle,
    givens,
    equalsConstraints: constraints.equalsConstraints,
    oppositeConstraints: constraints.oppositeConstraints,
    fullBoard,
  };
}

// ---------------- React Components ----------------

// Updated PuzzleBoard that shows constraints on the grid.
function PuzzleBoard({ puzzle, givens, onCellClick, errorCells, puzzleData }) {
  const n = puzzle.length;
  const gridSize = 2 * n - 1;

  // Build a map for constraints using grid coordinates.
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

  const gridItems = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (i % 2 === 0 && j % 2 === 0) {
        // Puzzle cell.
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
      } else if ((i % 2 === 0 && j % 2 === 1) || (i % 2 === 1 && j % 2 === 0)) {
        // Constraint cell (horizontal or vertical).
        const key = `constraint-${i}-${j}`;
        const symbol = constraintMap[`${i},${j}`] || "";
        gridItems.push(
          <div key={key} className="constraint">
            {symbol}
          </div>
        );
      } else {
        // Intersection cell, left empty.
        gridItems.push(
          <div key={`empty-${i}-${j}`} className="constraint-empty"></div>
        );
      }
    }
  }

  return (
    <div
      className="puzzle-board-grid"
      style={{ gridTemplateColumns: `repeat(${gridSize}, 40px)` }}
    >
      {gridItems}
    </div>
  );
}

function App() {
  const [difficulty, setDifficulty] = useState("medium");
  const [puzzleData, setPuzzleData] = useState(null);
  const [userBoard, setUserBoard] = useState(null);
  const [message, setMessage] = useState({ text: "", color: "" });
  const [errorCells, setErrorCells] = useState([]);

  // Generate a new puzzle when difficulty changes.
  useEffect(() => {
    generateNewPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Delay error validation by 1.5 seconds.
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

  // Auto-check solution when all cells are filled.
  useEffect(() => {
    if (userBoard && puzzleData) {
      const complete = userBoard.every((row) =>
        row.every((cell) => cell !== null)
      );
      if (complete) {
        let correct = true;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (userBoard[r][c] !== puzzleData.fullBoard[r][c]) {
              correct = false;
              break;
            }
          }
          if (!correct) break;
        }
        if (correct)
          setMessage({
            text: "Congratulations! Puzzle solved.",
            color: "green",
          });
        else setMessage({ text: "Solution is not correct.", color: "red" });
      } else {
        setMessage({ text: "", color: "" });
      }
    }
  }, [userBoard, puzzleData]);

  const generateNewPuzzle = () => {
    const data = generatePuzzle(BOARD_SIZE, difficulty);
    setPuzzleData(data);
    setUserBoard(deepCopy(data.puzzle));
    setMessage({ text: "", color: "" });
    setErrorCells([]);
  };

  // Cycle cell value on click (if editable).
  const handleCellClick = (r, c) => {
    if (!puzzleData.givens[r][c]) {
      setUserBoard((prev) => {
        const newBoard = deepCopy(prev);
        if (newBoard[r][c] === null) newBoard[r][c] = true;
        else if (newBoard[r][c] === true) newBoard[r][c] = false;
        else newBoard[r][c] = null;
        return newBoard;
      });
    }
  };

  return (
    <div className="App">
      <h1>Tango Puzzle</h1>
      <div className="controls">
        <label>
          Difficulty:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button onClick={generateNewPuzzle}>New Puzzle</button>
      </div>
      {puzzleData && userBoard && (
        <PuzzleBoard
          puzzle={userBoard}
          givens={puzzleData.givens}
          onCellClick={handleCellClick}
          errorCells={errorCells}
          puzzleData={puzzleData}
        />
      )}
      <div className="buttons">{/* Additional buttons can go here */}</div>
      {message.text && (
        <div className="message" style={{ color: message.color }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default App;
