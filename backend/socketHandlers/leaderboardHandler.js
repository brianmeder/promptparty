export default function leaderboardHandler(io, socket, db) {

	//Get lifetime leaderboard scores and send them back to the client
	async function getLifetimeLeaderboard(limit = 10) {
		try {
			// Validate limit parameter if provided by client
			if (typeof limit !== 'number' || limit < 1) {
				limit = 10; // Default to 10 if invalid
			}

			// Get top players by lifetime score
			const leaderboardSnapshot = await db
				.collection('players')
				.orderBy('lifetimeScore', 'desc')
				.limit(limit)
				.get();

			const leaderboardData = leaderboardSnapshot.docs.map((doc, index) => {
				const data = doc.data();
				return {
					rank: index + 1,
					username: doc.id,
					displayName: data.displayName || doc.id,
					lifetimeScore: data.lifetimeScore || 0,
					lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : null
				};
			});

			// Send leaderboard data back to the client
			socket.emit('lifetimeLeaderboard', leaderboardData);

			console.log(`Sent leaderboard data (${leaderboardData.length} players) to client ${socket.id}`);

		} catch (error) {
			console.error('Error fetching lifetime leaderboard:', error);
			// Send error back to client
			socket.emit('error', {
				message: 'Failed to fetch leaderboard data',
				code: 'LEADERBOARD_ERROR'
			});
		}
	}

	socket.on('getLifetimeLeaderboard', getLifetimeLeaderboard);
}