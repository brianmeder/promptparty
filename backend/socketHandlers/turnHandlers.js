import admin from 'firebase-admin';

var roomSocketsQueue = {};

export default function playerHandlers(io, socket, lobbyId, db) {
	async function getPlayerTurn(lobbyId) {
		const roomId = lobbyId;
		//Figure out which player's turn it is. Emit to room.
		if (roomSocketsQueue[lobbyId]) {
			console.log("Found the existing queue. Shifting()...")
			retrieveTurnSocketFromQueue(lobbyId);
		} else {
			io.in(roomId).allSockets()
				.then((sockets) => {
					roomSocketsQueue[roomId] = [...sockets];
					console.log(`Initializing Queue => Sockets in room ${roomId}:`, roomSocketsQueue[roomId]);
					retrieveTurnSocketFromQueue(lobbyId); // ✅ now safe to call!
				})
				.catch((error) => {
					console.error("Error fetching sockets:", error);
				});
		}
	}

	async function refreshPlayerStatScreen(lobbyId) {
		try {
			io.to(lobbyId).emit("refreshStats", {
				message: "New player turn, refresh stat screen!",
				// Response expected to be handled
				// in scoreScreenComponent.js
			});
			io.to(lobbyId).emit("refreshImage", {
				message: "New player turn, refresh image component!",
				// Response expected to be handled
				// in imageAndGuesserComponent.js
			});
		}
		catch (error) {
			console.log("Error in refresh player stat screen: " + error);
		}
	}

	async function retrieveTurnSocketFromQueue(lobbyId) {
		console.log("Length of socket room for " + lobbyId + " is " + roomSocketsQueue[lobbyId].length);
		// Check if the queue for this room is not empty
		if (roomSocketsQueue[lobbyId].length > 0) {
			console.log("Queue size > 0");
			try {
				// Emit the socket ID of the next player to take their turn
				const nextPlayerSocketId = roomSocketsQueue[lobbyId].shift();
				console.log(nextPlayerSocketId + " is the ID of the player to go!");

				// Emit "yourTurn" to the correct player
				io.to(nextPlayerSocketId).emit("yourTurn", {
					message: "It's your turn! Please proceed.",
				});

				// Create a timeout for 10 seconds (10000 ms)
				const timeout = setTimeout(() => {
					console.log("No response received in time. Moving to the next player.");
					// If no response happens within 10 seconds, move to the next player
					retrieveTurnSocketFromQueue(lobbyId);
				}, 10000); // 10 seconds timeout

				// Listen for the player's response (turnReceived) from the correct socket
				const playerSocket = io.sockets.sockets.get(nextPlayerSocketId); // Get the specific socket
				playerSocket.once("turnReceived", (data) => {
					console.log("Data received in turnReceived:", data);  // Log the full data received
					const username = data && data.player ? data.player : "Unknown Player"; // Guard against undefined player data
					console.log(`${username}'s turn has been acknowledged.`);

					// Clear the timeout once a response is received
					clearTimeout(timeout);

					// Proceed with emitting that the player is now going
					io.to(lobbyId).emit("playerGoingNow", {
						playerGoingNow: username,
					});
				});

			} catch (error) {
				console.error("Error processing player turn:", error);
			}
			refreshPlayerStatScreen(lobbyId);
		}
		else if (roomSocketsQueue[lobbyId].length == 0) {
			console.log("Emitting gameOver because length of socket room is 0");
			io.to(lobbyId).emit("gameOver", {
				message: "The game has ended because everyone has gone!",
			});
		}
	}

	socket.on("getPlayerTurn", async (data) => {
		console.log("Received data:", data);
		try {
			getPlayerTurn(data.lobbyId);
		} catch (error) {
			console.log("Something went wrong getting player turn.")
		}
	});
}