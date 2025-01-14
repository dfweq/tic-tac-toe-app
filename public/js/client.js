// client.js

const socket = io();

// DOM Elements
const roleSelection = document.getElementById('role-selection');
const player1Btn = document.getElementById('player1-btn');
const player2Btn = document.getElementById('player2-btn');
const gameDiv = document.getElementById('game');
const cells = document.querySelectorAll('.cell');
const statusDiv = document.getElementById('status');
const restartBtn = document.getElementById('restart-btn');

let playerRole = null;
let currentPlayer = null;

// Role Selection Handlers
player1Btn.addEventListener('click', () => {
    socket.emit('playerJoin', 'player1');
});

player2Btn.addEventListener('click', () => {
    socket.emit('playerJoin', 'player2');
});

// Cell Click Handler
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (playerRole !== currentPlayer) return;
        const index = cell.getAttribute('data-index');
        if (cell.textContent !== '') return;
        socket.emit('makeMove', parseInt(index));
    });
});

// Restart Button Handler
restartBtn.addEventListener('click', () => {
    window.location.reload();
});

// Socket Event Listeners

// Assign Player Role
socket.on('playerAssignment', (role) => {
    playerRole = role;
    if (role === 'player1' || role === 'player2') {
        roleSelection.classList.add('hidden');
        gameDiv.classList.remove('hidden');
        statusDiv.textContent = 'Waiting for another player to join...';
    } else {
        roleSelection.classList.add('hidden');
        gameDiv.classList.remove('hidden');
        statusDiv.textContent = 'You are a spectator.';
    }
});

// Game Start
socket.on('gameStart', (data) => {
    currentPlayer = data.currentPlayer;
    updateBoard(data.board);
    updateStatus();
});

// Game Update
socket.on('gameUpdate', (data) => {
    currentPlayer = data.currentPlayer;
    updateBoard(data.board);
    updateStatus();
});

// Game End
socket.on('gameEnd', (data) => {
    if (data.winner) {
        if (data.winner === playerRole) {
            statusDiv.textContent = 'You win!';
        } else {
            statusDiv.textContent = 'You lose!';
        }
    } else {
        statusDiv.textContent = "It's a tie!";
    }
    restartBtn.classList.remove('hidden');
});

// Player Disconnected
socket.on('playerDisconnected', () => {
    statusDiv.textContent = 'A player disconnected. Game reset.';
    restartBtn.classList.remove('hidden');
});

// Helper Functions

function updateBoard(board) {
    board.forEach((mark, index) => {
        cells[index].textContent = mark ? mark : '';
    });
}

function updateStatus() {
    if (currentPlayer === playerRole) {
        statusDiv.textContent = 'Your turn!';
    } else if (currentPlayer) {
        statusDiv.textContent = `Opponent's turn.`;
    } else {
        // No current player (game over)
    }
}
