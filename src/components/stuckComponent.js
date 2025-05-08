import React from "react";
import { Button, Box } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const StuckComponent = ({ socket, lobbyId, isHost }) => {
	const handleNextTurn = () => {
		if (isHost && socket) {
			socket.emit("getPlayerTurn", {
				lobbyId: lobbyId
			});
		}
	};

	return (
		<Box sx={{ position: "relative" }}>
			{isHost && (
				<Button
					variant="contained"
					color="secondary"
					size="large"
					endIcon={<NavigateNextIcon />}
					onClick={handleNextTurn}
					sx={{
						position: "fixed",
						bottom: "4em",
						right: "0px",
						fontWeight: "bold",
						backgroundColor: "#6a1b9a",
						'&:hover': {
							backgroundColor: "#4a148c"
						},
						boxShadow: 2,
						zIndex: 10,
						margin: 1 
					}}
				>
					Stuck!
				</Button>
			)}
		</Box>
	);
};

export default StuckComponent;
