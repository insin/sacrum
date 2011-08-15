// =============================================================== Utilities ===

/**
 * Replaces the contents of an element.
 */
function replace(el, content) {
  if (typeof el == 'string') {
    el = document.getElementById(el)
  }
  el.innerHTML = ''
  if (content instanceof Array) {
    content = DOMBuilder.fragment(content)
  }
  else if (typeof content == 'string') {
    content = document.createTextNode(content)
  }
  el.appendChild(content)
}

/**
 * Binds a function with a calling context and (optionally) some curried arguments.
 */
function bind(fn, ctx) {
  var curried = null
  if (arguments.length > 2) {
    curried = Array.prototype.slice.call(arguments, 2)
  }
  var f = function() {
    if (curried) {
      return fn.apply(ctx, curried.concat(Array.prototype.slice.call(arguments)))
    }
    return fn.apply(ctx, arguments)
  }
  f.boundTo = ctx
  return f
}

/**
 * Inherits another constructor's prototype without having to construct.
 */
function inherits(child, parent) {
  var F = function() {}
  F.prototype = parent.prototype
  child.prototype = new F()
  child.prototype.constructor = child
  return child
}

/**
 * Copies properties from one object to another.
 */
function extend(dest, src) {
  for (var prop in src) {
    dest[prop] = src[prop]
  }
  return dest
}

function isArray(o) {
  return Object.prototype.toString.call(o) == '[object Array]'
}

function isFunction(o) {
  return Object.prototype.toString.call(o) == '[object Function]'
}

function isRegExp(o) {
  return Object.prototype.toString.call(o) == '[object RegExp]'
}

function isString(o) {
  return Object.prototype.toString.call(o) == '[object String]'
}

function findAll(re, str, flags) {
  if (!isRegExp(re)) {
    re = new RegExp(re, flags)
  }
  var match = null
    , matches = []
  while ((match = re.exec(str)) !== null) {
    switch (match.length) {
      case 1:
        matches.push(match[0])
        break
      case 2:
        matches.push(match[1])
        break
      default:
        matches.push(match.slice(1))
    }
    if (!re.global) {
      break
    }
  }
  return matches
}

// Simple string formatting
var formatRE = /%s/g
  , formatObjRE = /{(\w+)}/g
function format(s) {
  return formatArr(s, Array.prototype.slice.call(arguments, 1))
}
function formatArr(s, args) {
  var i = 0
  return s.replace(formatRE, function() { return args[i++] })
}
function formatObj(s, obj) {
  return s.replace(formatObjRE, function(m, p) { return obj[p] })
}

// ==================================================================== URLs ===

