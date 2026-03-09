const mongoose = require('mongoose');

// Shared item schema used by favorites, watchlist, and history
const mediaItemSchema = new mongoose.Schema(
  {
    tmdbId:    { type: Number, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    title:     { type: String, default: '' },
    poster:    { type: String, default: '' },
    rating:    { type: Number, default: 0 },
    savedAt:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const watchlistSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    favorites: { type: [mediaItemSchema], default: [] },
    watchlist: { type: [mediaItemSchema], default: [] },
    history: {
      type: [mediaItemSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 100,
        message: 'History cannot exceed 100 items',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Watchlist', watchlistSchema);
