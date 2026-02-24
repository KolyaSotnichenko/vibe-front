'use client';

import { useState } from 'react';
import Link from 'next/link';

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
}

type Square = Piece | null;
type Board = Square[][];

interface Position {
  row: number;
  col: number;
}

const pieceSymbols: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Чорні фігури
  board[0] = [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' },
  ];
  board[1] = Array(8).fill({ type: 'pawn', color: 'black' });

  // Білі фігури
  board[6] = Array(8).fill({ type: 'pawn', color: 'white' });
  board[7] = [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' },
  ];

  return board;
}

function isValidMove(
  board: Board,
  from: Position,
  to: Position,
  piece: Piece
): boolean {
  const { row: fromRow, col: fromCol } = from;
  const { row: toRow, col: toCol } = to;
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // Не можна ходити на клітинку з своєю фігурою
  const targetPiece = board[toRow][toCol];
  if (targetPiece && targetPiece.color === piece.color) {
    return false;
  }

  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;

      // Рух вперед
      if (fromCol === toCol && !targetPiece) {
        if (toRow === fromRow + direction) return true;
        if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[fromRow + direction][fromCol]) {
          return true;
        }
      }

      // Взяття по діагоналі
      if (colDiff === 1 && toRow === fromRow + direction && targetPiece) {
        return true;
      }

      return false;
    }

    case 'knight':
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

    case 'bishop':
      if (rowDiff !== colDiff) return false;
      return isPathClear(board, from, to);

    case 'rook':
      if (fromRow !== toRow && fromCol !== toCol) return false;
      return isPathClear(board, from, to);

    case 'queen':
      if (fromRow !== toRow && fromCol !== toCol && rowDiff !== colDiff) return false;
      return isPathClear(board, from, to);

    case 'king':
      return rowDiff <= 1 && colDiff <= 1;

    default:
      return false;
  }
}

function isPathClear(board: Board, from: Position, to: Position): boolean {
  const rowDir = Math.sign(to.row - from.row);
  const colDir = Math.sign(to.col - from.col);

  let currentRow = from.row + rowDir;
  let currentCol = from.col + colDir;

  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol]) return false;
    currentRow += rowDir;
    currentCol += colDir;
  }

  return true;
}

function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

function isKingInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        if (isValidMove(board, { row, col }, kingPos, piece)) {
          return true;
        }
      }
    }
  }

  return false;
}

