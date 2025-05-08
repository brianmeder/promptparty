import admin from 'firebase-admin';
import getRandomWordbank from '../wordbankHelper.js';

export default function matchmakingHandlers(io, socket, db) {
	async function createLobby(data) {
		const lobbyId = Math.random().toString(36).slice(2, 8).toUpperCase();
		console.log(`A new lobby has been created with ID: ${lobbyId}`);

		try {
			const hostRef = db.collection("players").where("email", "==", data.player);
			const hostSnapshot = await hostRef.get();
			const hostDocRef = hostSnapshot.docs[0].ref;
			const hostDocData = hostSnapshot.docs[0].data();
			const newLobbyHostSocketId = hostDocData.socketId;

			const newLobby = {
				lobbyId,
				host: data.player,
				players: [data.player],
				playerRefs: [hostDocRef],
				inProgress: false,
				wordBank: getRandomWordbank(), //Init wordbank with preset values from wordbankHelper.js
				currentPromptBeingGuessed: "",
				numberOfGuessesReceived: 0
			};

			// Save the lobby with the document ID = lobbyId
			const docRef = db.collection("lobbies").doc(lobbyId);
			await docRef.set(newLobby);
			io.to(newLobbyHostSocketId).emit("lobbyCreated", { lobbyId, message: `Your game is being hosted with ID: ${lobbyId}` });

			socket.join(lobbyId);
			console.log(`${data.player} joined socket room: ${lobbyId}`);
		} catch (error) {
			console.error("Error creating lobby:", error);
			io.emit("error", { message: "Failed to create lobby." });
		}
	}

	async function joinLobby(data) {
		const { lobbyId, player } = data;
		console.log(`Player ${player} is trying to join game with ID ${lobbyId}`);

		try {
			const lobbiesRef = db.collection('lobbies');
			const querySnapshot = await lobbiesRef.where('lobbyId', '==', lobbyId).get();

			if (!querySnapshot.empty) {
				const lobbyDoc = querySnapshot.docs[0];
				const lobbyDocRef = lobbyDoc.ref;
				const lobbyData = lobbyDoc.data();

				if (lobbyData.players.length >= 4) {
					socket.emit('lobbyJoined_FAIL', { lobbyId, message: 'Lobby is full!' });
					return;
				}

				if (lobbyData.inProgress == true) {
					socket.emit('lobbyJoined_FAIL', { lobbyId, message: 'Cannot join game in progress.' });
					console.log("sent emit for fail full lobby");
					return;
				}

				if (!lobbyData.players.includes(player)) {
					const playerRef = await db.collection("players").where("email", "==", player).get();
					const playerDocRef = playerRef.docs[0].ref;

					await lobbyDocRef.update({
						players: admin.firestore.FieldValue.arrayUnion(player),
						playerRefs: admin.firestore.FieldValue.arrayUnion(playerDocRef)
					});

					socket.join(lobbyId);
					socket.emit('lobbyJoined_SUCCESS', { lobbyId, message: 'Successfully joined the lobby!' });
				} else {
					socket.emit('lobbyJoined_FAIL', { lobbyId, message: 'You are already in this lobby.' });
				}
			} else {
				socket.emit('lobbyJoined_FAIL', { lobbyId, message: 'Lobby does not exist.' });
			}
		} catch (error) {
			console.error("Error joining lobby:", error);
			socket.emit('lobbyJoined_FAIL', { lobbyId, message: 'An error occurred while joining the lobby.' });
		}
	}

	socket.on('createLobby', createLobby);
	socket.on('joinLobby', joinLobby);
}
