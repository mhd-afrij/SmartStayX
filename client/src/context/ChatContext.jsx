import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ChatService from '../services/ChatService';
import { useAppContext } from './AppContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { getToken } = useAuth();
  const { selectedLanguage, languageOptions } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const streamRef = useRef(false);

  const getLanguageName = useCallback((code) => {
    const matched = languageOptions.find((item) => item.code === code);
    return matched?.label || matched?.name || code || 'English';
  }, [languageOptions]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setUnreadCount(0);
  }, [isOpen]);

  const setOpen = useCallback((open) => {
    setIsOpen(open);
    if (open) setUnreadCount(0);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await ChatService.listConversations(getToken);
      if (res?.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch {
      // silently fail
    }
  }, [getToken]);

  const loadConversation = useCallback(async (conversationId) => {
    try {
      const res = await ChatService.getConversation(conversationId, getToken);
      if (res?.success && res.data) {
        setActiveConversationId(res.data.id);
        setMessages(res.data.messages || []);
      }
    } catch {
      setError('Failed to load conversation');
    }
  }, [getToken]);

  const createConversation = useCallback(async () => {
    try {
      const res = await ChatService.createConversation(getToken, selectedLanguage, getLanguageName(selectedLanguage));
      if (res?.success && res.data) {
        setActiveConversationId(res.data.id);
        setMessages([]);
        setError(null);
        loadConversations();
        return res.data.id;
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'AI service is not running';
      setError(msg);
    }
    return null;
  }, [getToken, loadConversations, selectedLanguage, getLanguageName]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setStreamingContent('');

    const userMessage = { role: 'user', content, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      if (streamRef.current) {
        setIsLoading(false);
        return;
      }

      let convId = activeConversationId;

      if (!convId) {
        convId = await createConversation();
        if (!convId) return;
      }

      streamRef.current = true;
      let fullContent = '';

      await ChatService.sendMessageStream(
        content,
        convId,
        getToken,
        (token) => {
          fullContent += token;
          setStreamingContent(fullContent);
        },
        () => {
          const assistantMessage = {
            role: 'assistant',
            content: fullContent,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent('');
          setIsLoading(false);
          streamRef.current = false;
          loadConversations();
        },
        (err) => {
          setError(err.message || 'Failed to get response');
          setIsLoading(false);
          streamRef.current = false;

          const assistantMessage = {
            role: 'assistant',
            content: streamingContent || 'I apologize, but I encountered an error. Please try again.',
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent('');
        },
        selectedLanguage,
        getLanguageName(selectedLanguage)
      );
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      streamRef.current = false;
    }
  }, [activeConversationId, isLoading, getToken, createConversation, loadConversations, streamingContent, selectedLanguage, getLanguageName]);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await ChatService.deleteConversation(conversationId, getToken);
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    } catch {
      setError('Failed to delete conversation');
    }
  }, [activeConversationId, getToken]);

  const startNewChat = useCallback(async () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, []);

  const value = {
    isOpen,
    setIsOpen: setOpen,
    toggleOpen,
    conversations,
    activeConversationId,
    messages,
    isLoading,
    streamingContent,
    error,
    unreadCount,
    loadConversations,
    loadConversation,
    createConversation,
    sendMessage,
    deleteConversation,
    startNewChat,
    setActiveConversationId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
