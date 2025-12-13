import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';

import { UISettingsForm } from '../../../interfaces';
import { actionCreators } from '../../../store';
import { State } from '../../../store/reducers';
import { inputHandler, uiSettingsTemplate } from '../../../utility';
import { Button, InputGroup, SettingsHeadline } from '../../UI';
import styles from './UISettings.module.css';

export const UISettings = (): JSX.Element => {
  const { loading, config } = useSelector((state: State) => state.config);

  const dispatch = useDispatch();
  const { updateConfig } = bindActionCreators(actionCreators, dispatch);

  // Initial state
  const [formData, setFormData] = useState<UISettingsForm>(uiSettingsTemplate);

  // Get config
  useEffect(() => {
    setFormData({
      ...uiSettingsTemplate,
      ...config,
    });
  }, [loading]);

  // Form handler
  const formSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();

    // Save settings
    await updateConfig(formData);

    // Update local page title
    document.title = formData.customTitle;
  };

  // Input handler
  const inputChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    options?: { isNumber?: boolean; isBool?: boolean }
  ) => {
    inputHandler<UISettingsForm>({
      e,
      options,
      setStateHandler: setFormData,
      state: formData,
    });
  };

  const clearColor = (key: keyof UISettingsForm) => {
    setFormData((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <form onSubmit={(e) => formSubmitHandler(e)}>
      {/* === OTHER OPTIONS === */}
      <SettingsHeadline text="Miscellaneous" />
      {/* PAGE TITLE */}
      <InputGroup>
        <label htmlFor="customTitle">Custom page title</label>
        <input
          type="text"
          id="customTitle"
          name="customTitle"
          placeholder="Praetorium"
          value={formData.customTitle}
          onChange={(e) => inputChangeHandler(e)}
        />
      </InputGroup>

      {/* === SEARCH OPTIONS === */}
      <SettingsHeadline text="Search" />
      {/* HIDE SEARCHBAR */}
      <InputGroup>
        <label htmlFor="hideSearch">Hide search bar</label>
        <select
          id="hideSearch"
          name="hideSearch"
          value={formData.hideSearch ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>True</option>
          <option value={0}>False</option>
        </select>
      </InputGroup>

      {/* AUTOFOCUS SEARCHBAR */}
      <InputGroup>
        <label htmlFor="disableAutofocus">Disable search bar autofocus</label>
        <select
          id="disableAutofocus"
          name="disableAutofocus"
          value={formData.disableAutofocus ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>True</option>
          <option value={0}>False</option>
        </select>
      </InputGroup>

      {/* === HEADER OPTIONS === */}
      <SettingsHeadline text="Header" />
      {/* HIDE HEADER */}
      <InputGroup>
        <label htmlFor="hideHeader">
          Hide headline (greetings and weather)
        </label>
        <select
          id="hideHeader"
          name="hideHeader"
          value={formData.hideHeader ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>True</option>
          <option value={0}>False</option>
        </select>
      </InputGroup>

      {/* HIDE DATE */}
      <InputGroup>
        <label htmlFor="hideDate">Hide date</label>
        <select
          id="hideDate"
          name="hideDate"
          value={formData.hideDate ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>True</option>
          <option value={0}>False</option>
        </select>
      </InputGroup>

      {/* HIDE TIME */}
      <InputGroup>
        <label htmlFor="showTime">Hide time</label>
        <select
          id="showTime"
          name="showTime"
          value={formData.showTime ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={0}>True</option>
          <option value={1}>False</option>
        </select>
      </InputGroup>

      {/* DATE FORMAT */}
      <InputGroup>
        <label htmlFor="useAmericanDate">Date formatting</label>
        <select
          id="useAmericanDate"
          name="useAmericanDate"
          value={formData.useAmericanDate ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>Friday, October 22 2021</option>
          <option value={0}>Friday, 22 October 2021</option>
        </select>
      </InputGroup>

      {/* CUSTOM GREETINGS */}
      <InputGroup>
        <label htmlFor="greetingsSchema">Custom greetings</label>
        <input
          type="text"
          id="greetingsSchema"
          name="greetingsSchema"
          placeholder="Good day;Hi;Bye!"
          value={formData.greetingsSchema}
          onChange={(e) => inputChangeHandler(e)}
        />
        <span>
          Greetings must be separated with semicolon. All 4 messages must be
          filled, even if they are the same
        </span>
      </InputGroup>

      {/* CUSTOM DAYS */}
      <InputGroup>
        <label htmlFor="daySchema">Custom weekday names</label>
        <input
          type="text"
          id="daySchema"
          name="daySchema"
          placeholder="Sunday;Monday;Tuesday"
          value={formData.daySchema}
          onChange={(e) => inputChangeHandler(e)}
        />
        <span>Names must be separated with semicolon</span>
      </InputGroup>

      {/* CUSTOM MONTHS */}
      <InputGroup>
        <label htmlFor="monthSchema">Custom month names</label>
        <input
          type="text"
          id="monthSchema"
          name="monthSchema"
          placeholder="January;February;March"
          value={formData.monthSchema}
          onChange={(e) => inputChangeHandler(e)}
        />
        <span>Names must be separated with semicolon</span>
      </InputGroup>

      {/* === SECTIONS OPTIONS === */}
      <SettingsHeadline text="Sections" />
      {/* HIDE APPS */}
      <InputGroup>
        <label htmlFor="hideApps">Hide applications</label>
        <select
          id="hideApps"
          name="hideApps"
          value={formData.hideApps ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>True</option>
          <option value={0}>False</option>
        </select>
      </InputGroup>

      {/* === LAYOUT OPTIONS === */}
      <SettingsHeadline text="Layout" />
      <InputGroup>
        <label htmlFor="appCategoryMaxItems">
          Max apps before using 2 columns
        </label>
        <input
          type="number"
          id="appCategoryMaxItems"
          name="appCategoryMaxItems"
          min={1}
          value={formData.appCategoryMaxItems}
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
        />
        <span>Default is 5 items</span>
      </InputGroup>

      <InputGroup>
        <label htmlFor="categoryUnderlineFade">
          Underline fade amount
        </label>
        <div className={styles.RadioGrid} role="radiogroup" aria-label="Underline fade amount">
          <label className={styles.RadioCard}>
            <input
              type="radio"
              name="categoryUnderlineFade"
              value={0}
              checked={Number(formData.categoryUnderlineFade) === 0}
              onChange={(e) => inputChangeHandler(e, { isNumber: true })}
            />
            <div>
              <div className={styles.RadioLabel}>Off</div>
              <div className={styles.RadioHint}>Solid underline</div>
            </div>
          </label>
          <label className={styles.RadioCard}>
            <input
              type="radio"
              name="categoryUnderlineFade"
              value={0.35}
              checked={Number(formData.categoryUnderlineFade) === 0.35}
              onChange={(e) => inputChangeHandler(e, { isNumber: true })}
            />
            <div>
              <div className={styles.RadioLabel}>Soft fade</div>
              <div className={styles.RadioHint}>Gentle taper</div>
            </div>
          </label>
          <label className={styles.RadioCard}>
            <input
              type="radio"
              name="categoryUnderlineFade"
              value={0.65}
              checked={Number(formData.categoryUnderlineFade) === 0.65}
              onChange={(e) => inputChangeHandler(e, { isNumber: true })}
            />
            <div>
              <div className={styles.RadioLabel}>Bold fade</div>
              <div className={styles.RadioHint}>Longer gradient</div>
            </div>
          </label>
        </div>
      </InputGroup>

      <InputGroup>
        <label htmlFor="bookmarkCategoryMaxItems">
          Max bookmarks before using 2 columns
        </label>
        <input
          type="number"
          id="bookmarkCategoryMaxItems"
          name="bookmarkCategoryMaxItems"
          min={1}
          value={formData.bookmarkCategoryMaxItems}
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
        />
        <span>Default is 7 items</span>
      </InputGroup>

      <InputGroup>
        <label htmlFor="bookmarkDescriptionItalic">Bookmark description style</label>
        <select
          id="bookmarkDescriptionItalic"
          name="bookmarkDescriptionItalic"
          value={formData.bookmarkDescriptionItalic ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>Italic</option>
          <option value={0}>Standard</option>
        </select>
        <span>Controls the small text shown under bookmarks</span>
      </InputGroup>

      <InputGroup>
        <label>Category header style</label>
        <div className={styles.RadioGrid} role="radiogroup" aria-label="Category header style">
          <label className={styles.RadioCard}>
            <input
              type="radio"
              name="categoryHeaderStyle"
              value="none"
              checked={formData.categoryHeaderStyle === 'none'}
              onChange={(e) => inputChangeHandler(e)}
            />
            <div>
              <div className={styles.RadioLabel}>No decoration</div>
              <div className={styles.RadioHint}>Just text</div>
            </div>
          </label>
          <label className={styles.RadioCard}>
            <input
              type="radio"
              name="categoryHeaderStyle"
              value="underline"
              checked={formData.categoryHeaderStyle === 'underline'}
              onChange={(e) => inputChangeHandler(e)}
            />
            <div>
              <div className={styles.RadioLabel}>Modern underline</div>
              <div className={styles.RadioHint}>Matches fade above</div>
            </div>
          </label>
          <label className={styles.RadioCard}>
            <input
              type="radio"
              name="categoryHeaderStyle"
              value="bubble"
              checked={formData.categoryHeaderStyle === 'bubble'}
              onChange={(e) => inputChangeHandler(e)}
            />
            <div>
              <div className={styles.RadioLabel}>Light bubble</div>
              <div className={styles.RadioHint}>Pill background</div>
            </div>
          </label>
        </div>
      </InputGroup>

      <InputGroup>
        <label htmlFor="categoryDescriptionColor">Category description color</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="color"
            id="categoryDescriptionColor"
            name="categoryDescriptionColor"
            value={formData.categoryDescriptionColor || '#000000'}
            onChange={(e) => inputChangeHandler(e)}
          />
          <button type="button" onClick={() => clearColor('categoryDescriptionColor')}>
            Reset
          </button>
        </div>
        <span>Leave empty to inherit theme</span>
      </InputGroup>

      <InputGroup>
        <label htmlFor="appTitleColor">App title color</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="color"
            id="appTitleColor"
            name="appTitleColor"
            value={formData.appTitleColor || '#000000'}
            onChange={(e) => inputChangeHandler(e)}
          />
          <button type="button" onClick={() => clearColor('appTitleColor')}>
            Reset
          </button>
        </div>
        <span>Leave empty to use theme default</span>
      </InputGroup>

      <InputGroup>
        <label htmlFor="bookmarkTitleColor">Bookmark title color</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="color"
            id="bookmarkTitleColor"
            name="bookmarkTitleColor"
            value={formData.bookmarkTitleColor || '#000000'}
            onChange={(e) => inputChangeHandler(e)}
          />
          <button type="button" onClick={() => clearColor('bookmarkTitleColor')}>
            Reset
          </button>
        </div>
        <span>Leave empty to use theme default</span>
      </InputGroup>

      {/* HIDE BOOKMARKS */}
      <InputGroup>
        <label htmlFor="hideBookmarks">Hide bookmarks</label>
        <select
          id="hideBookmarks"
          name="hideBookmarks"
          value={formData.hideBookmarks ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>True</option>
          <option value={0}>False</option>
        </select>
      </InputGroup>

      {/* HIDE EMPTY CATEGORIES */}
      <InputGroup>
        <label htmlFor="hideEmptyCategories">Hide empty categories</label>
        <select
          id="hideEmptyCategories"
          name="hideEmptyCategories"
          value={formData.hideEmptyCategories ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>True</option>
          <option value={0}>False</option>
        </select>
      </InputGroup>

      <Button>Save changes</Button>
    </form>
  );
};
