# cookie-auth

simple http authentication/authorization based on cookies (and no passwords)

# notes

returns a new high entropy url, associated with a resource (email address)

when someone accesses that resource.
that resource is associated with a cookie in their browser.
(record user agent, so that it's possible to show the user
a list of logins they currently have)

---

note, to make curl work with cookies must set a "cookie jar"
it seems: `-c file` sets the file to write to,
and `-b file` sets the file to write to. You'd think you'd want
those both to be the same file!
The man page is not clear about this at all.

`curl localhost:8000 -c ./jar -b ./jar`

the man page says that -c should work, but it only seems to write the
jar but not read it! once the cookie is written, you can use -b or --cookie

but that doesn't make sense because there isn't even a b in cookie.
anyway, "cookie" is one of the worst named things in the web stack.
it's a damn ticket stub!
nobody ever gave you a cookie with a seat number on it.

---

What you need to know about cookies.

A cookie is always `key=value` and has "attributes"
that tell the browser what to do. you need `Expires={date}` and `Path=/`.

Without `Expires` set in the future, the cookie will be a "session cookie"
and will expire after the browser exits.

Without `Path=/` the browser will only send the cookie on the path
that it got it from.

*/

## authorization

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

This is exactly like tearing off the ticket and givening you back the ticket
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


