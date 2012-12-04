var exports = exports || this;
exports.Pocket = (function (global) {
    var K = function () {},
        isAndroid = Ti.Platform.osname === "android",
        jsOAuth = require("jsOAuth-1.3.3");

    var Pocket = function (options) {
        var self;

        if (this instanceof Pocket) {
            self = this;
        } else {
            self = new K();
        }

        if (!options) {
            options = {};
        }
        self.windowTitle = options.windowTitle || "Pocket Authorization";
        self.windowClose = options.windowClose || "Close";
        self.windowBack = options.windowBack || "Back";
        self.consumerKey = options.consumerKey;
        self.accessTokenKey = options.accessTokenKey;
        self.userName = options.pocketUserName;
        self.authorizeUrl = "https://getpocket.com/auth/authorize";
        self.code = "";
        self.scope = options.scope;
        self.authorized = false;
        self.listeners = {};

        if (self.accessTokenKey && self.userName) {
            self.authorized = true;
        }

        options.requestTokenUrl = "https://getpocket.com/v3/oauth/request";
        options.authorizationUrl = "https://getpocket.com/auth/authorize";
        self.oauthClient = jsOAuth.OAuth(options);

        return self;
    };

    K.prototype = Pocket.prototype;

    function createAuthWindow() {
        var self = this,
            oauth = self.oauthClient,
            webViewWindow = Ti.UI.createWindow({
                title: this.windowTitle
            }),
            webView = Ti.UI.createWebView(),
            loadingOverlay = Ti.UI.createView({
                backgroundColor: "black",
                opacity: 0.7,
                zIndex: 1
            }),
            actInd = Ti.UI.createActivityIndicator({
                height: 50,
                width: 10,
                message: "Loading...",
                color: "white"
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
        webViewWindow.open({
            modal: true
        });

        webViewWindow.add(webView);

        closeButton.addEventListener("click", function (e) {
            webViewWindow.close();
            self.fireEvent("cancel", {
                success: false,
                error: "The user cancelled.",
                result: null
            });
        });

        backButton.addEventListener("click", function (e) {
            webView.goBack();
        });

        webView.addEventListener("beforeload", function (e) {
            if (!isAndroid) {
                webViewWindow.add(loadingOverlay);
            }
            actInd.show();
        });

        var getRequestToken = function () {
            oauth.post("https://getpocket.com/v3/oauth/authorize", {
                consumer_key: self.consumerKey,
                code: self.code
            }, function (response) {
                // Success
                var i, tmp, responseData = response.text.split("&"),
                    length = responseData.length,
                    responseDict = {};
                for (i = 0; i < length; i += 1) {
                    tmp = responseData[i].split("=");
                    responseDict[tmp[0]] = tmp[1];
                }
                oauth.setAccessToken([responseDict.access_token, ""]);
                self.accessTokenKey = responseDict.access_token;
                self.userName = responseDict.username;
                self.fireEvent("login", {
                    success: true,
                    error: false,
                    userName: self.userName,
                    accessTokenKey: oauth.getAccessTokenKey()
                });
                self.authorized = true;
                if (isAndroid) {
                    webViewWindow.close();
                }
            }, function (response) {
                // Failure
                setTimeout(function () {
                    self.fireEvent("login", {
                        success: false,
                        error: true,
                        result: response
                    });
                }, 1);
            });
        };

        webView.addEventListener("load", function (event) {
            if (event.url.indexOf("https://getpocket.com/auth/approve_access") !== -1) {
                webViewWindow.remove(loadingOverlay);
                actInd.hide();
                if (webViewWindow.leftNavButton !== backButton) {
                    webViewWindow.leftNavButton = backButton;
                }
                getRequestToken();
                if (!isAndroid) {
                    webViewWindow.close();
                }
            } else {
                webViewWindow.remove(loadingOverlay);
                actInd.hide();

                if (event.url.indexOf("https://getpocket.com/auth/authorize") > -1) {
                    var authNodeLength = parseInt(webView.evalJS("(window.document.getElementsByTagName('body')[0]).childNodes.length"), 10);
                    if (authNodeLength === 0) {
                        getRequestToken();
                        if (!isAndroid) {
                            webViewWindow.close();
                        }
                    }
                }

                if (webViewWindow.leftNavButton !== closeButton) {
                    webViewWindow.leftNavButton = closeButton;
                }
            }
        });
    }

    Pocket.prototype.authorize = function () {
        var self = this;

        if (this.authorized) {
            setTimeout(function () {
                self.fireEvent("login", {
                    success: true,
                    error: false,
                    accessTokenKey: self.accessTokenKey
                });
            }, 1);
        } else {
            createAuthWindow.call(this);
            this.oauthClient.setAccessToken("", "");
            this.oauthClient.post(
            this.oauthClient.requestTokenUrl, {
                consumer_key: this.consumerKey,
                redirect_uri: "dummy_response_uri_text"
            }, function (response) {
                // Success
                self.code = response.text.split("=")[1];
                self.webView.url = self.oauthClient.authorizationUrl + "?request_token=" + self.code + "&rnd=" + (new Date()).getTime() + "&redirect_uri=";
            }, function (response) {
                // Failure
                setTimeout(function () {
                    self.fireEvent("login", {
                        success: false,
                        error: true,
                        result: response
                    });
                }, 1);
            });
        }
    };

    Pocket.prototype.getConsumerKey = function () {
        var self = this;
        return self.consumerKey;
    };

    Pocket.prototype.request = function (path, params, headers, httpVerb, callback) {
        var self = this,
            oauth = this.oauthClient,
            url;

        if (path.match(/^https?:\/\/.+/i)) {
            url = path;
        } else {
            url = "https://getpocket.com/" + path;
        }

        params.access_token = this.accessTokenKey;

        oauth.request({
            method: httpVerb,
            url: url,
            data: params,
            headers: headers,
            success: function (data) {
                callback.call(self, {
                    success: true,
                    error: false,
                    result: data
                });
            },
            failure: function (data) {
                callback.call(self, {
                    success: false,
                    error: "Request failed",
                    result: data
                });
            }
        });
    };

    Pocket.prototype.logout = function (callback) {
        var self = this;
        this.oauthClient.setAccessToken("", "");
        this.accessTokenKey = null;
        this.authorized = false;
        callback();
    };

    Pocket.prototype.addEventListener = function (eventName, callback) {
        this.listeners = this.listeners || {};
        this.listeners[eventName] = this.listeners[eventName] || [];
        this.listeners[eventName].push(callback);
    };

    Pocket.prototype.fireEvent = function (eventName, data) {
        var eventListeners = this.listeners[eventName] || [];
        for (var i = 0, l = eventListeners.length; i < l; i++) {
            eventListeners[i].call(this, data);
        }
    };

    return Pocket;
})(this);