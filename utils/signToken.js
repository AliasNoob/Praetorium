const jwt = require('jsonwebtoken');

const signToken = (expiresIn) => {
  const token = jwt.sign({ app: 'praetorium' }, process.env.SECRET, { expiresIn });
  return token;
};

module.exports = signToken;