export default function Chess() {
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameOver, setGameOver] = useState<PieceColor | 'draw' | null>(null);
  const [isCheck, setIsCheck] = useState(false);

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;

    const clickedPiece = board[row][col];

    if (selectedSquare) {
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];

      if (selectedPiece && isValidMove(board, selectedSquare, { row, col }, selectedPiece)) {
        // Створюємо нову дошку після ходу
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = selectedPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = null;

        // Перевіряємо, чи не залишається наш король під шахом після ходу
        if (!isKingInCheck(newBoard, currentPlayer)) {
          setBoard(newBoard);

          // Перевіряємо шах для наступного гравця
          const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
          const nextInCheck = isKingInCheck(newBoard, nextPlayer);
          setIsCheck(nextInCheck);

          setCurrentPlayer(nextPlayer);
          setSelectedSquare(null);
          setValidMoves([]);
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else {
        // Вибір іншої своєї фігури
        if (clickedPiece && clickedPiece.color === currentPlayer) {
          setSelectedSquare({ row, col });
          const moves = calculateValidMoves(board, { row, col }, clickedPiece);
          setValidMoves(moves);
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        const moves = calculateValidMoves(board, { row, col }, clickedPiece);
        setValidMoves(moves);
      }
    }
  };

  const calculateValidMoves = (board: Board, from: Position, piece: Piece): Position[] => {
    const moves: Position[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(board, from, { row, col }, piece)) {
          // Перевіряємо, чи не залишає цей хід короля під шахом
          const testBoard = board.map(r => [...r]);
          testBoard[row][col] = piece;
          testBoard[from.row][from.col] = null;
          if (!isKingInCheck(testBoard, piece.color)) {
            moves.push({ row, col });
          }
        }
      }
    }
    return moves;
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setCurrentPlayer('white');
    setValidMoves([]);
    setGameOver(null);
    setIsCheck(false);
  };

  const randomizeHeavyPieces = () => {
    const newBoard: Board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Залишаємо королів на їхніх початкових позиціях
    newBoard[0][4] = { type: 'king', color: 'black' };
    newBoard[7][4] = { type: 'king', color: 'white' };

    // Збираємо всі важкі фігури
    const heavyPieces: Piece[] = [
      { type: 'queen', color: 'white' },
      { type: 'rook', color: 'white' },
      { type: 'rook', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'queen', color: 'black' },
      { type: 'rook', color: 'black' },
      { type: 'rook', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'knight', color: 'black' },
    ];

    // Отримуємо всі вільні клітинки (окрім позицій королів)
    const emptySquares: Position[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!newBoard[row][col]) {
          emptySquares.push({ row, col });
        }
      }
    }

    // Перемішуємо та розміщуємо важкі фігури
    const shuffledSquares = [...emptySquares].sort(() => Math.random() - 0.5);
    heavyPieces.forEach((piece, index) => {
      if (shuffledSquares[index]) {
        const { row, col } = shuffledSquares[index];
        newBoard[row][col] = piece;
      }
    });

    setBoard(newBoard);
    setSelectedSquare(null);
    setCurrentPlayer('white');
    setValidMoves([]);
    setGameOver(null);
    setIsCheck(false);
  };

  const isSquareValid = (row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-950 py-8 px-4"
         style={{
           backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
         }}>
      <div className="max-w-6xl mx-auto">
        {/* Header with Hearthstone style */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] mb-2"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(255,215,0,0.3)',
                  fontFamily: 'serif'
                }}>
              ⚔️ ШАХМАТИ ⚔️
            </h1>
            <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Game Board */}
          <div className="flex-shrink-0">
            {/* Board frame with ornate styling */}
            <div className="p-6 bg-gradient-to-br from-amber-800 via-yellow-800 to-amber-900 rounded-3xl shadow-2xl border-4 border-yellow-600 relative"
                 style={{
                   boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.2)'
                 }}>
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 text-yellow-500 text-2xl">◈</div>
              <div className="absolute top-2 right-2 text-yellow-500 text-2xl">◈</div>
              <div className="absolute bottom-2 left-2 text-yellow-500 text-2xl">◈</div>
              <div className="absolute bottom-2 right-2 text-yellow-500 text-2xl">◈</div>

              <div className="bg-gradient-to-br from-amber-950 to-stone-900 p-4 rounded-2xl border-2 border-yellow-700">
                <div className="grid grid-cols-8 gap-0 w-fit mx-auto"
                     style={{
                       boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8)'
                     }}>
                  {board.map((row, rowIndex) =>
                    row.map((square, colIndex) => {
                      const isLight = (rowIndex + colIndex) % 2 === 0;
                      const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                      const isValidMove = isSquareValid(rowIndex, colIndex);

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleSquareClick(rowIndex, colIndex)}
                          className={`
                            w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-5xl sm:text-6xl
                            transition-all duration-200 relative group
                            ${isLight
                              ? 'bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300'
                              : 'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900'}
                            ${isSelected ? 'ring-4 ring-yellow-400 ring-inset scale-95 shadow-inner' : ''}
                            ${isValidMove ? 'ring-4 ring-green-400 ring-inset' : ''}
                            ${!gameOver ? 'hover:brightness-110 hover:scale-105 active:scale-95' : ''}
                            border border-yellow-900/30
                          `}
                          style={{
                            boxShadow: isLight
                              ? 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)'
                              : 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,215,0,0.1)',
                            textShadow: square
                              ? square.color === 'white'
                                ? '0 2px 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6), 0 4px 8px rgba(0,0,0,0.8)'
                                : '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(100,50,0,0.8), 0 4px 8px rgba(0,0,0,0.8)'
                              : undefined
                          }}
                        >
                          {square && (
                            <span className={`
                              transform transition-transform
                              ${square.color === 'white' ? 'text-gray-100' : 'text-amber-950'}
                              drop-shadow-lg
                            `}>
                              {pieceSymbols[square.color][square.type]}
                            </span>
                          )}
                          {isValidMove && !square && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel with game info */}
          <div className="flex-1 max-w-md">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-amber-800 via-yellow-800 to-amber-900 rounded-2xl p-6 border-4 border-yellow-600 shadow-2xl mb-6"
                 style={{
                   boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.3)'
                 }}>
              <div className="bg-amber-950/60 rounded-xl p-6 border-2 border-yellow-700/50">
                <div className="text-center space-y-4">
                  {gameOver ? (
                    <div>
                      <h2 className="text-3xl font-bold text-yellow-300 mb-2" style={{ fontFamily: 'serif' }}>
                        🏆 ГРА ЗАВЕРШЕНА
                      </h2>
                      <p className="text-2xl text-yellow-200">
                        {gameOver === 'draw' ? 'Нічия!' : `Переможець: ${gameOver === 'white' ? 'Білі' : 'Чорні'}!`}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold text-yellow-300 mb-3" style={{ fontFamily: 'serif' }}>
                        ХІД ГРАВЦЯ
                      </h2>
                      <div className={`
                        inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2
                        ${currentPlayer === 'white'
                          ? 'bg-gray-100 border-gray-300 text-gray-900'
                          : 'bg-amber-950 border-amber-800 text-yellow-200'}
                      `}>
                        <div className={`w-8 h-8 rounded-full ${currentPlayer === 'white' ? 'bg-white border-2 border-gray-400' : 'bg-black border-2 border-yellow-700'}`}></div>
                        <span className="text-2xl font-bold">
                          {currentPlayer === 'white' ? 'БІЛІ' : 'ЧОРНІ'}
                        </span>
                      </div>

                      {isCheck && (
                        <div className="mt-4 p-3 bg-red-600 rounded-lg border-2 border-red-400 animate-pulse">
                          <p className="text-xl font-bold text-white">⚠️ ШАХ! ⚠️</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <button
                onClick={resetGame}
                className="w-full px-8 py-4 text-2xl font-bold text-white rounded-xl
                          bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800
                          hover:from-amber-500 hover:via-amber-600 hover:to-amber-700
                          active:scale-95 transition-all duration-200
                          border-4 border-yellow-600
                          shadow-lg hover:shadow-2xl"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontFamily: 'serif',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.3)'
                }}
              >
                ⚔️ НОВА ГРА
              </button>

              <button
                onClick={randomizeHeavyPieces}
                className="w-full px-8 py-4 text-2xl font-bold text-white rounded-xl
                          bg-gradient-to-b from-purple-600 via-purple-700 to-purple-800
                          hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
                          active:scale-95 transition-all duration-200
                          border-4 border-purple-400
                          shadow-lg hover:shadow-2xl"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontFamily: 'serif',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.3)'
                }}
              >
                🎲 РАНДОМ ВАЖКИХ ФІГУР
              </button>

              <Link href="/">
                <button
                  className="w-full px-8 py-4 text-xl font-bold text-yellow-300 rounded-xl
                            bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900
                            hover:from-stone-600 hover:via-stone-700 hover:to-stone-800
                            active:scale-95 transition-all duration-200
                            border-4 border-stone-600
                            shadow-lg hover:shadow-2xl"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: 'serif',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.3)'
                  }}
                >
                  ← Повернутися до Хрестиків-Ноликів
                </button>
              </Link>
            </div>

            {/* Rules */}
            <div className="mt-6 bg-gradient-to-br from-amber-800 via-yellow-800 to-amber-900 rounded-2xl p-6 border-4 border-yellow-600 shadow-2xl"
                 style={{
                   boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,215,0,0.3)'
                 }}>
              <div className="bg-amber-950/60 rounded-xl p-5 border-2 border-yellow-700/50">
                <h3 className="text-xl font-bold text-yellow-300 mb-3" style={{ fontFamily: 'serif' }}>
                  📜 ПРАВИЛА
                </h3>
                <ul className="text-yellow-200 space-y-2 text-sm">
                  <li>• Натисніть на фігуру, щоб вибрати її</li>
                  <li>• Зелені клітинки показують можливі ходи</li>
                  <li>• Білі ходять першими</li>
                  <li>• Мета: поставити мат королю суперника</li>
                  <li>• Не можна залишати свого короля під шахом</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
