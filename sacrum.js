!function(__global__, server) {

// =============================================================== Utilities ===

var DOMBuilder = (server ? require('DOMBuilder') : __global__.DOMBuilder)
  , forms = (server ? require('newforms') : __global__.forms)

var slice = Array.prototype.slice
  , toString = Object.prototype.toString

/**
 * Binds a function with a calling context and (optionally) some curried arguments.
 */
function bind(fn, ctx) {
  var curried = null
  if (arguments.length > 2) {
    curried = slice.call(arguments, 2)
  }
  var f = function() {
    if (curried) {
      return fn.apply(ctx, curried.concat(slice.call(arguments)))
    }
    return fn.apply(ctx, arguments)
  }
  f.func = fn
  f.boundTo = ctx
  return f
}

/**
 * Makes a constructor inherit another constructor's prototype without having
 * to actually use the constructor.
 */
function inherits(child, parent) {
  var F = function() {}
  F.prototype = parent.prototype
  child.prototype = new F()
  child.prototype.constructor = child
  child.__super__ = parent.prototype
  return child
}

/**
 * Inherits inherit another constructor's prototype sets its prototype and
 * constructor properties in one fell swoop. If a child constructor is not
 * provided via prototypeProps.constructor, a new constructor will be created
 * for you.
 */
function subclass(parent, prototypeProps, constructorProps) {
  var child
  if (prototypeProps && prototypeProps.hasOwnProperty('constructor')) {
    child = prototypeProps.constructor
  } else {
    // Create a new constructor if one wasn't given
    child = function() { return parent.apply(this, arguments) }
  }

  // Inherit constructor properties
  extend(child, parent)

  // Inherit the parent's prototype
  inherits(child, parent)

  // Add prototype properties, if given
  if (prototypeProps) {
    extend(child.prototype, prototypeProps)
  }

  // Add constructor properties, if given
  if (constructorProps) {
    extend(child, constructorProps)
  }

  return child
}

/**
 * Creates or uses a child constructor to inherit from the the call context
 * object, which is expected to be a constructor.
 */
function extendConstructor(prototypeProps, constructorProps) {
  var child = subclass(this, prototypeProps, constructorProps)
  child.extend = this.extend
  return child
}

/**
 * Special case extension function for Models - prototypeProps is required and
 * is expected to contain a Meta property containing Model options, defining at
 * least a name property.
 */
function extendModelConstructor(prototypeProps, constructorProps) {
  // Prepare ModelOptions for the extended Model
  constructorProps = constructorProps || {}
  var options = new ModelOptions(prototypeProps.Meta)
  delete prototypeProps.Meta
  prototypeProps._meta = constructorProps._meta = options

  return extendConstructor.call(this, prototypeProps, constructorProps)
}

// Assign extend constructor functions to hoisted constructors
Views.extend = extendConstructor
Model.extend = extendModelConstructor

/**
 * Copies properties from one object to another.
 */
function extend(dest, src) {
  for (var prop in src) {
    dest[prop] = src[prop]
  }
  return dest
}

/**
 * Pairs up items from two lists.
 */
function zip(a1, a2) {
  var l = Math.min(a1.length, a2.length)
    , zipped = []
  for (var i = 0; i < l; i++) {
    zipped.push([a1[i], a2[i]])
  }
  return zipped
}

function isArray(o) {
  return toString.call(o) == '[object Array]'
}

function isFunction(o) {
  return toString.call(o) == '[object Function]'
}

function isRegExp(o) {
  return toString.call(o) == '[object RegExp]'
}

function isString(o) {
  return toString.call(o) == '[object String]'
}

/**
 * Finds all matches againt a RegExp, returning captured groups if present.
 */
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
  return formatArr(s, slice.call(arguments, 1))
}
function formatArr(s, args) {
  var i = 0
  return s.replace(formatRE, function() { return args[i++] })
}
function formatObj(s, obj) {
  return s.replace(formatObjRE, function(m, p) { return obj[p] })
}

// ================================================================== Models ===

/**
 * Base constructor for models - doesn't actually do much yet.
 */
function Model(props) {
  extend(this, props)
}

/**
 * Meta-info about a model.
 */
function ModelOptions(meta) {
  this.meta = meta
  this.name = meta.name
  this.namePlural = meta.namePlural || format('%ss', meta.name)
}

// ----------------------------------------------- Model Storage / Retrieval ---

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

// -----------------------------------------------------------Models & Forms ---

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
 * instance properties:
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
 * @param {Object} props instance properties.
 */
function Views(props) {
  extend(this, props)
}

Views.prototype.name = 'Views'

/**
 * Default tagName for this Views' element if it needs to be automatically
 * created.
 */
Views.prototype.tagName = 'div'

/**
 * Renders a DOMBuilder template with the given context data.
 * @param {string} templateName the name of a DOMBuilder template to render.
 * @param {Object} context template rendering context data.
 * @param {Object.<string, Function>=} named event handling functions - if
 *     provided, these functions will be bound to this Views instance and
 *     addded to the template context as an 'events' property.
 */
