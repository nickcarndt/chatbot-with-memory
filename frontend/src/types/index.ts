export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string; // Changed from timestamp to created_at to match backend
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  messages: Message[];
}

export interface CreateConversationRequest {
  title?: string;
}

export interface SendMessageRequest {
  role: 'user' | 'assistant';
  content: string;
}