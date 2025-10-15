import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../types';
import { conversationAPI } from '../services/api';
import ChatMessage from './ChatMessage';
import ConversationList from './ConversationList';
import './ChatInterface.css';

const ChatInterface: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await conversationAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const clearAllConversations = async () => {
    if (!window.confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
      return;
    }
    
    try {
      await conversationAPI.clearAllConversations();
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      alert('All conversations cleared successfully!');
    } catch (error) {
      console.error('Error clearing conversations:', error);
      alert('Failed to clear conversations. Please try again.');
    }
  };

  const createNewConversation = async () => {
    try {
      const newConversation = await conversationAPI.createConversation({
        title: 'New Conversation'
      });
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    try {
      const conversationData = await conversationAPI.getConversation(conversation.id);
      setMessages(conversationData.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await conversationAPI.sendMessage(currentConversation.id, {
        role: 'user',
        content: inputMessage
      });

      // The backend returns the assistant message, not the user message
      const assistantMessage: Message = {
        id: response.id,
        role: response.role,
        content: response.content,
        created_at: response.created_at
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-interface">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Chatbot with Memory 🚀</h2>
          <div className="button-group">
            <button onClick={createNewConversation} className="new-conversation-btn">
              + New Chat
            </button>
            <button onClick={clearAllConversations} className="clear-history-btn">
              🗑️ Clear All
            </button>
          </div>
        </div>
        <ConversationList
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={selectConversation}
        />
      </div>

      <div className="chat-main">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <h3>{currentConversation.title}</h3>
            </div>
            <div className="messages-container">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="message assistant-message">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                rows={1}
              />
              <button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="welcome-screen">
            <h2>Welcome to Chatbot with Memory</h2>
            <p>Start a new conversation or select an existing one from the sidebar.</p>
            <button onClick={createNewConversation} className="start-chat-btn">
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
