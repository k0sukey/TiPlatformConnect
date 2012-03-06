(function(){
	var window = Ti.UI.createWindow();

	var twitter = require('twitter').Twitter({
			consumerKey: 'INSERT KEY HERE',
			consumerSecret: 'INSERT SECRET HERE',
			accessTokenKey: Ti.App.Properties.getString('twitterAccessTokenKey'),
			accessTokenSecret: Ti.App.Properties.getString('twitterAccessTokenSecret')
		});

	var tumblr = require('tumblr').Tumblr({
			consumerKey: 'INSERT KEY HERE',
			consumerSecret: 'INSERT SECRET HERE',
			accessTokenKey: Ti.App.Properties.getString('tumblrAccessTokenKey'),
			accessTokenSecret: Ti.App.Properties.getString('tumblrAccessTokenSecret')
		});

	var flickr = require('flickr').Flickr({
			consumerKey: 'INSERT KEY HERE',
			consumerSecret: 'INSERT SECRET HERE',
			accessTokenKey: Ti.App.Properties.getString('flickrAccessTokenKey'),
			accessTokenSecret: Ti.App.Properties.getString('flickrAccessTokenSecret'),
			callbackUrl: 'http://www.example.com/flickrcallback'
		});

	var foursquare = require('foursquare').Foursquare({
			consumerKey: 'INSERT KEY HERE',
			consumerSecret: 'INSERT SECRET HERE',
			accessTokenKey: Ti.App.Properties.getString('foursquareAccessTokenKey'),
			callbackUrl: 'http://www.example.com/foursquarecallback'
		});

	var tableView = Ti.UI.createTableView({
		data: [],
		style: Ti.UI.iPhone.TableViewStyle.GROUPED
	});
	window.add(tableView);

	var rows = [];

	var twitterRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	rows.push(twitterRow);

	var twitterLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in width Twitter'
	});
	twitterRow.add(twitterLabel);

	var twitterAuthorize = function(event){
		twitter.addEventListener('login', function(e){
			Ti.App.Properties.setString('twitterAccessTokenKey', e.accessTokenKey);
			Ti.App.Properties.setString('twitterAccessTokenSecret', e.accessTokenSecret);

			if (e.success) {
				twitter.request('1/account/verify_credentials.json', {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						twitterLabel.setText(json.screen_name);
						twitter.touchEnabled = false;
						twitter.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (!event) {
							twitterRow.removeEventListener('click', twitterAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
			}
		});

		twitter.authorize();
	};

	if (twitter.authorized) {
		twitterAuthorize();
	} else {
		twitterRow.touchEnabled = true;
		twitterRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;
		twitterCallback = true;

		twitterRow.addEventListener('click', twitterAuthorize);
	}

	var tumblrRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	rows.push(tumblrRow);

	var tumblrLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in width Tumblr'
	});
	tumblrRow.add(tumblrLabel);

	var tumblrAuthorize = function(event){
		tumblr.addEventListener('login', function(e){
			Ti.App.Properties.setString('tumblrAccessTokenKey', e.accessTokenKey);
			Ti.App.Properties.setString('tumblrAccessTokenSecret', e.accessTokenSecret);

			if (e.success) {
				tumblr.request('v2/user/info', {}, 'POST', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						tumblrLabel.setText(json.response.user.name);
						tumblr.touchEnabled = false;
						tumblr.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (!event) {
							tumblrRow.removeEventListener('click', tumblrAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
			}
		});

		tumblr.authorize();
	};

	if (tumblr.authorized) {
		tumblrAuthorize();
	} else {
		tumblrRow.touchEnabled = true;
		tumblrRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;
		tumblrCallback = true;

		tumblrRow.addEventListener('click', tumblrAuthorize);
	}

	var flickrRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	rows.push(flickrRow);

	var flickrLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in width Flickr'
	});
	flickrRow.add(flickrLabel);

	var flickrAuthorize = function(event){
		flickr.addEventListener('login', function(e){
			Ti.App.Properties.setString('flickrAccessTokenKey', e.accessTokenKey);
			Ti.App.Properties.setString('flickrAccessTokenSecret', e.accessTokenSecret);

			flickrLabel.setText(flickr.getUsername());
			flickr.touchEnabled = false;
			flickr.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

			if (!event) {
				flickrRow.removeEventListener('click', flickrAuthorize);
			}
		});

		flickr.authorize();
	};

	if (flickr.authorized) {
		flickrAuthorize();
	} else {
		flickrRow.touchEnabled = true;
		flickrRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;
		flickrCallback = true;

		flickrRow.addEventListener('click', flickrAuthorize);
	}

	var foursquareRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	rows.push(foursquareRow);

	var foursquareLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in width Foursquare'
	});
	foursquareRow.add(foursquareLabel);

	var foursquareAuthorize = function(event){
		foursquare.addEventListener('login', function(e){
			Ti.App.Properties.setString('foursquareAccessTokenKey', e.accessTokenKey);

			if (e.success) {
				foursquare.request('v2/users/self', {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						foursquareLabel.setText(json.response.user.firstName);
						foursquare.touchEnabled = false;
						foursquare.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (!event) {
							foursquareRow.removeEventListener('click', foursquareAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
			}
		});

		foursquare.authorize();
	};

	if (foursquare.authorized) {
		foursquareAuthorize();
	} else {
		foursquareRow.touchEnabled = true;
		foursquareRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;
		foursquareCallback = true;

		foursquareRow.addEventListener('click', foursquareAuthorize);
	}
    
	tableView.setData(rows);
	window.open();
})(this);
