import admin from 'firebase-admin';

export default function playerHandlers(io, socket, db) {
	async function removePlayer(player, lobbyId) {
		try {
			const lobbiesRef = db.collection('lobbies');
			const querySnapshot = await lobbiesRef.where('lobbyId', '==', lobbyId).get();
			if (!querySnapshot.empty) {
				// Lobby exists, get the first matching document
				const lobbyDoc = querySnapshot.docs[0];
				const lobbyDocRef = lobbyDoc.ref;
				const lobbyData = lobbyDoc.data();

				// Check if the player is already in the players array
				if (lobbyData.players.includes(player)) {

					const playerRef = await db.collection("players").where("email", "==", player);
					const playerSnapshot = await playerRef.get();
					const playerDocRef = playerSnapshot.docs[0].ref;

					// Remove player
					await lobbyDocRef.update({
						players: admin.firestore.FieldValue.arrayRemove(player), // Correct for Firebase Admin
						playerRefs: admin.firestore.FieldValue.arrayRemove(playerDocRef)
					});
					socket.emit('leaveLobby_SUCCESS', { lobbyId, message: `${player} was removed from lobby ${lobbyId}` })
					console.log(`${player} was removed from lobby ${lobbyId}`);
				}

				const updatedLobbyDoc = await lobbyDocRef.get();
				const updatedLobbyData = updatedLobbyDoc.data();

				//If host leaves and host was the only player in the lobby, delete the lobby.
				if (updatedLobbyData.host == player && updatedLobbyData.players.length == 0) {
					// Prep to delete all documents in the generatedImages subcollection
					const imagesCollectionRef = lobbyDocRef.collection('generatedImages');
					const imageSnapshots = await imagesCollectionRef.get();

					// Delete each document in the subcollection
					const imageDeletions = [];
					imageSnapshots.forEach(doc => {
						imageDeletions.push(doc.ref.delete());
					});

					// Wait for all image documents to be deleted
					await Promise.all(imageDeletions);

					// Delete the main lobby document
					await lobbyDocRef.delete();
					socket.emit('lobbyClosed', { lobbyId, message: `Lobby closed. Reason: Host left the lobby ${lobbyId}` });
					console.log(`Lobby closed. Reason: Host left the lobby ${lobbyId}`);
				}
				else if (updatedLobbyData.host == player && updatedLobbyData.players.length >= 1) {
					await lobbyDocRef.update({
						host: updatedLobbyData.players[0]
					});
					const newHost = updatedLobbyData.players[0];
					console.log(`Host changed to ${newHost} in lobby ${lobbyId}`);

					// Get the socket ID of the new host from Firestore (assuming socket ID is stored in Firestore)
					const newHostRef = db.collection("players").where("email", "==", newHost);
					const newHostSnapshot = await newHostRef.get();
					console.log(newHostSnapshot.docs[0]);
					const newHostDoc = newHostSnapshot.docs[0];
					const newHostData = newHostDoc.data();
					console.log(newHostData);
					const newHostSocketId = newHostData.socketId;
					console.log(`Found the socketId ${newHostSocketId} for new host ${newHost}.`);
					// Emit a message to the new host only using their socket ID
					if (newHostSocketId != undefined) {
						console.log("about to emit youAreNewHost!");
						socket.to(newHostSocketId).emit('youAreNewHost', {
							message: `Host left the game. You are the new host of lobby ${lobbyId}`
						});
						console.log(`New host ${newHost} notified in lobby ${lobbyId}`);
					} else {
						console.error(`No socket ID found for new host ${newHost}`);
					}
				}
			}
			socket.leave(lobbyId);
		}
		catch (error) {
			console.error("Error removing player from lobby!", error);
			socket.emit('leaveLobby_FAIL', { lobbyId, message: 'An error occurred while trying to leave the lobby.' });
		}
	}

	socket.on('removePlayer', (data) => {
		removePlayer(data.player, data.lobbyId);
	});
}
