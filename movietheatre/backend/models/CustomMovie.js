const mongoose = require('mongoose');

const customMovieSchema = new mongoose.Schema(
  {
    movieId:     { type: String, default: '' },          // admin-defined ID
    title:       { type: String, required: [true, 'Title is required'], trim: true },
    overview:    { type: String, default: '' },
    posterUrl:   { type: String, default: '' },
    backdropUrl: { type: String, default: '' },
    releaseDate: { type: String, default: '' },
    trailerUrl:  { type: String, default: '' },          // YouTube link
    rating:      { type: Number, default: 0, min: 0, max: 10 },
    genres:      [{ type: String }],
    category:    { type: String, default: '' },          // e.g. Trending, Upcoming
    runtime:     { type: Number, default: 0 },
    language:    { type: String, default: 'en' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomMovie', customMovieSchema);
