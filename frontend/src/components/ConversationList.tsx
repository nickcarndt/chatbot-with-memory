import React from 'react';
import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation
}) => {
  // Debug: Log conversations to see what titles are being received
  console.log('ConversationList - conversations:', conversations);
  console.log('ConversationList - conversation titles:', conversations.map(c => ({ id: c.id, title: c.title })));
  
  return (
    <div className="conversation-list">
      {conversations.length === 0 ? (
        <div className="no-conversations">
          <p>No conversations yet</p>
          <p>Start a new chat to begin!</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`conversation-item ${
              currentConversation?.id === conversation.id ? 'active' : ''
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="conversation-title">{conversation.title}</div>
            <div className="conversation-date">
              {new Date(conversation.created_at).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ConversationList;
