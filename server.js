// server.js

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start the server
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Game state
let gameState = {
    board: Array(9).fill(null),
    players: {},
    currentPlayer: null,
    winner: null,
    moves: 0,
};

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign player role
    socket.on('playerJoin', (player) => {
        if (player === 'player1' && !gameState.players.player1) {
            gameState.players.player1 = socket.id;
            socket.emit('playerAssignment', 'player1');
            console.log(`Player 1 joined: ${socket.id}`);
        } else if (player === 'player2' && !gameState.players.player2) {
            gameState.players.player2 = socket.id;
            socket.emit('playerAssignment', 'player2');
            console.log(`Player 2 joined: ${socket.id}`);
        } else {
            socket.emit('playerAssignment', 'spectator');
            console.log(`Spectator connected: ${socket.id}`);
        }

        // If both players are connected, start the game
        if (gameState.players.player1 && gameState.players.player2) {
            gameState.currentPlayer = 'player1';
            io.emit('gameStart', { currentPlayer: gameState.currentPlayer, board: gameState.board });
        }
    });

    // Handle player moves
    socket.on('makeMove', (index) => {
        if (gameState.winner) return; // Game over

        const player = getPlayerBySocketId(socket.id);
        if (player !== gameState.currentPlayer) return; // Not this player's turn
        if (gameState.board[index] !== null) return; // Cell already taken

        // Update the board
        gameState.board[index] = player === 'player1' ? 'X' : 'O';
        gameState.moves += 1;

        // Check for a winner
        const winner = checkWinner(gameState.board);
        if (winner) {
            gameState.winner = player;
            io.emit('gameUpdate', { board: gameState.board, currentPlayer: null, winner: player });
            io.emit('gameEnd', { winner: player });
            return;
        }

        // Check for a tie
        if (gameState.moves === 9) {
            io.emit('gameUpdate', { board: gameState.board, currentPlayer: null, winner: null });
            io.emit('gameEnd', { winner: null });
            return;
        }

        // Switch turns
        gameState.currentPlayer = player === 'player1' ? 'player2' : 'player1';
        io.emit('gameUpdate', { board: gameState.board, currentPlayer: gameState.currentPlayer, winner: null });
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Reset game state if a player disconnects
        if (socket.id === gameState.players.player1 || socket.id === gameState.players.player2) {
            gameState = {
                board: Array(9).fill(null),
                players: {},
                currentPlayer: null,
                winner: null,
                moves: 0,
            };
            io.emit('playerDisconnected');
        }
    });
});

// Helper functions
function getPlayerBySocketId(id) {
    if (gameState.players.player1 === id) return 'player1';
    if (gameState.players.player2 === id) return 'player2';
    return 'spectator';
}

function checkWinner(board) {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8], // Rows
        [0,3,6], [1,4,7], [2,5,8], // Columns
        [0,4,8], [2,4,6]           // Diagonals
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] === 'X' ? 'player1' : 'player2';
        }
    }
    return null;
}
