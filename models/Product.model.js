const mongoose = require('mongoose');

const ProductModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  material: {   // e.g. ['Plastic', 'Paper', 'Foam', 'Other']
    type: String,
    required: true,
  },
  size: {
    type: String,
  },
  quantityPerPack: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerPack: {
    type: Number,
    required: true,
  },
  image: {
    type: [String],
  },
  description: {
    type: String,
  },
  isActive: {
    type: String,
    trim: true
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('product', ProductModel);
