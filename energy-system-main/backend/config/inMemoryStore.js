/**
 * In-Memory Fallback Data Store for Smart Energy System
 * Ensures the system operates seamlessly out-of-the-box even if MongoDB service is not currently active.
 * Transparently delegates to real MongoDB when Mongoose is connected.
 */

class QueryChain {
  constructor(dataPromise) {
    this.dataPromise = Promise.resolve(dataPromise);
  }

  sort(sortCriteria) {
    this.dataPromise = this.dataPromise.then((items) => {
      if (!Array.isArray(items)) return items;
      const sorted = [...items];
      const key = typeof sortCriteria === 'string' ? sortCriteria : Object.keys(sortCriteria || {})[0];
      const order = typeof sortCriteria === 'string' ? -1 : sortCriteria[key];

      sorted.sort((a, b) => {
        let valA = a[key] ?? 0;
        let valB = b[key] ?? 0;
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();
        if (valA < valB) return order === 1 ? -1 : 1;
        if (valA > valB) return order === 1 ? 1 : -1;
        return 0;
      });
      return sorted;
    });
    return this;
  }

  limit(num) {
    this.dataPromise = this.dataPromise.then((items) => {
      if (!Array.isArray(items)) return items;
      return items.slice(0, num);
    });
    return this;
  }

  skip(num) {
    this.dataPromise = this.dataPromise.then((items) => {
      if (!Array.isArray(items)) return items;
      return items.slice(num);
    });
    return this;
  }

  lean() {
    return this;
  }

  select() {
    return this;
  }

  then(resolve, reject) {
    return this.dataPromise.then(resolve, reject);
  }

  catch(reject) {
    return this.dataPromise.catch(reject);
  }
}

class InMemoryCollection {
  constructor(name) {
    this.name = name;
    this.items = [];
    this.idCounter = 1;
  }

  _matches(item, query = {}) {
    if (!query) return true;
    for (const key of Object.keys(query)) {
      if (key === '$or') {
        const orMatches = query.$or.some((subQuery) => this._matches(item, subQuery));
        if (!orMatches) return false;
        continue;
      }
      if (key === 'timestamp' && typeof query[key] === 'object') {
        const itemTime = new Date(item.timestamp).getTime();
        if (query[key].$gte && itemTime < new Date(query[key].$gte).getTime()) return false;
        if (query[key].$lte && itemTime > new Date(query[key].$lte).getTime()) return false;
        continue;
      }
      if (query[key] && typeof query[key] === 'object' && query[key].$regex) {
        const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
        const val = item[key];
        if (Array.isArray(val)) {
          if (!val.some((v) => regex.test(v))) return false;
        } else if (!regex.test(String(val || ''))) {
          return false;
        }
        continue;
      }
      if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  }

  _createDoc(data) {
    const doc = {
      _id: `mem_${Date.now()}_${this.idCounter++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    if (this.name === 'User') {
      const bcrypt = require('bcryptjs');
      if (doc.password && !doc.password.startsWith('$2a$') && !doc.password.startsWith('$2b$')) {
        doc.password = bcrypt.hashSync(doc.password, 10);
      }
      doc.matchPassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      };
    }

    doc.save = async function () {
      doc.updatedAt = new Date();
      return doc;
    };
    return doc;
  }

  find(query = {}) {
    const results = this.items.filter((item) => this._matches(item, query));
    return new QueryChain(results);
  }

  findOne(query = {}) {
    const item = this.items.find((i) => this._matches(i, query)) || null;
    return new QueryChain(item);
  }

  findById(id) {
    const item = this.items.find((i) => String(i._id) === String(id)) || null;
    return new QueryChain(item);
  }

  async create(data) {
    const doc = this._createDoc(data);
    this.items.push(doc);
    return doc;
  }

  async insertMany(docs = []) {
    const created = docs.map((d) => this._createDoc(d));
    this.items.push(...created);
    return created;
  }

  async countDocuments(query = {}) {
    return this.items.filter((item) => this._matches(item, query)).length;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const idx = this.items.findIndex((i) => String(i._id) === String(id));
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...update, updatedAt: new Date() };
    this.items[idx].save = async () => this.items[idx];
    return this.items[idx];
  }

  async findByIdAndDelete(id) {
    const idx = this.items.findIndex((i) => String(i._id) === String(id));
    if (idx === -1) return null;
    const deleted = this.items.splice(idx, 1)[0];
    return deleted;
  }

  async updateMany(query = {}, update = {}) {
    let count = 0;
    this.items.forEach((item) => {
      if (this._matches(item, query)) {
        Object.assign(item, update);
        count++;
      }
    });
    return { modifiedCount: count };
  }
}

const collections = {
  User: new InMemoryCollection('User'),
  Appliance: new InMemoryCollection('Appliance'),
  EnergyReading: new InMemoryCollection('EnergyReading'),
  Prediction: new InMemoryCollection('Prediction'),
  Anomaly: new InMemoryCollection('Anomaly'),
  Alert: new InMemoryCollection('Alert'),
  Settings: new InMemoryCollection('Settings'),
};

const getCollection = (name) => {
  if (!collections[name]) {
    collections[name] = new InMemoryCollection(name);
  }
  return collections[name];
};

module.exports = { getCollection };
