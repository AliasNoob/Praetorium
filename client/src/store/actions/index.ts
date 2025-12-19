import {
  AddAppAction,
  DeleteAppAction,
  PinAppAction,
  ReorderAppsAction,
  SetEditAppAction,
  SortAppsAction,
  UpdateAppAction,
} from './app';
import { AuthErrorAction, AutoLoginAction, LoginAction, LogoutAction } from './auth';
import {
  DockerAction,
  TestDockerAction,
  TestDockerLoadingAction,
  TestDockerErrorAction,
  FetchDockerHostsAction,
  AddDockerHostAction,
  UpdateDockerHostAction,
  DeleteDockerHostAction,
} from './docker';
import {
  AddBookmarkAction,
  DeleteBookmarkAction,
  ReorderBookmarksAction,
  SetEditBookmarkAction,
  SortBookmarksAction,
  UpdateBookmarkAction,
} from './bookmark';
import {
  AddCategoryAction,
  DeleteCategoryAction,
  GetCategoriesAction,
  PinCategoryAction,
  ReorderCategoriesAction,
  SetEditCategoryAction,
  SortCategoriesAction,
  UpdateCategoryAction,
} from './category';
import {
  AddQueryAction,
  DeleteQueryAction,
  FetchQueriesAction,
  GetConfigAction,
  UpdateConfigAction,
  UpdateQueryAction,
} from './config';
import { ClearNotificationAction, CreateNotificationAction } from './notification';
import {
  AddThemeAction,
  DeleteThemeAction,
  EditThemeAction,
  FetchThemesAction,
  SetThemeAction,
  UpdateThemeAction,
} from './theme';

export type Action =
  // Theme
  | SetThemeAction
  | FetchThemesAction
  | AddThemeAction
  | DeleteThemeAction
  | UpdateThemeAction
  | EditThemeAction
  // Config
  | GetConfigAction
  | UpdateConfigAction
  | AddQueryAction
  | DeleteQueryAction
  | FetchQueriesAction
  | UpdateQueryAction
  // Notifications
  | CreateNotificationAction
  | ClearNotificationAction
  // Apps
  | PinAppAction
  | AddAppAction
  | DeleteAppAction
  | UpdateAppAction
  | ReorderAppsAction
  | SortAppsAction
  | SetEditAppAction
  // Categories
  | GetCategoriesAction<any>
  | AddCategoryAction
  | PinCategoryAction
  | DeleteCategoryAction
  | UpdateCategoryAction
  | SortCategoriesAction
  | ReorderCategoriesAction
  | SetEditCategoryAction
  // Bookmarks
  | AddBookmarkAction
  | DeleteBookmarkAction
  | UpdateBookmarkAction
  | SetEditBookmarkAction
  | ReorderBookmarksAction
  | SortBookmarksAction
  // Auth
  | LoginAction
  | LogoutAction
  | AutoLoginAction
  | AuthErrorAction
  // Docker
  | DockerAction
  | TestDockerAction
  | TestDockerLoadingAction
  | TestDockerErrorAction
  | FetchDockerHostsAction
  | AddDockerHostAction
  | UpdateDockerHostAction
  | DeleteDockerHostAction;