Views.prototype.render = function(templateName, context, events) {
  context = context || {}
  if (events) {
    for (var name in events) {
      var event = events[name]
      if (event == null) {
        this.warn('Event', name, 'for use with', templateName, 'is', event)
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
  var contents = this.render(templateName, context, events)
  // We don't place contents into an element on the server as we never want to
  // store state on view instances, since they're shared across all users.
  if (server) {
    return contents
  }
  this._ensureElement()
  return this.replaceContents(this.el, contents)
}

/**
 * Replaces the contents of an element and returns it.
 */
Views.prototype.replaceContents = function(el, contents) {
  if (isString(el)) {
    el = document.getElementById(el)
  }
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
  // If given a list of contents, wrap it in a DocumentFragment so it can be
  // appended in one go.
  if (isArray(contents)) {
    contents = DOMBuilder.fragment(contents)
  }
  else if (isString(contents)) {
    contents = DOMBuilder.textNode(contents)
  }
  el.appendChild(contents)
  return el
}

/**
 * Ensures this Views instance has an el property which contents can be added
 * to.
 */
Views.prototype._ensureElement = function() {
  if (!this.el) {
    this.el = DOMBuilder.createElement(this.tagName)
  }
}

/**
 * Logs debug information with this Views' name.
 */
Views.prototype.log = function() {
  console.log.apply(console,
                    [this.name].concat(slice.call(arguments)))
}

/**
 * Logs warning information with this Views' name.
 */
Views.prototype.warn = function(message) {
  console.warn.apply(console,
                     [this.name].concat(slice.call(arguments)))
}

/**
 * Logs error information with this Views' name.
 */
Views.prototype.error = function(message) {
  console.error.apply(console,
                      [this.name].concat(slice.call(arguments)))
}


// ==================================================================== URLs ===

var namedParamRE = /:([\w\d]+)/g
  , escapeRE = /[-[\]{}()*+?.,\\^$|#\s]/g

/**
 * Thrown when a URLResolver fails to resolve a URL against known URL patterns.
 */
function Resolver404(path, tried) {
  this.path = path
  this.tried = tried || null
}
Resolver404.prototype.toString = function() {
  return 'Resolver404 on ' + this.path
}

/**
 * Thrown when a URL can't be reverse matched.
 */
function NoReverseMatch(message) {
  this.message = message
}
NoReverseMatch.prototype.toString = function() {
  return 'NoReverseMatch: ' + this.message
}

/**
 * Holds details of a successful URL resolution.
 */
function ResolverMatch(func, args, urlName) {
  this.func = func
  this.args = args
  this.urlName = urlName
}

// ---------------------------------------------------------- Implementation ---

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
  this.regex = new RegExp('^' + patternToRE.call(this, pattern) + '$')

  if (isFunction(callback)) {
    this.callback = callback
    this.callbackName = null
  }
  else {
    this.callback = null
    this.callbackName = callback
  }

  this.name = name
}

URLPattern.prototype.toString = function() {
  return formatObj('[object URLPattern] <{name} "{pattern}">', this)
}

/**
 * Retrieves a named view function for this pattern from a context object,
 * binding it to the object.
 */
URLPattern.prototype.addContext = function(context) {
  if (!context || !this.callbackName) {
    return
  }
  this.callback = bind(context[this.callbackName], context)
}

/**
 * Resolves a URL fragment against this pattern, returning matched details if
 * resolution succeeds.
 */
URLPattern.prototype.resolve = function(path) {
  var match = this.regex.exec(path)
  if (match) {
    return new ResolverMatch(this.callback, match.slice(1), this.name)
  }
}

/**
 * Resolves a list of URL patterns when a root URL pattern is matched.
 */
function URLResolver(pattern, urlPatterns) {
  this.pattern = pattern
  // Resolvers start by matching a prefix, so anchor to start of the input
  this.regex = new RegExp('^' + patternToRE.call(this, pattern))
  this.urlPatterns = urlPatterns
  this._reverseLookups = null
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
          , revLookupParams = revLookup[0]
          , revLookupPattern = revLookup[1]
        lookups[name] = [urlPattern.namedParams.concat(revLookupParams),
                         pattern + revLookupPattern]
      }
    }
    else if (urlPattern.name !== null) {
      lookups[urlPattern.name] = [urlPattern.namedParams, pattern]
    }
  }
  this._reverseLookups = lookups
}

/**
 * Getter for reverse lookup information, which populates the first time it's
 * called.
 */
URLResolver.prototype.getReverseLookups = function() {
  if (this._reverseLookups === null) {
    this._populate()
  }
  return this._reverseLookups
}

/**
 * Resolves a view function to handle the given path.
 */
