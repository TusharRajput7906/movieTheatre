import { configureStore } from '@reduxjs/toolkit';
import moviesReducer   from './slices/moviesSlice.js';
import tvReducer       from './slices/tvSlice.js';
import authReducer     from './slices/authSlice.js';
import favoritesReducer from './slices/favoritesSlice.js';
import searchReducer   from './slices/searchSlice.js';
import uiReducer       from './slices/uiSlice.js';
import peopleReducer   from './slices/peopleSlice.js';

export const store = configureStore({
  reducer: {
    movies:    moviesReducer,
    tv:        tvReducer,
    auth:      authReducer,
    favorites: favoritesReducer,
    search:    searchReducer,
    ui:        uiReducer,
    people:    peopleReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});
