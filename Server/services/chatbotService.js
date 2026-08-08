import axios from 'axios';
import logger from '../utils/logger.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class ChatbotService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: 10000,
    });
  }

  _logError(method, error) {
    const details = {
      message: error.message,
      code: error.code,
      errno: error.errno,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      },
    };
    logger.error(`Chatbot service error (${method}): ${JSON.stringify(details)}`);
  }

  async createConversation(userId) {
    try {
      const { data } = await this.client.post(
        '/api/chat/conversations',
        {},
        { headers: { 'x-user-id': userId } }
      );
      return data;
    } catch (error) {
      this._logError('createConversation', error);
      throw new Error(`AI service unavailable: ${error.code || error.message || 'connection refused'}`);
    }
  }

  async listConversations(userId, limit = 20) {
    try {
      const { data } = await this.client.get('/api/chat/conversations', {
        headers: { 'x-user-id': userId },
        params: { limit },
      });
      return data;
    } catch (error) {
      this._logError('listConversations', error);
      throw new Error(`AI service unavailable: ${error.code || error.message || 'connection refused'}`);
    }
  }

  async getConversation(conversationId) {
    try {
      const { data } = await this.client.get(`/api/chat/conversations/${conversationId}`);
      return data;
    } catch (error) {
      this._logError('getConversation', error);
      throw new Error(`AI service unavailable: ${error.code || error.message || 'connection refused'}`);
    }
  }

  async deleteConversation(conversationId) {
    try {
      const { data } = await this.client.delete(`/api/chat/conversations/${conversationId}`);
      return data;
    } catch (error) {
      this._logError('deleteConversation', error);
      throw new Error(`AI service unavailable: ${error.code || error.message || 'connection refused'}`);
    }
  }

  async sendMessage(message, conversationId, userId) {
    try {
      const { data } = await this.client.post(
        '/api/chat/message',
        { message, conversationId },
        { headers: { 'x-user-id': userId } }
      );
      return data;
    } catch (error) {
      this._logError('sendMessage', error);
      throw new Error(`AI service unavailable: ${error.code || error.message || 'connection refused'}`);
    }
  }

  getMessageStreamUrl() {
    return `${AI_SERVICE_URL}/api/chat/message/stream`;
  }

  async planTrip(payload, userId) {
    try {
      const { data } = await this.client.post(
        '/api/trip-planner',
        payload,
        { headers: { 'x-user-id': userId } }
      );
      return data;
    } catch (error) {
      this._logError('planTrip', error);
      throw new Error(`AI service unavailable: ${error.code || error.message || 'connection refused'}`);
    }
  }

  async isHealthy() {
    try {
      const { data } = await this.client.get('/api/health', { timeout: 3000 });
      return data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

export default new ChatbotService();
