import { useState, useEffect } from 'react';
import { Typography, Box, List, ListItem, ListItemText, Button, Chip, Paper } from '@mui/material';

const PromptSelectorComponent = ({ socket, lobbyId }) => {
	// State for storing the word bank
	const [wordBank, setWordBank] = useState([]);
	// State for tracking selected words
	const [selectedWords, setSelectedWords] = useState([]);
	// Track if it's this user's turn to select a prompt
	const [isMyTurn, setIsMyTurn] = useState(false);

	useEffect(() => {
		// Listen for prompt selection event from backend
		socket.on("selectPrompt", (data) => {
			console.log("Received word bank:", data.wordBank);
			setWordBank(data.wordBank || []);
			setIsMyTurn(true);
			// Reset selections when new word bank is received
			setSelectedWords([]);
		});

		// Cleanup function to prevent memory leaks
		return () => {
			socket.off("selectPrompt");
		};
	}, [socket]);

	// Handle word selection
	const handleWordSelect = (word) => {
		if (selectedWords.includes(word)) {
			// If already selected, remove it
			setSelectedWords(selectedWords.filter(w => w !== word));
		} else {
			// Add to selection
			setSelectedWords([...selectedWords, word]);
		}
	};

	// Handle prompt submission
	const handleSubmit = () => {
		if (selectedWords.length === 0) {
			alert("Please select at least one word for your prompt");
			return;
		}

		// Send selected words to backend
		socket.emit("submitPrompt", {
			prompt: selectedWords.join(" "),
			lobbyId: lobbyId
		});

		console.log("Submitted prompt:", selectedWords.join(" "));
		setIsMyTurn(false);
	};

	// Function to check if a word is selected
	const isWordSelected = (word) => selectedWords.includes(word);

	return (
		<Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
			{isMyTurn ? (
				<>
					<Typography variant="h5" color="white" gutterBottom>
						Create Your Prompt
					</Typography>

					<Paper elevation={3} sx={{ p: 2, mb: 3, minHeight: '60px' }}>
						<Typography variant="h6" gutterBottom>
							Your Prompt:
						</Typography>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
							{selectedWords.length === 0 ? (
								<Typography color="text.secondary" fontStyle="italic">
									(Select words below to build your prompt)
								</Typography>
							) : (
								selectedWords.map((word, index) => (
									<Chip
										key={index}
										label={word}
										onDelete={() => handleWordSelect(word)}
										color="primary"
									/>
								))
							)}
						</Box>
					</Paper>

					<Typography variant="h6" color="white" gutterBottom>
						Word Bank
					</Typography>

					<List sx={{
						bgcolor: 'background.paper',
						borderRadius: 1,
						boxShadow: 1,
						display: 'flex',
						flexWrap: 'wrap',
						p: 2
					}}>
						{wordBank.length === 0 ? (
							<Typography color="text.secondary">
								Waiting for word bank...
							</Typography>
						) : (
							wordBank.map((word, index) => (
								<ListItem
									key={index}
									sx={{
										width: 'auto',
										p: 0.5,
										m: 0.5,
										border: '1px solid',
										borderColor: isWordSelected(word) ? 'primary.main' : 'divider',
										borderRadius: 1,
										bgcolor: isWordSelected(word) ? 'primary.light' : 'background.paper',
										cursor: 'pointer'
									}}
									onClick={() => handleWordSelect(word)}
								>
									<ListItemText primary={word} />
								</ListItem>
							))
						)}
					</List>

					<Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
						<Button
							variant="contained"
							color="primary"
							size="large"
							onClick={handleSubmit}
							disabled={selectedWords.length === 0}
						>
							Submit Prompt
						</Button>
					</Box>
				</>
			) : ("")
			}
		</Box>
	);
};

export default PromptSelectorComponent;