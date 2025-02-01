import React, { useState, useEffect } from "react";
import "./App.css";

const BOARD_SIZE = 6;

// --------- Helper Functions for Puzzle Generation and Solving ---------

// Deep copy a 2D board array.
function deepCopy(board) {
  return board.map((row) => row.slice());
}

// Count occurrences of a given value in an array.
function countVal(arr, val) {
  return arr.filter((x) => x === val).length;
}

// Check if any three consecutive cells (already assigned) are identical.
function violatesAdjacent(arr) {
  for (let i = 0; i < arr.length - 2; i++) {
    if (arr[i] !== null && arr[i + 1] !== null && arr[i + 2] !== null) {
      if (arr[i] === arr[i + 1] && arr[i + 1] === arr[i + 2]) return true;
    }
  }
  return false;
}

// Test whether placing val at (r,c) in board keeps row/column balance and adjacent rule.
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

// Generate a full valid solution board using recursive backtracking.
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

// Generate extra constraints (equal or opposite) from adjacent cell pairs.
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

// Backtracking solver that counts solutions (stops after reaching limit).
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

// Check if the puzzle has a unique solution.
function hasUniqueSolution(puzzle, eqConstraints, oppConstraints) {
  return solvePuzzle(deepCopy(puzzle), eqConstraints, oppConstraints, 2) === 1;
}

// Generate a puzzle by starting with a full solution and then removing cells.
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

// --------- React Components ---------

// The puzzle board UI – each cell displays a symbol (or is blank)
// and is styled as either a "given" (non-editable) or "editable" cell.
function PuzzleBoard({ puzzle, givens, onCellClick }) {
  return (
    <div className="puzzle-board">
      {puzzle.map((row, r) => (
        <div key={r} className="puzzle-row">
          {row.map((cell, c) => (
            <div
              key={c}
              className={`puzzle-cell ${givens[r][c] ? "given" : "editable"}`}
              onClick={() => onCellClick(r, c)}
            >
              {cell === null ? "" : cell ? "☀" : "☾"}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [difficulty, setDifficulty] = useState("medium");
  const [puzzleData, setPuzzleData] = useState(null);
  const [userBoard, setUserBoard] = useState(null);
  const [message, setMessage] = useState("");

  // Generate a new puzzle when the component mounts or when difficulty changes.
  useEffect(() => {
    generateNewPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const generateNewPuzzle = () => {
    const data = generatePuzzle(BOARD_SIZE, difficulty);
    setPuzzleData(data);
    setUserBoard(deepCopy(data.puzzle));
    setMessage("");
  };

  // For editable cells, cycle through: (null → true → false → null)
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

  // Check whether the current user board matches the full solution.
  const checkSolution = () => {
    if (!puzzleData) return;
    const { fullBoard } = puzzleData;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (userBoard[r][c] === null || userBoard[r][c] !== fullBoard[r][c]) {
          setMessage("Solution is not correct.");
          return;
        }
      }
    }
    setMessage("Congratulations! Puzzle solved.");
  };

  // Optionally show the solution.
  const showSolution = () => {
    if (!puzzleData) return;
    setUserBoard(deepCopy(puzzleData.fullBoard));
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
        />
      )}
      <div className="buttons">
        <button onClick={checkSolution}>Check Solution</button>
        <button onClick={showSolution}>Show Solution</button>
      </div>
      {message && <div className="message">{message}</div>}
      <div className="constraints">
        <h3>Extra Clues:</h3>
        {puzzleData && (
          <div>
            {puzzleData.equalsConstraints.map((pair, idx) => (
              <div key={`eq-${idx}`}>
                Cells ({pair[0][0]},{pair[0][1]}) and ({pair[1][0]},{pair[1][1]}
                ) must be EQUAL (=)
              </div>
            ))}
            {puzzleData.oppositeConstraints.map((pair, idx) => (
              <div key={`opp-${idx}`}>
                Cells ({pair[0][0]},{pair[0][1]}) and ({pair[1][0]},{pair[1][1]}
                ) must be OPPOSITE (X)
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
