var exports = exports || this;
exports.Tumblr = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === "android", jsOAuth = require('jsOAuth-1.3.3');

	var Tumblr = function(options) {
		var self;

		if (this instanceof Tumblr) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Tumblr Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.authorizeUrl = 'http://www.tumblr.com/oauth/authorize';
		self.accessTokenKey = options.accessTokenKey;
		self.accessTokenSecret = options.accessTokenSecret;
		self.authorized = false;
		self.listeners = {};

		if (self.accessTokenKey && self.accessTokenSecret) {
			self.authorized = true;
		}

		options.requestTokenUrl = options.requestTokenUrl || 'http://www.tumblr.com/oauth/request_token';
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Tumblr.prototype;

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
				error: "The user cancelled.",
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

				if (webViewWindow.leftNavButton !== backButton) {
					webViewWindow.leftNavButton = backButton;
				}

				if (event.url.indexOf('oauth_verifier') !== -1) {
					if (!isAndroid) {
						webViewWindow.close();
					}

	                var verifier = oauth.parseTokenRequest({ text: event.url.split('?')[1] }, undefined);

					oauth.post('http://www.tumblr.com/oauth/access_token', verifier, function(e){
						var token = self.oauthClient.parseTokenRequest(e, e.responseHeaders['Content-Type'] || undefined);
		                oauth.setAccessToken([ token.oauth_token, token.oauth_token_secret ]);

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
					}, function(e){
						self.fireEvent('login', {
							success: false,
							error: "Failure to fetch access token, please try again.",
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

	Tumblr.prototype.authorize = function(){
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

			this.oauthClient.post(this.oauthClient.requestTokenUrl, {}, function(e){
				var token = self.oauthClient.parseTokenRequest(e, e.responseHeaders['Content-Type'] || undefined);
				self.oauthClient.setAccessToken([token.oauth_token, token.oauth_token_secret]);
				self.webView.url = self.authorizeUrl + '?' + e.text;
			}, function(e){
				self.fireEvent('login', {
					success: false,
					error: "Failure to fetch access token, please try again.",
					result: e
				});
			});
		}
	};

	Tumblr.prototype.request = function(path, params, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url = "http://api.tumblr.com/" + path;

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
					error: "Request failed",
					result: data
				});
			}
		});
	};

	Tumblr.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Tumblr.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};


	return Tumblr;
})(this);
