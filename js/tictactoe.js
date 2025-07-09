/**
 * tictactoe.js
 *
 * This file contains the logic for the Tic-Tac-Toe game against a computer AI.
 * The AI uses the minimax algorithm to play an optimal game.
 */
document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('tictactoe-board');
    const statusElement = document.getElementById('game-status');
    const resetButton = document.getElementById('reset-btn-ttt');

    let board = ['', '', '', '', '', '', '', '', ''];
    const humanPlayer = 'X';
    const aiPlayer = 'O';
    let currentPlayer = humanPlayer;
    let isGameActive = true;

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    // --- Create the Board ---
    function createBoard() {
        boardElement.innerHTML = '';
        board.forEach((cell, index) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.index = index;
            cellElement.addEventListener('click', handleCellClick);
            boardElement.appendChild(cellElement);
        });
    }

    // --- Game Logic ---
    function handleCellClick(e) {
        if (!isGameActive || currentPlayer !== humanPlayer) return;

        const clickedCellIndex = parseInt(e.target.dataset.index);

        if (board[clickedCellIndex] === '') {
            makeMove(clickedCellIndex, humanPlayer);
            if (isGameActive) {
                // AI's turn after a short delay for effect
                statusElement.textContent = "Computer is thinking...";
                setTimeout(aiTurn, 500);
            }
        }
    }
    
    function makeMove(index, player) {
        if (board[index] === '' && isGameActive) {
            board[index] = player;
            const cell = boardElement.children[index];
            cell.textContent = player;
            cell.classList.add(player.toLowerCase());
            
            if (checkWin(board, player)) {
                endGame(false);
            } else if (isTie(board)) {
                endGame(true);
            } else {
                 currentPlayer = (player === humanPlayer) ? aiPlayer : humanPlayer;
            }
        }
    }

    function aiTurn() {
        if (!isGameActive) return;
        
        const bestMove = minimax(board, aiPlayer).index;
        makeMove(bestMove, aiPlayer);
        if (isGameActive) {
            statusElement.textContent = "Your turn (X)";
        }
    }

    function checkWin(currentBoard, player) {
        return winningConditions.some(condition => {
            return condition.every(index => currentBoard[index] === player);
        });
    }

    function isTie(currentBoard) {
        return currentBoard.every(cell => cell !== '');
    }

    function endGame(draw) {
        isGameActive = false;
        if (draw) {
            statusElement.textContent = "Game ended in a draw!";
        } else {
            statusElement.textContent = `Player ${currentPlayer} has won!`;
        }
    }

    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        isGameActive = true;
        currentPlayer = humanPlayer;
        statusElement.textContent = "Your turn (X)";
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });
    }

    // --- Minimax AI Algorithm ---
    function minimax(newBoard, player) {
        const availableSpots = newBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

        if (checkWin(newBoard, humanPlayer)) {
            return { score: -10 };
        } else if (checkWin(newBoard, aiPlayer)) {
            return { score: 10 };
        } else if (availableSpots.length === 0) {
            return { score: 0 };
        }

        const moves = [];
        for (let i = 0; i < availableSpots.length; i++) {
            const move = {};
            move.index = availableSpots[i];
            newBoard[availableSpots[i]] = player;

            if (player === aiPlayer) {
                const result = minimax(newBoard, humanPlayer);
                move.score = result.score;
            } else {
                const result = minimax(newBoard, aiPlayer);
                move.score = result.score;
            }

            newBoard[availableSpots[i]] = '';
            moves.push(move);
        }

        let bestMove;
        if (player === aiPlayer) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    }


    // --- Initialize ---
    createBoard();
    resetButton.addEventListener('click', resetGame);
});
