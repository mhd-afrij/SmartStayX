import axios from "axios";
import { toast } from "react-hot-toast";
import { config } from "../config/ConfigManager";
import API_ENDPOINTS, { getEndpoint } from "../config/endpoints";

// Generic API client — wraps axios with retry logic, auth headers, and error toast handling.
class ApiService {
  #baseUrl;
  #endpoint;

  constructor(endpoint) {
    this.#endpoint = endpoint;
    this.#baseUrl = config.get("api.baseUrl");
  }

  get endpoint() {
    return this.#endpoint;
  }

  get url() {
    return `${this.#baseUrl}/api/${this.#endpoint}`;
  }

  get timeout() {
    return config.get("api.timeout");
  }

  #getAxiosConfig(token = null) {
    const cfg = { timeout: this.timeout };
    if (token) {
      cfg.headers = { Authorization: `Bearer ${token}` };
    }
    return cfg;
  }

  async #requestWithRetry(requestFn, retries = null) {
    const maxRetries = retries ?? config.get("api.retryAttempts");
    const retryDelay = config.get("api.retryDelay");
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
    throw lastError;
  }

  async #request(method, url, payload = null, token = null) {
    const cfg = this.#getAxiosConfig(token);
    const requestFn = async () => {
      let response;
      if (method === "get" || method === "delete") {
        response = await axios[method](url, cfg);
      } else {
        response = await axios[method](url, payload, cfg);
      }
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message);
    };

    try {
      return await this.#requestWithRetry(requestFn);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  get(token = null) {
    return this.#request("get", this.url, null, token);
  }

  getById(id, token = null) {
    return this.#request("get", `${this.url}/${id}`, null, token);
  }

  post(payload, token = null) {
    return this.#request("post", this.url, payload, token);
  }

  put(id, payload, token = null) {
    return this.#request("put", `${this.url}/${id}`, payload, token);
  }

  delete(id, token = null) {
    return this.#request("delete", `${this.url}/${id}`, null, token);
  }

  handleError(error) {
    const message = error.response?.data?.message || error.message;
    toast.error(message);
  }
}

export { API_ENDPOINTS, getEndpoint };
export default ApiService;
