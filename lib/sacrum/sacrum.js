var server = (typeof window == 'undefined')

var is = require('isomorph').is
  , object = require('isomorph').object
  , array = require('isomorph').array
  , format = require('isomorph').format
  , querystring = require('isomorph').querystring
  , Concur = require('Concur')
  , urlresolve = require('urlresolve')
  , DOMBuilder = require('DOMBuilder')
  , forms = require('newforms')

var slice = Array.prototype.slice
  , toString = Object.prototype.toString

// Monkeypatch a toDOM method for debugging 404 errors
urlresolve.Resolver404.prototype.toDOM = function() {
  var el = DOMBuilder.elements
  return DOMBuilder.fragment(
    el.P(this.toString() + ' - tried the following patterns:')
  , el.UL(el.LI.map(this.tried, function(tried) {
      array.flatten(tried)
      var patterns = []
      for (var i = 0, l = tried.length; i < l; i++) {
        patterns.push(tried[i].pattern)
      }
      return patterns.join(' ')
    }))
  )
}

// ================================================================== Models ===

/**
 * Meta-info about a model.
 */
function ModelOptions(meta) {
  this.meta = meta
  this.name = meta.name
  this.namePlural = meta.namePlural || meta.name + 's'
}

/**
 * Model definitions are expected contain a Meta property containing Model
 * options, defining at least a name property.
 */
function ModelMeta(prototypeProps, constructorProps) {
  // Prepare ModelOptions for the extended Model
  var options = new ModelOptions(prototypeProps.Meta)
  delete prototypeProps.Meta
  prototypeProps._meta = constructorProps._meta = options
}

/**
 * Base constructor for models - doesn't actually do much yet.
 */
var Model = Concur.extend({
  __meta__: ModelMeta
, constructor: function(props) {
    object.extend(this, props)
  }
})

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

Storage.prototype.update = function(instance) {}

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
object.extend(forms.ModelInterface, {
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
var Views = Concur.extend({
  constructor: function(props) {
    object.extend(this, props)
  }
})

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

Views.prototype.redirect = function(path) {
  if (server) {
    return new Redirect(path)
  }
  else {
    loadURL(path)
  }
}

function Redirect(path) {
  this.path = path
}
Redirect.prototype.toString = function() {
  return format('Redirect to %s', this.path)
}

/**
 * Replaces the contents of an element and returns it.
 */
Views.prototype.replaceContents = function(el, contents) {
  if (is.String(el)) {
    el = document.getElementById(el)
  }
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
  // If given a list of contents, wrap it in a DocumentFragment so it can be
  // appended in one go.
  if (is.Array(contents)) {
    contents = DOMBuilder.fragment(contents)
  }
  else if (is.String(contents)) {
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

/**
 * Placeholder for URL patterns. The furst use of either the resolve or reverse
 * function creates a URLResolver using the configured patterns.
 */
var URLConf = {
  patterns: []
, resolver: null
, resolve: function(path) {
    object.extend(this, urlresolve.getResolver(this.patterns))
    return this.resolve(path)
  }
, reverse: function(name, args, prefix) {
    object.extend(this, urlresolve.getResolver(this.patterns))
    return this.reverse(name, args, prefix)
  }
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
      var path = el.getAttribute('href')
      console.log('Resolving a/@href', path)
      var match = URLConf.resolve(path)
      match.func.apply(null, match.args)
      pushURLState(path)
    }
    else if (tagName == 'form') {
      var path = el.getAttribute('action')
        , formData = forms.formData(el)
      console.log('Resolving form/@action', path, formData)
      var match = URLConf.resolve(path)
      match.func.apply(null, match.args.concat([formData]))
      if (el.method.toUpperCase() != 'POST') {
        pushURLState(path, formData)
      }
    }
    else {
      console.error('Unknown target element for URL change', tagName, el)
    }
  }
  catch(err) {
    console.error('£rror handling URL change', err)
    alert(err)
  }
}

// TODO Hash/iframe fallbacks for non-pushState browsers & file: protocol

/**
 * Adds a URL to the history.
 */
function pushURLState(path, queryObj) {
  if (window.location.protocol == 'file:') {
    return
  }
  var loc = window.location
    , root = loc.protocol + '//' + loc.host
  if (queryObj && !is.Empty(queryObj)) {
    path += '?' + querystring.stringify(queryObj)
  }
  window.history.pushState({}, '', root + path)
}

/**
 * Executes the appropriate handler when the back button is used.
 */
function handlePopURLState(e) {
  var path = window.location.pathname
  console.log('Resolving onpopstate', path)
  var match = URLConf.resolve(path)
  match.func.apply(null, match.args)
}

/**
 * Executes the handler for the given URL and adds it to the history.
 */
function loadURL(path) {
  console.log('Resolving loadURL', path)
  var match = URLConf.resolve(path)
  match.func.apply(null, match.args)
  pushURLState(path)
}

var templateAPI = DOMBuilder.modes.template.api

/**
 * Resolves a URL with the given arguments (if any) and returns it or adds it
 * to the context.
 */
function URLNode(urlName, args, options) {
  args = args || []
  options = object.extend({as: null}, options || {})
  this.urlName = new templateAPI.TextNode(urlName)
  this.args = []
  for (var i = 0, l = args.length; i < l; i++) {
    this.args.push(new templateAPI.TextNode(args[i]))
  }
  this.as = options.as
}
object.inherits(URLNode, templateAPI.TemplateNode)

URLNode.prototype.render = function(context) {
  var urlName = this.urlName.render(context).join('')
  var args = []
  for (var i = 0, l = this.args.length; i < l; i++) {
    args.push(this.args[i].render(context).join(''))
  }
  var url = URLConf.reverse(urlName, args)
  if (this.as) {
    context.set(this.as, url)
    return []
  }
  return url
}

object.extend(DOMBuilder.template, {
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

module.exports = {
  Model: Model
, ModelOptions: ModelOptions
, Storage: Storage
, Query: Query
, Views: Views
, Redirect: Redirect
, URLConf: URLConf
, handleURLChange: handleURLChange
, pushURLState: pushURLState
, handlePopURLState: handlePopURLState
}
