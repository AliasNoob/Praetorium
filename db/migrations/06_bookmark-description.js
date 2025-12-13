const { DataTypes } = require('sequelize');
const { STRING } = DataTypes;

const up = async (query) => {
  await query.addColumn('bookmarks', 'description', {
    type: STRING,
    allowNull: false,
    defaultValue: '',
  });
};

const down = async (query) => {
  await query.removeColumn('bookmarks', 'description');
};

module.exports = {
  up,
  down,
};
