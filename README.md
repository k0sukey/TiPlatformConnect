# TiPlatformConnect (forked twitter-titanium)
* Replaced jsOAuth-1.3.1.js to jsOAuth-1.3.3.js, and customize for Titanium Mobile(Content-Type, Ti.Network.createHTTPClient())
* twitter.js using jsOAuth.getAccessTokenKey() and jsOAuth.getAccessTokenSecret(), and update_with_media support!
* Added tumblr.js using OAuth(not XAuth). But photo upload yet...
* Added mixi.js. Mixi is Japanese SNS
* Added foursquare.js
* Added flickr.js. But in development...
* Added github.js
* Added linkedin.js
* Rewrite the app.js
* Extend platform.request(path, params, headers, httpVerb, callback); path is replaced url possible. Added headers.

## How to use

See Resouces/app.js

## twitter.js

update_with_media support! How to Resouces/app.js

## tumblr.js

Required default callback URL in Tumblr application setting page. No need to in the library properties.

## mixi.js

Required callback url in the library properties. Required access token refresh(only mixi.js), how to Resouces/app.js.

## foursquare.js

Required callback url in Foursquare application setting page, And need to in the library properties.

## flickr.js

Required callback url in the library properties.

## github.js

Required callback URL in Github application setting page, And need in the library properties.

## linkedin.js

Not required callback URL. 

## Thanks
* Original twitter-titanium by @ebryn
* jsOAuth by @bytespider
