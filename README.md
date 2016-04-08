# cookie-auth

simple http authentication/authorization that uses cookies intsead of passwords.

Works exactly like tickets do when you go to a movie theater or catch a bus.
First you get a ticket, in the form of a url, which can be emailed to you.
Then that ticket is _redeemed_, you request that url and a cookie is
written with the response, like the ticket being torn when you enter
the theater. Now that cookie shows you are authorized to use the website,
like the ticket stub shows you are authorized to watch the movie.

## Example

`ticket-auth` just encapsulates the logic around tickets,
but doesn't handle sending the tickets to users (i.e. via email)

``` js
  var Tickets = require('ticket-auth')

  //initialize database
  var Level = require('level')
  var SubLevel = require('level-sublevel')
  var db = SubLevel(level(path, {valueEncoding: 'json'}))

  //create Tickets instance
  var auth = Tickets(db)

  //a resource can be any string.
  var resource = 'test resoruce'

  //create a ticket to a resoruce
  auth.create(resource, function (err, ticket) {
    //redeem that ticket into a ticket_stub (which is a cookie)
    auth.redeem(ticket, function (err, ticket_stub) {
      //check which resource a ticket_stub accesses
      auth.check(ticket_stub, function (err, _resource) {
        assert.equal(_resource, resource)
      })
    })
  })
```

here is an example of redeeming a ticket.

``` js
  var Tickets = require('ticket-auth')

  //initialize database
  var Level = require('level')
  var SubLevel = require('level-sublevel')
  var db = SubLevel(level(path, {valueEncoding: 'json'}))

  //create Tickets instance
  var auth = Tickets(db)

  var Tiny = require('tiny-route') //router
  var Stack = require('stack') //middleware

  //here is the actual http server!

  require('http').createServer(Stack(
    //url for redeeming a ticket. /redeem/<ticket_code>
    Tiny.get(/^\/redeem\/([0-9a-f]+)/, function (req, res, next) {
      api.auth.redeem(req.params[0], function (err, cookie) {
        if(err) return next(err)
        //ticket is redeemed! set it as a cookie, 
        res.setHeader('Set-Cookie', cookie)
        res.setHeader('Location', '/') //redirect to the login page.
        res.statusCode = 303
        res.end()
      })
    }),
    function (req, res) {
    })
  ).listen(8000)
```

# testing with curl

note, to make curl work with cookies must set a "cookie jar"
it seems: `-c file` sets the file to write to,
and `-b file` sets the file to write to. You'd think you'd want
those both to be the same file!
The man page is not clear about this at all.

`curl localhost:8000 -c ./jar -b ./jar`

the man page says that -c should work, but it only seems to write the
jar but not read it! once the cookie is written, you can use -b or --cookie

but that doesn't make sense because there isn't even a b in cookie.

## what are "cookies": crash course

A cookie is always `key=value` and has "attributes"
that tell the browser what to do. you need `Expires={date}` and `Path=/`.

Without `Expires` set in the future, the cookie will be a "session cookie"
and will expire after the browser exits.

Without `Path=/` the browser will only send the cookie on the path
that it got it from.

## 

Authorization uses "cookies". Cookies are something delicious you eat,
so it really doesn't make any sense to call things used for authentication
"cookies", especially when those things behave a lot like a familiar ticket
and ticket stub, as is familiar to people who have ridden a bus or gone to
the movies.

first a "ticket" is created. this is a high entropy (unguessable) token.
```
node index.js auth.create <resource>
1d67c0e114b10dc9cc96ea9cd2966f76c42539db
```
in this case, `<resource>` should probably be an email address.
this token would be emailed to the user, embedded in a link back to the server.

`http://localhost:8000/redeem/1d67c0e114b10dc9cc96ea9cd2966f76c42539db`
the server creates a cookie and sends it to you in the response,
which is also a redirect to the rest of the app (though it could easily
be a redirect to edit your newly created profile)

This is exactly like tearing off the ticket and giving you back the ticket
stub when you enter the theater. Possession of the ticket stub shows you are
authorized to see the movie.

To can test this using `curl`

```

curl localhost:8000/redeem/1d67c0e114b10dc9cc96ea9cd2966f76c42539db -c jar -b jar -v
*   Trying 127.0.0.1...
* Connected to localhost (127.0.0.1) port 8000 (#0)
> GET /redeem/1d67c0e114b10dc9cc96ea9cd2966f76c42539db HTTP/1.1
> Host: localhost:8000
> User-Agent: curl/7.43.0
> Accept: */*
> 
< HTTP/1.1 200 OK
* Replaced cookie cookie="437734b0886caf51a8961b1033abb392b07333c1" for domain localhost, path /, expire 1491397335
< Set-Cookie: cookie=437734b0886caf51a8961b1033abb392b07333c1;Path=/;Expires=Wed Apr 05 2017 13:02:15 GMT+1200 (NZST)FirstPartyOnly;HttpOnly;
< Location: /
< Date: Tue, 05 Apr 2016 01:02:15 GMT
< Connection: keep-alive
< Content-Length: 0
< 
* Connection #0 to host localhost left intact
```

note that `curl` can be quite finnecky about using cookies
and to both write and read cookies you need to use `-c jar -b jar`
arguments where `jar` is the "cookie jar"


## License

MIT

