var exports = exports || this;
exports.Etsy = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === 'android', jsOAuth = require('jsOAuth-1.3.3');

	var Etsy = function(options) {
		var self;

		if (this instanceof Etsy) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Etsy Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.accessTokenKey = options.accessTokenKey;
		self.accessTokenSecret = options.accessTokenSecret;
		self.scope = options.scope;
		self.authorized = false;
		self.listeners = {};

		if (self.accessTokenKey && self.accessTokenSecret) {
			self.authorized = true;
		}

		self.callbackUrl = options.callbackUrl || 'oob';

		options.requestTokenUrl = options.requestTokenUrl || 'http://openapi.etsy.com/v2/oauth/request_token';
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Etsy.prototype;

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
			var verifier = event.source.evalJS("document.getElementsByClassName('oauth-verifier')[0].innerText");

			if (verifier) {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (webViewWindow.leftNavButton !== backButton) {
					webViewWindow.leftNavButton = backButton;
				}

				if (!isAndroid) {
					webViewWindow.close();
				}

				oauth.setVerifier(verifier);
				oauth.accessTokenUrl = 'http://openapi.etsy.com/v2/oauth/access_token';

				oauth.fetchAccessToken(function(data){
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
			} else {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (webViewWindow.leftNavButton !== closeButton) {
					webViewWindow.leftNavButton = closeButton;
				}
			}
		});
	}

	Etsy.prototype.authorize = function(){
		var self = this;

		if (this.authorized) {
			setTimeout(function(){
				self.fireEvent('login', {
					success: true,
					error: false,
					accessTokenKey: self.accessTokenKey
				});
			}, 1);
		} else {
			createAuthWindow.call(this);

			this.oauthClient.setAccessToken('', '');
			this.oauthClient.get(this.oauthClient.requestTokenUrl + '?scope=' + this.scope,
				function (data){
					var login_url = '';
					var oauth_token = '';
					var oauth_token_secret = '';

					data.text.split('&').forEach(function(e){
						var query = e.split('=');
						if (query[0] === 'login_url') {
							login_url = query[1].replace(/%[a-fA-F0-9]{2}/ig, function (match) {
								return String.fromCharCode(parseInt(match.replace('%', ''), 16));
							});
						} else if (query[0] === 'oauth_token') {
							oauth_token = query[1];
						} else if (query[0] === 'oauth_token_secret') {
							oauth_token_secret = query[1];
						}
					});

					self.oauthClient.setAccessToken(oauth_token, oauth_token_secret);
					self.webView.url = login_url;
				}, function(data){
					self.fireEvent('login', {
						success: false,
						error: 'Failure to fetch access token, please try again.',
						result: data
					});
				}
			);
		}
	};

	Etsy.prototype.request = function(path, params, headers, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url;

		if (path.match(/^https?:\/\/.+/i)) {
			url = path;
		} else {
			url = 'http://openapi.etsy.com/' + path;
		}

		params.access_token = this.accessTokenKey;

		oauth.request({
			method: httpVerb,
			url: url,
			data: params,
			headers: headers,
			success: function(data){
				callback.call(self, {
					success: true,
					error: false,
					result: data
				});
			},
			failure: function(data){
				callback.call(self, {
					success: false,
					error: 'Request failed',
					result: data
				});
			}
		});
	};

	Etsy.prototype.logout = function(callback){
		var self = this;

		this.oauthClient.setAccessToken('', '');
		this.accessTokenKey = null;
		this.accessTokenSecret = null;
		this.authorized = false;

		callback();
	};

	Etsy.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Etsy.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};

	return Etsy;
})(this);
