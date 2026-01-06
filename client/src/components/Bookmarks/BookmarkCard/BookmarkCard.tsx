import { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router-dom';

import { Bookmark, Category } from '../../../interfaces';
import { actionCreators } from '../../../store';
import { State } from '../../../store/reducers';
import { iconParser, isImage, isSvg, isUrl, urlParser, isFetchedIcon, parseFetchedIcon } from '../../../utility';
import { Icon } from '../../UI';
import classes from './BookmarkCard.module.css';

interface Props {
  category: Category;
  fromHomepage?: boolean;
}

export const BookmarkCard = (props: Props): JSX.Element => {
  const { category, fromHomepage = false } = props;
  const config = useSelector((state: State) => state.config.config);
  const isAuthenticated = useSelector((state: State) => state.auth.isAuthenticated);

  const dispatch = useDispatch();
  const { setEditCategory } = bindActionCreators(actionCreators, dispatch);

  const threshold = config.bookmarkCategoryMaxItems ?? 7;
  const maxItems = Math.max(1, threshold * 2);
  const isTwoColumns = category.bookmarks.length >= threshold;
  const hasOverflow = category.bookmarks.length > maxItems;
  const displayBookmarks = category.bookmarks.slice(0, maxItems);

  const headerStyleClass =
    config.categoryHeaderStyle === 'underline'
      ? classes.CategoryUnderline
      : config.categoryHeaderStyle === 'bubble'
      ? classes.CategoryBubble
      : '';

  const headerWidthClass =
    isTwoColumns && config.categoryHeaderStyle === 'underline'
      ? classes.CategoryUnderlineWide
      : isTwoColumns && config.categoryHeaderStyle === 'bubble'
      ? classes.CategoryBubbleWide
      : '';

  const headerClasses = [
    classes.CategoryTitle,
    headerStyleClass,
    headerWidthClass,
    fromHomepage || !isAuthenticated ? '' : classes.BookmarkHeader,
  ]
    .filter(Boolean)
    .join(' ');

  const headerStyle =
    config.categoryHeaderStyle === 'underline'
      ? ({
          ['--underline-fade-start' as any]: config.categoryUnderlineFade === 0 ? 1 : config.categoryUnderlineFade ?? 0.35,
          ['--underline-fade-end' as any]: config.categoryUnderlineFade === 0 ? 1 : 0,
        } as React.CSSProperties)
      : undefined;

  const bookmarkTitleStyle = config.bookmarkTitleColor
    ? { color: config.bookmarkTitleColor }
    : undefined;

  const descriptionClass = [
    classes.BookmarkDescription,
    config.bookmarkDescriptionItalic ? classes.Italic : '',
  ]
    .filter(Boolean)
    .join(' ');

  const isCardStyle = config.categoryHeaderStyle === 'bubble';

  return (
    <div className={[classes.BookmarkCard, isCardStyle ? classes.CardSurface : ''].filter(Boolean).join(' ')}>
      <h3
        className={headerClasses}
        style={headerStyle}
        onClick={() => {
          if (!fromHomepage && isAuthenticated) {
            setEditCategory(category);
          }
        }}
      >
        {hasOverflow && (
          <Link
            to="/settings/interface"
            className={classes.OverflowBadge}
            title="Too many bookmarks in this category. Click to adjust settings."
            aria-label="Too many bookmarks in this category. Click to adjust settings."
          >
            <span className={classes.OverflowText}>!</span>
          </Link>
        )}
        {category.name}
      </h3>

      <div
        className={[classes.Bookmarks, isTwoColumns ? classes.TwoColumns : '']
          .filter(Boolean)
          .join(' ')}
      >
        {displayBookmarks.map((bookmark: Bookmark) => {
          const redirectUrl = urlParser(bookmark.url)[1];

          let iconEl: JSX.Element = <Fragment></Fragment>;

          if (bookmark.icon) {
            const { icon, name } = bookmark;

            // Check for fetched icon (JSON format)
            if (isFetchedIcon(icon)) {
              const fetchedIcon = parseFetchedIcon(icon);
              if (fetchedIcon) {
                iconEl = (
                  <div className={classes.BookmarkIcon}>
                    <img
                      src={fetchedIcon.path}
                      alt={`${name} icon`}
                      className={classes.CustomIcon}
                    />
                  </div>
                );
              }
            } else if (isImage(icon)) {
              const source = isUrl(icon) ? icon : `/uploads/${icon}`;

              iconEl = (
                <div className={classes.BookmarkIcon}>
                  <img
                    src={source}
                    alt={`${name} icon`}
                    className={classes.CustomIcon}
                  />
                </div>
              );
            } else if (isSvg(icon)) {
              const source = isUrl(icon) ? icon : `/uploads/${icon}`;

              iconEl = (
                <div className={classes.BookmarkIcon}>
                  <svg
                    data-src={source}
                    fill="var(--color-primary)"
                    className={classes.BookmarkIconSvg}
                  ></svg>
                </div>
              );
            } else {
              iconEl = (
                <div className={classes.BookmarkIcon}>
                  <Icon icon={iconParser(icon)} />
                </div>
              );
            }
          }

          return (
            <a
              href={redirectUrl}
              target={config.bookmarksSameTab ? '' : '_blank'}
              rel="noreferrer"
              key={`bookmark-${bookmark.id}`}
              style={bookmarkTitleStyle}
            >
              {bookmark.icon && iconEl}
              <span className={classes.TextBlock}>
                <span style={bookmarkTitleStyle}>{bookmark.name}</span>
                {bookmark.description ? (
                  <span className={descriptionClass}>{bookmark.description}</span>
                ) : null}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
