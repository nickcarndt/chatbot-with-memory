import axios from 'axios';
import { Conversation, CreateConversationRequest, SendMessageRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const conversationAPI = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/conversations/');
    return response.data;
  },

  // Create a new conversation
  createConversation: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await api.post<Conversation>('/conversations/', data);
    return response.data;
  },

  // Get a specific conversation
  getConversation: async (id: number): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (id: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/conversations/${id}/messages`);
    return response.data;
  },

  // Send a message
  sendMessage: async (conversationId: number, data: SendMessageRequest): Promise<any> => {
    const response = await api.post<any>(`/conversations/${conversationId}/messages`, data);
    return response.data;
  },

  // Clear all conversations
  clearAllConversations: async (): Promise<void> => {
    await api.delete('/conversations/');
  },

  // Delete a specific conversation
  deleteConversation: async (id: number): Promise<void> => {
    await api.delete(`/conversations/${id}`);
  },
};

export default api;
