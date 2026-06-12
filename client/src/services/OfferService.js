import ApiService from "./ApiService";

// Offer API service — extends ApiService for offer CRUD with active-offer filtering.
class OfferService extends ApiService {
  constructor() {
    super("offers");
  }

  async fetchAll(token) {
    return this.get(token);
  }

  async create(offerData, token) {
    return this.post(offerData, token);
  }

  async update(id, offerData, token) {
    return this.put(id, offerData, token);
  }

  async delete(id, token) {
    return super.delete(id, token);
  }

  async fetchActive(token) {
    const { data } = await this.get(token);
    return {
      ...data,
      offers: data.offers?.filter((o) => o.isActive) || [],
    };
  }
}

export default new OfferService();
