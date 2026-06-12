import ApiService from "./ApiService";

// Room API service — extends ApiService for room CRUD with hotel-based filtering.
class RoomService extends ApiService {
  constructor() {
    super("rooms");
  }

  async fetchAll(token) {
    return this.get(token);
  }

  async fetchById(id, token) {
    return this.getById(id, token);
  }

  async create(roomData, token) {
    return this.post(roomData, token);
  }

  async update(id, roomData, token) {
    return this.put(id, roomData, token);
  }

  async delete(id, token) {
    return super.delete(id, token);
  }

  async fetchByHotel(hotelId, token) {
    const { data } = await this.get(token);
    return {
      ...data,
      rooms: data.rooms?.filter((room) => room.hotel === hotelId) || [],
    };
  }
}

export default new RoomService();
