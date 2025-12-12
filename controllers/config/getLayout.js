const asyncWrapper = require('../../middleware/asyncWrapper');
const Category = require('../../models/Category');
const App = require('../../models/App');
const Bookmark = require('../../models/Bookmark');

// @desc      Get full layout as JSON
// @route     GET /api/config/layout
// @access    Private
const getLayout = asyncWrapper(async (req, res, next) => {
  const categories = await Category.findAll({
    include: [
      {
        model: App,
        as: 'apps',
      },
      {
        model: Bookmark,
        as: 'bookmarks',
      },
    ],
    order: [
      ['orderId', 'ASC'],
      [{ model: App, as: 'apps' }, 'orderId', 'ASC'],
      [{ model: Bookmark, as: 'bookmarks' }, 'orderId', 'ASC'],
    ],
  });

  // Convert to plain objects and structure for editing
  const layout = categories.map((c) => {
    const category = c.get({ plain: true });
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      isPinned: category.isPinned,
      orderId: category.orderId,
      isPublic: category.isPublic,
      apps: category.apps.map((app) => ({
        id: app.id,
        name: app.name,
        url: app.url,
        icon: app.icon,
        isPinned: app.isPinned,
        orderId: app.orderId,
        isPublic: app.isPublic,
        description: app.description,
      })),
      bookmarks: category.bookmarks.map((bookmark) => ({
        id: bookmark.id,
        name: bookmark.name,
        url: bookmark.url,
        icon: bookmark.icon,
        isPinned: bookmark.isPinned,
        orderId: bookmark.orderId,
        isPublic: bookmark.isPublic,
      })),
    };
  });

  res.status(200).json({
    success: true,
    data: layout,
  });
});

module.exports = getLayout;
