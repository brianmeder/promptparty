import React, { useState } from 'react';
import { Button, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const FAQComponent = () => {
	const [open, setOpen] = useState(false);

	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};

	return (
		<>
			<Button
				sx={{
					position: 'absolute',
					top: '6rem',
					right: '2rem',
					backgroundColor: '#1976d2',
					color: '#ffffff',
					fontWeight: 'bold',
					borderRadius: '12px',
					textTransform: 'none',
					boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
					'&:hover': {
						backgroundColor: '#1565c0',
					},
				}}
				variant="outlined" onClick={handleClickOpen}>
				Help / FAQs
			</Button>
			<Dialog
				onClose={handleClose}
				aria-labelledby="customized-dialog-title"
				open={open}
			>
				<DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
					Frequently Asked Questions.
				</DialogTitle>
				<IconButton
					aria-label="close"
					onClick={handleClose}
					sx={(theme) => ({
						position: 'absolute',
						right: 8,
						top: 8,
						color: theme.palette.grey[500],
					})}
				>
					<CloseIcon />
				</IconButton>
				<DialogContent dividers>
					<Typography>
						<b>Overview.</b>
					</Typography>
					<Typography gutterBottom>
						<em>Prompt Party</em> is a browser-based competitive multiplayer party game. The goal of the game is to
						guess the prompt's used to generate an AI image. The player with the most accurate guesses will win!
					</Typography>
					<Typography gutterBottom>
						Each lobby supports up to 1-4 players. Players can choose to host a lobby by creating their own, or join friends
						by joining a lobby using a specially generated lobby ID. No players may join a game in progress.
					</Typography>
					<hr></hr>
					<Typography>
						<b>Troubleshooting.</b>
					</Typography>
					<Typography gutterBottom>
						If you find that the page becomes unresponsive, it is likely you have lost communication
						with the game server. Please refresh the page and try again.
					</Typography>
					<Typography gutterBottom>
						Leaving mid-game may result in the game becoming unresponsive. If this is the case, all players must leave the game and
						make a new one.
					</Typography>
					<Typography gutterBottom>
						This problem may also be remedied by the host using the special <b>STUCK!</b> button unique to them, which may skip
						the leaving player's turn to progress the game.
					</Typography>
					<Typography gutterBottom>
						<b>Note:</b> refreshing the page while in a game will cause
						you to be kicked from the game.
					</Typography>
					<hr></hr>
					<Typography>
						<b>Why doesn't my image look accurate to the prompt?</b>
					</Typography>
					<Typography gutterBottom>
						The very nature of AI generated images are that they are surreal and weird. This is intended
						behavior. It makes guessing more fun and interactive!
					</Typography>
					<hr></hr>
				</DialogContent>
				<DialogActions>
					<Button autoFocus onClick={handleClose}>
						Understood
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default FAQComponent;