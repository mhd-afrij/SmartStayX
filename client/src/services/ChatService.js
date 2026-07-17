import axios from 'axios';

const getAuthHeaders = async (getToken) => {
  try {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

class ChatService {
  async createConversation(getToken, language, languageName) {
    const headers = await getAuthHeaders(getToken);
    const { data } = await axios.post(
      '/api/chatbot/conversations',
      { language, languageName },
      { headers }
    );
    return data;
  }

  async listConversations(getToken, limit = 20) {
    const headers = await getAuthHeaders(getToken);
    const { data } = await axios.get('/api/chatbot/conversations', {
      headers,
      params: { limit },
    });
    return data;
  }

  async getConversation(conversationId, getToken) {
    const headers = await getAuthHeaders(getToken);
    const { data } = await axios.get(`/api/chatbot/conversations/${conversationId}`, { headers });
    return data;
  }

  async deleteConversation(conversationId, getToken) {
    const headers = await getAuthHeaders(getToken);
    const { data } = await axios.delete(`/api/chatbot/conversations/${conversationId}`, { headers });
    return data;
  }

  async sendMessage(message, conversationId, getToken, language, languageName) {
    const headers = await getAuthHeaders(getToken);
    const { data } = await axios.post(
      '/api/chatbot/message',
      { message, conversationId, language, languageName },
      { headers }
    );
    return data;
  }

  async sendMessageStream(message, conversationId, getToken, onToken, onDone, onError, language, languageName) {
    const headers = await getAuthHeaders(getToken);

    try {
      const response = await fetch('/api/chatbot/message/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ message, conversationId, language, languageName }),
      });

      if (!response.ok) {
        let errorMsg = `AI service error (${response.status})`;
        try {
          const errBody = await response.json();
          errorMsg = errBody.message || errorMsg;
        } catch {
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.token) {
                onToken?.(parsed.token);
              }
            } catch {
              // ignore parse errors for partial lines
            }
          } else if (line.startsWith('event: done')) {
            onDone?.();
          }
        }
      }
    } catch (error) {
      onError?.(error);
    }
  }

  async planTrip(payload, getToken, language, languageName) {
    const headers = await getAuthHeaders(getToken);
    const { data } = await axios.post('/api/chatbot/trip-planner', { ...payload, language, languageName }, { headers });
    return data;
  }
}

export default new ChatService();
