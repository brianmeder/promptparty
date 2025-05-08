
import { io } from 'socket.io-client';
//========================================================================
// This function is meant to act as a timer for players inputting words.
// After time has elapsed, emit a message to stop word input.
//
// Parameters: - lobbyId to alert correct lobby when time is up.
//             - Time (seconds) to count down from.
//=========================================================================

export async function submissionTimer(lobbyId, time) {

	const timeMilliseconds = 1000 * time; //Convert time to milliseconds

	setTimeout(function () {

		io.to(lobbyId).emit('stopWordInput', {
			message: `The time to enter words has elapsed.`,
		});

	}, timeMilliseconds);
}