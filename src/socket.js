import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000"; // Change this to your backend URL

const socket = io(SOCKET_SERVER_URL, {
	autoConnect: false, // Prevents auto-reconnect issues
	withCredentials: true, // Allows cross-origin cookies
});

export default socket;