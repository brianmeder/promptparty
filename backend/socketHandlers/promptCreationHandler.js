//Backend handler to send wordbank and receive created prompts from active user.
export default function playerHandlers(io, socket, db) {

	//This function is specifcally for the user to be creating the prompt for the image.
	async function beginPromptCreation(playerSocket, lobbyId) {
		console.log("We have to send the wordbank to " + playerSocket + "!!!");

		const retrievedWordBank = await getWordBankFromLobby(lobbyId);
		try {
			io.to(playerSocket).emit("selectPrompt", {
				//Return array of wordbank words.
				wordBank: retrievedWordBank,
			})
		} catch (error) {
			console.log("something went wrong sending wordBank to " + playerSocket);
		}

	}

	//This function is specifcally for giving the wordbank to players going to guess the prompt.
	async function beginPromptGuessing(playerSocket, lobbyId) {
		console.log("We have to send the wordbank to " + playerSocket + "!!!");

		const retrievedWordBank = await getWordBankFromLobby(lobbyId);
		try {
			io.to(playerSocket).emit("guessPrompt", {
				//Return array of wordbank words.
				wordBank: retrievedWordBank,
			})
		} catch (error) {
			console.log("something went wrong sending wordBank to " + playerSocket);
		}

	}

	async function getWordBankFromLobby(lobbyId) {
		try {
			// Get the lobby document reference
			const lobbyRef = db.collection('lobbies').doc(lobbyId);

			// Fetch the document
			const lobbyDoc = await lobbyRef.get();

			// Check if document exists
			if (!lobbyDoc.exists) {
				console.error(`Lobby with ID ${lobbyId} not found`);
				return [];
			}

			// Get the data and extract the wordBank array
			const lobbyData = lobbyDoc.data();
			const wordBank = lobbyData.wordBank || [];

			console.log(`Retrieved ${wordBank.length} words from lobby ${lobbyId}`);
			console.log(wordBank);
			return wordBank;
		} catch (error) {
			console.error('Error retrieving wordBank:', error);
			return [];
		}
	}

	//For image creator
	socket.on("timeForPromptCreation", (data) => {
		const playerSocket = socket.id;
		const lobby = data.lobbyId;
		beginPromptCreation(playerSocket, lobby);
	})

	//For image guessers
	socket.on("timeForPromptGuessing", (data) => {
		console.log("Received timeForPromptGuessing!");
		const playerSocket = socket.id;
		const lobby = data.lobbyId;
		beginPromptGuessing(playerSocket, lobby);
	})

}