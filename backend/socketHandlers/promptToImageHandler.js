import { generateImageFromPrompt } from '../stablediffusionwebui/stableDiffusionConfig.js';

export default function promptToImageHandler(io, socket, db) {
	// Listen for prompt submission events
	socket.on("submitPrompt", async (data) => {
		try {
			const lobbyId = data.lobbyId;
			const createdPrompt = data.prompt;
			console.log(createdPrompt + " received as prompt from player " + socket.id);
			console.log(`Generating image for prompt: "${data.prompt}"`);

			console.log("going to emit displayLoading");
			io.to(lobbyId).emit("displayLoading");
			console.log("success");

			// Generate the image
			const imagePath = await generateImageFromPrompt(data.prompt);
			const fullImageURL = `http://localhost:5000${imagePath}`;

			// Save the generation info to the database if needed
			if (lobbyId && db) {
				await db.collection('lobbies').doc(lobbyId).collection('generatedImages').add({
					prompt: data.prompt,
					imagePath: imagePath,
					createdBy: socket.id,
					createdAt: new Date()
				});
				await db.collection('lobbies').doc(lobbyId).update({
					currentPromptBeingGuessed: data.prompt,
				});
			}

			// Emit the result back to the client
			socket.emit("imageGenerated", {
				prompt: data.prompt,
				imagePath: fullImageURL
			});

			// Broadcast to the lobby
			if (lobbyId) {
				io.to(lobbyId).emit("newImageCreated", {
					prompt: data.prompt,
					imagePath: fullImageURL,
					createdBy: socket.id
				});
			}

		} catch (error) {
			console.error('Error in prompt-to-image handler:', error);
		}
	});
}