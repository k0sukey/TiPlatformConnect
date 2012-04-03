var exports = exports || this;
exports.Linkedin = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === 'android', jsOAuth = require('lib/jsOAuth-1.3.3');

	var Linkedin = function(options) {
		var self;

		if (this instanceof Linkedin) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Linkedin Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.authorizeUrl = 'https://www.linkedin.com/uas/oauth/authorize';
		self.accessTokenKey = options.accessTokenKey;
		self.accessTokenSecret = options.accessTokenSecret;
		self.scope = options.scope;
		self.authorized = false;
		self.listeners = {};

		if (self.accessTokenKey) {
			self.authorized = true;
		}

		self.callbackUrl = options.callbackUrl || 'oob';

		options.requestTokenUrl = options.requestTokenUrl || 'https://api.linkedin.com/uas/oauth/requestToken';
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Linkedin.prototype;

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

				if (webViewWindow.leftNavButton !== backButton) {
					webViewWindow.leftNavButton = backButton;
				}
			} else {
				if (webViewWindow.leftNavButton !== closeButton) {
					webViewWindow.leftNavButton = closeButton;
				}

				var pin = event.source.evalJS("document.getElementsByClassName('access-code')[0].innerText");

				if (!pin) {
					webViewWindow.remove(loadingOverlay);
					actInd.hide();
				} else {
					if (!isAndroid) {
						webViewWindow.close();
					}

					oauth.accessTokenUrl = 'https://api.linkedin.com/uas/oauth/accessToken?oauth_verifier=' + pin;

					oauth.fetchAccessToken(
						function(data){
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
						}, function(data) {
							self.fireEvent('login', {
								success: false,
								error: "Failure to fetch access token, please try again.",
								result: data
							});
						}
					);
				}
			}
		});
	}

	Linkedin.prototype.authorize = function(){
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

			this.oauthClient.fetchRequestToken(
				function(requestParams){
					var authorizeUrl = self.authorizeUrl + requestParams;
					self.webView.url = authorizeUrl;
				},
				function(data){
					self.fireEvent('login', {
						success: false,
						error: 'Failure to fetch access token, please try again.',
						result: data
					});
				}
			);
		}
	};

	Linkedin.prototype.request = function(path, params, headers, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url;

		if (path.match(/^https?:\/\/.+/i)) {
			url = path;
		} else {
			url = 'https://api.linkedin.com/' + path;
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
			error: function(data){
				callback.call(self, {
					success: false,
					error: 'Request failed',
					result: data
				});
			}
		});
	};

	Linkedin.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Linkedin.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};


	return Linkedin;
})(this);
