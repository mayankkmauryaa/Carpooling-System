class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  async findOne(query, options = {}) {
    return await this.repository.findOne(query, options);
  }

  async findAll(query = {}, options = {}) {
    return await this.repository.findAll(query, options);
  }

  async create(data) {
    return await this.repository.create(data);
  }

  async updateById(id, data, options = {}) {
    return await this.repository.updateById(id, data, options);
  }

  async deleteById(id) {
    return await this.repository.deleteById(id);
  }

  async paginate(query = {}, options = {}) {
    return await this.repository.paginate(query, options);
  }

  async count(query = {}) {
    return await this.repository.count(query);
  }

  async exists(query) {
    return await this.repository.exists(query);
  }
}

module.exports = BaseService;
