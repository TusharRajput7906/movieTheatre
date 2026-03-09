const Watchlist = require('../models/Watchlist');

async function getOrCreate(userId) {
  let doc = await Watchlist.findOne({ userId });
  if (!doc) doc = await Watchlist.create({ userId });
  return doc;
}

async function getFavorites(req, res) {
  try {
    const doc = await getOrCreate(req.userId);
    res.json({ favorites: doc.favorites, watchlist: doc.watchlist });
  } catch (err) {
    console.error('getFavorites error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Full sync: replace server data with client's localStorage data
async function syncFavorites(req, res) {
  const { favorites = [], watchlist = [] } = req.body;
  try {
    const doc = await Watchlist.findOneAndUpdate(
      { userId: req.userId },
      { $set: { favorites, watchlist } },
      { new: true, upsert: true }
    );
    res.json({ favorites: doc.favorites, watchlist: doc.watchlist });
  } catch (err) {
    console.error('syncFavorites error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Toggle a single item in/out of favorites
async function toggleFavorite(req, res) {
  const { tmdbId, mediaType, title, poster, rating } = req.body;
  if (!tmdbId || !mediaType) {
    return res.status(400).json({ message: 'tmdbId and mediaType are required' });
  }

  try {
    const doc = await getOrCreate(req.userId);
    const idx = doc.favorites.findIndex(
      (f) => f.tmdbId === tmdbId && f.mediaType === mediaType
    );

    if (idx === -1) {
      doc.favorites.push({ tmdbId, mediaType, title, poster, rating });
    } else {
      doc.favorites.splice(idx, 1);
    }

    await doc.save();
    res.json({ favorites: doc.favorites });
  } catch (err) {
    console.error('toggleFavorite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Toggle a single item in/out of watchlist
async function toggleWatchlist(req, res) {
  const { tmdbId, mediaType, title, poster, rating } = req.body;
  if (!tmdbId || !mediaType) {
    return res.status(400).json({ message: 'tmdbId and mediaType are required' });
  }

  try {
    const doc = await getOrCreate(req.userId);
    const idx = doc.watchlist.findIndex(
      (w) => w.tmdbId === tmdbId && w.mediaType === mediaType
    );

    if (idx === -1) {
      doc.watchlist.push({ tmdbId, mediaType, title, poster, rating });
    } else {
      doc.watchlist.splice(idx, 1);
    }

    await doc.save();
    res.json({ watchlist: doc.watchlist });
  } catch (err) {
    console.error('toggleWatchlist error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getFavorites, syncFavorites, toggleFavorite, toggleWatchlist };
