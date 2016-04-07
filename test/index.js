
var tape = require('tape')
var Auth = require('../')
var Level = require('level-test')()
var SubLevel = require('level-sublevel/bytewise')
var Cookie = require('cookie')
var db = SubLevel(Level('auth', {valueEncoding: 'json'}))
var auth = Auth(db)

tape('create a token', function (t) {
  auth.create('resource', function (err, ticket) {
    if(err) throw err
    t.ok(ticket)
    console.log('redeem')
    auth.redeem(ticket, function (err, cookie) {
      if(err) throw err
      console.log('check')
      auth.check(cookie, function (err, resource) {
        if(err) throw err
       t.equal(resource, 'resource')
        t.end()
      })
    })
  })
})

tape('create a token, once', function (t) {
  auth.create('resource', function (err, ticket) {
    if(err) throw err
    t.ok(ticket)
    auth.redeem(ticket, function (err, cookie) {
      if(err) throw err
      auth.redeem(ticket, function (err) {
        t.ok(err)
        t.end()
      })
    })
  })
})


tape('create a token', function (t) {
  auth.create('resource', function (err, ticket) {
    if(err) throw err
    t.ok(ticket)
    auth.redeem(ticket, function (err, cookie) {
      if(err) throw err
      var c = Cookie.parse(cookie)
      
      var _value = Cookie.serialize('cookie', c.cookie + '_BROKEN', cookie)
      auth.check(_value, function (err, resource) {
        t.ok(err)
        t.end()
      })
    })
  })
})


tape('create a token, can be used multiple times', function (t) {

  auth.create({resource: 'things', uses: 0}, function (err, ticket) {
    if(err) throw err
    auth.redeem(ticket, function (err) {
        if(err) throw err
        auth.redeem(ticket, function (err, cookie) {
          if(err) throw err
          auth.redeem(ticket, function (err, cookie) {
            if(err) throw err
            t.end()
          })
        })
    })

  })

})






