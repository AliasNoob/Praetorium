import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Category } from '../../interfaces';
import { actionCreators } from '../../store';
import { State } from '../../store/reducers';
import { redirectUrl, searchParser, urlParser } from '../../utility';
import classes from './SearchBar.module.css';

// Redux
// Typescript
// CSS
// Utils
interface Props {
  setLocalSearch: (query: string) => void;
  appSearchResult: Category[] | null;
  bookmarkSearchResult: Category[] | null;
}

export const SearchBar = (props: Props): JSX.Element => {
  const { config, loading } = useSelector((state: State) => state.config);
  const [isShiftHeld, setIsShiftHeld] = useState(false);

  const dispatch = useDispatch();
  const { createNotification } = useMemo(
    () => bindActionCreators(actionCreators, dispatch),
    [dispatch]
  );

  const { setLocalSearch, appSearchResult, bookmarkSearchResult } = props;

  const inputRef = useRef<HTMLInputElement>(document.createElement('input'));

  const clearSearch = useCallback(() => {
    inputRef.current.value = '';
    setLocalSearch('');
  }, [setLocalSearch]);

  // Search bar autofocus
  useEffect(() => {
    if (!loading && !config.disableAutofocus) {
      inputRef.current.focus();
    }
  }, [config.disableAutofocus, loading]);

  // Track shift key state globally
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(true);
      }
    };
    const handleKeyUp = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Listen for keyboard events outside of search bar
  useEffect(() => {
    const keyOutsideFocus = (e: any) => {
      const { key } = e as KeyboardEvent;

      if (key === 'Escape') {
        clearSearch();
      } else if (document.activeElement !== inputRef.current) {
        if (key === '`') {
          inputRef.current.focus();
          clearSearch();
        }
      }
    };

    window.addEventListener('keyup', keyOutsideFocus);

    return () => window.removeEventListener('keyup', keyOutsideFocus);
  }, [clearSearch]);

  const searchHandler = (e: KeyboardEvent<HTMLInputElement>) => {
    const {
      isLocal,
      encodedURL,
      primarySearch,
      secondarySearch,
      isURL,
      sameTab,
      rawQuery,
    } = searchParser(inputRef.current.value);

    if (isLocal) {
      setLocalSearch(encodedURL);
    }

    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      // Check if shift is held for shift search provider
      if (e.shiftKey && config.shiftSearchTemplate && !/^ *$/.test(rawQuery)) {
        const shiftEncodedURL = encodeURIComponent(inputRef.current.value.trim());
        const url = `${config.shiftSearchTemplate}${shiftEncodedURL}`;
        redirectUrl(url, false); // Always open in new tab for shift search
        return;
      }

      if (!primarySearch.prefix) {
        // Prefix not found -> emit notification
        createNotification({
          title: 'Error',
          message: 'Prefix not found',
        });
      } else if (isURL) {
        // URL or IP passed -> redirect
        const url = urlParser(inputRef.current.value)[1];
        redirectUrl(url, sameTab);
      } else if (isLocal) {
        // Local query -> redirect if at least 1 result found
        if (appSearchResult?.[0]?.apps?.length) {
          redirectUrl(appSearchResult[0].apps[0].url, sameTab);
        } else if (bookmarkSearchResult?.[0]?.bookmarks?.length) {
          redirectUrl(bookmarkSearchResult[0].bookmarks[0].url, sameTab);
        } else {
          // no local results -> search the internet with the default search provider if query is not empty
          if (!/^ *$/.test(rawQuery)) {
            let template = primarySearch.template;

            if (primarySearch.prefix === 'l') {
              template = secondarySearch.template;
            }

            const url = `${template}${encodedURL}`;
            redirectUrl(url, sameTab);
          }
        }
      } else {
        // Valid query -> redirect to search results
        const url = `${primarySearch.template}${encodedURL}`;
        redirectUrl(url, sameTab);
      }
    } else if (e.code === 'Escape') {
      clearSearch();
    }
  };

  // Get shift provider name for display
  const shiftProviderName = config.shiftSearchProvider || 'ChatGPT';

  return (
    <div className={classes.SearchContainer}>
      <input
        ref={inputRef}
        type="text"
        className={`${classes.SearchBar} ${isShiftHeld ? classes.SearchBarShift : ''}`}
        onKeyUp={(e) => searchHandler(e)}
        onDoubleClick={clearSearch}
      />
      {isShiftHeld && (
        <div className={classes.ShiftIndicator}>
          <span className={classes.ShiftIndicatorIcon}>⚡</span>
          <span>{shiftProviderName}</span>
        </div>
      )}
    </div>
  );
};
