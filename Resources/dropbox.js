var exports = exports || this;
exports.Dropbox = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === 'android', jsOAuth = require('jsOAuth-1.3.3');

	var Dropbox = function(options) {
		var self;

		if (this instanceof Dropbox) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Dropbox Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.authorizeUrl = 'https://www.dropbox.com/1/oauth/authorize';
		self.accessTokenKey = options.accessTokenKey;
		self.accessTokenSecret = options.accessTokenSecret;
		self.authorized = false;
		self.listeners = {};

		if (self.accessTokenKey && self.accessTokenSecret) {
			self.authorized = true;
		}

		self.callbackUrl = options.callbackUrl || 'oob';

		options.requestTokenUrl = options.requestTokenUrl || 'https://api.dropbox.com/1/oauth/request_token';
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Dropbox.prototype;

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
			webViewWindow.remove(loadingOverlay);
			actInd.hide();

			if (webViewWindow.leftNavButton !== closeButton) {
				webViewWindow.leftNavButton = closeButton;
			}

			oauth.post('https://api.dropbox.com/1/oauth/access_token', {}, function(e){
				var token = oauth.parseTokenRequest(e, e.responseHeaders['Content-Type'] || undefined);

				oauth.setAccessToken([ token.oauth_token, token.oauth_token_secret ]);
				self.accessTokenKey = token.oauth_token;
				self.accessTokenSecret = token.oauth_token_secret;

				if (!isAndroid) {
					webViewWindow.close();
				}

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
			});
		});
	}

	Dropbox.prototype.authorize = function(){
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

			this.oauthClient.fetchRequestToken(function(requestParams){
				var authorizeUrl = self.authorizeUrl + requestParams;
				self.webView.url = authorizeUrl;
			},
			function(data){
				self.fireEvent('login', {
					success: false,
					error: "Failure to fetch access token, please try again.",
					result: data
				});
			});
		}
	};

	Dropbox.prototype.request = function(path, params, headers, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url;

		if (path.match(/^https?:\/\/.+/i)) {
			url = path;
		} else {
			url = 'https://api.dropbox.com/' + path;
		}

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

	Dropbox.prototype.logout = function(callback){
		var self = this;

		this.oauthClient.setAccessToken('', '');
		this.accessTokenKey = null;
		this.accessTokenSecret = null;
		this.authorized = false;

		callback();
	};

	Dropbox.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Dropbox.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};


	return Dropbox;
})(this);
