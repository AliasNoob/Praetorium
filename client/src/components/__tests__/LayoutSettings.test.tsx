import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createStore, Store } from 'redux';
import { MemoryRouter } from 'react-router-dom';

import { AppCard } from '../Apps/AppCard/AppCard';
import { BookmarkCard } from '../Bookmarks/BookmarkCard/BookmarkCard';
import { UISettings } from '../Settings/UISettings/UISettings';
import { configTemplate } from '../../utility/templateObjects/configTemplate';
import { App, Bookmark, Category } from '../../interfaces';

jest.mock('../../utility', () => {
  const { uiSettingsTemplate } = require('../../utility/templateObjects/settingsTemplate');
  const { configTemplate } = require('../../utility/templateObjects/configTemplate');

  return {
    uiSettingsTemplate,
    configTemplate,
    // Minimal input handler to update form state in tests
    inputHandler: ({ e, options, setStateHandler, state }: any) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      let value: any = target.value;

      if (options?.isBool) {
        value = Number(value) === 1;
      } else if (options?.isNumber) {
        value = Number(value);
      }

      setStateHandler({
        ...state,
        [target.name]: value,
      });
    },
    iconParser: () => 'mdiSquare',
    isImage: () => false,
    isSvg: () => false,
    isUrl: () => false,
    urlParser: (url: string) => [url, url],
    storeUIConfig: jest.fn(),
    applyAuth: () => ({}),
  };
});

jest.mock('../UI', () => ({
  Icon: () => <span data-testid="icon" />,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  InputGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SettingsHeadline: ({ text }: { text: string }) => <h2>{text}</h2>,
}));

jest.mock('../../store', () => ({
  actionCreators: {
    updateConfig: jest.fn(() => async () => {}),
  },
}));

type PartialConfig = Partial<typeof configTemplate>;

type AuthOverrides = {
  isAuthenticated?: boolean;
};

const renderWithStore = (
  ui: JSX.Element,
  configOverrides: PartialConfig = {},
  authOverrides: AuthOverrides = {}
) => {
  const initialState = {
    config: {
      loading: false,
      config: { ...configTemplate, ...configOverrides },
      customQueries: [],
    },
    auth: {
      isAuthenticated: authOverrides.isAuthenticated ?? false,
    },
  };

  const store: Store = createStore((state = initialState) => state);

  return render(
    <MemoryRouter>
      <Provider store={store}>{ui}</Provider>
    </MemoryRouter>
  );
};

const buildApps = (count: number): App[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `App ${idx + 1}`,
    url: 'https://example.com',
    categoryId: 1,
    icon: '',
    isPublic: true,
    description: '',
    orderId: idx,
    isPinned: true,
    createdAt: '',
    updatedAt: '',
  }));

const buildBookmarks = (count: number): Bookmark[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `Bookmark ${idx + 1}`,
    url: 'https://example.com',
    categoryId: 1,
    icon: '',
    isPublic: true,
    orderId: idx,
    createdAt: '',
    updatedAt: '',
  }));

