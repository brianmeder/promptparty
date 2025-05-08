import { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';

const PlayerTurnIndicator = ({ setCurrentPlayer, currentPlayer, socket }) => {
	// Player whose turn it is (passed above / declared in App.js)
	//const [currentPlayer, setCurrentPlayer] = useState("");

	useEffect(() => {
		// Listen for player turn updates
		socket.on("playerGoingNow", (data) => {
			const playerName = data.playerGoingNow;
			console.log(`${playerName}'s turn.`);
			// Update the state with current player
			setCurrentPlayer(playerName);
		});

		// Cleanup function to prevent memory leaks
		return () => {
			socket.off("playerGoingNow");
		};
	}, [socket]);

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100px",
				backgroundColor: "#1976d2", // Blue background
				borderRadius: "8px",
				color: "white",
				fontWeight: "bold",
				boxShadow: 3,
				padding: "10px",
			}}
		>
			<div className="player-turn-container">
				{currentPlayer ? (
					<Typography variant="h6" className="player-turn-text">Current Turn: <span className="current-player">{currentPlayer}</span></Typography>
				) : (
					<Typography variant="h6" className="player-turn-text">Waiting for player turn...</Typography>
				)}
			</div>
		</Box>
	);
};

export default PlayerTurnIndicator;