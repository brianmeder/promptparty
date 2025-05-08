import admin from 'firebase-admin';
import { wordEnforcer } from '../wordEnforcer.js';

export default function gameHandler(io, socket, db) {

	// Submission Timer Function
	async function submissionTimer(lobbyId, time) {
		let remainingTime = time; // Set the initial remaining time
		const intervalId = setInterval(() => {
			//console.log(`Emitting remaining time: ${remainingTime}`);  // Log the remaining time

			// Log socket IDs connected to the lobbyId room
			const room = io.sockets.adapter.rooms.get(lobbyId);
			if (room) {
				//console.log(`Socket IDs in room ${lobbyId}:`, [...room]);
			} else {
				//console.log(`No players in room ${lobbyId}`);
			}

			io.to(lobbyId).emit('updateTimer', {
				remainingTime,
			});

			remainingTime -= 1;  // Decrease the time by 1 second

			if (remainingTime <= 0) {
				clearInterval(intervalId);  // Stop the timer once it reaches 0
				//console.log("About to emit stopWordInput!");
				io.to(lobbyId).emit('stopWordInput', {
					message: 'The time to enter words has elapsed.',
				});
				//console.log('Timer finished');
			}
		}, 1000);  // Emit every second (1000ms)
	}




	// Start Game
	socket.on('hostStartGame', async (data) => {
		try {
			const lobbyId = data.lobbyId;
			if (!lobbyId) throw new Error("No lobbyId received.");
			alertRoomGameStart(lobbyId);
		} catch (error) {
			console.error("Error (start game):", error.message);
		}
	});

	// Alert Players That Game Started
	async function alertRoomGameStart(lobbyId) {
		console.log(`Starting game for lobby: ${lobbyId}`);

		// Get players in the room
		const roomSockets = await io.in(lobbyId).fetchSockets();
		console.log(`Players in lobby ${lobbyId}:`, roomSockets.map(s => s.id));

		// Notify clients
		io.to(lobbyId).emit('startGame', { message: `Host has started the game.` });

		// Update game state in Firestore
		try {
			const lobbyRef = db.collection("lobbies").where("lobbyId", "==", lobbyId);
			const lobbySnapshot = await lobbyRef.get();

			if (lobbySnapshot.empty) {
				console.error(`Lobby ${lobbyId} not found.`);
				return;
			}

			const lobbyDocRef = lobbySnapshot.docs[0].ref;
			await lobbyDocRef.update({ inProgress: true });
			console.log(`✅ Lobby ${lobbyId} is now in progress.`);
		} catch (error) {
			console.error(`Error setting lobby to "in progress":`, error);
		}

		// Begin word input phase
		io.to(lobbyId).emit('beginWordInput', { message: `It is time for inputting words into the word bank.` });

		// Start 30-second word submission timer
		submissionTimer(lobbyId, 30);
	}

	// Handle Word Submission
	socket.on('submitWord', async (data) => {
		const { lobbyId, word } = data;
		console.log(`📩 Word received from lobby: ${lobbyId}`);

		try {
			const lobbyRef = db.collection("lobbies").where("lobbyId", "==", lobbyId);
			const lobbySnapshot = await lobbyRef.get();

			if (lobbySnapshot.empty) {
				console.error(`Lobby ${lobbyId} not found. (wordbank entry)`);
				return;
			}

			const lobbyDocRef = lobbySnapshot.docs[0].ref;

			// Process the word before adding it
			const editedWord = wordEnforcer(word);

			if (editedWord == "****" || "") {
				console.log("Bad word or symbol detected.")
				return; //Do not add curses.
			}

			// Update Firestore word bank
			await lobbyDocRef.update({
				wordBank: admin.firestore.FieldValue.arrayUnion(editedWord)
			});

			console.log(`✅ Added word "${editedWord}" to word bank in lobby ${lobbyId}`);
		} catch (error) {
			console.error(`Error adding word to wordbank:`, error);
		}
	});
}
