import { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router-dom';

import { App, Category } from '../../../interfaces';
import { actionCreators } from '../../../store';
import { State } from '../../../store/reducers';
import { iconParser, isImage, isSvg, isUrl, urlParser } from '../../../utility';
import { Icon } from '../../UI';
import classes from './AppCard.module.css';

interface Props {
  category: Category;
  fromHomepage?: boolean;
}

export const AppCard = (props: Props): JSX.Element => {
  const { category, fromHomepage = false } = props;

  const config = useSelector((state: State) => state.config.config);
  const isAuthenticated = useSelector((state: State) => state.auth.isAuthenticated);

  const dispatch = useDispatch();
  const { setEditCategory } = bindActionCreators(actionCreators, dispatch);

  const threshold = config.appCategoryMaxItems ?? 5;
  const maxItems = Math.max(1, threshold * 2);
  const isTwoColumns = category.apps.length >= threshold;
  const hasOverflow = category.apps.length > maxItems;
  const displayApps = category.apps.slice(0, maxItems);

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
    fromHomepage || !isAuthenticated ? '' : classes.AppHeader,
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

  const appTitleStyle = config.appTitleColor
    ? { color: config.appTitleColor }
    : undefined;

  const descriptionStyle = config.categoryDescriptionColor
    ? { color: config.categoryDescriptionColor }
    : undefined;

  return (
    <div className={classes.AppCard}>
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
            title="Too many apps in this category. Click to adjust settings."
            aria-label="Too many apps in this category. Click to adjust settings."
          >
            <span className={classes.OverflowText}>!</span>
          </Link>
        )}
        {category.name}
      </h3>

      <div
        className={[classes.Apps, isTwoColumns ? classes.TwoColumns : '']
          .filter(Boolean)
          .join(' ')}
      >
        {displayApps.map((app: App) => {
          const [displayUrl, redirectUrl] = urlParser(app.url);

          let iconEl: JSX.Element = <Fragment></Fragment>;

          if (app.icon) {
            const { icon, name } = app;

            if (isImage(icon)) {
              const source = isUrl(icon) ? icon : `/uploads/${icon}`;

              iconEl = (
                <div className={classes.AppIcon}>
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
                <div className={classes.AppIcon}>
                  <svg
                    data-src={source}
                    fill="var(--color-primary)"
                    className={classes.AppIconSvg}
                  ></svg>
                </div>
              );
            } else {
              iconEl = (
                <div className={classes.AppIcon}>
                  <Icon icon={iconParser(icon)} />
                </div>
              );
            }
          }

          return (
            <a
              href={redirectUrl}
              target={config.appsSameTab ? '' : '_blank'}
              rel="noreferrer"
              key={`app-${app.id}`}
            >
              {app.icon && iconEl}              
              <div className={classes.AppCardDetails}>
                  <h5 style={appTitleStyle}>{app.name}</h5>
                  <span style={descriptionStyle}>
                    {!app.description.length ? displayUrl : app.description}
                  </span>
                </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
