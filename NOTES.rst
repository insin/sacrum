=====
Notes
=====

TODOs and musings.

URLs
====

- URL-View function mapping.
- Allow Views to specify their own URLs.
- Named URLs for decoupling.
- Patch a $url template function into DOMBuilder.template

Storage & Retrieval
===================

Still need to choose a means of storing data properly - current Storage is a
cobbled-together API to get up and running with other components and allow
use of newforms' ModelChoiceField.

- Relational? Document-based? Data store? Key/value store?
- Redis? Will be using it for other stuff anyway.

Easy localStorage support is a must-have.

Models
======

Do we want to go down the Django route of being able to tell the app exactly
what the models should look type?

- Could port ModelForms to newforms.
- Depends on storage decisions - don't want to get all relational if we don't
  have to.

A list of field names or a get/set with attributes held as an internal object
will at least be required so we can put all sorts of stuff into instances as
properties.

Node.js
=======

How can we make rendering and views easily reusable on Node to generate full
pages so our supposedly single-page apps can also work without JavaScript and
be indexable while using proper URLs?

Views
-----

- Use a default full-page template, which should be empty when running in
  browsers.

  - Forcing all templates to extend - not so good for client-only +
    localstorage apps. Could do it programmatically.

- Each View needs to know how to build its complete structure, with the full page
  rendered in Node, but only the changing content in the browser.

Event Handlers
--------------

- Define events as paths to event handling functions rather than functions
  themselves.
- DOMBuilder HTML mode event handling helpers will automatically craete IDs on
  any elements which have event attribtues defined.
- Given the same code will be available in the browser, should be possible to
  hook the appropriate handlers up based on a combination of the above, plus any
  wiggle room which needs to be added.

Required Libs
=============

This will improve as DOMBuilder and newforms improve.

- Template filters
- More fine-grained/responsive validation.

Cool Stuff
==========

What do we want to do once the boring stuff is working?

- Redis! Store all sorts of real-time data without feeling icky.
- Socket.io! More real-time shenanigans.

Stuff:

- Notification that an object is being edited concurrently/ability to grab a
  temporary lock before that happens.
- View other people's usage in real-time.
- Real-time! I just like typing it!