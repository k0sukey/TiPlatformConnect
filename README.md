# TiPlatformConnect (forked twitter-titanium)
* Replaced jsOAuth-1.3.1.js to jsOAuth-1.3.3.js, and customize for Titanium Mobile
* twitter.js using jsOAuth.getAccessTokenKey() and jsOAuth.getAccessTokenSecret(), and update_with_media support!
* Added tumblr.js using OAuth(not XAuth). Photo upload yet... Dose not change how to use twitter.js
* Added foursquare.js. In development... Dose not change how to use twitter.js
* Added flickr.js. In development... Dose not change how to use twitter.js, and extend getUserNsid(), getUsername().
* Rewrite the app.js

## How to use

See Resouces/app.js

## twitter.js

update_with_media support!

## tumblr.js

Required default callback URL in Tumblr application setting page. No need to in the library properties.

## foursquare.js

Required callback url in Foursquare application setting page. Need to in the library properties.

## flickr.js

Required callback url in the library properties.

## Thanks
* Original twitter-titanium by @ebryn
* jsOAuth by @bytespider
