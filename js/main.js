import { Game } from './game.js';
import { CONFIG } from './config.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game
    const game = new Game();
    // Attach game instance to window for global access
    window.game = game;
    
    // Get DOM elements
    const startButton = document.getElementById('start-button');
    const playerNameInput = document.getElementById('player-name');
    const loginScreen = document.getElementById('login-screen');
    
    // Focus the input field when page loads
    playerNameInput.focus();

    // Handle start button click
    startButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            loginScreen.style.display = 'none';
            game.start(playerName);
        }
    });

    // Handle Enter key press
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const playerName = playerNameInput.value.trim();
            if (playerName) {
                loginScreen.style.display = 'none';
                game.start(playerName);
            }
        }
    });
}); 