import { WeatherData, WeatherProvider } from '../types';

export interface WeatherForm {
  weatherProvider: WeatherProvider;
  WEATHER_API_KEY: string;
  lat: number;
  long: number;
  isCelsius: boolean;
  weatherData: WeatherData;
  weatherWidgetDesign: 'design1' | 'design2' | 'design3';
  weatherDetailsUrl: string;
  weatherGlass: boolean;
}

export interface GeneralForm {
  defaultSearchProvider: string;
  secondarySearchProvider: string;
  searchSameTab: boolean;
  pinAppsByDefault: boolean;
  pinBookmarksByDefault: boolean;
  pinCategoriesByDefault: boolean;
  useOrdering: string;
  appsSameTab: boolean;
  bookmarksSameTab: boolean;
}

export interface UISettingsForm {
  customTitle: string;
  hideHeader: boolean;
  hideApps: boolean;
  hideBookmarks: boolean;
  hideEmptyCategories: boolean;
  useAmericanDate: boolean;
  greetingsSchema: string;
  daySchema: string;
  monthSchema: string;
  showTime: boolean;
  hideDate: boolean;
  hideSearch: boolean;
  disableAutofocus: boolean;
  appCategoryMaxItems: number;
  bookmarkCategoryMaxItems: number;
  categoryHeaderStyle: 'none' | 'underline' | 'bubble';
  categoryDescriptionColor: string;
  appTitleColor: string;
  bookmarkTitleColor: string;
  categoryUnderlineFade: number;
  bookmarkDescriptionItalic: boolean;
}

export interface DockerSettingsForm {
  dockerApps: boolean;
  dockerHost: string;
  kubernetesApps: boolean;
  unpinStoppedApps: boolean;
}

export interface ThemeSettingsForm {
  defaultTheme: string;
}
