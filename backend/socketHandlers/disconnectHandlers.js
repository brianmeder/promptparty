import { admin } from '../firebaseAdmin.js';

export default function disconnectHandler(io, socket, db) {

	async function removeOnRefresh(socketId) {
		try {
			const playerSnapshot = await db.collection("players").where("socketId", "==", socketId).get();

			if (playerSnapshot.empty) {
				console.log("No player found with this socketId.");
				return;
			}

			const disconnectingPlayer = playerSnapshot.docs[0].data().email;
			console.log(`❌ Removing player: ${disconnectingPlayer} from all lobbies`);

			const lobbyQuery = await db.collection("lobbies").where("players", "array-contains", disconnectingPlayer).get();

			for (const lobbyDoc of lobbyQuery.docs) {
				const lobbyId = lobbyDoc.data().lobbyId;
				await db.collection("lobbies").doc(lobbyDoc.id).update({
					players: admin.firestore.FieldValue.arrayRemove(disconnectingPlayer)
				});
				console.log(`✅ Removed ${disconnectingPlayer} from lobby ${lobbyId}`);
			}
		} catch (error) {
			console.error("Error removing player on disconnect:", error);
		}
	}

	socket.on('disconnect', async () => {
		console.log(`❌ Client disconnected: ${socket.id}`);
		await removeOnRefresh(socket.id);
	});
}
