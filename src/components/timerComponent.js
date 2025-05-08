import React, { useState, useEffect } from 'react';

const TimerComponent = ({ socket, submitTime, lobbyId, handleWordSubmit }) => {
	const [timeRemaining, setTimeRemaining] = useState(null);  // To hold the remaining time
	const [timerActive, setTimerActive] = useState(false); // To track if the timer is active

	useEffect(() => {
		if (submitTime) {
			console.log('Starting to listen for updateTimer events');  // Log when we start listening

			// Listen for the server-emitted timer update event
			socket.on('updateTimer', (data) => {
				console.log('Received updateTimer data:', data);  // Log received data
				if (data.remainingTime !== undefined) {
					setTimeRemaining(data.remainingTime);
				}
			});

			setTimerActive(true);  // Start the timer when submitTime is true
		}

		return () => {
			// Cleanup listeners when the component is unmounted
			socket.off('updateTimer');
		};
	}, [submitTime, socket]);  // Dependency on submitTime and socket

	return (
		<div>
			{timerActive && timeRemaining !== null ? (
				<div>
					<h2 style={{ color: '#f8f8f8' }}>Time Remaining: {timeRemaining} seconds</h2>
				</div>
			) : (
				<div style={{ color: '#f8f8f8' }}>Loading...</div>  // If the time is not yet set, show loading
			)}
		</div>
	);
};

export default TimerComponent;
