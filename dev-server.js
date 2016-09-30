var WebpackDevServer = require("webpack-dev-server");
var webpack = require("webpack");

var compiler = webpack(require('./webpack.config'));

var server = new WebpackDevServer(compiler, {
  contentBase: 'static/',
  historyApiFallback: {
    rewrites: [{from: /^\/$/, to: '/index.html'}],
  },
  setup: function(app) {
    app.use('/static/dist/static/fonts', function(req, res) {
      res.redirect('/static/fonts' + req.originalUrl.substring(25));
    })
    app.use('/dist', function(req, res) {
      res.redirect('/static' + req.originalUrl);
    })
  },
  stats: { colors: true },
});
server.listen(3000, "0.0.0.0", function() {
});
