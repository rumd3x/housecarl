const path = require('path')
const logger = require('morgan')
const express = require('express')
const var_dump = require('var_dump')
const favicon = require('serve-favicon')
const createError = require('http-errors')
const cookieParser = require('cookie-parser')
const expressLayouts = require('express-ejs-layouts')


const apiRouter = require('./routes/api')
const healthRouter = require('./routes/health')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(express.json())
app.use(expressLayouts)
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api', apiRouter)
app.use('/health', healthRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  err.status = err.status || 500
  res.locals.error = err

  var_dump(err)

  // render the error page
  res.status(err.statusCode || 500)
  res.render('error')
});


module.exports = app
