var exports = exports || this;
exports.Google = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === 'android', jsOAuth = require('jsOAuth-1.3.3');

	var Google = function(options) {
		var self;

		if (this instanceof Google) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Google Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.accessTokenKey = options.accessTokenKey;
		self.refreshTokenKey = options.refreshTokenKey;
		self.scope = options.scope;
		self.authorized = false;
		self.listeners = {};

		if (self.accessTokenKey && self.refreshTokenKey) {
			self.authorized = true;
		}

		self.callbackUrl = options.callbackUrl || 'urn:ietf:wg:oauth:2.0:oob';

		options.requestTokenUrl = options.requestTokenUrl || 'https://accounts.google.com/o/oauth2/auth';
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Google.prototype;

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
			if (event.url.indexOf('https://accounts.google.com/o/oauth2/approval') !== -1) {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (webViewWindow.leftNavButton !== backButton) {
					webViewWindow.leftNavButton = backButton;
				}

				if (!isAndroid) {
					webViewWindow.close();
				}

				var code = event.source.evalJS("document.getElementsByTagName('title')[0].innerText").split('=')[1];

				oauth.post('https://accounts.google.com/o/oauth2/token', { grant_type: 'authorization_code', client_id: self.consumerKey, client_secret: self.consumerSecret, code: code, redirect_uri: self.callbackUrl }, function(e){
					var json = JSON.parse(e.text);

					oauth.setAccessToken([ json.access_token ]);
					self.accessTokenKey = json.access_token;
					self.refreshTokenKey = json.refresh_token;

					self.fireEvent('login', {
						success: true,
						error: false,
						accessTokenKey: oauth.getAccessTokenKey(),
						refreshTokenKey: self.refreshTokenKey,
						expiresIn: json.expires_in
					});
					self.authorized = true;
					if (isAndroid) {
						webViewWindow.close();
					}
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

	Google.prototype.authorize = function(){
		var self = this;

		if (this.authorized) {
			this.oauthClient.post('https://accounts.google.com/o/oauth2/token', { grant_type: 'refresh_token', client_id: this.consumerKey, client_secret: this.consumerSecret, refresh_token: this.refreshTokenKey }, function(e){
				var json = JSON.parse(e.text);

				self.oauthClient.setAccessToken([ json.access_token ]);
				self.accessTokenKey = json.access_token;
				self.refreshTokenKey = json.refresh_token;

				self.fireEvent('login', {
					success: true,
					error: false,
					accessTokenKey: self.oauthClient.getAccessTokenKey(),
					refreshTokenKey: self.refreshTokenKey,
					expiresIn: json.expires_in
				});
			}, function(e){
				self.oauthClient.setAccessToken([ null ]);
				self.accessTokenKey = null;
				self.refreshTokenKey = null;

				self.fireEvent('login', {
					success: false,
					error: true
				});
			});
		} else {
			createAuthWindow.call(this);

			this.oauthClient.setAccessToken('', '');
			self.webView.url = this.oauthClient.requestTokenUrl + '?client_id=' + this.consumerKey + '&redirect_uri=' + this.callbackUrl + '&scope=' + this.scope + '&response_type=code';
		}
	};

	Google.prototype.request = function(path, params, headers, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url = path;

		headers.Authorization = 'OAuth ' + oauth.getAccessTokenKey();

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

	Google.prototype.logout = function(callback){
		var self = this;

		this.oauthClient.setAccessToken('', '');
		this.accessTokenKey = null;
		this.refreshTokenKey = null;
		this.authorized = false;

		callback();
	};

	Google.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Google.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};

	Google.prototype.refreshAccessToken = function(){
		var self = this;

		self.oauthClient.post('https://accounts.google.com/o/oauth2/token', { grant_type: 'refresh_token', client_id: self.consumerKey, client_secret: self.consumerSecret, refresh_token: self.refreshTokenKey }, function(e){
			var json = JSON.parse(e.text);

			self.oauthClient.setAccessToken([ json.access_token ]);
			self.accessTokenKey = json.access_token;
			self.refreshTokenKey = json.refresh_token;

			self.fireEvent('refresh', {
				success: true,
				error: false,
				accessTokenKey: self.oauthClient.getAccessTokenKey(),
				refreshTokenKey: self.refreshTokenKey,
				expiresIn: json.expires_in
			});
		}, function(e){
			self.fireEvent('refresh', {
				success: false,
				error: true
			});
		});
	};

	return Google;
})(this);
