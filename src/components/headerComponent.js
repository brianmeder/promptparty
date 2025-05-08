import React, { useState, useEffect } from 'react';
import {
	Box, Typography, IconButton, Dialog, DialogTitle, DialogContent, List,
	ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, DialogActions, Button
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import socket from '../socket.js';
import FAQComponent from './faqComponent.js';

const Header = ({ user }) => {
	const [leaderboardOpen, setLeaderboardOpen] = useState(false);
	const [leaderboardData, setLeaderboardData] = useState([]);
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	// Handle opening the leaderboard
	const handleOpenLeaderboard = () => {
		if (!user) {
			setLoginDialogOpen(true);
			return;
		}
		setLeaderboardOpen(true);
		setLoading(true);

		// Request leaderboard data from server via socket
		socket.emit('getLifetimeLeaderboard');
	};

	// Handle closing the leaderboard
	const handleCloseLeaderboard = () => {
		setLeaderboardOpen(false);
	};

	// Set up socket listener for leaderboard data
	useEffect(() => {
		// Listen for leaderboard data from server
		socket.on('lifetimeLeaderboard', (data) => {
			setLeaderboardData(data);
			setLoading(false);
		});

		// Clean up listener when component unmounts
		return () => {
			socket.off('lifetimeLeaderboard');
		};
	}, []);

	// Trophy colors based on rank
	const getTrophyColor = (rank) => {
		switch (rank) {
			case 1: return '#FFD700'; // Gold
			case 2: return '#C0C0C0'; // Silver
			case 3: return '#CD7F32'; // Bronze
			default: return '#A0A0A0'; // Gray
		}
	};

	return (
		<Box
			sx={{
				background: 'teal',
				padding: '2rem',
				textAlign: 'center',
				boxShadow: 3,
				position: 'relative', // For positioning the leaderboard icon
			}}
		>
			<Typography
				variant="h2"
				sx={{
					fontFamily: '"Times", "Comic Neue", cursive',
					fontWeight: 'bold',
					color: 'white',
					textShadow: '2px 2px black',
				}}
			>
				🎨 Prompt Party 🎉
			</Typography>
			<Typography
				variant="subtitle1"
				sx={{
					fontFamily: '"Comic Sans MS", "Comic Neue", cursive',
					color: '#fff',
					mt: 1,
				}}
			>
				A game of artificial unintelligence.
			</Typography>

			{/* Leaderboard Icon Button */}
			<IconButton
				aria-label="leaderboard"
				onClick={handleOpenLeaderboard}
				sx={{
					position: 'absolute',
					top: '1rem',
					right: '4rem',
					color: 'white',
					backgroundColor: 'rgba(0,0,0,0.2)',
					'&:hover': {
						backgroundColor: 'rgba(0,0,0,0.4)',
					}
				}}
			>
				<LeaderboardIcon fontSize="large" />
			</IconButton>

			{/* Leaderboard Dialog */}
			<Dialog
				open={leaderboardOpen}
				onClose={handleCloseLeaderboard}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle sx={{ bgcolor: 'teal', color: 'white' }}>
					Lifetime Leaderboard
					<IconButton
						aria-label="close"
						onClick={handleCloseLeaderboard}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							color: 'white',
						}}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent dividers sx={{ p: 0 }}>
					{loading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
							<CircularProgress />
						</Box>
					) : (
						<List sx={{ width: '100%', bgcolor: 'background.paper' }}>
							{leaderboardData.length === 0 ? (
								<ListItem>
									<ListItemText primary="No leaderboard data available" />
								</ListItem>
							) : (
								leaderboardData.map((player) => (
									<ListItem
										key={player.username}
										sx={{
											bgcolor: player.rank <= 3 ? `rgba(${player.rank === 1 ? '255, 215, 0' : player.rank === 2 ? '192, 192, 192' : '205, 127, 50'}, 0.1)` : 'transparent',
										}}
									>
										<ListItemAvatar>
											<Avatar sx={{ bgcolor: getTrophyColor(player.rank) }}>
												{player.rank <= 3 ? (
													<EmojiEventsIcon />
												) : (
													player.rank
												)}
											</Avatar>
										</ListItemAvatar>
										<ListItemText
											primary={player.username}
											secondary={`Score: ${player.lifetimeScore.toLocaleString()}`}
											primaryTypographyProps={{
												fontWeight: player.rank <= 3 ? 'bold' : 'normal',
											}}
										/>
									</ListItem>
								))
							)}
						</List>
					)}
				</DialogContent>
			</Dialog>
			<FAQComponent />
			<Dialog
				open={loginDialogOpen}
				onClose={() => setLoginDialogOpen(false)}
			>
				<DialogTitle>{"Login Required"}</DialogTitle>
				<DialogContent>
					<Typography>
						You must be logged in to view the leaderboard.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setLoginDialogOpen(false)} color="primary" autoFocus>
						OK
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default Header;