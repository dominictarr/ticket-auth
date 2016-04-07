var pl = require('pull-level')
var Cookie = require('cookie')
var crypto = require('crypto')
var timestamp = require('monotonic-timestamp')
var pull = require('pull-stream')

function isString (s) {
  return 'string' === typeof s
}

function random () {
  return crypto.randomBytes(20).toString('hex')
}

function createCookie(value) {
  return (
    'cookie='+value
  + ';Path=/'
  + ';Expires='+new Date(Date.now() + 60e3*60*24*365)

  //Security

  //prevents this cookie being sent from another page.
  // https://tools.ietf.org/html/draft-west-first-party-cookies-03
  + 'FirstPartyOnly;'

  // Don't expose cookie to js, prevents XSS attacks from stealing the cookie.
  + 'HttpOnly;' //don't expose to js

  //do not send over http. https only.
  // + 'Secure;' //this should really be used, but need https.
  )
}


module.exports = function (db) {

  var tickets = {}, byId = {}, stubs = {}

  //administrator role creates a new access token
  //TICKET
  //this can have a time limit (say, 3 days) or number of uses.

  function create (opts, cb) {
    if('string' === typeof opts)
      opts = {resource: opts, uses: 1, expires: 0}
    if('string' !== typeof opts.resource)
      return cb(new Error('resource id must be provided'))

    opts.created = Date.now()

    var ticket = random()
    db.batch([
      {
        key: ['ticket', ticket],
        value: opts,
        type: 'put'
      },
      {key: ['resource', opts.resource], value: ticket, type: 'put'},
    ], function (err) {
      if(err) return cb(err)
      return cb(null, ticket)
    })
  }

  //user visits url, access token is used and cookie is created.
  //TICKET STUB.
  //now stub (cookie) represents
  function redeem (ticket, cb) {
    //read the ticket, check how many tickets are allowed.
    db.get(['ticket', ticket], function (err, opts) {
      if(err) return cb(new Error('unknown or expired ticket'))

      if(opts.expires) {
        var expiry = opts.created + opts.expires

        if(expiry && (Date.now() > expiry))
          return cb(new Error('ticket has expired:'+expiry + ' ' + Date.now()))
      }
      if(opts.uses)
        if(opts.stubs && opts.stubs.length >= opts.uses)
          return cb(new Error('ticket already used:' +opts.uses + ' times'))

      var stub = random()
      db.batch([
        {
          key: ['ticket', ticket],
          value: {
            resource: opts.resource, uses: opts.uses,
            created: opts.created, expires: opts.expires,
            stubs: stub.concat(opts.stubs)
          }, type: 'put'
        },
        {key: ['stub', stub], value: opts.resource, type: 'put'}
      ], function (err) {
        if(err) cb(err)
        else cb(null, createCookie(stub))
      })
    })
  }

  //TODO: add feature to revoke tickets and stubs.

  return  {
    create: create,
    redeem: redeem,
    check: function (cookie, cb) {
      //check whether this cookie is valid.
      cookie = isString(cookie) ? Cookie.parse(cookie).cookie : null
      if(!cookie) return cb(new Error('no cookie'))
      db.get(['stub', cookie], function (err, id) {
        if(!id) return cb(new Error('unknown cookie'))
        cb(null, id)
      })
    },
    dump: function () {
      return pl.read(db)
    }
  }
}


