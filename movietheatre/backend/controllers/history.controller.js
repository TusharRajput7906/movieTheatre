const Watchlist = require('../models/Watchlist');

async function getOrCreate(userId) {
  let doc = await Watchlist.findOne({ userId });
  if (!doc) doc = await Watchlist.create({ userId });
  return doc;
}

async function getHistory(req, res) {
  try {
    const doc = await getOrCreate(req.userId);
    res.json({ history: doc.history });
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function addToHistory(req, res) {
  const { tmdbId, mediaType, title, poster, rating } = req.body;
  if (!tmdbId || !mediaType) {
    return res.status(400).json({ message: 'tmdbId and mediaType are required' });
  }

  try {
    const doc = await getOrCreate(req.userId);

    // Remove existing entry for this item (avoid duplicates)
    doc.history = doc.history.filter(
      (h) => !(h.tmdbId === tmdbId && h.mediaType === mediaType)
    );

    // Prepend new entry
    doc.history.unshift({ tmdbId, mediaType, title, poster, rating, savedAt: new Date() });

    // Keep only the latest 100
    if (doc.history.length > 100) doc.history = doc.history.slice(0, 100);

    await doc.save();
    res.json({ history: doc.history });
  } catch (err) {
    console.error('addToHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function clearHistory(req, res) {
  try {
    await Watchlist.findOneAndUpdate(
      { userId: req.userId },
      { $set: { history: [] } },
      { upsert: true }
    );
    res.json({ history: [] });
  } catch (err) {
    console.error('clearHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getHistory, addToHistory, clearHistory };
