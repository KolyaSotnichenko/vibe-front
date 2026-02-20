'use client';

import { useState } from 'react';
import Link from 'next/link';

type Player = 'X' | 'O' | null;

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // рядки
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // колонки
    [0, 4, 8], [2, 4, 6]             // діагоналі
  ];

  const checkWinner = (newBoard: Player[]): Player | 'Draw' | null => {
    // Перевірка на переможця
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a];
      }
    }

    // Перевірка на нічию
    if (newBoard.every(cell => cell !== null)) {
      return 'Draw';
    }

    return null;
  };

  const handleClick = (index: number) => {
    // Ігнорувати клік якщо клітинка зайнята або гра закінчена
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-white">
          Хрестики-Нолики
        </h1>

        {/* Статус гри */}
        <div className="text-2xl font-semibold">
          {winner ? (
            <div className="text-center">
              {winner === 'Draw' ? (
                <p className="text-yellow-600 dark:text-yellow-400">Нічия!</p>
              ) : (
                <p className="text-green-600 dark:text-green-400">
                  Переможець: {winner}!
                </p>
              )}
            </div>
          ) : (
            <p className="text-indigo-600 dark:text-indigo-400">
              Хід: {currentPlayer}
            </p>
          )}
        </div>

        {/* Ігрове поле */}
        <div className="grid grid-cols-3 gap-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className={`
                w-24 h-24 text-5xl font-bold rounded-xl
                transition-all duration-200 transform
                ${cell === 'X' ? 'text-blue-600 dark:text-blue-400' : ''}
                ${cell === 'O' ? 'text-red-600 dark:text-red-400' : ''}
                ${!cell && !winner ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 cursor-pointer' : 'bg-gray-50 dark:bg-gray-750'}
                ${cell || winner ? 'cursor-not-allowed' : ''}
                shadow-md
              `}
              disabled={!!cell || !!winner}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Кнопка перезапуску */}
        <button
          onClick={resetGame}
          className="px-8 py-3 text-xl font-semibold text-white bg-indigo-600 rounded-full
                     hover:bg-indigo-700 active:scale-95 transition-all duration-200 shadow-lg
                     hover:shadow-xl"
        >
          Нова гра
        </button>

        {/* Правила */}
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400 max-w-md">
          <p>Збери три свої символи в ряд (по горизонталі, вертикалі або діагоналі), щоб перемогти!</p>
          <Link
            href="/pravyla"
            className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Детальні правила гри →
          </Link>
        </div>
      </div>
    </div>
  );
}
