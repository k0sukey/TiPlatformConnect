var exports = exports || this;
exports.Flickr = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === 'android', jsOAuth = require('jsOAuth-1.3.3');

	var Flickr = function(options) {
		var self;

		if (this instanceof Flickr) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Flickr Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.authorizeUrl = 'http://m.flickr.com/services/oauth/authorize';
		self.accessTokenKey = options.accessTokenKey;
		self.accessTokenSecret = options.accessTokenSecret;
		self.authorized = false;
		self.listeners = {};

		self.user_nsid = '';
		self.username = '';

		if (self.accessTokenKey && self.accessTokenSecret) {
			self.authorized = true;
		}

		options.requestTokenUrl = options.requestTokenUrl || 'http://www.flickr.com/services/oauth/request_token';
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Flickr.prototype;

	function createAuthWindow() {
		var self = this,
			oauth = this.oauthClient,
			webViewWindow = Ti.UI.createWindow({title: this.windowTitle}),
			webView = Ti.UI.createWebView(),
			loadingOverlay = Ti.UI.createView({
				backgroundColor: 'black',
				opacity: 0.7,
				zIndex: 1
			}),
			actInd = Titanium.UI.createActivityIndicator({
				height: 50,
				width: 10,
				message: 'Loading...',
				color: 'white'
			}),
			closeButton = Ti.UI.createButton({
				title: this.windowClose
			}),
			backButton = Ti.UI.createButton({
				title: this.windowBack
			});

		this.webView = webView;

		webViewWindow.leftNavButton = closeButton;

		actInd.show();
		loadingOverlay.add(actInd);
		webViewWindow.add(loadingOverlay);
		webViewWindow.open({modal: true});

		webViewWindow.add(webView);

		closeButton.addEventListener('click', function(e){
			webViewWindow.close();
			self.fireEvent('cancel', {
				success: false,
				error: 'The user cancelled.',
				result: null
			});
		});

		backButton.addEventListener('click', function(e){
			webView.goBack();
		});

		webView.addEventListener('beforeload', function(e){
			if (!isAndroid) {
				webViewWindow.add(loadingOverlay);
			}
			actInd.show();
		});

		webView.addEventListener('load', function(event){
			if (event.url.indexOf(self.authorizeUrl) === -1) {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (event.url.indexOf('oauth_verifier') !== -1) {
					if (!isAndroid) {
						webViewWindow.close();
					}

					var verifier = oauth.parseTokenRequest({ text: event.url.split('?')[1] }, undefined);
					oauth.setVerifier(verifier.oauth_verifier);
					oauth.accessTokenUrl = 'http://www.flickr.com/services/oauth/access_token';

					oauth.fetchAccessToken(function(data){
						var token = oauth.parseTokenRequest(data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([ token.oauth_token, token.oauth_token_secret ]);

						self.user_nsid = token.user_nsid;
						self.username = token.username;

						self.fireEvent('login', {
							success: true,
							error: false,
							accessTokenKey: oauth.getAccessTokenKey(),
							accessTokenSecret: oauth.getAccessTokenSecret()
						});
						self.authorized = true;
						if (isAndroid) {
							webViewWindow.close();
						}
					}, function(data){
						self.fireEvent('login', {
							success: false,
							error: 'Failure to fetch access token, please try again.',
							result: data
						});
					});
				}
			} else {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (webViewWindow.leftNavButton !== closeButton) {
					webViewWindow.leftNavButton = closeButton;
				}
			}
		});
	}

	Flickr.prototype.authorize = function(){
		var self = this;

		if (this.authorized) {
			setTimeout(function(){
				self.fireEvent('login', {
					success: true,
					error: false,
					accessTokenKey: self.accessTokenKey,
					accessTokenSecret: self.accessTokenSecret
				});
			}, 1);
		} else {
			createAuthWindow.call(this);

			this.user_nsid = '';
			this.username = '';

			this.oauthClient.fetchRequestToken(function(requestParams){
				var authorizeUrl = self.authorizeUrl + requestParams;
				self.webView.url = authorizeUrl;
			}, function(data) {
				self.fireEvent('login', {
					success: false,
					error: 'Failure to fetch access token, please try again.',
					result: data
				});
			});
		}
	};

	Flickr.prototype.request = function(path, params, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url = 'http://api.flickr.com/' + path;

		oauth.request({
			method: httpVerb,
			url: url,
			data: params,
			success: function(data){
				callback.call(self, {
					success: true,
					error: false,
					result: data
				});
			},
			error: function(data){
				callback.call(self, {
					success: false,
					error: 'Request failed',
					result: data
				});
			}
		});
	};

	Flickr.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Flickr.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};

	Flickr.prototype.getUserNsid = function(){
		return this.user_nsid;
	};

	Flickr.prototype.getUsername = function(){
		return this.username;
	};

	return Flickr;
})(this);
