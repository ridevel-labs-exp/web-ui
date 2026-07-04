import api from './api';
import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const telemetryService = {
  // Mock Driver GPS Ingestion over HTTP
  sendMockLocation: async (driverId, latitude, longitude, isAvailable) => {
    const response = await api.post('/api/telemetry/location', {
      driverId,
      latitude,
      longitude,
      isAvailable,
    });
    return response.data;
  },

  // Get current location from cache
  getCachedLocation: async (driverId) => {
    const response = await api.get(`/api/telemetry/location/${driverId}`);
    return response.data;
  },

  // WebSocket Live Tracker connection utilizing SockJS and STOMP
  createLiveTracker: (driverId, onLocationReceived) => {
    // Establish connection endpoint (SockJS transport)
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
    });

    stompClient.onConnect = (frame) => {
      console.log('STOMP Connected successfully:', frame);
      
      // Subscribe to individual driver coordinate updates
      stompClient.subscribe(`/topic/driver-location/${driverId}`, (message) => {
        if (message.body) {
          try {
            const data = JSON.parse(message.body);
            onLocationReceived(data);
          } catch (e) {
            console.error('Failed to parse telemetry message payload', e);
          }
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();

    return {
      disconnect: () => {
        if (stompClient.active) {
          stompClient.deactivate();
          console.log('STOMP Disconnected successfully');
        }
      }
    };
  }
};
