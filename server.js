const express = require('express'); // Ainda precisa do express, mas não para servir arquivos estáticos do jogo
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Path não é mais estritamente necessário se não servir arquivos

const app = express();
const server = http.createServer(app);

// --- Configuração do Socket.IO com CORS ---
// Permite conexões do domínio do seu GitHub Pages
const io = socketIo(server, {
    cors: {
        origin: "https://maancari.github.io", // **MUDE ESTE PARA A URL BASE DO SEU GITHUB PAGES**
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- Estado do Jogo (AGORA CENTRALIZADO NO SERVIDOR) ---
let gameState = {
    buttonPressed: false,
    pressedBy: null,
    isBlocked: false
};

// --- Lógica do Socket.IO (WebSockets) ---
io.on('connection', (socket) => {
    console.log('Um usuário conectado:', socket.id);

    socket.emit('gameStateUpdate', gameState);

    socket.on('playerButtonClick', (playerInfo) => {
        console.log(`Botão apertado por: ${playerInfo.player}`);
        if (!gameState.isBlocked && !gameState.buttonPressed) {
            gameState.buttonPressed = true;
            gameState.pressedBy = playerInfo.player;
            io.emit('gameStateUpdate', gameState);
        }
    });

    socket.on('resetGame', () => {
        console.log('Jogo reiniciado pelo gerenciador');
        gameState = {
            buttonPressed: false,
            pressedBy: null,
            isBlocked: false
        };
        io.emit('gameStateUpdate', gameState);
    });

    socket.on('blockButtons', () => {
        console.log('Botões bloqueados pelo gerenciador');
        gameState.isBlocked = true;
        io.emit('gameStateUpdate', gameState);
    });

    socket.on('unblockButtons', () => {
        console.log('Botões desbloqueados pelo gerenciador');
        gameState.isBlocked = false;
        io.emit('gameStateUpdate', gameState);
    });

    socket.on('managerPlayerClick', (playerInfo) => {
        console.log(`Gerenciador clicou para: ${playerInfo.player}`);
        if (!gameState.isBlocked && !gameState.buttonPressed) {
            gameState.buttonPressed = true;
            gameState.pressedBy = playerInfo.player;
            io.emit('gameStateUpdate', gameState);
        }
    });

    socket.on('disconnect', () => {
        console.log('Um usuário desconectado:', socket.id);
    });
});

// --- Iniciar o Servidor ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`); // localhost:3000 é só para testes locais
    // console.log(`Servindo arquivos de: ${pathToGameFiles}`); // REMOVA ou COMENTE
});