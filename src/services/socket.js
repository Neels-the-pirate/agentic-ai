import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to real-time server:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected from real-time server');
    });
  }

  return socketInstance;
};

export const joinExecutionRoom = (executionId) => {
  const socket = getSocket();
  if (socket && executionId) {
    socket.emit('join:execution', executionId);
  }
};

export const leaveExecutionRoom = (executionId) => {
  const socket = getSocket();
  if (socket && executionId) {
    socket.emit('leave:execution', executionId);
  }
};

export const joinUserRoom = (userId) => {
  const socket = getSocket();
  if (socket && userId) {
    socket.emit('join:user', userId);
  }
};
