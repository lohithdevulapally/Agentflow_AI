const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { inMemoryStore, getDBStatus } = require('../config/db');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

// Password comparison method for Mongoose model
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

let MongooseUserModel;
try {
  MongooseUserModel = mongoose.model('User', userSchema);
} catch (e) {
  MongooseUserModel = mongoose.model('User');
}

// Unified User Repository supporting Mongoose and In-Memory fallback
const User = {
  async create({ name, email, password, role = 'operator' }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseUserModel.create({ name, email, password: hashedPassword, role });
      const obj = doc.toObject();
      delete obj.password;
      return obj;
    }
    const id = uuidv4();
    const now = new Date();
    const user = {
      _id: id,
      id,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      lastLogin: null,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.users.set(id, user);
    const result = { ...user };
    delete result.password;
    return result;
  },

  async findOne({ email }, includePassword = false) {
    if (!getDBStatus().isInMemoryFallback) {
      let query = MongooseUserModel.findOne({ email: email.toLowerCase() });
      if (includePassword) query = query.select('+password');
      const doc = await query.exec();
      return doc ? doc.toObject() : null;
    }
    for (const user of inMemoryStore.users.values()) {
      if (user.email === email.toLowerCase()) {
        const res = { ...user };
        if (!includePassword) delete res.password;
        return res;
      }
    }
    return null;
  },

  async findById(id) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseUserModel.findById(id);
      return doc ? doc.toObject() : null;
    }
    const user = inMemoryStore.users.get(id);
    if (!user) return null;
    const res = { ...user };
    delete res.password;
    return res;
  },

  async updateLastLogin(id) {
    const now = new Date();
    if (!getDBStatus().isInMemoryFallback) {
      return MongooseUserModel.findByIdAndUpdate(id, { lastLogin: now }, { new: true });
    }
    const user = inMemoryStore.users.get(id);
    if (user) {
      user.lastLogin = now;
      user.updatedAt = now;
      inMemoryStore.users.set(id, user);
    }
    return user;
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },
};

module.exports = User;
