class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    const { populate, select } = options;
    let query = this.model.findById(id);
    
    if (populate) {
      query = query.populate(populate);
    }
    
    if (select) {
      query = query.select(select);
    }
    
    return await query;
  }

  async findOne(query, options = {}) {
    const { populate, select } = options;
    let dbQuery = this.model.findOne(query);
    
    if (populate) {
      dbQuery = dbQuery.populate(populate);
    }
    
    if (select) {
      dbQuery = dbQuery.select(select);
    }
    
    return await dbQuery;
  }

  async findAll(query = {}, options = {}) {
    const { 
      populate, 
      select, 
      sort = { createdAt: -1 }, 
      page = 1, 
      limit = 20 
    } = options;
    
    let dbQuery = this.model.find(query);
    
    if (populate) {
      dbQuery = dbQuery.populate(populate);
    }
    
    if (select) {
      dbQuery = dbQuery.select(select);
    }
    
    const skip = (page - 1) * limit;
    
    return await dbQuery
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(query = {}) {
    return await this.model.countDocuments(query);
  }

  async create(data) {
    const document = new this.model(data);
    return await document.save();
  }

  async updateById(id, data, options = {}) {
    const { new: isNew = true, runValidators = true } = options;
    return await this.model.findByIdAndUpdate(
      id, 
      data, 
      { new: isNew, runValidators }
    );
  }

  async updateOne(query, data, options = {}) {
    const { new: isNew = true, runValidators = true } = options;
    return await this.model.findOneAndUpdate(
      query, 
      data, 
      { new: isNew, runValidators }
    );
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async deleteOne(query) {
    return await this.model.findOneAndDelete(query);
  }

  async exists(query) {
    const doc = await this.model.findOne(query).select('_id');
    return !!doc;
  }

  async paginate(query = {}, options = {}) {
    const { 
      populate, 
      select, 
      sort = { createdAt: -1 }, 
      page = 1, 
      limit = 20 
    } = options;
    
    const skip = (page - 1) * limit;
    const total = await this.count(query);
    
    let dbQuery = this.model.find(query);
    
    if (populate) {
      dbQuery = dbQuery.populate(populate);
    }
    
    if (select) {
      dbQuery = dbQuery.select(select);
    }
    
    const items = await dbQuery
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async updateMany(query, data) {
    return await this.model.updateMany(query, data);
  }

  async aggregate(pipeline) {
    return await this.model.aggregate(pipeline);
  }
}

module.exports = BaseRepository;
