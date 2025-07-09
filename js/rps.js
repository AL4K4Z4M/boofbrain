/**
 * rps.js
 *
 * This file contains the logic for the Rock, Paper, Scissors game.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Score elements
    const playerScoreEl = document.getElementById('player-score');
    const computerScoreEl = document.getElementById('computer-score');

    // Message and display elements
    const resultMessageEl = document.getElementById('result-message');
    const playerHandEl = document.getElementById('player-hand');
    const computerHandEl = document.getElementById('computer-hand');

    // Buttons
    const choiceButtons = document.querySelectorAll('.choice-btn');
    const resetButton = document.getElementById('reset-btn');

    // Game state
    let playerScore = 0;
    let computerScore = 0;
    const choices = ['rock', 'paper', 'scissors'];
    const emojiMap = {
        rock: '✊',
        paper: '✋',
        scissors: '✌️'
    };

    // --- Event Listeners ---

    // Add click event for each choice button
    choiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            playRound(button.dataset.choice);
        });
    });

    // Add click event for the reset button
    resetButton.addEventListener('click', resetGame);


    // --- Game Logic Functions ---

    /**
     * Plays a single round of the game.
     * @param {string} playerChoice - The player's selection ('rock', 'paper', or 'scissors').
     */
    function playRound(playerChoice) {
        const computerChoice = getComputerChoice();
        const winner = getWinner(playerChoice, computerChoice);

        // Update UI
        playerHandEl.textContent = emojiMap[playerChoice];
        computerHandEl.textContent = emojiMap[computerChoice];

        if (winner === 'player') {
            playerScore++;
            resultMessageEl.textContent = `You win! ${capitalize(playerChoice)} beats ${computerChoice}.`;
            resultMessageEl.style.color = 'var(--accent-primary)'; // Emerald
        } else if (winner === 'computer') {
            computerScore++;
            resultMessageEl.textContent = `You lose! ${capitalize(computerChoice)} beats ${playerChoice}.`;
            resultMessageEl.style.color = 'var(--accent-tertiary)'; // Pink
        } else {
            resultMessageEl.textContent = "It's a tie!";
            resultMessageEl.style.color = 'var(--text-secondary)';
        }

        updateScore();
    }

    /**
     * Gets a random choice for the computer.
     * @returns {string} The computer's choice.
     */
    function getComputerChoice() {
        const randomIndex = Math.floor(Math.random() * choices.length);
        return choices[randomIndex];
    }

    /**
     * Determines the winner of the round.
     * @param {string} player - The player's choice.
     * @param {string} computer - The computer's choice.
     * @returns {string} 'player', 'computer', or 'tie'.
     */
    function getWinner(player, computer) {
        if (player === computer) {
            return 'tie';
        }
        if (
            (player === 'rock' && computer === 'scissors') ||
            (player === 'paper' && computer === 'rock') ||
            (player === 'scissors' && computer === 'paper')
        ) {
            return 'player';
        }
        return 'computer';
    }

    /**
     * Updates the score display on the page.
     */
    function updateScore() {
        playerScoreEl.textContent = playerScore;
        computerScoreEl.textContent = computerScore;
    }

    /**
     * Resets the game state and UI to the beginning.
     */
    function resetGame() {
        playerScore = 0;
        computerScore = 0;
        updateScore();
        resultMessageEl.textContent = 'Make your move!';
        resultMessageEl.style.color = 'var(--text-secondary)';
        playerHandEl.textContent = '?';
        computerHandEl.textContent = '?';
    }

    /**
     * Helper function to capitalize the first letter of a string.
     * @param {string} string - The string to capitalize.
     * @returns {string} The capitalized string.
     */
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});
