const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const apiProxy = createProxyMiddleware('/api', {
    target: 'http://localhost:5005'
  })

  const assetsProxy = createProxyMiddleware('/uploads', {
    target: 'http://localhost:5005'
  })

  // Proxy custom CSS so CRA dev server uses backend-saved praetorium.css
  const cssProxy = createProxyMiddleware('/praetorium.css', {
    target: 'http://localhost:5005'
  })

  const wsProxy = createProxyMiddleware('/socket', {
    target: 'http://localhost:5005',
    ws: true
  })

  app.use(apiProxy);
  app.use(assetsProxy);
  app.use(cssProxy);
  app.use(wsProxy);
};