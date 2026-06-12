import ApiService from "./ApiService";

// User API service — extends ApiService for profile, recent searches, and preferences.
class UserService extends ApiService {
  constructor() {
    super("user");
  }

  async fetchUser(token) {
    return this.get(token);
  }

  async updateProfile(userData, token) {
    return this.put("profile", userData, token);
  }

  async fetchRecentSearches(token) {
    const { data } = await this.get(token);
    return data.recentSearchedCities || [];
  }

  async addRecentSearch(city, token) {
    return this.post({ city }, token);
  }
}

export default new UserService();