var namedParamRE = /:([\w\d]+)/g
  , escapeRE = /[-[\]{}()*+?.,\\^$|#\s]/g

function Resolver404(path, tried) {
  this.path = path
  this.tried = tried || null
}
Resolver404.prototype.toString = function() {
  return 'Resolver404 on ' + this.path
}

function NoReverseMatch(message) {
  this.message = message
}
NoReverseMatch.prototype.toString = function() {
  return 'NoReverseMatch: ' + this.message
}


// ---------------------------------------------------------- Implementation ---

var URLConf = {
  patterns: null
, resolver: null
}

function getResolver() {
  if (URLConf.resolver === null) {
    URLConf.resolver = new URLResolver('/', URLConf.patterns)
  }
  return URLConf.resolver
}

/**
 * Converts a url pattern to source for a RegExp which matches the specified URL
 * fragment, capturing any named parameters.
 *
 * Also stores the names of parameters in the call context object for reference
 * when reversing.
 */
function patternToRE(pattern) {
  pattern = pattern.replace(escapeRE, '\\$&')
  // Store the names of any named parameters
  this.namedParams = findAll(namedParamRE, pattern)
  if (this.namedParams.length) {
    // The pattern has some named params, so replace them with appropriate
    // capturing groups.
    pattern = pattern.replace(namedParamRE, '([^\/]*)')
  }
  return pattern
}

/**
 * Associates a URL pattern with a callback function, generating a RegExp which
 * will match the pattern and capture named parameters.
 */
function URLPattern(pattern, callback, name) {
  this.pattern = pattern
  // Only full matches are accepted when resolving, so anchor to start and end
  // of the input.
  this.regex = new RegExp('^' + patternToRE.call(this, pattern) + '$', 'g')

  if (isFunction(callback)) {
    this.callback = callback
  }
  else {
    this.callback = null
    this._callbackName = callback
  }

  this.name = name
}

URLPattern.prototype.toString = function() {
  return formatObj('[object URLPattern] <{name} "{pattern}">', this)
}

URLPattern.prototype.addContext = function(context) {
  if (!context || !this._callbackName) {
    return
  }
  this.callback = bind(context[this._callbackName], context)
}

URLPattern.prototype.resolve = function(path) {
  var match = this.regex.exec(path)
  if (match) {
    return new ResolverMatch(this.callback, args = match.slice(1), this.name)
  }
}

/**
 * Resolves a list of URL patterns when a root URL pattern is matched.
 */
function URLResolver(pattern, urlPatterns) {
  this.pattern = pattern
  // Resolvers start by matching a prefix, so anchor to start of the input
  this.regex = new RegExp('^' + patternToRE.call(this, pattern), 'g')
  this.urlPatterns = urlPatterns
  this.reverseLookups = null
}

URLResolver.prototype.toString = function() {
  return formatObj('[object URLResolver] <{pattern}>', this)
}

/**
 * Populates expected argument and pattern information for use when reverse
 * URL lookups are requested.
 */
URLResolver.prototype._populate = function() {
  var lookups = {}
    , urlPattern
    , pattern
  for (var i = this.urlPatterns.length - 1; i >= 0; i--) {
    urlPattern = this.urlPatterns[i]
    pattern = urlPattern.pattern
    if (urlPattern instanceof URLResolver) {
      var reverseLookups = urlPattern.getReverseLookups()
      for (var name in reverseLookups) {
        var revLookup = reverseLookups[name]
          , revLookupMatches = revLookup[0]
          , revLookupPattern = revLookup[1]
        lookups[name] = [this.namedParams.concat(revLookupMatches[0]),
                         pattern + revLookupPattern]
      }
    }
    else if (urlPattern.name !== null) {
      lookups[urlPattern.name] = [urlPattern.namedParams, pattern]
    }
  }
  this.reverseLookups = lookups
}

URLResolver.prototype.getReverseLookups = function() {
  if (this.reverseLookups === null) {
    this._populate()
  }
  return this.reverseLookups
}

/**
 * Resolves a view function to handle the given path.
 */
URLResolver.prototype.resolve = function(path) {
  var tried = []
    , match = this.regex.exec(path)
  if (match) {
    var args = match.slice(1)
      , subPath = path.substring(this.regex.lastIndex)
      , urlPattern
      , subMatch
    for (var i = 0, l = this.urlPatterns.length; i < l; i++) {
      urlPattern = this.urlPatterns[i]
      try {
        subMatch = urlPattern.resolve(subPath)
        if (subMatch) {
          // Add any arguments which were captured by this instance's own path
          // RegExp.
          subMatch.args = args.concat(subMatch.args)
          return subMatch
        }
        tried.push([urlPattern])
      }
      catch (e) {
        if (!(e instanceof Resolver404)) throw e
        var subTried = e.tried
        if (subTried !== null) {
          for (var j = 0, k = subTried.length; j < k; j++) {
            tried.push([urlPattern, subTried[j]])
          }
        }
        else {
          tried.push([urlPattern])
        }
      }
    }
    throw new Resolver404(subPath, tried)
  }
  throw new Resolver404(path)
}

URLResolver.prototype.reverse = function(name, args) {
  var lookup = this.getReverseLookups()[name]
  if (lookup) {
    var expectedArgs = lookup[0]
      , pattern = lookup[1]
    if (args.length != expectedArgs.length) {
      throw new NoReverseMatch(format(
          'URL pattern named "%s" expects %s argument%s, but got %s: [%s]'
        , name
        , expectedArgs.length
        , expectedArgs.length == 1 ? '' : 's'
        , args.length
        , args.join(', ')
        ))
    }
    return format(pattern.replace(namedParamRE, '%s'), args)
  }
  throw new NoReverseMatch(format(
      'Reverse for "%s" with arguments [%s] not found.'
    , name
    , args.join(', ')
    ))
}

function ResolverMatch(func, args, urlName) {
  this.func = func
  this.args = args
  this.urlName = urlName
}

// -------------------------------------------------------------- Public API ---

function patterns(context) {
  var args = Array.prototype.slice.call(arguments, 1)
    , patternList = []
    , pattern
  for (var i = 0, l = args.length; i < l; i++) {
    pattern = args[i]
    if (isArray(pattern)) {
      pattern = url
    }
    else if (pattern instanceof URLPattern) {
      pattern.addContext(context)
    }
    patternList.push(pattern)
  }
  return patternList
}

function include(patterns) {
  return patterns
}

function url(pattern, view, name) {
  if (isArray(view)) {
    // For include() processing
    return new URLResolver(pattern, view)
  }
  else {
    if (isString(view)) {
      if (!view) {
        throw new Error('Empty URL pattern view name not permitted (for pattern ' + pattern + ')')
      }
    }
    return new URLPattern(pattern, view, name)
  }
}

function resolve(path) {
  return getResolver().resolve(path)
}

function reverse(name, args, prefix) {
  args = args || []
  prefix = prefix || '/'
  var resolver = getResolver()
  return format('%s%s', prefix , resolver.reverse(name, args))
}

// ================================================================== Models ===

/**
 * Base constructor for models - doesn't actually do much yet.
 */
function Model(attrs) {
  extend(this, attrs)
}

// ===================================================== Storage / Retrieval ===

/**
 * Stores and retrieves instances of the given model.
 */
function Storage(model) {
  this._store = {}
  this._idSeed = 1
  this.model = model
}

Storage.prototype.query = function() {
  return new Query(this)
}

/**
 * Generates a new id for a model instance and stores it.
 */
Storage.prototype.add = function(instance) {
  instance.id = this._idSeed++
  this._store[instance.id] = instance
  return instance
}

/**
 * Retrieves all model instances.
 */
Storage.prototype.all = function() {
  var a = []
  for (var id in this._store) {
    a.push(this._store[id])
  }
  return a
}

/**
 * Retrieves the model instance with the given id, or null if it doesn't exist.
 */
Storage.prototype.get = function(id) {
  return this._store[id] || null
}

/**
 * Removes the given model instance.
 */
Storage.prototype.remove = function(instance) {
  delete this._store[instance.id]
}

/**
 * A representation of a query on a Storage object, which can be used to obtain
 * query results or perform further retrieval.
 *
 * We need an object which has access to query results and a link to the means
 * of looking stuff up to hook up with newforms' ModelChoiceField.
 */
function Query(storage) {
  this.storage = storage
}

/**
 * Fetches query results - for now, always returns all instances in the storage.
 */
Query.prototype.__iter__ = function() {
  return this.storage.all()
}

Query.prototype.get = function(id) {
  return this.storage.get(id)
}

// =================================================================== Forms ===

// Let newforms know what our cobbled-together storage and retrieval looks like
extend(forms.ModelInterface, {
  throwsIfNotFound: false
, notFoundValue: null
, prepareValue: function(instance) {
    return instance.id
  }
, findById: function(modelQuery, id) {
    return modelQuery.get(id)
  }
})

// =================================================================== Views ===

/**
 * Base constructor for objects containing functions which implement display and
 * control logic. Generally, views are instantiated using Views.extend - you
 * shouldn't need to use this contructor directly unless you're writing a
 * specialised base constructor, such as ModelAdminViews.
 *
 * The base Views object provides functionality which expects the following
 * instance attributes:
 *
 * name (required)
 *    Name for the collection of view functions - for example, if you have a
 *    bunch of view functions which handle listing and editing Vehicle objects,
 *    a logical name would be 'VehicleViews'
 *
 * el (optinal)
 *    The element which contains the Views' contents, if appropriate.
 *
 * These don't have to be set at construction time - you could defer setting
 * them until the Views' init() method is called, if appropriate.
 *
 * @constructor
 * @param {Object} attrs instance attributes.
 */
function Views(attrs) {
  extend(this, attrs)
}

/**
 * Tracks views which have been created using Views.extend.
 */
Views._created = []

/**
 * Calls the init() function on each created Views object which has one.
 */
Views.initAll = function() {
  for (var i = 0, l = Views._created.length; i < l; i++) {
    if (typeof Views._created[i].init == 'function') {
      Views._created[i].init()
    }
  }
}

/**
 * Creates a new object which extends Views, with the given attributes.
 * @param {Object} attrs instance attributes.
 */
Views.extend = function(attrs) {
  console.log('Views.extend', attrs.name)
  var F = function(attrs) {
    Views.call(this, attrs)
  }
  inherits(F, Views)
  var views = new F(attrs)
  Views._created.push(views)
  return views
}

/**
 * Renders a template with the given context data.
 * @param {string} templateName the name of a template to render.
 * @param {Object} context template rendering context data.
 * @param {Object.<string, Function>=} named event handling functions - if
 *     provided, these functions will be bound to this Views instance and
 *     addded to the template context as an 'events' property.
 */
Views.prototype.render = function(templateName, context, events) {
  if (events) {
    for (var name in events) {
      var event = events[name]
      if (event == null) {
        this.warn(format('Event %s, for use with %s, is %s',
                         name, templateName, event))
      }
      else {
        events[name] = bind(event, this)
      }
    }
    context.events = events
  }
  return DOMBuilder.template.renderTemplate(templateName, context)
}

/**
 * Renders a template and displays the results in this Views' element.
 */
Views.prototype.display = function(templateName, context, events) {
  replace(this.el, this.render(templateName, context, events))
}

/**
 * Logs a message with this Views' name.
 */
Views.prototype.log = function(message) {
  console.log(this.name, message)
}

/**
 * Logs a warning message with this Views' name.
 */
Views.prototype.warn = function(message) {
  console.warn(this.name, message)
}
