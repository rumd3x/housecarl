var path = require('path');
var logger = require('morgan');
var express = require('express');
var favicon = require('serve-favicon');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var expressLayouts = require('express-ejs-layouts')


var apiRouter = require('./routes/api');
var dashboardRouter = require('./routes/dashboard');
var healthRouter = require('./routes/health');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.json());
app.use(expressLayouts);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', dashboardRouter);
app.use('/api', apiRouter);
app.use('/health', healthRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.error(err.stack);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// var teste = async () => {
//   console.log("teste");
//   setTimeout(teste, 1000);
// }

// teste();

module.exports = app;
