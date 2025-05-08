import { Typography, Box, List, ListItem, ListItemText, Button, Chip, Paper, LinearProgress, CircularProgress } from '@mui/material';
import { useEffect, useState } from "react";



// Renamed to start with uppercase letter
const ImageGuesserComponent = ({ currentPlayer, socket, lobbyId, playerEmail }) => {
	// React Hooks
	// ===========
	const [currentImage, setCurrentImage] = useState("");
	const [enableGuessing, setEnableGuessing] = useState(false);
	const [wordBank, setWordBank] = useState([]);
	const [hasSubmitted, setHasSubmitted] = useState(false);
	const [selectedWords, setSelectedWords] = useState([]);
	const [loadingState, setLoadingState] = useState({ isLoading: false });

	useEffect(() => {
		// Listen for new image generated.
		socket.on("newImageCreated", (data) => {
			const imagePath = data.imagePath;
			console.log("newImageCreated received and imagePath created.");
			console.log(imagePath);
			setLoadingState({ isLoading: false });
			setCurrentImage(imagePath);
			socket.emit("timeForPromptGuessing", { lobbyId: lobbyId })
			setHasSubmitted(false);
		});

		// Cleanup function to prevent memory leaks
		return () => {
			socket.off("newImageCreated");
		};
	}, [socket]);

	// Handle word selection
	const handleWordSelect = (word) => {
		if (selectedWords.includes(word)) {
			// If already selected, remove it
			setSelectedWords(selectedWords.filter(w => w !== word));
		} else {
			// Add to selected words
			setSelectedWords([...selectedWords, word]);
		}
	};

	// Submit the prompt guess
	const submitGuess = () => {
		if (selectedWords.length === 0) {
			return; // Don't submit if no words selected
		}

		// Generate the guessed prompt from selected words
		const guessedPrompt = selectedWords.join(" ");

		// Send the guessed prompt to the server
		socket.emit("submitPromptGuess", {
			lobbyId,
			prompt: guessedPrompt,
			playerEmail: playerEmail,
			currentPlayer: currentPlayer
		});
		console.log(playerEmail + " was sent as playerEmail");

		console.log("Submitted prompt guess:", guessedPrompt);
		setHasSubmitted(true);
		setEnableGuessing(false);
	};

	useEffect(() => {
		// Listen for prompt guessing event from backend
		socket.on("guessPrompt", (data) => {
			console.log("Received word bank:", data.wordBank);
			setWordBank(data.wordBank || []);
			// Reset when new word bank is received
			setSelectedWords([]);
			setEnableGuessing(true);
			setHasSubmitted(false);
		});

		// Cleanup function to prevent memory leaks
		return () => {
			socket.off("guessPrompt");
		};
	}, [socket]);

	useEffect(() => {
		socket.on("displayLoading", (data) => {
			console.log("Received displayLoading");
			setLoadingState({ isLoading: true });
		});

		return () => {
			socket.off("displayLoading");
		};
	}, [socket]);

	useEffect(() => {
		socket.on("refreshImage", (data) => {
			console.log("Received refreshImage");
			setCurrentImage(""); //Remove image.
			setHasSubmitted(false); //Remove submission acknowledgement message.

		});

		return () => {
			socket.off("refreshImage");
		};
	}, [socket]);

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "auto",
				backgroundColor: "#800080",
				borderRadius: "8px",
				color: "white",
				fontWeight: "bold",
				boxShadow: 3,
				padding: "10px",
				margin: "10px",
				flexDirection: "column"  // Ensure text + image align properly
			}}
		>
			<Box
				sx={{
					maxWidth: "800px",
					maxHeight: "600px",
					overflow: "hidden",
					display: "flex",
					justifyContent: "center",
					alignItems: "center"
				}}
			>
				{currentImage ? (
					<img
						src={currentImage}
						alt="Game image"
						style={{
							width: "100%",
							height: "auto",
							objectFit: "contain",
							borderRadius: "8px"
						}}
					/>
				) : (
					""
				)}
			</Box>
			{/* Word bank and prompt guessing section */}
			<Box
				sx={{
					maxWidth: "800px",
					width: "100%",
					margin: "16px 0",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: 2
				}}
			>
				{enableGuessing ? (
					<>
						<Typography variant="h6" sx={{ marginBottom: 1 }}>
							Guess the prompt using words from the word bank:
						</Typography>

						{/* Display selected words */}
						<Box
							sx={{
								display: "flex",
								flexWrap: "wrap",
								gap: 1,
								justifyContent: "center",
								minHeight: "50px",
								padding: 2,
								backgroundColor: "rgba(255, 255, 255, 0.1)",
								borderRadius: "8px",
								width: "100%",
								marginBottom: 2
							}}
						>
							{selectedWords.length > 0 ? (
								selectedWords.map((word, index) => (
									<Chip
										key={index}
										label={word}
										color="primary"
										onDelete={() => handleWordSelect(word)}
										sx={{ margin: "4px" }}
									/>
								))
							) : (
								<Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
									Select words from below to build your guess
								</Typography>
							)}
						</Box>

						{/* Word bank */}
						<Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
							Word Bank:
						</Typography>
						<Box
							sx={{
								display: "flex",
								flexWrap: "wrap",
								gap: 1,
								justifyContent: "center",
								maxWidth: "100%"
							}}
						>
							{wordBank.map((word, index) => (
								<Chip
									key={index}
									label={word}
									onClick={() => handleWordSelect(word)}
									variant={selectedWords.includes(word) ? "filled" : "outlined"}
									color={selectedWords.includes(word) ? "secondary" : "default"}
									sx={{
										margin: "4px",
										backgroundColor: selectedWords.includes(word) ? undefined : "rgba(255, 255, 255, 0.2)",
										color: "white",
										"&:hover": {
											backgroundColor: selectedWords.includes(word) ? undefined : "rgba(255, 255, 255, 0.3)"
										}
									}}
								/>
							))}
						</Box>

						{/* Submit button */}
						<Button
							variant="contained"
							color="secondary"
							onClick={submitGuess}
							disabled={selectedWords.length === 0 || hasSubmitted}
							sx={{ marginTop: 2, minWidth: "150px" }}
						>
							Submit Guess
						</Button>
					</>
				) : hasSubmitted ? (
					<Typography variant="h6">
						Your guess has been submitted! Waiting for results...
					</Typography>
				) : (
					<Typography variant="h6">
						{loadingState.isLoading
							? "An image is being generated..."
							: currentImage
								? "Waiting for your turn to guess..."
								: "Waiting for a prompt to be made..."}
					</Typography>
				)}
			</Box>
			<>
				{/* Display loading bar when loading react hook is set to true*/}
				{loadingState.isLoading && (
					<Box sx={{ width: '100%', justifyContent: 'center', display: "flex", }}>
						<CircularProgress color="primary" />
					</Box>
				)}
			</>
		</Box>
	);
};

export default ImageGuesserComponent;