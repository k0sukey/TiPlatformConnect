var exports = exports || this;
exports.Github = (function(global){
	var K = function(){}, isAndroid = Ti.Platform.osname === 'android', jsOAuth = require('jsOAuth-1.3.3');

	var Github = function(options) {
		var self;

		if (this instanceof Github) {
			self = this;
		} else {
			self = new K();
		}

		if (!options) { options = {}; }
		self.windowTitle = options.windowTitle || 'Github Authorization';
		self.windowClose = options.windowClose || 'Close';
		self.windowBack = options.windowBack || 'Back';
		self.consumerKey = options.consumerKey;
		self.consumerSecret = options.consumerSecret;
		self.accessTokenKey = options.accessTokenKey;
		self.scope = options.scope;
		self.authorized = false;
		self.listeners = {};

		if (self.accessTokenKey) {
			self.authorized = true;
		}

		self.callbackUrl = options.callbackUrl || 'oob';

		options.requestTokenUrl = options.requestTokenUrl || 'https://github.com/login/oauth/authorize';
		self.oauthClient = jsOAuth.OAuth(options);

		return self;
	};

	K.prototype = Github.prototype;

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
			if (event.url.indexOf('?code=') !== -1) {
				webViewWindow.remove(loadingOverlay);
				actInd.hide();

				if (webViewWindow.leftNavButton !== backButton) {
					webViewWindow.leftNavButton = backButton;
				}

				if (!isAndroid) {
					webViewWindow.close();
				}

				var query = {};
				event.url.split('?')[1].split('&').forEach(function(value){
					var tmp = value.split('=');
					query[tmp[0]] = tmp[1];
				});

				oauth.post('https://github.com/login/oauth/access_token', {
					client_id: self.consumerKey,
					client_secret: self.consumerSecret,
					code: query.code,
					state: query.state,
					redirect_uri: self.callbackUrl
				}, function(e){
					var token = oauth.parseTokenRequest(e, e.responseHeaders['Content-Type'] || undefined);

					oauth.setAccessToken([ token.access_token ]);
					self.accessTokenKey = token.access_token;

					self.fireEvent('login', {
						success: true,
						error: false,
						accessTokenKey: oauth.getAccessTokenKey()
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

	Github.prototype.authorize = function(){
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
			self.webView.url = this.oauthClient.requestTokenUrl + '?client_id=' + this.consumerKey + '&redirect_uri=' + this.callbackUrl + '&scope=' + this.scope;
		}
	};

	Github.prototype.request = function(path, params, headers, httpVerb, callback){
		var self = this, oauth = this.oauthClient, url;

		if (path.match(/^https?:\/\/.+/i)) {
			url = path;
		} else {
			url = 'https://api.github.com/' + path;
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

	Github.prototype.logout = function(callback){
		var self = this;

		this.oauthClient.setAccessToken('', '');
		this.accessTokenKey = null;
		this.authorized = false;

		callback();
	};

	Github.prototype.addEventListener = function(eventName, callback) {
		this.listeners = this.listeners || {};
		this.listeners[eventName] = this.listeners[eventName] || [];
		this.listeners[eventName].push(callback);
	};

	Github.prototype.fireEvent = function(eventName, data) {
		var eventListeners = this.listeners[eventName] || [];
		for (var i = 0; i < eventListeners.length; i++) {
			eventListeners[i].call(this, data);
		}
	};

	return Github;
})(this);
