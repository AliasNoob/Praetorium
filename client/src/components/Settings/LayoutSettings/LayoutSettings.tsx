import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

// Redux
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';

// Typescript
import { ApiResponse } from '../../../interfaces';

// Other
import { InputGroup, Button } from '../../UI';
import { applyAuth } from '../../../utility';
import classes from './LayoutSettings.module.css';

interface LayoutCategory {
  id?: number;
  name: string;
  type: string;
  isPinned: boolean;
  orderId: number | null;
  isPublic: number;
  apps: LayoutApp[];
  bookmarks: LayoutBookmark[];
}

interface LayoutApp {
  id?: number;
  name: string;
  url: string;
  icon: string;
  isPinned: boolean;
  orderId: number | null;
  isPublic: number;
  description: string;
}

interface LayoutBookmark {
  id?: number;
  name: string;
  url: string;
  icon: string;
  isPinned: boolean;
  orderId: number | null;
  isPublic: number;
}

export const LayoutSettings = (): JSX.Element => {
  const dispatch = useDispatch();
  const { createNotification, getCategories } = bindActionCreators(actionCreators, dispatch);

  const [layoutJson, setLayoutJson] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState<boolean>(true);
  const [jsonError, setJsonError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load layout on mount
  useEffect(() => {
    setIsLoading(true);
    axios
      .get<ApiResponse<LayoutCategory[]>>('/api/config/layout', {
        headers: applyAuth(),
      })
      .then((response) => {
        const formattedJson = JSON.stringify(response.data.data, null, 2);
        setLayoutJson(formattedJson);
        setIsValidJson(true);
        setJsonError('');
      })
      .catch((err) => {
        console.error(err.response);
        createNotification({
          title: 'Error',
          message: 'Failed to load layout',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Validate JSON on change
  const validateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) {
      setJsonError('JSON cannot be empty');
      return false;
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      // Check if it's an array
      if (!Array.isArray(parsed)) {
        setJsonError('Layout must be an array of categories');
        return false;
      }

      // Validate each category
      for (let i = 0; i < parsed.length; i++) {
        const cat = parsed[i];
        if (!cat.name || typeof cat.name !== 'string') {
          setJsonError(`Category at index ${i} must have a valid "name" string`);
          return false;
        }
        if (!cat.type || (cat.type !== 'apps' && cat.type !== 'bookmarks')) {
          setJsonError(`Category "${cat.name}" must have type "apps" or "bookmarks"`);
          return false;
        }
        if (cat.apps && !Array.isArray(cat.apps)) {
          setJsonError(`Category "${cat.name}": apps must be an array`);
          return false;
        }
        if (cat.bookmarks && !Array.isArray(cat.bookmarks)) {
          setJsonError(`Category "${cat.name}": bookmarks must be an array`);
          return false;
        }

        // Validate apps
        if (cat.apps) {
          for (let j = 0; j < cat.apps.length; j++) {
            const app = cat.apps[j];
            if (!app.name || typeof app.name !== 'string') {
              setJsonError(`Category "${cat.name}" app at index ${j}: must have a valid "name"`);
              return false;
            }
            if (!app.url || typeof app.url !== 'string') {
              setJsonError(`Category "${cat.name}" app "${app.name}": must have a valid "url"`);
              return false;
            }
          }
        }

        // Validate bookmarks
        if (cat.bookmarks) {
          for (let j = 0; j < cat.bookmarks.length; j++) {
            const bookmark = cat.bookmarks[j];
            if (!bookmark.name || typeof bookmark.name !== 'string') {
              setJsonError(`Category "${cat.name}" bookmark at index ${j}: must have a valid "name"`);
              return false;
            }
            if (!bookmark.url || typeof bookmark.url !== 'string') {
              setJsonError(`Category "${cat.name}" bookmark "${bookmark.name}": must have a valid "url"`);
              return false;
            }
          }
        }
      }

      setJsonError('');
      return true;
    } catch (e) {
      if (e instanceof SyntaxError) {
        setJsonError(`Invalid JSON syntax: ${e.message}`);
      } else {
        setJsonError('Invalid JSON');
      }
      return false;
    }
  };

  const inputChangeHandler = (e: ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const value = e.target.value;
    setLayoutJson(value);
    const valid = validateJson(value);
    setIsValidJson(valid);
  };

  const formSubmitHandler = (e: FormEvent) => {
    e.preventDefault();

    if (!isValidJson) {
      createNotification({
        title: 'Error',
        message: 'Please fix JSON errors before saving',
      });
      return;
    }

    try {
      const layout = JSON.parse(layoutJson);

      axios
        .put<ApiResponse<{ message: string }>>(
          '/api/config/layout',
          { layout },
          { headers: applyAuth() }
        )
        .then(() => {
          createNotification({
            title: 'Success',
            message: 'Layout saved successfully. Reload page to see changes.',
          });
          // Refresh categories in store
          getCategories();
        })
        .catch((err) => {
          console.error(err.response);
          createNotification({
            title: 'Error',
            message: err.response?.data?.error || 'Failed to save layout',
          });
        });
    } catch (e) {
      createNotification({
        title: 'Error',
        message: 'Invalid JSON format',
      });
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(layoutJson);
      setLayoutJson(JSON.stringify(parsed, null, 2));
      setIsValidJson(true);
      setJsonError('');
    } catch (e) {
      createNotification({
        title: 'Error',
        message: 'Cannot format invalid JSON',
      });
    }
  };

  const refreshLayout = () => {
    setIsLoading(true);
    axios
      .get<ApiResponse<LayoutCategory[]>>('/api/config/layout', {
        headers: applyAuth(),
      })
      .then((response) => {
        const formattedJson = JSON.stringify(response.data.data, null, 2);
        setLayoutJson(formattedJson);
        setIsValidJson(true);
        setJsonError('');
        createNotification({
          title: 'Success',
          message: 'Layout refreshed from server',
        });
      })
      .catch((err) => {
        console.error(err.response);
        createNotification({
          title: 'Error',
          message: 'Failed to refresh layout',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (isLoading) {
    return <div>Loading layout...</div>;
  }

  return (
    <form onSubmit={(e) => formSubmitHandler(e)}>
      <InputGroup>
        <label htmlFor="layoutJson">
          Layout JSON
          <span className={classes.LabelHint}>
            Edit categories, apps, and bookmarks directly
          </span>
        </label>
        <textarea
          id="layoutJson"
          name="layoutJson"
          value={layoutJson}
          onChange={(e) => inputChangeHandler(e)}
          spellCheck={false}
          className={`${classes.LayoutTextarea} ${!isValidJson ? classes.InvalidJson : ''}`}
          rows={25}
        ></textarea>
      </InputGroup>

      {jsonError && (
        <div className={classes.JsonError}>
          <span className={classes.ErrorIcon}>⚠</span>
          {jsonError}
        </div>
      )}

      {isValidJson && layoutJson && (
        <div className={classes.JsonValid}>
          <span className={classes.ValidIcon}>✓</span>
          Valid JSON
        </div>
      )}

      <div className={classes.ButtonGroup}>
        <Button>Save Layout</Button>
        <Button click={formatJson}>
          Format JSON
        </Button>
        <Button click={refreshLayout}>
          Refresh
        </Button>
      </div>

      <div className={classes.HelpText}>
        <h4>Layout Structure</h4>
        <p>The layout is an array of categories. Each category contains:</p>
        <ul>
          <li><code>name</code> - Category name (required)</li>
          <li><code>type</code> - Either "apps" or "bookmarks" (required)</li>
          <li><code>isPinned</code> - Show on home page (boolean)</li>
          <li><code>orderId</code> - Display order (number)</li>
          <li><code>isPublic</code> - Visible when logged out (1 or 0)</li>
          <li><code>apps</code> / <code>bookmarks</code> - Array of items</li>
        </ul>
        <p>Each app/bookmark contains:</p>
        <ul>
          <li><code>name</code> - Display name (required)</li>
          <li><code>url</code> - Link URL (required)</li>
          <li><code>icon</code> - Icon name (mdi icon or custom)</li>
          <li><code>isPinned</code>, <code>orderId</code>, <code>isPublic</code></li>
        </ul>
      </div>
    </form>
  );
};
