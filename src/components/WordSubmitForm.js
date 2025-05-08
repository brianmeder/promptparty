import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

const WordSubmitForm = ({ onSubmit, lobbyId }) => {
	const [word, setWord] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault(); // Prevents page refresh
		if (word.trim()) {
			onSubmit(word, lobbyId); // Send both word and lobbyId
			setWord(""); // Clear input after submission
		}
	};

	return (
		<Box
			component="form"
			onSubmit={handleSubmit}
			sx={{ display: "flex", gap: 2, flexDirection: "column", gap: 1, alignItems: "center" }}
		>
			<Typography variant="h4" sx={{ color: "white" }}>
				Begin submitting words!
			</Typography>
			<TextField
				label="Enter Word"
				variant="outlined"
				value={word}
				onChange={(e) => setWord(e.target.value)}
				onKeyPress={(e) => e.key === "Enter" && handleSubmit(e)}
				sx={{
					flexGrow: 1,
					input: { color: "black", backgroundColor: "white" }
				}}
			/>
			<Button
				type="submit"
				variant="contained"
				color="primary"
			>
				Submit
			</Button>
		</Box>
	);
};

export default WordSubmitForm;
