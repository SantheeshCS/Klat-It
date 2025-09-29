import React from 'react';
import './UserList.css';

const UserList = ({ users, selectedUser, onUserSelect }) => {
  return (
    <div className="user-list">
      {users.map(user => (
        <div
          key={user._id}
          className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
          onClick={() => onUserSelect(user)}
        >
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="username">{user.username}</div>
            <div className={`user-status ${user.isOnline ? 'online' : 'offline'}`}>
              {user.isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserList;