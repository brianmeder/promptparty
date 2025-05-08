import { removeBadWord } from "../wordEnforcer.js";

export default function chatHandler(io, socket) {
	// Handle when a client sends a message
	socket.on('send_message', (data) => {
		var { username, lobbyId, message, timestamp } = data;
		message = removeBadWord(message);

		// Basic validation
		if (!username || !lobbyId || !message) {
			socket.emit('error', { message: 'Invalid message data' });
			return;
		}

		// Broadcast the message to everyone in the same lobby
		io.to(lobbyId).emit('chat_message', {
			username,
			message,
		});
	});
}