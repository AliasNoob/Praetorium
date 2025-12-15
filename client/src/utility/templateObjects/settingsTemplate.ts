import { DockerSettingsForm, GeneralForm, ThemeSettingsForm, UISettingsForm, WeatherForm } from '../../interfaces';

export const uiSettingsTemplate: UISettingsForm = {
  customTitle: document.title,
  hideHeader: false,
  hideApps: false,
  hideBookmarks: false,
  hideEmptyCategories: true,
  useAmericanDate: false,
  greetingsSchema: 'Good evening!;Good afternoon!;Good morning!;Good night!',
  daySchema: 'Sunday;Monday;Tuesday;Wednesday;Thursday;Friday;Saturday',
  monthSchema:
    'January;February;March;April;May;June;July;August;September;October;November;December',
  showTime: false,
  hideDate: false,
  hideSearch: false,
  disableAutofocus: false,
  appCategoryMaxItems: 5,
  bookmarkCategoryMaxItems: 7,
  categoryHeaderStyle: 'underline',
  categoryDescriptionColor: '',
  appTitleColor: '',
  bookmarkTitleColor: '',
  categoryUnderlineFade: 0,
  bookmarkDescriptionItalic: true,
};

export const weatherSettingsTemplate: WeatherForm = {
  weatherProvider: 'weatherapi',
  WEATHER_API_KEY: '',
  lat: 0,
  long: 0,
  isCelsius: true,
  weatherData: 'cloud',
  weatherWidgetDesign: 'design1',
  weatherDetailsUrl: '',
  weatherGlass: true,
};

export const generalSettingsTemplate: GeneralForm = {
  searchSameTab: false,
  defaultSearchProvider: 'l',
  secondarySearchProvider: 'd',
  pinAppsByDefault: true,
  pinBookmarksByDefault: true,
  pinCategoriesByDefault: true,
  useOrdering: 'createdAt',
  appsSameTab: false,
  bookmarksSameTab: false,
};

export const dockerSettingsTemplate: DockerSettingsForm = {
  dockerApps: true,
  dockerHost: 'localhost',
  kubernetesApps: true,
  unpinStoppedApps: true,
};

export const themeSettingsTemplate: ThemeSettingsForm = {
  defaultTheme: 'tron',
};
