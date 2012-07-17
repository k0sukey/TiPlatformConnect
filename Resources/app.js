(function(){
	Ti.Facebook.appid = 'XXXXXXXXXXXXXXX';
	Ti.Facebook.permissions = [ 'publish_stream' , 'offline_access' ];

	var twitter = require('twitter').Twitter({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('twitterAccessTokenKey', ''),
		accessTokenSecret: Ti.App.Properties.getString('twitterAccessTokenSecret', '')
	});

	var linkedin = require('linkedin').Linkedin({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('linkedinAccessTokenKey', ''),
		accessTokenSecret: Ti.App.Properties.getString('linkedinAccessTokenSecret', '')
	});

	var tumblr = require('tumblr').Tumblr({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('tumblrAccessTokenKey', ''),
		accessTokenSecret: Ti.App.Properties.getString('tumblrAccessTokenSecret', '')
	});

	var mixi = require('mixi').Mixi({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('mixiAccessTokenKey', ''),
		refreshTokenKey: Ti.App.Properties.getString('mixiRefreshTokenKey', ''),
		callbackUrl: 'http://www.example.com/callback/mixi',
		scope: 'r_profile w_voice'
	});

	mixi.addEventListener('refresh', function(e){
		Ti.API.info(e);
	});

	var flickr = require('flickr').Flickr({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('flickrAccessTokenKey', ''),
		accessTokenSecret: Ti.App.Properties.getString('flickrAccessTokenSecret', ''),
		callbackUrl: 'http://www.example.com/callback/flickr'
	});

	var foursquare = require('foursquare').Foursquare({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('foursquareAccessTokenKey', ''),
		callbackUrl: 'http://www.example.com/callback/foursquare'
	});

	var google = require('google').Google({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('googleAccessTokenKey', ''),
		refreshTokenKey: Ti.App.Properties.getString('googleRefreshTokenKey', ''),
		scope: 'https://www.google.com/m8/feeds'
	});

	google.addEventListener('refresh', function(e){
		Ti.API.info(e);
	});

	var github = require('github').Github({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('githubAccessTokenKey', ''),
		callbackUrl: 'http://www.example.com/callback/github',
		scope: 'user'
	});

	var etsy = require('etsy').Etsy({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('etsyAccessTokenKey', ''),
		accessTokenSecret: Ti.App.Properties.getString('etsyAccessTokenSecret', ''),
		scope: 'profile_r'
	});

	var hatena = require('hatena').Hatena({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('hatenaAccessTokenKey', ''),
		accessTokenSecret: Ti.App.Properties.getString('hatenaAccessTokenSecret', ''),
		scope: 'read_public,write_public'
	});

	var dropbox = require('dropbox').Dropbox({
		consumerKey: 'XXXXXXXXXXXXXXXXXXXX',
		consumerSecret: 'XXXXXXXXXXXXXXXXXXXX',
		accessTokenKey: Ti.App.Properties.getString('dropboxAccessTokenKey', ''),
		accessTokenSecret: Ti.App.Properties.getString('dropboxAccessTokenSecret', '')
	});

	var window = Ti.UI.createWindow({
		title: 'TiPlatformConnect',
		tabBarHidden: true
	});

	var doneButton = Ti.UI.createButton({
		systemButton: Ti.UI.iPhone.SystemButton.DONE,
		SystemButtonStyle: Ti.UI.iPhone.SystemButtonStyle.DONE
	});

	doneButton.addEventListener('click', function(){
		if (captionTextField.value === '') {
			Ti.UI.createAlertDialog({
				title: 'Error',
				message: 'Caption required'
			}).show();
		} else {
			var path;
			var params = {};
			var headers = {};

			if (twitter.authorized && twitterSwitch.value) {
				params.status = captionTextField.value;

				if (photoImageView.image) {
					path = 'https://upload.twitter.com/1/statuses/update_with_media.json';
					params['media[]'] = photoImageView.toBlob();
					headers = { 'Content-Type': 'multipart/form-data' };
				} else {
					path = '1/statuses/update.json';
				}

				if (place.id && place.name && place.latitude && place.longitude) {
					params.lat = place.latitude;
					params.long = place.longitude;
				}

				twitter.request(path, params, headers, 'POST', function(e){
					if (e.success) {
						// success proc...
					} else {
						// error proc...
					}
				});
			}

			if (Ti.Facebook.getLoggedIn() && facebookSwitch.value) {
				params = {};

				if (photoImageView.image) {
					path = 'me/photos';
					params.name = captionTextField.value;
					params.picture = photoImageView.toBlob();
				} else {
					path = 'me/feed';
					params.message = captionTextField.value;
				}

				if (place.id && place.name && place.latitude && place.longitude) {
					params.coordinates = {
						latitude: place.latitude,
						longitude: place.longitude
					};
				}

				Ti.Facebook.requestWithGraphPath(path, params, 'POST', function(e){
					Ti.API.info(e);
				});
			}

			if (tumblr.authorized && tumblrSwitch.value && tumblrBlog.name && tumblrBlog.title) {
				params = {};
				headers = {};

				path = 'v2/blog/' + tumblrBlog.name + '.tumblr.com/post';
				params.tweet = 'off';

				if (photoImageView.image) {
					params.type = 'photo';
					params.data = photoImageView.toBlob();
					params.caption = captionTextField.value;
					headers = { 'Content-Type': 'multipart/form-data' };
				} else {
					params.type = 'text';
					params.body = captionTextField.value;
				}

				tumblr.request(path, params, headers, 'POST', function(e){
					if (e.success) {
						// success proc...
					} else {
						// error proc...
					}
				});
			}

			if (mixi.authorized && mixiSwitch.value) {
				params = {};
				headers = {};

				path = '2/voice/statuses/update';
				params.status = captionTextField.value;

				if (photoImageView.image) {
					params.photo = photoImageView.toBlob();
					headers = { 'Content-Type': 'multipart/form-data' };
				}

				mixi.request(path, params, headers, 'POST', function(e){
					if (e.success) {
						// success proc...
					} else {
						// error proc...
					}
				});
			}

			if (flickr.authorized && flickrSwitch.value && photoImageView.image) {
				params = {};
				headers = {};

				path = 'services/upload/';
				params.photo = photoImageView.toBlob();
				params.description = captionTextField.value;
				headers = { 'Content-Type': 'multipart/form-data' };

				flickr.request(path, params, headers, 'POST', function(e){
					if (e.success) {
						// success proc...
					} else {
						// error proc...
					}
				});
			}

			if (foursquare.authorized && foursquareSwitch.value && place.id && place.name && place.latitude && place.longitude) {
				params = {};
				headers = {};

				path = 'v2/checkins/add';
				params.venueId = place.id;
				params.shout = captionTextField.value;
				params.ll = place.latitude + ',' + place.longitude;
				params.broadcast = 'public';

				foursquare.request(path, params, headers, 'POST', function(e){
					if (e.success) {
						// success proc...
					} else {
						// error proc...
					}
				});
			}
		}
	});

	window.rightNavButton = doneButton;

	var tableView = Ti.UI.createTableView({
		data: [],
		style: Ti.UI.iPhone.TableViewStyle.GROUPED
	});
	window.add(tableView);

	var sections = [];

	var shareSection = Ti.UI.createTableViewSection({
		headerTitle: 'Share'
	});
	sections.push(shareSection);

	var captionRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	shareSection.add(captionRow);

	var captionTextField = Ti.UI.createTextField({
		paddingRight: 10,
		paddingLeft: 10,
		hintText: 'Caption'
	});
	captionRow.add(captionTextField);

	var photoRow = Ti.UI.createTableViewRow();
	shareSection.add(photoRow);

	photoRow.addEventListener('click', function(){
		Ti.Media.openPhotoGallery({
			animated: true,
			mediaTypes: [ Ti.Media.MEDIA_TYPE_PHOTO ],
			success: function(e){
				photoImageView.image = e.media;
			},
			error: function(){
				// error proc...
			},
			cancel: function(){
				photoImageView.image = null;
			}
		});
	});

	var photoLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Photo'
	});
	photoRow.add(photoLabel);

	var photoImageView = Ti.UI.createImageView({
		right: 10,
		width: 32,
		height: 32,
		backgroundColor: '#fff',
		borderRadius: 6,
		borderColor: '#ccc'
	});
	photoRow.add(photoImageView);

	var placeRow = Ti.UI.createTableViewRow({
		hasChild: true
	});
	shareSection.add(placeRow);

	var placeLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Place'
	});
	placeRow.add(placeLabel);

	var checkinLabel = Ti.UI.createLabel({
		right: 10,
		color: '#666',
		font: { fontSize: 12 },
		textAlign: 'right',
		text: ''
	});
	placeRow.add(checkinLabel);

	var place = {
		id: null,
		name: null,
		latitude: null,
		longitude: null
	};

	placeRow.addEventListener('click', function(){
		var placeWindow = Ti.UI.createWindow({
			title: 'Place',
			backgroundColor: '#fff'
		});

		placeWindow.addEventListener('close', function(){
			if (place.id && place.name && place.latitude && place.longitude) {
				checkinLabel.text = place.name;
			} else {
				checkinLabel.text = '';
			}
		});

		var cancelButton = Ti.UI.createButton({
			systemButton: Ti.UI.iPhone.SystemButton.CANCEL
		});
		cancelButton.addEventListener('click', function(){
			place = {
				id: null,
				name: null,
				latitude: null,
				longitude: null
			};
			placeWindow.close();
		});
		placeWindow.rightNavButton = cancelButton;

		var placeMapView = Ti.Map.createView({
			top: 0,
			left: 0,
			height: 200,
			mapType: Ti.Map.STANDARD_TYPE,
			animate: true,
			regionFit: true,
			userLocation: true
		});
		placeWindow.add(placeMapView);

		var placeTableView = Ti.UI.createTableView({
			top: 200,
			left: 0,
			height: 216,
			data: []
		});
		placeWindow.add(placeTableView);

		placeTableView.addEventListener('click', function(e){
			place = {
				id: e.rowData.id,
				name: e.rowData.name,
				latitude: e.rowData.latitude,
				longitude: e.rowData.longitude
			};
			placeWindow.close();
		});

		Ti.Geolocation.purpose = 'TiPlatformConnect';
		if (Ti.Geolocation.locationServicesEnabled) {
			Ti.Geolocation.getCurrentPosition(function(e){
				if (e.error) {
					// error proc...
				} else {
					placeMapView.region = {
						latitude: e.coords.latitude,
						longitude: e.coords.longitude,
						latitudeDelta: 0.005,
						longitudeDelta: 0.005
					};

					foursquare.request('v2/venues/search', { ll: e.coords.latitude + ',' + e.coords.longitude }, {}, 'GET', function(e){
						if (e.success) {
							var json = JSON.parse(e.result.text);

							var rows = [];

							json.response.venues.forEach(function(venue){
								var venueRow = Ti.UI.createTableViewRow({
									id: venue.id,
									name: venue.name,
									latitude: venue.location.lat,
									longitude: venue.location.lng
								});
								rows.push(venueRow);

								var venueLabel = Ti.UI.createLabel({
									top: -16,
									left: 10,
									text: venue.name
								});
								venueRow.add(venueLabel);

								var addressLabel = Ti.UI.createLabel({
									top: 16,
									left: 10,
									color: '#666',
									font: { fontSize: 12 },
									text: venue.location.address
								});
								venueRow.add(addressLabel);
							});

							placeTableView.setData(rows);
						} else {
							// error proc...
						}
					});
				}
			});
		} else {
			// error proc...
		}

		placeWindow.open({ modal: true });
	});

	var platformSection = Ti.UI.createTableViewSection({
		headerTitle: 'Platform'
	});
	sections.push(platformSection);

	var twitterRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(twitterRow);

	var twitterLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Twitter'
	});
	twitterRow.add(twitterLabel);

	var twitterSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('twitterShareSwitch', true)
	});
	twitterSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('twitterShareSwitch', e.value);
	});

	var twitterAuthorize = function(event){
		twitter.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('twitterAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('twitterAccessTokenSecret', e.accessTokenSecret);

				twitter.request('1/account/verify_credentials.json', {}, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						twitterLabel.setText(json.screen_name + ' on Twitter');
						twitterRow.add(twitterSwitch);
						twitterRow.touchEnabled = false;
						twitterRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
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

	var facebookRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(facebookRow);

	var facebookLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Facebook'
	});
	facebookRow.add(facebookLabel);

	var facebookSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('facebookShareSwitch', true)
	});
	facebookSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('facebookShareSwitch', e.value);
	});

	if (Ti.Facebook.getLoggedIn()) {
		Ti.Facebook.requestWithGraphPath('me', {}, 'GET', function(e){
			if (e.success) {
				var json = JSON.parse(e.result);
				facebookLabel.setText(json.name + ' on Facebook');
				facebookRow.add(facebookSwitch);
			}
		});
	} else {
		facebookRow.touchEnabled = true;
		facebookRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

		facebookRow.addEventListener('click', function(){
			Ti.Facebook.authorize();
		});
	}

	Ti.Facebook.addEventListener('login', function(e) {
		if (e.success) {
			Ti.Facebook.requestWithGraphPath('me', {}, {}, 'GET', function(e){
				if (e.success) {
					var json = JSON.parse(e.result);
					facebookLabel.setText(json.name + ' on Facebook');
					facebookRow.add(facebookSwitch);
				}
			});

			facebookRow.touchEnabled = false;
			facebookRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
		} else if (e.error) {
			// error proc...
		} else if (e.cancelled) {
			// cancel proc...
		}
	});

	var linkedinRow = Ti.UI.createTableViewRow({
		height: Ti.UI.FILL,
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(linkedinRow);

	var linkedinLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Linkedin'
	});
	linkedinRow.add(linkedinLabel);

	var linkedinSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('linkedinShareSwitch', true)
	});
	linkedinSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('linkedinShareSwitch', e.value);
	});

	var linkedinAuthorize = function(event){
		linkedin.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('linkedinAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('linkedinAccessTokenSecret', e.accessTokenSecret);

				linkedin.request('v1/people/~', { format: 'json' }, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						linkedinLabel.setText(json.firstName + ' on Linkedin');
						linkedinRow.add(linkedinSwitch);
						linkedinRow.touchEnabled = false;
						linkedinRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							linkedinRow.removeEventListener('click', linkedinAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
			}
		});

		linkedin.authorize();
	};

	if (linkedin.authorized) {
		linkedinAuthorize();
	} else {
		linkedinRow.touchEnabled = true;
		linkedinRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

		linkedinRow.addEventListener('click', linkedinAuthorize);
	}

	var tumblrRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(tumblrRow);

	var tumblrLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Tumblr'
	});
	tumblrRow.add(tumblrLabel);

	var tumblrSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('tumblrShareSwitch', true)
	});
	tumblrSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('tumblrShareSwitch', e.value);
	});

	var tumblrBlog = JSON.parse(Ti.App.Properties.getString('tumblrBlog', '{}'));

	var tumblrAuthorize = function(event){
		tumblr.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('tumblrAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('tumblrAccessTokenSecret', e.accessTokenSecret);

				tumblr.request('v2/user/info', {}, {}, 'POST', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						tumblrLabel.setText(json.response.user.name + ' on Tumblr');
						tumblrRow.add(tumblrSwitch);
						tumblrRow.touchEnabled = false;
						tumblrRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						var tumblrBlogRow = Ti.UI.createTableViewRow({
							hasChild: true
						});
						tableView.insertRowAfter(6, tumblrBlogRow);

						tumblrBlogRow.addEventListener('click', function(){
							var tumblrBlogWindow = Ti.UI.createWindow({
								title: 'Choose a Tumblr',
								backgroundColor: '#fff'
							});

							tumblrBlogWindow.addEventListener('close', function(){
								if (tumblrBlog.name && tumblrBlog.title) {
									chooseLabel.text = tumblrBlog.title;
								} else {
									chooseLabel.text = '';
								}
							});

							var cancelButton = Ti.UI.createButton({
								systemButton: Ti.UI.iPhone.SystemButton.CANCEL
							});
							cancelButton.addEventListener('click', function(e){
								tumblrBlog = {};
								tumblrBlogWindow.close();
							});
							tumblrBlogWindow.rightNavButton = cancelButton;

							var tumblrBlogTableView = Ti.UI.createTableView({
								data: []
							});
							tumblrBlogWindow.add(tumblrBlogTableView);

							tumblrBlogTableView.addEventListener('click', function(e){
								tumblrBlog = {
									name: e.rowData.name,
									title: e.rowData.blogTitle
								};
								Ti.App.Properties.setString('tumblrBlog', JSON.stringify(tumblrBlog));
								tumblrBlogWindow.close();
							});

							var rows = [];

							json.response.user.blogs.forEach(function(blog){
								var tumblrBlogRow = Ti.UI.createTableViewRow({
									name: blog.name,
									blogTitle: blog.title
								});
								rows.push(tumblrBlogRow);

								var tumblrBlogLabel = Ti.UI.createLabel({
									left: 10,
									text: blog.title
								});
								tumblrBlogRow.add(tumblrBlogLabel);
							});

							tumblrBlogTableView.setData(rows);

							tumblrBlogWindow.open({ modal: true });
						});

						var tumblrBlogLabel = Ti.UI.createLabel({
							left: 10,
							text: 'Choose a Tumblr'
						});
						tumblrBlogRow.add(tumblrBlogLabel);

						var chooseLabel = Ti.UI.createLabel({
							right: 10,
							color: '#666',
							font: { fontSize: 12 },
							textAlign: 'right',
							text: JSON.parse(Ti.App.Properties.getString('tumblrBlog', '{}')).title
						});
						tumblrBlogRow.add(chooseLabel);

						if (event) {
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

	var mixiRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(mixiRow);

	var mixiLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Mixi'
	});
	mixiRow.add(mixiLabel);

	var mixiSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('mixiShareSwitch', true)
	});
	mixiSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('mixiShareSwitch', e.value);
	});

	var mixiAuthorize = function(event){
		mixi.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('mixiAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('mixiRefreshTokenKey', e.refreshTokenKey);

				var expiresIn = e.expiresIn;
				mixi.request('2/people/@me/@self', { format: 'json' }, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						mixiLabel.setText(json.entry.displayName + ' on Mixi');
						mixiRow.add(mixiSwitch);
						mixiRow.touchEnabled = false;
						mixiRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							mixiRow.removeEventListener('click', mixiAuthorize);
						}

						setInterval(function(){
							mixi.refreshAccessToken();
						}, expiresIn * 0.9 * 1000);
					} else {
						// error proc...
					}
				});
			} else {
				mixiRow.touchEnabled = true;
				mixiRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;
				mixiCallback = true;

				mixiRow.addEventListener('click', mixiAuthorize);
			}
		});

		mixi.authorize();
	};

	if (mixi.authorized) {
		mixiAuthorize();
	} else {
		mixiRow.touchEnabled = true;
		mixiRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;
		mixiCallback = true;

		mixiRow.addEventListener('click', mixiAuthorize);
	}

	var flickrRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(flickrRow);

	var flickrLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Flickr'
	});
	flickrRow.add(flickrLabel);

	var flickrSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('flickrShareSwitch', true)
	});
	flickrSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('flickrShareSwitch', e.value);
	});

	var flickrAuthorize = function(event){
		flickr.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('flickrAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('flickrAccessTokenSecret', e.accessTokenSecret);

				flickr.request('services/rest', { nojsoncallback: 1, format: 'json', method: 'flickr.test.login' }, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						flickrLabel.setText(json.user.username._content + ' on Flickr');
						flickrRow.add(flickrSwitch);
						flickrRow.touchEnabled = false;
						flickrRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							flickrRow.removeEventListener('click', flickrAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
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
	platformSection.add(foursquareRow);

	var foursquareLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Foursquare'
	});
	foursquareRow.add(foursquareLabel);

	var foursquareSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('foursquareShareSwitch', true)
	});
	foursquareSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('foursquareShareSwitch', e.value);
	});

	var foursquareAuthorize = function(event){
		foursquare.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('foursquareAccessTokenKey', e.accessTokenKey);

				foursquare.request('v2/users/self', {}, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						foursquareLabel.setText(json.response.user.firstName + ' on Foursquare');
						foursquareRow.add(foursquareSwitch);
						foursquareRow.touchEnabled = false;
						foursquareRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
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

	var googleRow = Ti.UI.createTableViewRow({
		height: Ti.UI.FILL,
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(googleRow);

	var googleLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Google'
	});
	googleRow.add(googleLabel);

	var googleSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('googleShareSwitch', true)
	});
	googleSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('googleShareSwitch', e.value);
	});

	var googleAuthorize = function(event){
		google.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('googleAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('googleRefreshTokenKey', e.refreshTokenKey);

				google.request('https://www.google.com/m8/feeds/contacts/default/full', { alt: 'json' }, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						googleLabel.setText(json.feed.author[0].name.$t + ' on Google');
						googleRow.add(googleSwitch);
						googleRow.touchEnabled = false;
						googleRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							googleRow.removeEventListener('click', googleAuthorize);
						}

						setInterval(function(){
							google.refreshAccessToken();
						}, expiresIn * 0.9 * 1000);
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
			}
		});

		google.authorize();
	};

	if (google.authorized) {
		googleAuthorize();
	} else {
		googleRow.touchEnabled = true;
		googleRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

		googleRow.addEventListener('click', googleAuthorize);
	}

	var githubRow = Ti.UI.createTableViewRow({
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(githubRow);

	var githubLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Github'
	});
	githubRow.add(githubLabel);

	var githubSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('githubShareSwitch', true)
	});
	githubSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('githubShareSwitch', e.value);
	});

	var githubAuthorize = function(event){
		github.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('githubAccessTokenKey', e.accessTokenKey);

				github.request('user', {}, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						githubLabel.setText(json.login + ' on Github');
						githubRow.add(githubSwitch);
						githubRow.touchEnabled = false;
						githubRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							githubRow.removeEventListener('click', githubAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				githubRow.touchEnabled = true;
				githubRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

				githubRow.addEventListener('click', githubAuthorize);
			}
		});

		github.authorize();
	};

	if (github.authorized) {
		githubAuthorize();
	} else {
		githubRow.touchEnabled = true;
		githubRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

		githubRow.addEventListener('click', githubAuthorize);
	}

	var etsyRow = Ti.UI.createTableViewRow({
		height: Ti.UI.FILL,
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(etsyRow);

	var etsyLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Etsy'
	});
	etsyRow.add(etsyLabel);

	var etsySwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('etsyShareSwitch', true)
	});
	etsySwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('etsyShareSwitch', e.value);
	});

	var etsyAuthorize = function(event){
		etsy.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('etsyAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('etsyAccessTokenSecret', e.accessTokenSecret);

				etsy.request('v2/users/__SELF__', {}, {}, 'GET', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						etsyLabel.setText(json.results[0].login_name + ' on Etsy');
						etsyRow.add(etsySwitch);
						etsyRow.touchEnabled = false;
						etsyRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							etsyRow.removeEventListener('click', etsyAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				etsyRow.touchEnabled = true;
				etsyRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

				etsyRow.addEventListener('click', etsyAuthorize);
			}
		});

		etsy.authorize();
	};

	if (etsy.authorized) {
		etsyAuthorize();
	} else {
		etsyRow.touchEnabled = true;
		etsyRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

		etsyRow.addEventListener('click', etsyAuthorize);
	}

	var hatenaRow = Ti.UI.createTableViewRow({
		height: Ti.UI.FILL,
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(hatenaRow);

	var hatenaLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Hatena'
	});
	hatenaRow.add(hatenaLabel);

	var hatenaSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('hatenaShareSwitch', true)
	});
	hatenaSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('hatenaShareSwitch', e.value);
	});

	var hatenaAuthorize = function(event){
		hatena.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('hatenaAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('hatenaAccessTokenSecret', e.accessTokenSecret);

				hatena.request('applications/my.json', {}, {}, 'POST', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						hatenaLabel.setText(json.display_name + ' on Hatena');
						hatenaRow.add(hatenaSwitch);
						hatenaRow.touchEnabled = false;
						hatenaRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							hatenaRow.removeEventListener('click', hatenaAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
			}
		});

		hatena.authorize();
	};

	if (hatena.authorized) {
		hatenaAuthorize();
	} else {
		hatenaRow.touchEnabled = true;
		hatenaRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

		hatenaRow.addEventListener('click', hatenaAuthorize);
	}

	var dropboxRow = Ti.UI.createTableViewRow({
		height: Ti.UI.FILL,
		touchEnabled: false,
		selectionStyle: Ti.UI.iPhone.TableViewCellSelectionStyle.NONE
	});
	platformSection.add(dropboxRow);

	var dropboxLabel = Ti.UI.createLabel({
		left: 10,
		text: 'Sign in with Dropbox'
	});
	dropboxRow.add(dropboxLabel);

	var dropboxSwitch = Ti.UI.createSwitch({
		right: 10,
		value: Ti.App.Properties.getBool('dropboxShareSwitch', true)
	});
	dropboxSwitch.addEventListener('change', function(e){
		Ti.App.Properties.setBool('dropboxShareSwitch', e.value);
	});

	var dropboxAuthorize = function(event){
		dropbox.addEventListener('login', function(e){
			if (e.success) {
				Ti.App.Properties.setString('dropboxAccessTokenKey', e.accessTokenKey);
				Ti.App.Properties.setString('dropboxAccessTokenSecret', e.accessTokenSecret);

				dropbox.request('1/account/info', {}, {}, 'POST', function(e){
					if (e.success) {
						var json = JSON.parse(e.result.text);

						dropboxLabel.setText(json.display_name + ' on Dropbox');
						dropboxRow.add(dropboxSwitch);
						dropboxRow.touchEnabled = false;
						dropboxRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;

						if (event) {
							dropboxRow.removeEventListener('click', dropboxAuthorize);
						}
					} else {
						// error proc...
					}
				});
			} else {
				// error proc…
			}
		});

		dropbox.authorize();
	};

	if (dropbox.authorized) {
		dropboxAuthorize();
	} else {
		dropboxRow.touchEnabled = true;
		dropboxRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;

		dropboxRow.addEventListener('click', dropboxAuthorize);
	}

	tableView.setData(sections);

	var tab = Ti.UI.createTab({
		window: window
	});

	var tabGroup = Ti.UI.createTabGroup();
	tabGroup.addTab(tab);
	tabGroup.open();
})(this);