describe('Layout-driven rendering', () => {
  const baseCategory: Category = {
    id: 1,
    name: 'Dev',
    type: 'app',
    isPublic: true,
    isPinned: true,
    orderId: 1,
    apps: [],
    bookmarks: [],
    createdAt: '',
    updatedAt: '',
  };

  test('AppCard switches to two columns at threshold and stretches underline', () => {
    const category: Category = {
      ...baseCategory,
      apps: buildApps(6),
    };

    const { container } = renderWithStore(
      <AppCard category={category} />, 
      {
        appCategoryMaxItems: 5,
        categoryHeaderStyle: 'underline',
      }
    );

    const grid = container.querySelector('.Apps');
    expect(grid?.className).toMatch(/TwoColumns/);

    const header = screen.getByText('Dev');
    expect(header.className).toMatch(/CategoryUnderline/);
    expect(header.className).toMatch(/CategoryUnderlineWide/);
  });

  test('AppCard applies title and description color overrides', () => {
    const category: Category = {
      ...baseCategory,
      apps: [
        {
          ...buildApps(1)[0],
          description: 'Custom description',
        },
      ],
    };

    renderWithStore(<AppCard category={category} />, {
      appTitleColor: '#123456',
      categoryDescriptionColor: '#654321',
    });

    const title = screen.getByText('App 1');
    const description = screen.getByText('Custom description');

    expect(title).toHaveStyle({ color: '#123456' });
    expect(description).toHaveStyle({ color: '#654321' });
  });

  test('BookmarkCard switches to two columns, bubble header, and title color override', () => {
    const category: Category = {
      ...baseCategory,
      type: 'bookmark',
      bookmarks: buildBookmarks(8),
    };

    const { container } = renderWithStore(
      <BookmarkCard category={category} />, 
      {
        bookmarkCategoryMaxItems: 7,
        categoryHeaderStyle: 'bubble',
        bookmarkTitleColor: '#abcdef',
      }
    );

    const grid = container.querySelector('.Bookmarks');
    expect(grid?.className).toMatch(/TwoColumns/);

    const header = screen.getByText('Dev');
    expect(header.className).toMatch(/CategoryBubble/);
    expect(header.className).toMatch(/CategoryBubbleWide/);

    const firstBookmark = screen.getByText('Bookmark 1');
    expect(firstBookmark).toHaveStyle({ color: '#abcdef' });
  });

  test('AppCard caps items based on user threshold and shows overflow badge', () => {
    const category: Category = {
      ...baseCategory,
      apps: buildApps(12),
    };

    const { container } = renderWithStore(
      <AppCard category={category} />, 
      {
        appCategoryMaxItems: 4,
      }
    );

    const links = container.querySelectorAll('.Apps a');
    expect(links.length).toBe(8);

    const badge = container.querySelector('.OverflowBadge');
    expect(badge).toBeInTheDocument();
  });

  test('BookmarkCard caps items based on user threshold and shows overflow badge', () => {
    const category: Category = {
      ...baseCategory,
      bookmarks: buildBookmarks(11),
    };

    const { container } = renderWithStore(
      <BookmarkCard category={category} />,
      {
        bookmarkCategoryMaxItems: 4,
      }
    );

    const links = container.querySelectorAll('.Bookmarks a');
    expect(links.length).toBe(8);

    const badge = container.querySelector('.OverflowBadge');
    expect(badge).toBeInTheDocument();
  });

  test('BookmarkCard renders description with style toggle', () => {
    const category: Category = {
      ...baseCategory,
      bookmarks: [
        {
          ...buildBookmarks(1)[0],
          description: 'Small helper text',
        },
      ],
    };

    renderWithStore(<BookmarkCard category={category} />, {
      bookmarkDescriptionItalic: true,
    });

    const desc = screen.getByText('Small helper text');
    expect(desc).toBeInTheDocument();
    expect(desc.className).toMatch(/Italic/);
  });
});

describe('UI settings controls', () => {
  test('shows defaults and allows toggling header style and colors', async () => {
    renderWithStore(<UISettings />);

    const maxApps = screen.getByLabelText('Max apps before using 2 columns') as HTMLInputElement;
    const maxBookmarks = screen.getByLabelText('Max bookmarks before using 2 columns') as HTMLInputElement;

    expect(maxApps.value).toBe('5');
    expect(maxBookmarks.value).toBe('7');

    const underlineRadio = screen.getByRole('radio', { name: /Modern underline/i }) as HTMLInputElement;
    const bubbleRadio = screen.getByRole('radio', { name: /Light bubble/i }) as HTMLInputElement;

    expect(underlineRadio.checked).toBe(true);
    expect(bubbleRadio.checked).toBe(false);

    await userEvent.click(bubbleRadio);
    expect(bubbleRadio.checked).toBe(true);
    expect(underlineRadio.checked).toBe(false);

    const appTitleColor = screen.getByLabelText('App title color') as HTMLInputElement;
    fireEvent.change(appTitleColor, { target: { value: '#abcdef' } });
    expect(appTitleColor.value).toBe('#abcdef');
  });
});
