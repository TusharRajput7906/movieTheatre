const User        = require('../models/User');
const CustomMovie = require('../models/CustomMovie');
const Watchlist   = require('../models/Watchlist');

/* ── Stats ───────────────────────────────────────────────── */
async function getStats(req, res) {
  try {
    const [totalUsers, bannedUsers, totalMovies] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      CustomMovie.countDocuments(),
    ]);
    res.json({ totalUsers, bannedUsers, totalMovies });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── Users ───────────────────────────────────────────────── */
async function getAllUsers(req, res) {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function banUser(req, res) {
  try {
    const { id } = req.params;
    if (id === req.userId) {
      return res.status(400).json({ message: 'Cannot ban your own account' });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { isBanned: true },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('banUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function unbanUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isBanned: false },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('unbanUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (id === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(id);
    // Also clean up watchlist data
    await Watchlist.findOneAndDelete({ userId: id });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

/* ── Custom Movies ───────────────────────────────────────── */
async function getCustomMovies(req, res) {
  try {
    const movies = await CustomMovie.find({}).sort({ createdAt: -1 });
    res.json({ movies });
  } catch (err) {
    console.error('getCustomMovies error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function addCustomMovie(req, res) {
  try {
    const { movieId, title, overview, posterUrl, backdropUrl, releaseDate, trailerUrl, rating, genres, category, runtime, language } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const movie = await CustomMovie.create({
      movieId:    movieId || '',
      title:      title.trim(),
      overview,
      posterUrl,
      backdropUrl,
      releaseDate,
      trailerUrl: trailerUrl || '',
      rating:     Number(rating) || 0,
      genres:     Array.isArray(genres) ? genres : [],
      category:   category || '',
      runtime:    Number(runtime) || 0,
      language:   language || 'en',
      createdBy:  req.userId,
    });
    res.status(201).json({ movie });
  } catch (err) {
    console.error('addCustomMovie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateCustomMovie(req, res) {
  try {
    const { id } = req.params;
    const { movieId, title, overview, posterUrl, backdropUrl, releaseDate, trailerUrl, rating, genres, category, runtime, language } = req.body;
    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }
    const updates = {};
    if (movieId     !== undefined) updates.movieId     = movieId;
    if (title       !== undefined) updates.title       = title.trim();
    if (overview    !== undefined) updates.overview    = overview;
    if (posterUrl   !== undefined) updates.posterUrl   = posterUrl;
    if (backdropUrl !== undefined) updates.backdropUrl = backdropUrl;
    if (releaseDate !== undefined) updates.releaseDate = releaseDate;
    if (trailerUrl  !== undefined) updates.trailerUrl  = trailerUrl;
    if (rating      !== undefined) updates.rating      = Number(rating);
    if (genres      !== undefined) updates.genres      = Array.isArray(genres) ? genres : [];
    if (category    !== undefined) updates.category    = category;
    if (runtime     !== undefined) updates.runtime     = Number(runtime);
    if (language    !== undefined) updates.language    = language;

    const movie = await CustomMovie.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ movie });
  } catch (err) {
    console.error('updateCustomMovie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteCustomMovie(req, res) {
  try {
    const { id } = req.params;
    const movie = await CustomMovie.findByIdAndDelete(id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    console.error('deleteCustomMovie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getStats,
  getAllUsers, banUser, unbanUser, deleteUser,
  getCustomMovies, addCustomMovie, updateCustomMovie, deleteCustomMovie,
};
