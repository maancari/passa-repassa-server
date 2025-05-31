const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// --- Configuração do Socket.IO com CORS ---
// Permite conexões do domínio do seu GitHub Pages
const io = socketIo(server, {
    cors: {
        origin: "https://maancari.github.io", // **MUDE ESTE PARA A URL BASE DO SEU GITHUB PAGES**
        methods: ["GET", "POST"],
        credentials: true // Necessário para algumas configurações de socket
    }
});

// --- Configuração do Servidor de Arquivos Estáticos ---
// Serve os arquivos da pasta 'passa-repassa' (seus HTML, CSS, JS)
// Ajuste este caminho se a pasta do seu jogo não estiver no mesmo nível
const pathToGameFiles = path.join(__dirname, '../passa-repassa');
app.use(express.static(pathToGameFiles));

// Opcional: Redireciona a raiz para o manager.html
app.get('/', (req, res) => {
  res.sendFile(path.join(pathToGameFiles, 'manager.html'));
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

    // Envia o estado atual do jogo para o novo cliente assim que ele se conecta
    socket.emit('gameStateUpdate', gameState);

    // Quando um cliente envia um evento 'playerButtonClick'
    socket.on('playerButtonClick', (playerInfo) => {
        console.log(`Botão apertado por: ${playerInfo.player}`);
        if (!gameState.isBlocked && !gameState.buttonPressed) {
            gameState.buttonPressed = true;
            gameState.pressedBy = playerInfo.player;
            // Emite o estado atualizado para TODOS os clientes conectados
            io.emit('gameStateUpdate', gameState);
        }
    });

    // Quando o gerenciador envia um evento 'resetGame'
    socket.on('resetGame', () => {
        console.log('Jogo reiniciado pelo gerenciador');
        gameState = {
            buttonPressed: false,
            pressedBy: null,
            isBlocked: false
        };
        io.emit('gameStateUpdate', gameState); // Emite o novo estado para todos
    });

    // Quando o gerenciador envia um evento 'blockButtons'
    socket.on('blockButtons', () => {
        console.log('Botões bloqueados pelo gerenciador');
        gameState.isBlocked = true;
        io.emit('gameStateUpdate', gameState);
    });

    // Quando o gerenciador envia um evento 'unblockButtons'
    socket.on('unblockButtons', () => {
        console.log('Botões desbloqueados pelo gerenciador');
        gameState.isBlocked = false;
        io.emit('gameStateUpdate', gameState);
    });

    // Quando o gerenciador envia um evento 'managerPlayerClick'
    socket.on('managerPlayerClick', (playerInfo) => {
        console.log(`Gerenciador clicou para: ${playerInfo.player}`);
        if (!gameState.isBlocked && !gameState.buttonPressed) {
            gameState.buttonPressed = true;
            gameState.pressedBy = playerInfo.player;
            io.emit('gameStateUpdate', gameState);
        }
    });

    // Lidar com a desconexão de um usuário
    socket.on('disconnect', () => {
        console.log('Um usuário desconectado:', socket.id);
    });
});

// --- Iniciar o Servidor ---
const PORT = process.env.PORT || 3000; // Usa a porta 3000, ou a porta definida pelo ambiente (para hospedagem)
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Servindo arquivos de: ${pathToGameFiles}`);
});