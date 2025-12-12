const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');
const Category = require('../../models/Category');
const App = require('../../models/App');
const Bookmark = require('../../models/Bookmark');
const { sequelize } = require('../../db');

// @desc      Update full layout from JSON
// @route     PUT /api/config/layout
// @access    Private
const updateLayout = asyncWrapper(async (req, res, next) => {
  const { layout } = req.body;

  if (!layout || !Array.isArray(layout)) {
    return next(new ErrorResponse('Invalid layout format. Expected an array of categories.', 400));
  }

  // Validate the layout structure
  for (const category of layout) {
    if (!category.name || !category.type) {
      return next(new ErrorResponse('Each category must have a name and type.', 400));
    }
    if (category.apps && !Array.isArray(category.apps)) {
      return next(new ErrorResponse('Apps must be an array.', 400));
    }
    if (category.bookmarks && !Array.isArray(category.bookmarks)) {
      return next(new ErrorResponse('Bookmarks must be an array.', 400));
    }
  }

  // Use a transaction to ensure atomicity
  const transaction = await sequelize.transaction();

  try {
    // Process each category
    for (const categoryData of layout) {
      let category;

      if (categoryData.id) {
        // Update existing category
        category = await Category.findByPk(categoryData.id, { transaction });
        if (category) {
          await category.update(
            {
              name: categoryData.name,
              type: categoryData.type,
              isPinned: categoryData.isPinned ?? false,
              orderId: categoryData.orderId,
              isPublic: categoryData.isPublic ?? 1,
            },
            { transaction }
          );
        } else {
          // Category with this ID doesn't exist, create new
          category = await Category.create(
            {
              name: categoryData.name,
              type: categoryData.type,
              isPinned: categoryData.isPinned ?? false,
              orderId: categoryData.orderId,
              isPublic: categoryData.isPublic ?? 1,
            },
            { transaction }
          );
        }
      } else {
        // Create new category
        category = await Category.create(
          {
            name: categoryData.name,
            type: categoryData.type,
            isPinned: categoryData.isPinned ?? false,
            orderId: categoryData.orderId,
            isPublic: categoryData.isPublic ?? 1,
          },
          { transaction }
        );
      }

      // Process apps for this category
      if (categoryData.apps && categoryData.type === 'apps') {
        for (const appData of categoryData.apps) {
          if (appData.id) {
            // Update existing app
            const app = await App.findByPk(appData.id, { transaction });
            if (app) {
              await app.update(
                {
                  name: appData.name,
                  url: appData.url,
                  icon: appData.icon || 'cancel',
                  isPinned: appData.isPinned ?? false,
                  orderId: appData.orderId,
                  isPublic: appData.isPublic ?? 1,
                  description: appData.description || '',
                  categoryId: category.id,
                },
                { transaction }
              );
            } else {
              // App doesn't exist, create new
              await App.create(
                {
                  name: appData.name,
                  url: appData.url,
                  icon: appData.icon || 'cancel',
                  isPinned: appData.isPinned ?? false,
                  orderId: appData.orderId,
                  isPublic: appData.isPublic ?? 1,
                  description: appData.description || '',
                  categoryId: category.id,
                },
                { transaction }
              );
            }
          } else {
            // Create new app
            await App.create(
              {
                name: appData.name,
                url: appData.url,
                icon: appData.icon || 'cancel',
                isPinned: appData.isPinned ?? false,
                orderId: appData.orderId,
                isPublic: appData.isPublic ?? 1,
                description: appData.description || '',
                categoryId: category.id,
              },
              { transaction }
            );
          }
        }
      }

      // Process bookmarks for this category
      if (categoryData.bookmarks && categoryData.type === 'bookmarks') {
        for (const bookmarkData of categoryData.bookmarks) {
          if (bookmarkData.id) {
            // Update existing bookmark
            const bookmark = await Bookmark.findByPk(bookmarkData.id, { transaction });
            if (bookmark) {
              await bookmark.update(
                {
                  name: bookmarkData.name,
                  url: bookmarkData.url,
                  icon: bookmarkData.icon || 'cancel',
                  isPinned: bookmarkData.isPinned ?? false,
                  orderId: bookmarkData.orderId,
                  isPublic: bookmarkData.isPublic ?? 1,
                  categoryId: category.id,
                },
                { transaction }
              );
            } else {
              // Bookmark doesn't exist, create new
              await Bookmark.create(
                {
                  name: bookmarkData.name,
                  url: bookmarkData.url,
                  icon: bookmarkData.icon || 'cancel',
                  isPinned: bookmarkData.isPinned ?? false,
                  orderId: bookmarkData.orderId,
                  isPublic: bookmarkData.isPublic ?? 1,
                  categoryId: category.id,
                },
                { transaction }
              );
            }
          } else {
            // Create new bookmark
            await Bookmark.create(
              {
                name: bookmarkData.name,
                url: bookmarkData.url,
                icon: bookmarkData.icon || 'cancel',
                isPinned: bookmarkData.isPinned ?? false,
                orderId: bookmarkData.orderId,
                isPublic: bookmarkData.isPublic ?? 1,
                categoryId: category.id,
              },
              { transaction }
            );
          }
        }
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: { message: 'Layout updated successfully' },
    });
  } catch (error) {
    await transaction.rollback();
    return next(new ErrorResponse(`Failed to update layout: ${error.message}`, 500));
  }
});

module.exports = updateLayout;
