import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { ownerAPI } from '../utils/api';

function Chat({ roomId, currentUserId, currentUserName, otherUserName }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Load chat history
    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                const response = await ownerAPI.getChatHistory(roomId);

                if (response.data.success) {
                    const history = response.data.history.map(msg => ({
                        id: msg.id,
                        text: msg.text,
                        senderId: msg.senderId,
                        senderName: msg.senderName,
                        timestamp: msg.timestamp
                    }));
                    setMessages(history);
                }
            } catch (error) {
                console.error("error when download history chat:", error);
            }
        };

        if (roomId) {
            loadChatHistory();
        }
    }, [roomId]);

    // Connect Socket.io
    useEffect(() => {
        const token = localStorage.getItem('token');
        socketRef.current = io('http://localhost:5000', {
            auth: { token }
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
            socketRef.current.emit('join_room', roomId);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from socket server');
            setIsConnected(false);
        });

        socketRef.current.on('receive_message', (data) => {
            setMessages((prevMessages) => [...prevMessages, {
                id: Date.now(),
                text: data.message,
                senderId: data.senderId,
                senderName: data.senderName,
                timestamp: data.timestamp
            }]);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !isConnected) return;

        const messageData = {
            room: roomId,
            message: inputMessage.trim(),
            senderId: currentUserId,
            senderName: currentUserName,
            timestamp: new Date().toISOString()
        };

        socketRef.current.emit('send_message', messageData);
        setInputMessage('');
    };

    return (
        <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
                <div>
                    <h3 style={styles.chatTitle}>💬 Chat with {otherUserName}</h3>
                    <div style={styles.connectionStatus}>
                        <span style={isConnected ? styles.statusOnline : styles.statusOffline}>
                            {isConnected ? '● Online' : '● Offline'}
                        </span>
                    </div>
                </div>
            </div>

            <div style={styles.messagesArea}>
                {messages.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>👋 No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} style={msg.senderId === currentUserId ? styles.messageRight : styles.messageLeft}>
                            <div style={msg.senderId === currentUserId ? styles.bubbleRight : styles.bubbleLeft}>
                                <div style={styles.messageSender}>{msg.senderName}</div>
                                <div style={styles.messageText}>{msg.text}</div>
                                <div style={styles.messageTime}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={styles.inputArea}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    style={styles.input}
                    disabled={!isConnected}
                />
                <button type="submit" style={styles.sendButton} disabled={!isConnected || !inputMessage.trim()}>
                    Send ➤
                </button>
            </form>
        </div>
    );
}

const styles = {
    chatContainer: { display: 'flex', flexDirection: 'column', height: '600px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' },
    chatHeader: { padding: '20px', backgroundColor: '#2196F3', color: 'white', borderBottom: '2px solid #1976D2' },
    chatTitle: { margin: 0, fontSize: '18px' },
    connectionStatus: { marginTop: '5px', fontSize: '12px' },
    statusOnline: { color: '#4CAF50' },
    statusOffline: { color: '#f44336' },
    messagesArea: { flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f5f5f5' },
    emptyState: { textAlign: 'center', color: '#999', marginTop: '50px' },
    messageLeft: { display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' },
    messageRight: { display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' },
    bubbleLeft: { maxWidth: '70%', padding: '12px 16px', backgroundColor: '#fff', borderRadius: '15px 15px 15px 5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    bubbleRight: { maxWidth: '70%', padding: '12px 16px', backgroundColor: '#2196F3', color: 'white', borderRadius: '15px 15px 5px 15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    messageSender: { fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 },
    messageText: { fontSize: '15px', lineHeight: '1.4', wordWrap: 'break-word' },
    messageTime: { fontSize: '11px', marginTop: '6px', opacity: 0.7 },
    inputArea: { display: 'flex', padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #ddd' },
    input: { flex: 1, padding: '12px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '25px', outline: 'none', marginRight: '10px' },
    sendButton: { padding: '12px 25px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }
};

export default Chat;