import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './firebaseAdmin.js';

// Import handlers
import playerHandlers from './socketHandlers/playerHandlers.js';
import gameHandlers from './socketHandlers/gameHandlers.js';
import disconnectHandlers from './socketHandlers/disconnectHandlers.js';
import matchmakingHandlers from './socketHandlers/matchmakingHandlers.js';
import turnHandlers from './socketHandlers/turnHandlers.js';
import promptCreationHandler from './socketHandlers/promptCreationHandler.js';
import promptToImageHandler from './socketHandlers/promptToImageHandler.js';
import guessGrader from './socketHandlers/guessGrader.js';
import leaderboardHandler from './socketHandlers/leaderboardHandler.js';
import chatHandler from './socketHandlers/chatHandler.js';

// Initialize Express
const app = express();
const httpServer = createServer(app);

app.use(cors({
	origin: "http://localhost:3000",
	methods: ["GET", "POST"],
	credentials: true,
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/generated-images', express.static(path.join(process.cwd(), 'backend', 'public', 'generated-images')));

// Initialize Socket.io
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:3000",
		methods: ['GET', 'POST'],
		credentials: true,
	}
});

// Handle Socket.io connections
io.on('connection', (socket) => {
	console.log(`✅ New client connected: ${socket.id}`);

	// Attach event handlers
	matchmakingHandlers(io, socket, db);
	playerHandlers(io, socket, db);
	gameHandlers(io, socket, db);
	disconnectHandlers(io, socket, db);
	turnHandlers(io, socket, db);
	promptCreationHandler(io, socket, db);
	promptToImageHandler(io, socket, db);
	guessGrader(io, socket, db);
	leaderboardHandler(io, socket, db);
	chatHandler(io, socket);

	socket.on('disconnect', () => {
		console.log(`❌ Client disconnected: ${socket.id}`);
	});
});

// Start the server
httpServer.listen(5000, () => {
	console.log('Server is running on http://localhost:5000');
});
