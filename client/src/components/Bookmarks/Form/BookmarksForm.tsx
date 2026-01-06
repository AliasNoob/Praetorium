import { useState, ChangeEvent, useEffect, FormEvent } from 'react';
import axios from 'axios';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';

// Typescript
import { Bookmark, Category, NewBookmark } from '../../../interfaces';

// UI
import { ModalForm, InputGroup, Button } from '../../UI';

// Utils
import { inputHandler, newBookmarkTemplate, applyAuth } from '../../../utility';

interface Props {
  modalHandler: () => void;
  bookmark?: Bookmark;
}

type IconSource = 'mdi' | 'upload' | 'autofetch';

interface FetchedIcons {
  white: string | null;
  black: string | null;
  original: string | null;
}

export const BookmarksForm = ({
  bookmark,
  modalHandler,
}: Props): JSX.Element => {
  const { categories } = useSelector((state: State) => state.bookmarks);

  const dispatch = useDispatch();
  const { addBookmark, updateBookmark, createNotification } =
    bindActionCreators(actionCreators, dispatch);

  const [customIcon, setCustomIcon] = useState<File | null>(null);

  // Auto-fetch favicon state
  const [iconSource, setIconSource] = useState<IconSource>('mdi');
  const [fetchedIcons, setFetchedIcons] = useState<FetchedIcons | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<'white' | 'black' | 'original'>('white');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [iconFetchUrl, setIconFetchUrl] = useState<string>('');

  const [formData, setFormData] = useState<NewBookmark>(newBookmarkTemplate);

  // Load bookmark data if provided for editing
  useEffect(() => {
    if (bookmark) {
      setFormData({ ...bookmark });
    } else {
      setFormData(newBookmarkTemplate);
    }
  }, [bookmark]);

  const inputChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    options?: { isNumber?: boolean; isBool?: boolean }
  ) => {
    inputHandler<NewBookmark>({
      e,
      options,
      setStateHandler: setFormData,
      state: formData,
    });
  };

  const fileChangeHandler = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      setCustomIcon(e.target.files[0]);
    }
  };

  // Fetch favicon from URL
  const fetchFaviconFromUrl = async (): Promise<void> => {
    if (!iconFetchUrl) {
      createNotification({
        title: 'Error',
        message: 'Please enter a URL for icon fetching',
      });
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchedIcons(null);

    try {
      // Ensure URL has protocol
      let urlToFetch = iconFetchUrl;
      if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
        urlToFetch = 'https://' + urlToFetch;
      }

      const res = await axios.post<{
        success: boolean;
        icons: FetchedIcons;
        error?: string;
      }>('/api/icons/fetch', { url: urlToFetch }, {
        headers: applyAuth()
      });

      if (res.data.success && res.data.icons) {
        setFetchedIcons(res.data.icons);
        // Auto-select the first available variant
        if (res.data.icons.white) {
          setSelectedVariant('white');
          setFormData(prev => ({
            ...prev,
            icon: JSON.stringify({ ...res.data.icons, selected: 'white' })
          }));
        } else if (res.data.icons.black) {
          setSelectedVariant('black');
          setFormData(prev => ({
            ...prev,
            icon: JSON.stringify({ ...res.data.icons, selected: 'black' })
          }));
        } else if (res.data.icons.original) {
          setSelectedVariant('original');
          setFormData(prev => ({
            ...prev,
            icon: JSON.stringify({ ...res.data.icons, selected: 'original' })
          }));
        }
      } else {
        setFetchError('Failed to fetch favicon');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch favicon';
      setFetchError(errorMsg);
      createNotification({
        title: 'Error',
        message: errorMsg,
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Handle icon variant selection
  const handleVariantChange = (variant: 'white' | 'black' | 'original'): void => {
    setSelectedVariant(variant);
    if (fetchedIcons) {
      const iconData = {
        ...fetchedIcons,
        selected: variant
      };
      setFormData(prev => ({
        ...prev,
        icon: JSON.stringify(iconData)
      }));
    }
  };

  // Bookmarks form handler
  const formSubmitHandler = (e: FormEvent): void => {
    e.preventDefault();

    for (let field of ['name', 'url', 'icon'] as const) {
      if (/^ +$/.test(formData[field])) {
        createNotification({
          title: 'Error',
          message: `Field cannot be empty: ${field}`,
        });

        return;
      }
    }

    const createFormData = (): FormData => {
      const data = new FormData();
      if (customIcon) {
        data.append('icon', customIcon);
      }
      data.append('name', formData.name);
      data.append('url', formData.url);
      data.append('description', formData.description || '');
      data.append('categoryId', `${formData.categoryId}`);
      data.append('isPublic', `${formData.isPublic ? 1 : 0}`);

      return data;
    };

    const checkCategory = (): boolean => {
      if (formData.categoryId < 0) {
        createNotification({
          title: 'Error',
          message: 'Please select category',
        });

        return false;
      }

      return true;
    };

    if (!bookmark) {
      // add new bookmark
      if (!checkCategory()) return;

      if (formData.categoryId < 0) {
        createNotification({
          title: 'Error',
          message: 'Please select category',
        });
        return;
      }

      if (customIcon) {
        const data = createFormData();
        addBookmark(data);
      } else {
        addBookmark(formData);
      }

      setFormData({
        ...newBookmarkTemplate,
        categoryId: formData.categoryId,
        isPublic: formData.isPublic,
      });
    } else {
      // update
      if (!checkCategory()) return;

      if (customIcon) {
        const data = createFormData();
        updateBookmark(bookmark.id, data, {
          prev: bookmark.categoryId,
          curr: formData.categoryId,
        });
      } else {
        updateBookmark(bookmark.id, formData, {
          prev: bookmark.categoryId,
          curr: formData.categoryId,
        });
      }

      modalHandler();
    }

    setFormData({ ...newBookmarkTemplate, categoryId: formData.categoryId });
    setCustomIcon(null);
  };

  return (
    <ModalForm modalHandler={modalHandler} formHandler={formSubmitHandler}>
      {/* NAME */}
      <InputGroup>
        <label htmlFor="name">Bookmark Name</label>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Reddit"
          required
          value={formData.name}
          onChange={(e) => inputChangeHandler(e)}
        />
      </InputGroup>

      {/* URL */}
      <InputGroup>
        <label htmlFor="url">Bookmark URL</label>
        <input
          type="text"
          name="url"
          id="url"
          placeholder="reddit.com"
          required
          value={formData.url}
          onChange={(e) => inputChangeHandler(e)}
        />
      </InputGroup>

      <InputGroup>
        <label htmlFor="description">Bookmark description (optional)</label>
        <textarea
          name="description"
          id="description"
          placeholder="Short hint shown under the bookmark"
          value={formData.description || ''}
          onChange={(e) => inputChangeHandler(e)}
          rows={2}
        />
      </InputGroup>

      {/* CATEGORY */}
      <InputGroup>
        <label htmlFor="categoryId">Bookmark Category</label>
        <select
          name="categoryId"
          id="categoryId"
          required
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
          value={formData.categoryId}
        >
          <option value={-1}>Select category</option>
          {categories.map((category: Category): JSX.Element => {
            return (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            );
          })}
        </select>
      </InputGroup>

      {/* ICON */}
      <InputGroup>
        <label>Icon Source</label>
        <select
          value={iconSource}
          onChange={(e) => {
            const newSource = e.target.value as IconSource;
            setIconSource(newSource);
            if (newSource === 'mdi') {
              setCustomIcon(null);
              setFetchedIcons(null);
              setFetchError(null);
            }
          }}
        >
          <option value="mdi">MDI Icon Name</option>
          <option value="upload">Custom Upload</option>
          <option value="autofetch">Auto-fetch from URL</option>
        </select>
      </InputGroup>

      {iconSource === 'mdi' && (
        <InputGroup>
          <label htmlFor="icon">Bookmark Icon (optional)</label>
          <input
            type="text"
            name="icon"
            id="icon"
            placeholder="book-open-outline"
            value={formData.icon}
            onChange={(e) => inputChangeHandler(e)}
          />
          <span>
            Use icon name from MDI or pass a valid URL.
            <a href="https://materialdesignicons.com/" target="blank">
              {' '}
              Click here for reference
            </a>
          </span>
        </InputGroup>
      )}

      {iconSource === 'upload' && (
        <InputGroup>
          <label htmlFor="icon">Bookmark Icon</label>
          <input
            type="file"
            name="icon"
            id="icon"
            onChange={(e) => fileChangeHandler(e)}
            accept=".jpg,.jpeg,.png,.svg,.ico"
          />
        </InputGroup>
      )}

      {iconSource === 'autofetch' && (
        <InputGroup>
          <label>Auto-fetch Favicon</label>
          <input
            type="text"
            placeholder="https://reddit.com"
            value={iconFetchUrl}
            onChange={(e) => setIconFetchUrl(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={fetchFaviconFromUrl}
              disabled={isFetching || !iconFetchUrl}
              style={{
                padding: '8px 16px',
                cursor: isFetching ? 'wait' : 'pointer',
                opacity: isFetching ? 0.6 : 1
              }}
            >
              {isFetching ? 'Fetching...' : 'Fetch Icon'}
            </button>
          </div>
          
          {fetchError && (
            <span style={{ color: '#ff6b6b' }}>{fetchError}</span>
          )}
          
          {fetchedIcons && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                {fetchedIcons.white && (
                  <div style={{ 
                    textAlign: 'center',
                    padding: '8px',
                    border: selectedVariant === 'white' ? '2px solid #4dabf7' : '2px solid transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#333'
                  }}
                  onClick={() => handleVariantChange('white')}
                  >
                    <img 
                      src={`/fetched-icons/${fetchedIcons.white}`} 
                      alt="White variant" 
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>White</div>
                  </div>
                )}
                {fetchedIcons.black && (
                  <div style={{ 
                    textAlign: 'center',
                    padding: '8px',
                    border: selectedVariant === 'black' ? '2px solid #4dabf7' : '2px solid transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#f5f5f5'
                  }}
                  onClick={() => handleVariantChange('black')}
                  >
                    <img 
                      src={`/fetched-icons/${fetchedIcons.black}`} 
                      alt="Black variant" 
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#333' }}>Black</div>
                  </div>
                )}
                {fetchedIcons.original && (
                  <div style={{ 
                    textAlign: 'center',
                    padding: '8px',
                    border: selectedVariant === 'original' ? '2px solid #4dabf7' : '2px solid transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#666'
                  }}
                  onClick={() => handleVariantChange('original')}
                  >
                    <img 
                      src={`/fetched-icons/${fetchedIcons.original}`} 
                      alt="Original" 
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Original</div>
                  </div>
                )}
              </div>
              <span style={{ fontSize: '12px' }}>Click to select a variant</span>
            </div>
          )}
          
          <span>
            Enter any website URL above and click "Fetch Icon" to auto-fetch its favicon
          </span>
        </InputGroup>
      )}

      {/* VISIBILTY */}
      <InputGroup>
        <label htmlFor="isPublic">Bookmark visibility</label>
        <select
          id="isPublic"
          name="isPublic"
          value={formData.isPublic ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>Visible (anyone can access it)</option>
          <option value={0}>Hidden (authentication required)</option>
        </select>
      </InputGroup>

      <Button>{bookmark ? 'Update bookmark' : 'Add new bookmark'}</Button>
    </ModalForm>
  );
};
