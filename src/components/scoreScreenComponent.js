import React, { useEffect, useState } from "react";
import {
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Box,
	Fade,
	Chip,
	Button,
	Grid,

} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const ScoreScreenComponent = ({ socket, lobbyId, isHost }) => {
	const [turnEnded, setTurnEnded] = useState(false);
	const [gameEnded, setGameEnded] = useState(false);
	const [scoreData, setScoreData] = useState({
		playerScores: {},
		promptGuessed: "",
		originalPrompt: ""
	});
	const [isLoading, setIsLoading] = useState(true);
	const [finalScores, setFinalScores] = useState([]);

	useEffect(() => {
		// Listen for score updates
		socket.on("allGuessesReceivedForThisTurn", (data) => {
			console.log("Received score data:", data);
			setTurnEnded(true);
			setIsLoading(false);

			try {
				setScoreData({
					playerScores: data.playerScores || {},
					originalPrompt: data.originalPrompt || "",
					promptGuessed: data.promptGuessed || ""
				});
			} catch (error) {
				console.error("Error processing score data:", error);
			}
		});

		socket.on("gameOver", (data) => {
			console.log(data.message);
			socket.emit("sendFinalScores", {
				lobbyId: lobbyId,
			});
		})

		// Listen for game over event
		socket.on("receivedFinalScores", (data) => {
			console.log("Final Scores Received:", data);
			try {
				setScoreData({
					playerScores: data.finalPlayerScores || {},
				});
			} catch (error) {
				console.error("Error processing final score data:", error);
			}
			setGameEnded(true);
			setTurnEnded(true);
			setIsLoading(false);

			try {
				// Process final scores
				let players = [];

				if (data && data.playerScores) {
					players = Object.entries(data.playerScores).map(([socketId, playerData]) => ({
						socketId,
						username: playerData.username || "Unknown Player",
						score: playerData.score || 0
					}));
				} else if (data && Array.isArray(data)) {
					// If data is directly an array of players
					players = data.map(player => ({
						socketId: player.socketId || player.id || '',
						username: player.username || "Unknown Player",
						score: player.score || 0
					}));
				} else if (scoreData && scoreData.playerScores) {
					// Fallback to use current scoreData if gameOver data is not as expected
					players = Object.entries(scoreData.playerScores).map(([socketId, playerData]) => ({
						socketId,
						username: playerData.username || "Unknown Player",
						score: playerData.score || 0
					}));
				}

				// Sort by score (highest first)
				const sortedPlayers = players.sort((a, b) => b.score - a.score);
				console.log("Final sorted scores:", sortedPlayers);
				setFinalScores(sortedPlayers);
			} catch (error) {
				console.error("Error processing game over data:", error);
				// Fallback to use current scoreData if there was an error
				const players = Object.entries(scoreData.playerScores || {}).map(([socketId, playerData]) => ({
					socketId,
					username: playerData.username || "Unknown Player",
					score: playerData.score || 0
				}));
				const sortedPlayers = players.sort((a, b) => b.score - a.score);
				setFinalScores(sortedPlayers);
			}
		});

		socket.on("refreshStats", (data) => {
			setTurnEnded(false);
			setIsLoading(true);
		})

		// Clean up socket listeners
		return () => {
			socket.off("allGuessesReceivedForThisTurn");
			socket.off("gameOver");
			socket.off("refreshStats")
		};
	}, [socket, lobbyId, scoreData]);

	// Handle next turn button click
	const handleNextTurn = () => {
		if (isHost && socket) {
			socket.emit("getPlayerTurn", {
				lobbyId: lobbyId
			});
		}
	};


	// Convert player scores object to sorted array for regular turn end
	const getScoreboard = () => {
		if (!scoreData.playerScores) return [];

		const players = Object.entries(scoreData.playerScores).map(([socketId, data]) => ({
			socketId,
			username: data.username || "Unknown Player",
			score: data.score || 0,
			promptGuessed: data.promptGuessed || ""
		}));

		// Sort by score (highest first)
		return players.sort((a, b) => b.score - a.score);
	};

	const scoreboard = getScoreboard();

	// Game Over Table Component
	const GameOverTable = () => {
		if (finalScores.length === 0) {
			console.log("No final scores available for table");
			// Use regular scoreboard as fallback if finalScores is empty
			if (scoreboard.length > 0) {
				console.log("Using scoreboard as fallback for table");
			} else {
				return <Typography>No final scores available</Typography>;
			}
		}

		// Use finalScores if available, otherwise fall back to scoreboard
		const playersToUse = finalScores.length > 0 ? finalScores : scoreboard;

		// Group players by score to handle ties
		const scoreGroups = {};
		playersToUse.forEach(player => {
			if (!scoreGroups[player.score]) {
				scoreGroups[player.score] = [];
			}
			scoreGroups[player.score].push(player);
		});

		// Sort scores in descending order
		const sortedScores = Object.keys(scoreGroups).map(Number).sort((a, b) => b - a);

		// Create a ranked player list including ties
		const rankedPlayers = [];
		let currentRank = 1;

		sortedScores.forEach(score => {
			const playersWithScore = scoreGroups[score];
			playersWithScore.forEach(player => {
				rankedPlayers.push({
					...player,
					rank: currentRank
				});
			});
			currentRank += playersWithScore.length;
		});

		// Get medal colors for positions
		const getMedalColor = (rank) => {
			switch (rank) {
				case 1: return { backgroundColor: "rgba(255, 215, 0, 0.15)", color: "#856404" }; // Gold
				case 2: return { backgroundColor: "rgba(192, 192, 192, 0.15)", color: "#6c757d" }; // Silver
				case 3: return { backgroundColor: "rgba(205, 127, 50, 0.15)", color: "#856404" }; // Bronze
				default: return {};
			}
		};

		return (
			<Fade in={true} timeout={1000}>
				<Box sx={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
					<Typography
						variant="h3"
						align="center"
						sx={{
							fontWeight: "bold",
							color: "#6a1b9a",
							marginBottom: 4,
							textShadow: "1px 1px 2px rgba(0,0,0,0.1)"
						}}
					>
						<EmojiEventsIcon sx={{ fontSize: 45, color: "gold", verticalAlign: "bottom" }} />
						Game Over!
						<EmojiEventsIcon sx={{ fontSize: 45, color: "gold", verticalAlign: "bottom" }} />
					</Typography>

					<TableContainer
						component={Paper}
						sx={{
							maxWidth: 800,
							width: "100%",
							margin: "0 auto",
							borderRadius: 2,
							overflow: "hidden",
							boxShadow: 3
						}}
					>
						<Table>
							<TableHead sx={{ backgroundColor: "#6a1b9a" }}>
								<TableRow>
									<TableCell sx={{ color: "white", fontWeight: "bold", width: "15%" }}>Rank</TableCell>
									<TableCell sx={{ color: "white", fontWeight: "bold", width: "65%" }}>Player</TableCell>
									<TableCell align="center" sx={{ color: "white", fontWeight: "bold", width: "20%" }}>Score</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rankedPlayers.length > 0 ? (
									rankedPlayers.map((player, index) => {
										const medalStyle = getMedalColor(player.rank);
										return (
											<TableRow
												key={player.socketId || index}
												sx={{
													...medalStyle,
													'&:nth-of-type(odd)': {
														backgroundColor: medalStyle.backgroundColor || "#f5f5f5",
													},
													'&:hover': {
														backgroundColor: medalStyle.backgroundColor
															? `${medalStyle.backgroundColor.replace('0.15', '0.25')}`
															: "#e3f2fd"
													}
												}}
											>
												<TableCell sx={{ fontWeight: "bold" }}>
													{player.rank === 1 ? (
														<Box sx={{ display: "flex", alignItems: "center" }}>
															<EmojiEventsIcon sx={{ color: "gold", marginRight: 1 }} />
															{player.rank}
														</Box>
													) : (
														player.rank
													)}
												</TableCell>
												<TableCell sx={{
													fontWeight: player.rank <= 3 ? "bold" : "normal",
													color: medalStyle.color || "inherit"
												}}>
													{player.username}
												</TableCell>
												<TableCell align="center">
													<Chip
														label={player.score}
														color={player.rank === 1 ? "secondary" : player.rank <= 3 ? "primary" : "default"}
														sx={{
															fontWeight: "bold",
															minWidth: "60px"
														}}
													/>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell colSpan={3} align="center">
											No scores available yet
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			</Fade>
		);
	};

	return (
		<Fade in={turnEnded} timeout={800}>
			<Box sx={{
				padding: 3,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 3
			}}>
				{/* Show game over display when game has ended */}
				{gameEnded ? (
					<GameOverTable />
				) : (
					<>
						<Typography variant="h4" sx={{ fontWeight: "bold", color: "#6a1b9a" }}>
							Round Results
						</Typography>

						{isLoading ? (
							<Typography>Loading scores...</Typography>
						) : (
							<>
								<Paper
									elevation={3}
									sx={{
										padding: 2,
										backgroundColor: "#f3e5f5",
										borderRadius: 2,
										width: "100%",
										maxWidth: 600,
										textAlign: "center"
									}}
								>
									<Typography variant="h6" sx={{ color: "#4a148c" }}>
										Original Prompt:
									</Typography>
									<Typography
										variant="h5"
										sx={{
											fontWeight: "bold",
											marginTop: 1,
											fontStyle: "italic",
											color: "#6a1b9a"
										}}
									>
										"{scoreData.originalPrompt}"
									</Typography>
								</Paper>

								<TableContainer
									component={Paper}
									sx={{
										maxWidth: 600,
										width: "100%",
										borderRadius: 2,
										overflow: "hidden",
										boxShadow: 3
									}}
								>
									<Table>
										<TableHead sx={{ backgroundColor: "#6a1b9a" }}>
											<TableRow>
												<TableCell sx={{ color: "white", fontWeight: "bold" }}>Rank</TableCell>
												<TableCell sx={{ color: "white", fontWeight: "bold" }}>Player</TableCell>
												<TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Score</TableCell>
												<TableCell sx={{ color: "white", fontWeight: "bold" }}>Guess</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{scoreboard.length > 0 ? (
												scoreboard.map((player, index) => (
													<TableRow
														key={player.socketId || index}
														sx={{
															backgroundColor: index === 0 ? "rgba(255, 215, 0, 0.1)" : "inherit",
															'&:nth-of-type(odd)': { backgroundColor: "#f5f5f5" },
															'&:hover': { backgroundColor: "#e3f2fd" }
														}}
													>
														<TableCell>
															{index === 0 ? (
																<Box sx={{ display: "flex", alignItems: "center" }}>
																	<EmojiEventsIcon sx={{ color: "gold", marginRight: 1 }} />
																	{index + 1}
																</Box>
															) : (
																index + 1
															)}
														</TableCell>
														<TableCell sx={{ fontWeight: index === 0 ? "bold" : "normal" }}>
															{player.username}
														</TableCell>
														<TableCell align="center">
															<Chip
																label={player.score}
																color={index === 0 ? "secondary" : "primary"}
																sx={{
																	fontWeight: "bold",
																	minWidth: "60px"
																}}
															/>
														</TableCell>
														<TableCell>
															<Typography
																variant="body2"
																sx={{
																	fontStyle: "italic",
																	color: index === 0 ? "#6a1b9a" : "inherit"
																}}
															>
																"{player.promptGuessed}"
															</Typography>
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell colSpan={4} align="center">
														No scores available yet
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</TableContainer>

								{/* Next Turn Button - Only visible to host when turn has ended */}
								{isHost && turnEnded && !gameEnded && (
									<Button
										variant="contained"
										color="secondary"
										size="large"
										endIcon={<NavigateNextIcon />}
										onClick={handleNextTurn}
										sx={{
											marginTop: 2,
											fontWeight: "bold",
											backgroundColor: "#6a1b9a",
											'&:hover': {
												backgroundColor: "#4a148c"
											},
											boxShadow: 2
										}}
									>
										Start Next Turn
									</Button>
								)}
							</>
						)}
					</>
				)}
			</Box>
		</Fade>
	);
};

export default ScoreScreenComponent;