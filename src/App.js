// =================
// Import statements
// ==================
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import socket from "./socket.js"; // Uses the existing socket
import { Button, Box, Paper, Typography, Card, CardContent, Hidden } from "@mui/material";
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, addDoc, setDoc, query, where, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WordSubmitForm from './components/WordSubmitForm.js';
import TimerComponent from './components/timerComponent.js';
import PlayerTurnIndicator from './components/playerTurnIndicator.js';
import PromptSelectorComponent from './components/PromptSelectorComponent.js';
import ImageAndGuesserComponent from './components/imageAndGuesserComponent.js';
import ScoreScreenComponent from './components/scoreScreenComponent.js';
import Header from './components/headerComponent.js';
import ChatComponent from './components/chatComponent.js';
import StuckComponent from './components/stuckComponent.js';

// <--BEGINNING OF REACT APP-->
function App() {

	// =====================
	// Socket Configurations
	// =====================
	const [isConnected, setIsConnected] = useState(socket.connected);

	useEffect(() => {
		socket.connect(); // Manually connects socket

		socket.on("connect", () => {
			console.log("🔌 Connected to WebSocket Server with ID:", socket.id);
		});

		socket.on("disconnect", () => {
			console.log("❌ Disconnected from WebSocket Server");
		});

		return () => {
			socket.disconnect(); // Cleanup on unmount
		};
	}, []);


	// ======================================================
	//  Firebase Auth Listener (Handles Session Persistence)
	// ======================================================
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				console.log("User session restored:", currentUser.email);
				setUser(currentUser);
			} else {
				console.log("No user signed in.");
				setUser(null);
				setPlayer(null);
			}
		});
		return () => unsubscribe();
	}, []);

	// ================
	//  Google Sign-in
	// ================
	const [user, setUser] = useState(null);
	const [player, setPlayer] = useState(null); // Store player data from Firestore

	// Listen for auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				console.log("User is signed in:", currentUser.displayName);
				setUser(currentUser);
				checkAndSetPlayer(currentUser, socket.id); // Pass socket ID
				console.log(socket.id);
			} else {
				console.log("No user signed in.");
				setUser(null);
				setPlayer(null);
			}
		});
		return () => unsubscribe();
	}, []);

	// Handle Google Sign-In
	const handleGoogleLogin = async () => {
		try {
			await signInWithPopup(auth, googleProvider);
			// onAuthStateChanged will update the state automatically
		} catch (error) {
			console.error("Error during sign in:", error);
		}
	};

	// ==============
	//  User Signout
	// ==============
	const handleSignOut = async () => {
		try {
			await signOut(auth); // Sign the user out
			console.log("User signed out successfully");
			setUser(null);
			setPlayer(null);
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	// ==========================
	//  Player Username Creation
	// ==========================
	const checkAndSetPlayer = async (currentUser, socketId) => {
		if (!currentUser || !socketId) return;
		console.log(socketId);

		const usersRef = collection(db, "players");

		try {
			// Check if the user already exists in Firestore
			const q = query(usersRef, where("email", "==", currentUser.email));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				// User exists, update their socket ID
				const playerDocRef = querySnapshot.docs[0].ref;
				await updateDoc(playerDocRef, { socketId });

				const updatedPlayer = { ...querySnapshot.docs[0].data(), socketId };
				setPlayer(updatedPlayer);
				return;
			}

			// If user doesn't exist, ask for a new username
			let username = null;
			while (!username) {
				username = prompt("Choose a unique username:");
				if (!username) return;

				// Check if the username is taken
				const usernameQuery = query(usersRef, where("username", "==", username));
				const usernameSnapshot = await getDocs(usernameQuery);

				if (!usernameSnapshot.empty) {
					alert("Username already taken. Try again.");
					username = null;
				}
			}

			// Create a new player object
			const newPlayer = {
				displayName: currentUser.displayName,
				email: currentUser.email,
				username: username,
				socketId, // Store the current session's socket ID
				lifetimeScore: 0 // Initialize their lifetime score for leaderboard
			};
			// Create a document reference with the email as the ID
			const userDocRef = doc(usersRef, currentUser.email);

			// Save to Firestore
			await setDoc(userDocRef, newPlayer);
			setPlayer(newPlayer);
		} catch (error) {
			console.error("Error checking/setting player:", error);
		}
	};

	// ==============================
	//  Update Socket ID on Refresh
	// ==============================
	useEffect(() => {
		socket.on("connect", () => {
			if (user) {
				checkAndSetPlayer(user, socket.id);
			}
		});

		return () => socket.off("connect"); // Cleanup
	}, [user]); // Runs when `user` changes



	// =========================
	//  Frontend User Functions
	// =========================
	const [lobbyId, setLobbyId] = useState(null); // Store lobby ID in state
	const [players, setPlayers] = useState([]); // Store connected players
	const [inLobby, setInLobby] = useState(false); // Track if user is in a lobby
	const [startingGame, setStartingGame] = useState(false); //Track if the game is started for counter
	const [countdown, setCountdown] = useState(3); // Start at 3
	const [isHost, setIsHost] = useState(false);
	const [beforeStart, setBeforeStart] = useState(true);

	const handleCreateLobby = () => {
		console.log("Create Lobby Pressed.");
		socket.emit("createLobby", { player: user.email });

		socket.on("lobbyCreated", (data) => {
			console.log("Lobby Created with ID: " + data.lobbyId);
			setLobbyId(data.lobbyId);
			setPlayers([user.email]); // Add the host as the first player
			setInLobby(true); // Switch UI to lobby screen
			setIsHost(true);

			listenForLobbyUpdates(data.lobbyId);
		})
	};

	// Real-time listener for lobby updates
	const listenForLobbyUpdates = async (lobbyId) => {
		const lobbyRef = query(collection(db, "lobbies"), where("lobbyId", "==", lobbyId));

		onSnapshot(lobbyRef, (snapshot) => {
			snapshot.forEach((doc) => {
				const lobbyData = doc.data();
				console.log("Lobby Updated:", lobbyData);
				setPlayers(lobbyData.players);
			});
		});
		console.log("User email for event listener:", user.email);
		socket.on("youAreNewHost", (data) => {
			console.log(data.message);
			setIsHost(true);
		});
	};

	const handleJoinLobby = () => {
		// Use prompt to get the lobby ID from the user
		const lobbyId = prompt("Enter Game Lobby ID:");
		if (lobbyId != null) {
			console.log("Joining lobby with ID:", lobbyId);
			socket.emit("joinLobby", { lobbyId, player: user.email });
			socket.off("lobbyJoined_FAIL");
		} else {
			console.log("No Lobby ID provided.");
			alert("No Lobby ID provided.");
		}
		socket.on("lobbyJoined_SUCCESS", (data) => {
			console.log(data.message);
			setInLobby(true);
			setLobbyId(data.lobbyId)
			listenForLobbyUpdates(data.lobbyId);
		})
		socket.on("lobbyJoined_FAIL", (data) => {
			console.log(data.message);
			alert(data.message);
		})
	};

	const handleLeaveGame = () => {
		//Remove player from the lobby, if host and only 1 player, delete lobby!
		socket.emit("removePlayer", { lobbyId, player: user.email });
		setInLobby(false);
		setIsHost(false);
		setLobbyId([""]);
		socket.on("leaveLobby_SUCCESS", (data) => {
			console.log(data.message);
		})
		socket.on("leaveLobby_FAIL", (data) => {
			console.log(data.message);
		})
		socket.on("lobbyClosed", (data) => {
			console.log(data.message);
		})
		setGameInProgress(false);
		setBeforeStart(true); //Return the start game button to the ui
	}

	const GameStarter = () => {
		//Function for hosts to occur when they have clicked start game, alerts other players.
		const navigate = useNavigate();

		const startGame = () => {
			setStartingGame(true);
			socket.emit("hostStartGame", { lobbyId });
			// navigate('/game'); 
			setBeforeStart(false); // Remove start button from screen.
			setGameInProgress(true); // Game set in progress show game visuals.
		};

		return (
			<div>
				<Button variant="contained" style={{ backgroundColor: 'green' }} onClick={startGame}>
					Start Game
				</Button>
			</div>
		);
	};

	const GameListener = () => {
		//Function for non-hosts to know when their game has started.
		const navigate = useNavigate(); // Get the navigate function

		useEffect(() => {
			// Listen for "startGame" event from the server
			socket.on("startGame", (data) => {
				console.log("Game starting:", data.message);
				setGameInProgress(true); // Game set in progress show game visuals.
				// navigate("/game"); // Navigate to the Game page
				socket.emit('nameRetrieval', { message: lobbyId });
			});

			// Cleanup the event listener when the component unmounts
			return () => {
				socket.off("startGame");
			};
		}, [navigate]); // Dependency array ensures it runs once

		return null; // This component doesn’t render anything
	};

	// Function to handle page unload (refresh/close)
	const handleUnload = () => {
		// Emit the "leaveLobby" event to the backend when the page is unloaded
		handleLeaveGame();
		setTimeout(() => {
			window.location.reload(); // Reload the page after emitting socket
		}, 3000); // 1-second delay
	};

	useEffect(() => {
		// Set up event listener for page unload (refresh or close)
		window.addEventListener('unload', handleUnload);

		// Clean up listener when component is unmounted
		return () => {
			window.removeEventListener('unload', handleUnload);
		};
	}, []);

	// =============================================
	// Game Started Variable (Display Game Visuals)
	// =============================================
	const [gameInProgress, setGameInProgress] = useState(false);
	//useState hook for tracking player turn
	const [yourTurn, setYourTurn] = useState(false);
	//useState hook for wordbank submission time
	const [submitTime, setSubmitTime] = useState(false);
	//useState hook for showing art image
	const [artTime, setArtTime] = useState(false);
	//useState for showing current player (to be passed to playerTurnIndicatorComponent)
	const [currentPlayer, setCurrentPlayer] = useState("");

	//Unused useEffect() for retrievalNames
	useEffect(() => {
		// Listen for player names from the backend
		socket.on("sentNames", (data) => {
			console.log("Received player names:", data);
		});

		return () => {
			socket.off("sentNames"); // Cleanup event listener when component unmounts
		};
	}, []);

	//UseEffect() for beginning word input
	useEffect(() => {
		socket.on("beginWordInput", (data) => {
			console.log(data);
			setSubmitTime(true);
		});
	}, []);

	//UseEffect() for stopping word input
	const lobbyIdRef = useRef(null);
	const isHostRef = useRef(null);

	// Keep ref in sync
	useEffect(() => {
		lobbyIdRef.current = lobbyId;
	}, [lobbyId]);
	useEffect(() => {
		isHostRef.current = isHost;
	}, [isHost]);

	useEffect(() => {
		const handleStopWordInput = (data) => {
			console.log(data);
			setSubmitTime(false);
			if (lobbyIdRef.current) {
				console.log(lobbyIdRef.current);
				if (isHostRef.current == true) {
					socket.emit("getPlayerTurn", { lobbyId: lobbyIdRef.current });
				}
			} else {
				console.error("lobbyId is not set!");
			}
		};

		socket.on("stopWordInput", handleStopWordInput);

		return () => {
			socket.off("stopWordInput", handleStopWordInput);
		};
	}, []); // listener only gets added once


	//UseEffect() for stopping word input
	const userEmailRef = useRef(null);

	useEffect(() => {
		if (user && user.email) {
			userEmailRef.current = user.email;
		}
	}, [user]); // Re-run when the entire user object changes

	useEffect(() => {
		if (!user) return;  // If user is null, do not proceed

		const handleYourTurn = (data) => {
			console.log(data.message);
			if (userEmailRef.current) {
				socket.emit("turnReceived", { player: userEmailRef.current });
				socket.emit("timeForPromptCreation", { lobbyId: lobbyIdRef.current })
			} else {
				console.warn("User email is undefined");
			}
		};

		socket.on("yourTurn", handleYourTurn);

		// Cleanup when the component is unmounted or user changes
		return () => {
			socket.off("yourTurn", handleYourTurn);
		};
	}, [user]); // Re-run the effect when the entire user object changes


	const handleWordSubmit = (word, lobbyId) => {
		socket.emit("submitWord", { word, lobbyId }); // Send both to backend
	};

	//<--BEGINNING OF WEBPAGE UI-->
	return (
		<div className="App" >
			<header className="App-header">
				<Header user={user} />
			</header>
			<main>
				{/*-------------------- LOBBY FEATURES BEGIN --------------------*/}
				{user ? (
					inLobby ? (
						// Show lobby screen if user is in a lobby
						<Box
							sx={{
								backgroundColor: "#1e1e1e",
								color: "#ffffff",
								padding: 4,
								borderRadius: 4,
								boxShadow: 3,
								textAlign: "center",
								width: "90%",
								maxWidth: "500px",
								margin: "auto",
								mt: 5,
							}}
						>
							<Typography variant="h5" gutterBottom>
								Lobby ID: <strong>{lobbyId}</strong>
							</Typography>
							<Typography variant="h6" gutterBottom>
								Connected Players:
							</Typography>
							<Box component="ul" sx={{ listStyle: "none", padding: 0 }}>
								{players.map((player, index) => (
									<Box component="li" key={index} sx={{ mb: 1 }}>
										{index === 0 ? "(Host)👑 " : ""}
										{player}
									</Box>
								))}
							</Box>
							{isHost && beforeStart && !gameInProgress && <GameStarter />}
							<GameListener />
							<Button
								variant="contained"
								color="secondary"
								onClick={handleLeaveGame}
								sx={{ mt: 3 }}
							>
								Leave Lobby
							</Button>
						</Box>
					) : (
						// Show main menu if not in a lobby
						<Box
							sx={{
								backgroundColor: "#1e1e1e",
								color: "#ffffff",
								padding: 4,
								borderRadius: 4,
								boxShadow: 3,
								textAlign: "center",
								width: "90%",
								maxWidth: "500px",
								margin: "auto",
								mt: 5,
							}}
						>
							<Typography variant="h5" gutterBottom>
								Welcome, {user.displayName}!
							</Typography>
							<Button
								variant="contained"
								color="primary"
								onClick={handleCreateLobby}
								sx={{ mt: 2, width: "80%" }}
							>
								Create Lobby
							</Button>
							<Button
								variant="contained"
								color="secondary"
								onClick={handleJoinLobby}
								sx={{ mt: 2, width: "80%" }}
							>
								Join Lobby
							</Button>
							<Button
								variant="outlined"
								color="inherit"
								onClick={handleSignOut}
								sx={{ mt: 2, width: "80%" }}
							>
								Sign Out
							</Button>
						</Box>
					)
				) : (
					// Show login button if user is not signed in
					<Box sx={{ textAlign: "center", mt: 5 }}>
						<Button variant="contained" onClick={handleGoogleLogin}>
							Sign in with Google
						</Button>
					</Box>
				)}
				{/*-------------------- LOBBY FEATURES END --------------------*/}

				{/*-------------------- GAME FEATURES BEGIN --------------------*/}
				<Box
					sx={{
						flexGrow: 1,
						width: "100%",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						padding: 2,
					}}
				>
					{gameInProgress && submitTime ? (
						<Box
							sx={{
								width: "100%",
								maxWidth: 700,
								backgroundColor: "#1e1e1e",
								border: "2px solid #333",
								borderRadius: 4,
								padding: 4,
								boxShadow: 3,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 2,
							}}
						>
							<WordSubmitForm onSubmit={handleWordSubmit} lobbyId={lobbyId} />
							<TimerComponent
								submitTime={submitTime}
								lobbyId={lobbyId}
								handleWordSubmit={handleWordSubmit}
								socket={socket}
							/>
						</Box>
					) : ("")}
				</Box>
				{gameInProgress && !submitTime ? (
					<Box
						sx={{
							height: "100vh",
							width: "100vw",
							maxWidth: "90%",
							backgroundColor: "#121212",
							display: "flex",
							flexDirection: "column",
							justifyContent: "flex-start",
							alignItems: "center",
							padding: 3,
							overflowY: "auto",
							overFlowX: "hidden",
							willChange: "scroll-position",
							marginTop: 4,
							marginLeft: 10,
							marginBottom: 4,
							paddingBottom: 4,
							border: "2px solid #fff",  // Adds a white border around the box
							borderRadius: "8px",  // Optional: adds rounded corners to the border
							boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.95)", // Much more intensive shadow
						}}
					>
						{
							<PlayerTurnIndicator setCurrentPlayer={(setCurrentPlayer)} currentPlayer= {(currentPlayer)} socket={socket} />
						}
						{
							<ImageAndGuesserComponent currentPlayer= {(currentPlayer)} 
							socket={(socket)} lobbyId={lobbyId} playerEmail={userEmailRef.current}>
							</ImageAndGuesserComponent>
						}
						{
							<PromptSelectorComponent socket={(socket)} lobbyId={lobbyId} />
						}
						{
							<ScoreScreenComponent socket={(socket)} lobbyId={lobbyId} isHost={isHost} />
						}
						{
							<ChatComponent socket={(socket)} lobbyId={lobbyId} username={userEmailRef.current} />
						}
						{
							<StuckComponent socket={(socket)} lobbyId={lobbyId} isHost={isHost} />
						}
					</Box>
				) : ("")}
				{/*-------------------- GAME FEATURES END --------------------*/}
			</main>
		</div>
	);
	//<-- END OF WEBPAGE UI -->
}
// <--END OF REACT APP-->

export default App;