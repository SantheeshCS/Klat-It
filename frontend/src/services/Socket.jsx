import io from 'socket.io-client';
class SocketService 
{
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }
  connect(token) 
  {

    if (this.socket && this.isConnected) {
      return this.socket;
    }
    console.log('🟡 [FRONTEND] Connecting to socket...');
    this.socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token
      }
    });
    this.socket.on('connect', () => {
      console.log('✅ [FRONTEND] Socket connected successfully, ID:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 [FRONTEND] Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [FRONTEND] Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('receive_message', (message) => {
      console.log('🟢 [FRONTEND] receive_message event received:', message);
    });

    return this.socket;
  }

  emitUserOnline(userId) {
    if (this.socket) {
      this.socket.emit('user_online', userId);
    }
  }

  onUserStatus(callback) {
    if (!this.socket) return;
    this.socket.on('user_status', callback);
  }

  offUserStatus(callback) {
    if (!this.socket) return;
    this.socket.off('user_status', callback);
  }

  disconnect() {
    if (this.socket) {
      console.log('🟡 [FRONTEND] Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket()
  {
    return this.socket;
  }
  isConnected()
  {
    return this.isConnected;
  }
}

export default new SocketService();