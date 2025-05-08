// Frontend
import { useState, useEffect, useRef } from 'react';
import {
	Box,
	TextField,
	Button,
	Paper,
	Typography,
	List,
	ListItem,
	IconButton,
	Divider,
	Slide,
	Zoom,
	Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const ChatComponent = ({ socket, username, lobbyId }) => {
	const [message, setMessage] = useState('');
	const [chatHistory, setChatHistory] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const chatContainerRef = useRef(null);

	// Function to truncate username if longer than 25 characters
	const truncateUsername = (name) => {
		if (!name) return '';
		return name.length > 25 ? `${name.substring(0, 22)}...` : name;
	};

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		}

		// Increment unread count if chat is closed and message wasn't sent by current user
		if (!isOpen && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].username !== username) {
			setUnreadCount(prev => prev + 1);
		}
	}, [chatHistory]);

	// Reset unread count when opening chat
	useEffect(() => {
		if (isOpen) {
			setUnreadCount(0);
		}
	}, [isOpen]);

	// Listen for incoming messages
	useEffect(() => {
		if (!socket) return;

		const handleChatMessage = (data) => {
			setChatHistory((prev) => [...prev, data]);
		};

		socket.on('chat_message', handleChatMessage);

		return () => {
			socket.off('chat_message', handleChatMessage);
		};
	}, [socket]);

	async function sendChat(message) {
		if (!message.trim() || !socket) return;

		try {
			const chatData = {
				username,
				lobbyId,
				message: message.trim(),
			};

			socket.emit('send_message', chatData);
			setMessage(''); // Clear input after sending
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	}

	const handleSubmit = (e) => {
		e.preventDefault();
		sendChat(message);
	};

	const toggleChat = () => {
		setIsOpen(!isOpen);
	};

	return (
		<>
			{/* Chat toggle button (always visible) */}
			<Box
				sx={{
					position: 'fixed',
					right: isOpen ? 320 : 20,
					bottom: 20,
					zIndex: 1001,
					transition: 'right 0.3s ease'
				}}
			>
				<Zoom in={true}>
					<Button
						variant="contained"
						color="primary"
						onClick={toggleChat}
						startIcon={isOpen ? <KeyboardArrowRightIcon /> : <ChatIcon />}
						endIcon={!isOpen && unreadCount > 0 ?
							<Box component="span" sx={{
								bgcolor: 'error.main',
								color: 'white',
								borderRadius: '50%',
								width: 20,
								height: 20,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.75rem',
								fontWeight: 'bold'
							}}>
								{unreadCount}
							</Box> : null
						}
					>
						{isOpen ? 'Hide' : 'Chat'}
					</Button>
				</Zoom>
			</Box>

			{/* Chat panel */}
			<Slide direction="left" in={isOpen} mountOnEnter unmountOnExit>
				<Paper
					elevation={4}
					sx={{
						position: 'fixed',
						right: 20,
						bottom: 20,
						width: 300,
						height: 500,
						zIndex: 1000,
						display: 'flex',
						flexDirection: 'column',
						borderRadius: 2,
						overflow: 'hidden', // Ensure nothing spills out
						maxHeight: 'calc(100vh - 40px)', // Prevent cut-off at top/bottom of screen
					}}
				>
					<Box sx={{
						p: 1.5,
						backgroundColor: 'primary.main',
						color: 'primary.contrastText',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}}>
						<Typography variant="subtitle1">{`Game Chat - ${lobbyId}`}</Typography>
					</Box>

					<List
						ref={chatContainerRef}
						sx={{
							flex: 1,
							overflow: 'auto',
							p: 2,
							backgroundColor: 'background.paper'
						}}
					>
						{chatHistory.length === 0 ? (
							<Typography color="text.secondary" sx={{ textAlign: 'center', mt: 2, fontSize: '0.875rem' }}>
								No messages yet. Start the conversation!
							</Typography>
						) : (
							chatHistory.map((chat, index) => (
								<ListItem
									key={index}
									sx={{
										flexDirection: 'column',
										alignItems: chat.username === username ? 'flex-end' : 'flex-start',
										p: 0.5
									}}
								>
									<Box
										sx={{
											backgroundColor: chat.username === username ? 'primary.light' : 'grey.100',
											color: chat.username === username ? 'primary.contrastText' : 'text.primary',
											borderRadius: 2,
											p: 1,
											maxWidth: '80%',
											wordBreak: 'break-word' // Prevent long words from breaking layout
										}}
									>
										{chat.username !== 'System' && (
											<Tooltip title={chat.username.length > 25 ? chat.username : ""} arrow placement="top">
												<Typography variant="caption" sx={{
													display: 'block',
													mb: 0.5,
													overflow: 'hidden',
													textOverflow: 'ellipsis'
												}}>
													{truncateUsername(chat.username)}
												</Typography>
											</Tooltip>
										)}
										<Typography
											variant="body2"
											fontWeight={chat.username === 'System' ? 'medium' : 'regular'}
											fontStyle={chat.username === 'System' ? 'italic' : 'normal'}
										>
											{chat.message}
										</Typography>
									</Box>
								</ListItem>
							))
						)}
					</List>

					<Divider />

					<Box
						component="form"
						onSubmit={handleSubmit}
						sx={{
							p: 1.5,
							display: 'flex',
							backgroundColor: 'background.paper',
						}}
					>
						<TextField
							size="small"
							fullWidth
							placeholder="Type your message..."
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							variant="outlined"
							sx={{ mr: 1 }}
							inputProps={{ maxLength: 500 }}
						/>
						<Button
							type="submit"
							variant="contained"
							disabled={!message.trim()}
							sx={{ minWidth: 'unset', px: 1.5 }}
						>
							<SendIcon fontSize="small" />
						</Button>
					</Box>
				</Paper>
			</Slide>
		</>
	);
};

export default ChatComponent;