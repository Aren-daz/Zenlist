import { Server } from 'socket.io';

let ioInstance: Server | null = null

export const setupSocket = (io: Server) => {
  ioInstance = io
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Rooms par projet
    socket.on('project:join', ({ projectId }: { projectId: string }) => {
      if (projectId) socket.join(`project:${projectId}`)
    })

    // Indicateur de frappe
    socket.on('project:typing', ({ projectId, userId, name, isTyping }: { projectId: string; userId: string; name?: string; isTyping: boolean }) => {
      if (!projectId || !userId) return
      socket.to(`project:${projectId}`).emit('project:typing', { userId, name, isTyping })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

export const getIO = () => ioInstance