var exports = exports || this;
exports.Foursquare = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === 'android', jsOAuth = require('jsOAuth-1.3.3');

	var Foursquare = function(options) {
		var self;

		if (this instanceof Foursquare) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Foursquare Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.authorizeUrl = 'https://foursquare.com/oauth2/authorize';
		self.accessTokenKey = options.accessTokenKey;
		self.authorized = false;
		self.listeners = {};

		if (self.accessTokenKey) {
			self.authorized = true;
		}

		self.callbackUrl = options.callbackUrl || 'oob';

		options.requestTokenUrl = options.requestTokenUrl || 'https://foursquare.com/oauth2/authenticate?client_id=' + self.consumerKey + '&response_type=token&redirect_uri=' + self.callbackUrl;
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Foursquare.prototype;

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
			if (event.url.indexOf('#access_token=') !== -1) {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (!isAndroid) {
					webViewWindow.close();
				}

				oauth.setAccessToken([ event.url.split('#access_token=')[1] ]);

				self.fireEvent('login', {
					success: true,
					error: false,
					accessTokenKey: oauth.getAccessTokenKey()
				});
				self.authorized = true;
				if (isAndroid) {
					webViewWindow.close();
				}
			} else if (event.url.indexOf('#error=') !== -1) {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (!isAndroid) {
					webViewWindow.close();
				}

				self.fireEvent('login', {
					success: false,
					error: 'Failure to fetch access token, please try again.',
					result: { error: event.url.split('#error=')[1] }
				});

				if (isAndroid) {
					webViewWindow.close();
				}
			} else if (event.url.indexOf('foursquare.com/oauth2/authenticate') !== -1) {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (webViewWindow.leftNavButton !== backButton) {
					webViewWindow.leftNavButton = backButton;
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

	Foursquare.prototype.authorize = function(){
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
			self.webView.url = this.oauthClient.requestTokenUrl;
		}
	};

	Foursquare.prototype.request = function(path, params, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url = 'https://api.foursquare.com/' + path + '?oauth_token=' + this.oauthClient.getAccessTokenKey();

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

	Foursquare.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Foursquare.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};

	return Foursquare;
})(this);
