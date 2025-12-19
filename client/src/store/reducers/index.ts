import { combineReducers } from 'redux';

import { appsReducer } from './app';
import { authReducer } from './auth';
import { bookmarksReducer } from './bookmark';
import { configReducer } from './config';
import { dockerReducer } from './docker';
import { notificationReducer } from './notification';
import { themeReducer } from './theme';

export const reducers = combineReducers({
  theme: themeReducer,
  config: configReducer,
  notification: notificationReducer,
  apps: appsReducer,
  bookmarks: bookmarksReducer,
  auth: authReducer,
  docker: dockerReducer,
});

export type State = ReturnType<typeof reducers>;
