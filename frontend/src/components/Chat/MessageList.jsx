import React, { useEffect, useRef } from 'react';
import './MessageList.css';
const MessageList = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };


  const isCurrentUser = (message) => {
    if (!message || !message.sender) return false;
    
    if (typeof message.sender === 'string') {
      return message.sender === currentUser.id;
    } else if (message.sender._id) {
      return message.sender._id === currentUser.id;
    } else if (message.sender.toString() === currentUser.id) {
      return true;
    }
    
    return false;
  };


  const getSenderName = (message) => {
    if (!message.sender) return 'Unknown';
    
    if (typeof message.sender === 'string') {
      return 'You'; 
    } else if (message.sender.username) {
      return message.sender.username;
    }
    
    return 'Unknown';
  };

  console.log('Messages in MessageList:', messages); 

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="no-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isSent = isCurrentUser(message);
          const senderName = getSenderName(message);
          
          return (
            <div
              key={message._id || index}
              className={`message ${isSent ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{message.content}</p>
                <span className="message-time">
                  {formatTime(message.timestamp)}
                  {!isSent && senderName !== 'You' && (
                    <span className="sender-name"> • {senderName}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;