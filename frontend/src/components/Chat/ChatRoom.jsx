import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/Socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import { authAPI } from '../../services/api';
import './ChatRoom.css';

const ChatRoom = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const { user, logout } = useAuth();
  const socketRef = useRef();

  useEffect(() => {
    console.log('🟡 [ChatRoom] Component mounted, user:', user);
    
    const token = localStorage.getItem('token');
    console.log('🟡 [ChatRoom] Token exists:', !!token);
    
    socketRef.current = socketService.connect(token);
    const socket = socketRef.current;
    loadUsers();

    // announce presence when connected
    socket.on('connect', () => {
      console.log('✅ [ChatRoom] Socket connected event received');
      setSocketConnected(true);
      if (user?.id) {
        socketService.emitUserOnline(user.id);
      }
      if (currentRoom) {
        console.log('🟡 [ChatRoom] Re-joining room after reconnect:', currentRoom);
        socket.emit('join_room', currentRoom);
      }
    });
    socket.on('receive_message', (message) => {
      console.log('🟢 [ChatRoom] receive_message event - New message:', message);
      console.log('🟢 [ChatRoom] Current messages before update:', messages);
      setMessages(prev => {
        const newMessages = [...prev, message];
        console.log('🟢 [ChatRoom] Messages after update:', newMessages);
        return newMessages;
      });
    });

    // update users list on presence changes
    const handleUserStatus = ({ userId, isOnline }) => {
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline } : u));
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(prev => prev ? { ...prev, isOnline } : prev);
      }
    };
    socketService.onUserStatus(handleUserStatus);

    socket.on('disconnect', () => {
      console.log('🔴 [ChatRoom] Socket disconnected event received');
      setSocketConnected(false);
    });

    return () => {
      console.log('🟡 [ChatRoom] Component unmounting, cleaning up...');
      if (socketRef.current) {
        socketService.offUserStatus(handleUserStatus);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const loadUsers = async () => {
    try {
      console.log('🟡 [ChatRoom] Loading users...');
      const response = await authAPI.getUsers();
      const filteredUsers = response.data.filter(u => u._id !== user.id);
      console.log('✅ [ChatRoom] Users loaded:', filteredUsers.length);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('❌ [ChatRoom] Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (selectedUser) => {
    console.log('🟡 [ChatRoom] User selected:', selectedUser);
    setSelectedUser(selectedUser);
    const room = [user.id, selectedUser._id].sort().join('_');
    console.log('🟡 [ChatRoom] Room ID:', room);
    setCurrentRoom(room);
    if (socketRef.current) {
      console.log('🟡 [ChatRoom] Joining room:', room);
      socketRef.current.emit('join_room', room);
      socketRef.current.once('joined_room', (roomName) => {
        console.log('✅ [ChatRoom] Successfully joined room:', roomName);
      });
    }
    await loadMessages(room);
  };

  const loadMessages = async (room) => {
    try {
      console.log('🟡 [ChatRoom] Loading messages for room:', room);
      const response = await fetch(`http://localhost:4000/api/messages/${room}`);
      if (response.ok) {
        const messagesData = await response.json();
        console.log('✅ [ChatRoom] Messages loaded:', messagesData.length);
        setMessages(messagesData);
      } else {
        console.error('❌ [ChatRoom] Failed to load messages, status:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ [ChatRoom] Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = (content) => {
  console.log('🟡 [ChatRoom] sendMessage called with:', content);

  if (!selectedUser || !content.trim()) {
    return;
  }

  if (!socketRef.current || !socketRef.current.connected) {
    console.error('❌ [ChatRoom] Socket not connected');
    return;
  }

  const room = [user.id, selectedUser._id].sort().join('_');
  const messageData = {
    room: room,
    sender: user.id,
    content: content.trim(),
    timestamp: new Date()
  };

  console.log('🟡 [ChatRoom] Emitting send_message via socket');
  socketRef.current.emit('send_message', messageData);
};

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="chat-room">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3 className="clat">Klat-it</h3>
          <div className="connection-status">
            <span className={`status-dot ${user && socketConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="current-username">{user.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
        <UserList 
          users={users} 
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
        />
      </div>
      
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="user-avatar-small">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedUser.username}</h3>
                  <span className={`status ${selectedUser.isOnline ? 'online' : 'offline'}`}>
                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="messages-container">
              <MessageList 
                messages={messages}
                currentUser={user}
              />
            </div>
            
            <MessageInput onSendMessage={sendMessage} />
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a user to start chatting</h3>
            <p>Choose a user from the sidebar to begin your conversation</p>
            <div className="debug-info">
              <p>Users loaded: {users.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;