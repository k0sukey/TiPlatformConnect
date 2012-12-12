/*jslint regexp: true */
/*global Ti, require */
var exports = exports || this;
exports.Evernote = (function (global) {
    "use strict";
    var Evernote, createAuthWindow, K = function () {},
        isAndroid = Ti.Platform.osname === "android",
        jsOAuth = require("jsOAuth-1.3.3");
    Evernote = function (options) {
        var self;

        if (this instanceof Evernote) {
            self = this;
        } else {
            self = new K();
        }

        if (!options) {
            options = {};
        }
        self.windowTitle = options.windowTitle || "Evernote Authorization";
        self.windowClose = options.windowClose || "Close";
        self.windowBack = options.windowBack || "Back";
        self.consumerKey = options.consumerKey;
        self.consumerSecret = options.consumerSecret;
        self.accessTokenKey = options.accessTokenKey;
        self.evernoteHost = options.sandbox ? "https://sandbox.evernote.com" : "https://www.evernote.com";
        self.callback = options.callback || "http://evernote.com/";
        self.authorized = false;
        self.listeners = {};

        if (self.accessTokenKey) {
            self.authorized = true;
        }

        // Request URIs
        self.tempCredential = self.evernoteHost + "/oauth";
        self.authorizationUrl = self.evernoteHost + "/OAuth.action";
        self.requestTokenUrl = self.evernoteHost + "/oauth";

        self.oauthClient = jsOAuth.OAuth(options);

        return self;
    };

    K.prototype = Evernote.prototype;

    createAuthWindow = function () {
        var hdlLoadEvent, getRequestToken, self = this,
            oauth = self.oauthClient,
            webViewWindow = Ti.UI.createWindow({
                title: self.windowTitle
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
                title: self.windowClose
            }),
            backButton = Ti.UI.createButton({
                title: self.windowBack
            });

        hdlLoadEvent = function (event) {
            if (event.url.indexOf("oauth_token=") !== -1 && event.url.indexOf("oauth_verifier") !== -1) {
                webView.removeEventListener("load", hdlLoadEvent);
                webViewWindow.remove(loadingOverlay);
                actInd.hide();
                var i, tmp, getParams = (event.url.split("?")[1]).split("&"),
                    paramsObj = {},
                    l = getParams.length;
                for (i = 0; i < l; i += 1) {
                    tmp = getParams[i].split("=");
                    paramsObj[tmp[0]] = tmp[1];
                }
                getRequestToken(paramsObj);
                if (!isAndroid) {
                    webViewWindow.close();
                }
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
        };
        getRequestToken = function (getParams) {
            oauth.request({
                method: "GET",
                url: self.requestTokenUrl,
                data: {
                    oauth_consumer_key: self.consumerKey,
                    oauth_signature: self.consumerSecret,
                    oauth_signature_method: "PLAINTEXT",
                    oauth_token: getParams.oauth_token,
                    oauth_verifier: getParams.oauth_verifier
                },
                success: function (response) {
                    webView.addEventListener("load", hdlLoadEvent);
                    // Success function
                    var tmp, i, text = response.text,
                        spltxt = text.split("&"),
                        params = {},
                        l = spltxt.length;
                    for (i = 0; i < l; i += 1) {
                        tmp = spltxt[i].split("=");
                        params[tmp[0]] = decodeURIComponent(tmp[1]);
                    }
                    oauth.setAccessToken([params.oauth_token]);
                    setTimeout(function () {
                        self.fireEvent("login", {
                            success: true,
                            error: false,
                            result: params,
                            accessTokenKey: oauth.getAccessTokenKey()
                        });
                    }, 1);
                    self.authorized = true;
                    if (isAndroid) {
                        webViewWindow.close();
                    }
                },
                failure: function (response) {
                    webView.addEventListener("load", hdlLoadEvent);
                    // Failure function
                    setTimeout(function () {
                        self.fireEvent("login", {
                            success: false,
                            error: true,
                            result: response
                        });
                    }, 1);
                    self.authorized = false;
                    if (isAndroid) {
                        webViewWindow.close();
                    }
                }
            });
        };
        webView.addEventListener("load", hdlLoadEvent);
        webView.addEventListener("beforeload", function (e) {
            if (!isAndroid) {
                webViewWindow.add(loadingOverlay);
            }
            actInd.show();
        });

        self.webView = webView;
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
    };

    Evernote.prototype.authorize = function () {
        var self = this;

        if (self.authorized) {
            setTimeout(function () {
                self.fireEvent("login", {
                    success: true,
                    error: false,
                    accessTokenKey: self.accessTokenKey
                });
            }, 1);
        } else {
            createAuthWindow.call(self);
            self.oauthClient.setAccessToken("", "");
            self.oauthClient.request({
                method: "GET",
                url: self.tempCredential,
                data: {
                    oauth_consumer_key: self.consumerKey,
                    oauth_signature: self.consumerSecret,
                    oauth_signature_method: "PLAINTEXT",
                    oauth_callback: self.callback
                },
                success: function (response) {
                    // Success function
                    var text = response.text,
                        getParam = text.match(/(oauth_token=.+?)&/)[1],
                        authURL = self.authorizationUrl + "?" + getParam;
                    self.webView.url = authURL;
                },
                failure: function (response) {
                    // Failure function
                    setTimeout(function () {
                        self.fireEvent("login", {
                            success: false,
                            error: true,
                            result: response
                        });
                    }, 1);
                }
            });
        }
    };

    Evernote.prototype.request = function (path, params, headers, httpVerb, callback) {
        var self = this,
            oauth = self.oauthClient,
            url;

        if (path.match(/^https?:\/\/.+/i)) {
            url = path;
        } else {
            url = self.evernoteHost + "/" + path;
        }

        params.access_token = self.accessTokenKey;

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

    Evernote.prototype.logout = function (callback) {
        var self = this;
        self.oauthClient.setAccessToken("", "");
        self.accessTokenKey = null;
        self.authorized = false;
        callback();
    };

    Evernote.prototype.addEventListener = function (eventName, callback) {
        var self = this;
        self.listeners = self.listeners || {};
        self.listeners[eventName] = self.listeners[eventName] || [];
        self.listeners[eventName].push(callback);
    };

    Evernote.prototype.fireEvent = function (eventName, data) {
        var i, self = this,
            eventListeners = self.listeners[eventName] || [],
            l = eventListeners.length;
        for (i = 0; i < l; i += 1) {
            eventListeners[i].call(self, data);
        }
    };

    return Evernote;
}(this));