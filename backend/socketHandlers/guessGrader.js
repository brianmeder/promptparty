import { FieldValue } from 'firebase-admin/firestore'; // for Firebase Admin SDK

export default function promptToImageHandler(io, socket, db) {

	socket.on("submitPromptGuess", async (data) => { //sent socketid, lobbyid and guess
		const playerSocket = socket.id;
		const lobby = data.lobbyId;
		const prompt = data.prompt;
		const email = data.playerEmail;
		const currentPlayer = data.currentPlayer;
		console.log("currentPlayer ==  " + currentPlayer + " and email == " + email);
		console.log("lobby == " + lobby);
		console.log("Received prompt guess; \"" + prompt + "\" from player with socket ID" + playerSocket + " in lobby with ID: " + lobby);
		const key = await retrieveKey(lobby);

		//Score guess and save relevant data to firebase
		await gradeAndSave(key, prompt, playerSocket, email, lobby, currentPlayer);

	})

	socket.on("sendFinalScores", async (data) => {
		const lobbyId = data.lobbyId;
		console.log("need to send final scores of lobby: " + lobbyId);
		try {
			const lobbyRef = db.collection('lobbies').doc(lobbyId);
			const docSnap = await lobbyRef.get();

			if (!docSnap.exists) {
				console.log(`Lobby with ID ${lobbyId} does not exist.`);
				return false;
			}

			const lobbyData = docSnap.data();
			io.to(lobbyId).emit("receivedFinalScores", {
				finalPlayerScores: lobbyData.playerScores,
			});
			saveLifetimeScores(lobbyData.playerScores);
		}
		catch (error) {
			console.log(error);
		}
	})

	async function saveLifetimeScores(playerScoresDoc) {
		const batch = db.batch();
		const updatedPlayers = [];

		try {
			// Verify we have valid player scores data
			if (!playerScoresDoc || typeof playerScoresDoc !== 'object') {
				console.error('Invalid playerScores document provided');
				return [];
			}

			// Extract all the player data from the subdocuments
			const playerEntries = Object.entries(playerScoresDoc);

			if (playerEntries.length === 0) {
				console.log('No player scores found to process');
				return [];
			}

			// Process each player's score
			const playerPromises = playerEntries.map(async ([docId, playerInfo]) => {
				const { username, score } = playerInfo;

				if (!username || score === undefined) {
					console.warn(`Incomplete player data for document ID: ${docId}`);
					return null;
				}

				// Get reference to the player's document in the players collection
				const playerDocRef = db.collection('players').doc(username);

				// Get the current player document to read the existing lifetime score
				const playerDoc = await playerDocRef.get();

				if (!playerDoc.exists) {
					console.warn(`No player document found for username: ${username}`);
					return null;
				}

				const existingPlayerData = playerDoc.data();
				const currentLifetimeScore = existingPlayerData.lifetimeScore || 0;
				const newLifetimeScore = currentLifetimeScore + score;

				// Add update to batch
				batch.update(playerDocRef, {
					lifetimeScore: newLifetimeScore,
				});

				return {
					username,
					previousScore: currentLifetimeScore,
					newScore: newLifetimeScore,
					addedScore: score
				};
			});

			// Wait for all player document retrievals to complete
			const playerResults = await Promise.all(playerPromises);

			// Execute the batch update
			await batch.commit();

			// Return results of successfully updated players
			return playerResults.filter(result => result !== null);

		} catch (error) {
			console.error('Error updating lifetime scores:', error);
			throw error;
		}
	}

	async function checkAllGuessesReceived(lobbyId) {
		console.log("inside check all guesses received");
		try {
			const lobbyRef = db.collection('lobbies').doc(lobbyId);
			const docSnap = await lobbyRef.get();

			if (!docSnap.exists) {
				console.log(`Lobby with ID ${lobbyId} does not exist.`);
				return false;
			}

			const lobbyData = docSnap.data();

			console.log("Guesses Received == " + lobbyData.numberOfGuessesReceived)
			console.log("players length Received == " + lobbyData.players.length)

			if (lobbyData.numberOfGuessesReceived == lobbyData.players.length ||
				lobbyData.numberOfGuessesReceived % lobbyData.players.length == 0) {
				//Alert the lobby that everyone's score should be displayed as well
				//as their guess and that after this the next turn can commence!
				console.log("All guesses were received for this turn!");
				io.to(lobbyId).emit("allGuessesReceivedForThisTurn", {
					playerScores: lobbyData.playerScores,
					promptGuessed: lobbyData.promptGuessed,
					originalPrompt: lobbyData.currentPromptBeingGuessed
				});

			}
			else {
				console.log("more guesses needed!");
			}
		}
		catch (error) {
			console.log("Error in checkAllGuessesReceived(): " + error)
		}
	}


	async function gradeAndSave(key, prompt, playerSocket, email, lobby, currentPlayer) {
		//Reason for function existence: the "await" for gradePromptGuess!
		//which is not able to used in a socket.on()
		//Score the guess
		const score = await gradePromptGuess(key, prompt, email, currentPlayer);
		//Save data
		savePlayerScoreToDatabase(playerSocket, prompt, email, lobby, score);
	}

	async function savePlayerScoreToDatabase(socketId, prompt, username, lobbyId, score) {
		try {
			const lobbyRef = db.collection('lobbies').doc(lobbyId);
			const docSnap = await lobbyRef.get();

			if (!docSnap.exists) {
				console.log(`Lobby with ID ${lobbyId} does not exist.`);
				return false;
			}

			const lobbyData = docSnap.data();

			// Ensure playerScores is a plain object
			const playerScores = lobbyData.playerScores || {};
			console.log("username received was " + username);

			// Get current score or default to 0
			const currentScore = playerScores[socketId]?.score || 0;

			// Update only the necessary fields
			await lobbyRef.update({
				[`playerScores.${socketId}`]: {
					username: String(username),
					score: Number(currentScore) + Number(score),
					promptGuessed: String(prompt || "")
				},
				numberOfGuessesReceived: FieldValue.increment(1) // Atomic increment
			});

			console.log(`Score of ${score} for player ${username} (${socketId}) saved successfully in lobby ${lobbyId}`);
			checkAllGuessesReceived(lobbyId);
			return true;

		} catch (error) {
			console.error("Error saving player score to database:", error);
			return false;
		}
	}

	async function retrieveKey(lobbyId) {
		const lobbyRef = db.collection('lobbies').doc(lobbyId);

		const docSnap = await lobbyRef.get();

		let key = null;

		if (docSnap.exists) {
			const data = docSnap.data();
			key = data.currentPromptBeingGuessed;
			console.log("Found Prompt key:", key);
		} else {
			console.log("Lobby document does not exist.");
		}
		return key;
	}

	async function gradePromptGuess(key, guess, email, currentPlayer) {
		const normalize = (input) =>
			Array.isArray(input) ? input.map(w => w.toLowerCase()) : input.toLowerCase().split(' ');

		const keyWords = normalize(key);
		const guessWords = normalize(guess);

		let score = 0;
		const matchedKeyIndices = new Set();
		const matchedGuessIndices = new Set();

		// Step 1: +100 for words in key
		guessWords.forEach((gWord, gIdx) => {
			const matchIdx = keyWords.findIndex((kWord, kIdx) =>
				kWord === gWord && !matchedKeyIndices.has(kIdx)
			);
			if (matchIdx !== -1) {
				score += 100;
				matchedKeyIndices.add(matchIdx);
				matchedGuessIndices.add(gIdx);
			}
		});

		// Step 2: +50 more for correct position
		guessWords.forEach((gWord, i) => {
			if (i < keyWords.length && gWord === keyWords[i]) {
				score += 50;
			}
		});

		// Step 3: -25 for extra words in guess not in key
		const unmatchedGuessCount = guessWords.filter((_, i) => !matchedGuessIndices.has(i)).length;
		score -= unmatchedGuessCount * 25;

		//If player guessing their own prompt, reduce score by 3 times.
		if (currentPlayer == email) {
			score = Math.ceil(score / 3);
		}
		const finalScore = Math.max(0, score);
		console.log(`grade for guess: "${guess}" ===> ${finalScore}`);
		return finalScore;
	}

}