URLResolver.prototype.resolve = function(path) {
  var tried = []
    , match = this.regex.exec(path)
  if (match) {
    var args = match.slice(1)
      , subPath = path.substring(match[0].length)
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

/**
 * Performs a reverse lookuup for a named UR pattern with given arguments,
 * constructing a URL fragment if successful.
 */
URLResolver.prototype.reverse = function(name, args) {
  args = args || []
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
    return formatArr(pattern.replace(namedParamRE, '%s'), args)
  }
  throw new NoReverseMatch(format(
      'Reverse for "%s" with arguments [%s] not found.'
    , name
    , args.join(', ')
    ))
}

/**
 * Initialises the root resolver the first time it's needed.
 */
function getResolver() {
  if (URLConf.resolver === null) {
    URLConf.resolver = new URLResolver('/', URLConf.patterns)
  }
  return URLConf.resolver
}


// -------------------------------------------------------------- Public API ---

/**
 * Application URL patterns should be set in URLConf.patterns.
 */
var URLConf = {
  patterns: null
, resolver: null
}

/**
 * Creates a list of URL patterns, which can be specified using the url function
 * or an array with the same contents as that function's arguments.
 *
 * View names can be specified as strings to be looked up from a context object
 * (usually a Views instance), which should be passed as the first argument,
 * otherwise, it should be null.
 */
function patterns(context) {
  var args = slice.call(arguments, 1)
    , patternList = []
    , pattern
  for (var i = 0, l = args.length; i < l; i++) {
    pattern = args[i]
    if (isArray(pattern)) {
      pattern = url.apply(null, pattern)
      pattern.addContext(context)
    }
    else if (pattern instanceof URLPattern) {
      pattern.addContext(context)
    }
    patternList.push(pattern)
  }
  return patternList
}

/**
 * Creates a URL pattern or roots a list of patterns to the given pattern if
 * a list of views.
 */
function url(pattern, view, name) {
  if (isArray(view)) {
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

/**
 * Resolves a given URL.
 */
function resolve(path) {
  return getResolver().resolve(path)
}

/**
 * Reverse-resolves the URL pattern with the given name and arguments, returning
 * a URL.
 */
function reverse(name, args, prefix) {
  args = args || []
  prefix = prefix || '/'
  var resolver = getResolver()
  return format('%s%s', prefix , resolver.reverse(name, args))
}

/**
 * Event handler which prevents default submissions which would usually result
 * in a new HTTP request and performs URL resolution of the target URL to
 * determine which view function should be invokved.
 *
 * For form submissions, form data is collected from the form and passed as the
 * last argument to the view function.
 */
function handleURLChange(e) {
  console.log('handleURLChange', e)
  e.preventDefault()
  var el = e.target
    , tagName = el.tagName.toLowerCase()
  try {
    if (tagName == 'a') {
      var url = el.getAttribute('href')
      console.log('Resolving a/@href', url)
      var match = resolve(url)
      match.func.apply(null, match.args)
      // TODO History
    }
    else if (tagName == 'form') {
      var url = el.getAttribute('action')
        , formData = forms.formData(el)
      console.log('Resolving form/@action', url, formData)
      var match = resolve(url)
      match.func.apply(null, match.args.concat([formData]))
      // TODO History
    }
    else {
      console.error('Unknown target element for URL change', tagName, el)
    }
  }
  catch(err) {
    console.error('Exception handling URL change', err)
  }
}

var templateAPI = DOMBuilder.modes.template.api

/**
 * Resolves a URL with the given arguments (if any) and returns it or adds it
 * to the context.
 */
function URLNode(urlName, args, options) {
  args = args || []
  options = extend({as: null}, options || {})
  this.urlName = new templateAPI.TextNode(urlName)
  this.args = []
  for (var i = 0, l = args.length; i < l; i++) {
    this.args.push(new templateAPI.TextNode(args[i]))
  }
  this.as = options.as
}
inherits(URLNode, templateAPI.TemplateNode)

URLNode.prototype.render = function(context) {
  var urlName = this.urlName.render(context).join('')
  var args = []
  for (var i = 0, l = this.args.length; i < l; i++) {
    args.push(this.args[i].render(context).join(''))
  }
  var url = reverse(urlName, args)
  if (this.as) {
    context.set(this.as, url)
    return []
  }
  return url
}

extend(DOMBuilder.template, {
  /**
   * Provides access to the handleURLChange function in templates.
   */
  $resolve: handleURLChange
  /**
   * Provides access to construct a URLNode in templates.
   */
, $url: function(urlName, args, options) {
    return new URLNode(urlName, args, options)
  }
})

// ================================================================== Export ===

var Sacrum = {
  util: {
    bind: bind
  , inherits: inherits
  , subclass: subclass
  , extendConstructor: extendConstructor
  , extend: extend
  , zip: zip
  , isArray: isArray
  , isFunction: isFunction
  , isRegExp: isRegExp
  , isString: isString
  , findAll: findAll
  , format: format
  , formatArr: formatArr
  , formatObj: formatObj
  }
, Model: Model
, ModelOptions: ModelOptions
, Storage: Storage
, Query: Query
, Views: Views
, Resolver404: Resolver404
, NoReverseMatch: NoReverseMatch
, ResolverMatch: ResolverMatch
, URLPattern: URLPattern
, URLResolver: URLResolver
, URLConf: URLConf
, patterns: patterns
, url: url
, resolve: resolve
, reverse: reverse
, handleURLChange: handleURLChange
, URLNode: URLNode
}

if (server) {
  module.exports = Sacrum
}
else {
  __global__.Sacrum = Sacrum
}

}(this, !!(typeof module != 'undefined' && module.exports))
