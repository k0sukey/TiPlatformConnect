var exports = exports || this;
exports.Yammer = (function (global) {
    var K = function () {},
        isAndroid = Ti.Platform.osname === "android",
        jsOAuth = require("jsOAuth-1.3.3");

    var Yammer = function (options) {
        var self;

        if (this instanceof Yammer) {
            self = this;
        } else {
            self = new K();
        }

        if (!options) {
            options = {};
        }
        self.windowTitle = options.windowTitle || "Yammer Authorization";
        self.windowClose = options.windowClose || "Close";
        self.windowBack = options.windowBack || "Back";
        self.consumerKey = options.consumerKey;
        self.consumerSecret = options.consumerSecret;
        self.accessTokenKey = options.accessTokenKey;
        self.userName = options.pocketUserName;
        self.authorizeUrl = "https://www.yammer.com/oauth/authorize";
        self.code = "";
        self.scope = options.scope;
        self.authorized = false;
        self.listeners = {};

        if (self.accessTokenKey && self.userName) {
            self.authorized = true;
        }
        // self.callbackUrl = options.callbackUrl || 'oob';
        options.requestTokenUrl = "https://www.yammer.com/oauth/request_token";
        options.authorizationUrl = "https://www.yammer.com/oauth/authorize";
        self.oauthClient = jsOAuth.OAuth(options);

        return self;
    };

    K.prototype = Yammer.prototype;

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
        oauth.post("https://www.yammer.com/oauth/request_token", {
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
                alert(tmp[1]);
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
        // If we're not on the authorize page

        Ti.API.info("start webview load event.event.url is: " + event.url);

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

          
          var _url = 'https://www.yammer.com/oauth2/access_token.json?client_id=' + self.consumerKey + '&client_secret=' + self.consumerSecret + '&code=' + query.code;
          
          var xhr = Titanium.Network.createHTTPClient();
          xhr.open('GET',_url);
          xhr.onload = function(){
            
            result = JSON.parse(this.responseText);
            oauth.setAccessToken([ result.access_token.token]);
            self.accessTokenKey = result.access_token.token;
            self.fireEvent('login', {
              success: true,
              error: false,
              accessTokenKey: result.access_token.token
            });
            self.authorized = true;
            if (isAndroid) {
              webViewWindow.close();
            }
          };
          xhr.send();

        } else {
          
            webViewWindow.remove(loadingOverlay);
            actInd.hide();

            if (webViewWindow.leftNavButton !== closeButton) {
                webViewWindow.leftNavButton = closeButton;
            }
        }
      });
    }

    Yammer.prototype.authorize = function () {
        var self = this;

        if (this.authorized) {
          Ti.API.info("authorize method is called.start setTimeout");
            setTimeout(function () {
                self.fireEvent("login", {
                    success: true,
                    error: false,
                    accessTokenKey: self.accessTokenKey
                });
            }, 1);
        } else {
          Ti.API.info("createWindow and oauth dialog show");
            createAuthWindow.call(this);
            this.oauthClient.setAccessToken('', '');
            self.webView.url = "https://www.yammer.com/dialog/oauth?client_id=" + this.consumerKey + "&redirect_uri=https://api.singly.com/auth/yammer/auth";
        }
    };

    Yammer.prototype.getConsumerKey = function () {
        var self = this;
        return self.consumerKey;
    };

    Yammer.prototype.request = function (path, params, headers, httpVerb, callback) {
      
      var self = this,
          oauth = this.oauthClient,
          url;

      if (path.match(/^https?:\/\/.+/i)) {
          url = path;
      } else {
          url = "https://www.yammer.com/" + path;
      }
      Ti.API.info("request method fire! url is : " + url + "token is:" +  this.accessTokenKey);

      params.access_token = this.accessTokenKey;
      
      oauth.request({
          method: httpVerb,
          url: url,
          data: params,
          headers: headers,
          success: function (data) {
            Ti.API.info("success callback is called");
            callback.call(self, {
                success: true,
                error: false,
                result: data
            });
          },
          failure: function (data) {
            Ti.API.info("error callback is called");
            callback.call(self, {
                success: false,
                error: "Request failed",
                result: data
            });
          }
      });
    };

    Yammer.prototype.logout = function (callback) {
        var self = this;
        this.oauthClient.setAccessToken("", "");
        this.accessTokenKey = null;
        this.authorized = false;
        callback();
    };

    Yammer.prototype.addEventListener = function (eventName, callback) {
        this.listeners = this.listeners || {};
        this.listeners[eventName] = this.listeners[eventName] || [];
        this.listeners[eventName].push(callback);
    };

    Yammer.prototype.fireEvent = function (eventName, data) {
        var eventListeners = this.listeners[eventName] || [];
        for (var i = 0, l = eventListeners.length; i < l; i++) {
            eventListeners[i].call(this, data);
        }
    };

    return Yammer;
})(this);