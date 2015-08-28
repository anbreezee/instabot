$(function () {
var followerCounter = 0;
var subsPerRound = [45, 70];
var intervalBetweenRounds = [15 * 1000 * 60, 20 * 1000 * 60];
var hTimeout;
var subscribeMode;
var subscriptionMode;
var autoSubscribers = [];
var autoIndex = 0;
var maxAutoSubscribersPerRound = 5;
var maxAutoSubscribers = 200;
var action;

var logIt = function (message) {
	$('#log').val($('#log').val() + message + "\r\n");
};

var getRandom = function (arr, n) {
	var result = new Array(n),
		len = arr.length,
		taken = new Array(len);
	if (n > len) {
		return arr;
	}
	while (n--) {
		var x = Math.floor(Math.random() * len);
		result[n] = arr[x in taken ? taken[x] : x];
		taken[x] = --len;
	}
	return result;
};

var gotoUrl = function (url, callback) {
	var queryInfo = { active: true, currentWindow: true };
	chrome.tabs.query(queryInfo, function (tabs) {
		var tab = tabs[0];
		chrome.tabs.update(tab.id, {url: url});
		callback();
	});
};
var getAppInfo = function () {
	return {
		nickname: $('#nickname').val(),
		apiurl: 'http://188.166.7.99:8082/instabot/api.php' // $('#apiurl').val()
	};
};
var getRandomInt = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
var timeToLunch = function () {
	followerCounter++;
	if (followerCounter >= getRandomInt(subsPerRound[0], subsPerRound[1])) {
		followerCounter = 0;
		return getRandomInt(intervalBetweenRounds[0], intervalBetweenRounds[1]);
	}
	return 0;
};

var findUser = function (user, callback) {
	var appInfo = getAppInfo();
	logIt('request: search ' + user);
	$.get(appInfo.apiurl, { mode: 'search', nickname: user })
		.done(function (res) {
			if (res.data.length == 0) {
				logIt('User not found');
				return callback('not found');
			}
			logIt('User found: ID ' + res.data[0].id);
			callback(null, res.data[0]);
		})
		.fail(function (err) {
			callback(err)
		});
};

var getUserFollowers = function (user, callback) {
	findUser(user, function (err, data) {
		if (err) {
			return callback(err);
		}
		var appInfo = getAppInfo();
		logIt('request: followers for ' + data.id);

		mode = 'followers';
		if (subscribeMode == 'followed_by') {
			mode = 'following';
		}
		if (action == 'unsubscribe') {
			mode = 'following';
		}

		$.get(appInfo.apiurl, { mode: mode, user_id: data.id })
			.done(function (res) {
				if (res.data.length === 0) {
					logIt('Followers not found');
					return callback('not found');
				}
				logIt('Followers found: total ' + res.data.length);
				callback(null, res.data);
			})
			.fail(function (err) {
				callback(err);
			});
	});
};

var _subscribeTo = function (followers, index, callback) {
	if (index >= followers.length) {
		return callback();
	}
	logIt('user: ' + followers[index].username);

	if (subscriptionMode == 'auto' && autoSubscribers[autoIndex].length < maxAutoSubscribersPerRound) {
		console.log(followers[index].username);
		getUserFollowers(followers[index].username, function (err, data) {
			if (data != undefined && data.length < maxAutoSubscribers) {
				autoSubscribers[autoIndex].push(followers[index].username);
				console.log(autoSubscribers);
			}
			gotoUrl('http://www.instagram.com/' + followers[index].username, function () {

				var timeout = timeToLunch();
				if (timeout === 0) {
					timeout = 3000;
				}

				hTimeout = setTimeout(function () {
					var queryInfo = { active: true, currentWindow: true };
					chrome.tabs.query(queryInfo, function (tabs) {
						var tab = tabs[0];
						chrome.tabs.executeScript(tab.id, { code: "var button=document.getElementsByClassName('-cx-PRIVATE-FollowButton__button');if(button[0].className.replace(/[\\n\\t]/g, ' ').indexOf('-cx-PRIVATE-IGButton__success')==-1){button[0].click()}" });
						hTimeout = setTimeout(function () {
							_subscribeTo(followers, (index + 1), callback);
						}, 1000);
					});
				}, timeout);
			});
		})
	} else {
		gotoUrl('http://www.instagram.com/' + followers[index].username, function () {

			var timeout = timeToLunch();
			if (timeout === 0) {
				timeout = 3000;
			}

			hTimeout = setTimeout(function () {
				var queryInfo = { active: true, currentWindow: true };
				chrome.tabs.query(queryInfo, function (tabs) {
					var tab = tabs[0];
					chrome.tabs.executeScript(tab.id, { code: "var button=document.getElementsByClassName('-cx-PRIVATE-FollowButton__button');if(button[0].className.replace(/[\\n\\t]/g, ' ').indexOf('-cx-PRIVATE-IGButton__success')==-1){button[0].click()}" });
					hTimeout = setTimeout(function () {
						_subscribeTo(followers, (index + 1), callback);
					}, 1000);
				});
			}, timeout);
		});
	}
};

var _unsubscribeFromFollower = function (followers, index, callback) {
	if (index >= followers.length) {
		return callback();
	}
	logIt('user: ' + followers[index].username);
	gotoUrl('http://www.instagram.com/' + followers[index].username, function () {

		var timeout = timeToLunch();
		if (timeout === 0) {
			timeout = 3000;
		}

		hTimeout = setTimeout(function () {
			var queryInfo = { active: true, currentWindow: true };
			chrome.tabs.query(queryInfo, function (tabs) {
				var tab = tabs[0];
				chrome.tabs.executeScript(tab.id, { code: "var button=document.getElementsByClassName('-cx-PRIVATE-FollowButton__button');if(button[0].className.replace(/[\\n\\t]/g, ' ').indexOf('-cx-PRIVATE-IGButton__success')>-1){button[0].click()}" });

				number = $('#unsubscribeNumber').data('number');
				number--;
				$('#unsubscribeNumber').data('number', number);
				$('#unsubscribeNumber').val(number + ' left');

				hTimeout = setTimeout(function () {
					_unsubscribeFromFollower(followers, (index + 1), callback);
				}, 1000);
			});
		}, timeout);
	});
};

var _subscribe = function (users, index, callback) {
	if (index >= users.length) {
		if (subscriptionMode == 'auto') {
			console.log(autoSubscribers);
			console.log(autoIndex);
			if (autoSubscribers[autoIndex].length > 0) {
				logIt('Found ' + autoSubscribers[autoIndex].length + ' auto users:');
				for (var i in autoSubscribers[autoIndex]) {
					logIt(' > ' + autoSubscribers[autoIndex][i]);
				}
				autoIndex++;
				autoSubscribers[autoIndex] = [];
				_subscribe(autoSubscribers[autoIndex - 1], 0, callback);
			}
		}
		return callback();
	}
	getUserFollowers(users[index], function (err, data) {
		logIt('Active user: ' + users[index]);
		if (err) {
			logIt('Error');
			_subscribe(users, (index + 1), callback);
		} else {
			_subscribeTo(data, 0, function () {
				_subscribe(users, (index + 1), callback);
			});
		}
	});
};

var subscribe = function () {
	action = 'subscribe';
	if (subscriptionMode == 'manual' || subscriptionMode == 'auto') {
		var users = $('#subscribeUsers').val();
		users = users.split(/[ ,]+/);
		autoSubscribers[0] = [];
		autoIndex = 0;
		followerCounter = 0;
		_subscribe(users, 0, function () {
			logIt('Finish!');
		});
	} else if (subscriptionMode == 'url') {
		var url = $('#subscribeUsers').val();
		$.get(url)
			.done(function (res) {
				if (res.length === 0) {
					logIt('No data');
					return;
				}
				var users = res.split(/[ ,]+/);
				logIt('Users: total ' + users.length);
				autoSubscribers[0] = [];
				autoIndex = 0;
				followerCounter = 0;
				_subscribe(users, 0, function () {
					logIt('Finish!');
				});
			})
			.fail(function (err) {
				logIt(err.responseText);
				return;
			});
	}
};

var unsubscribeFollowers = function () {
	var appInfo = getAppInfo();
	// var number = $('#unsubscribeNumber').val();
	followerCounter = 0;
	action = 'unsubscribe';
	getUserFollowers(appInfo.nickname, function (err, data) {
		var number = data.length;
		$('#unsubscribeNumber').data('number', number);
		$('#unsubscribeNumber').val(number + ' left');

		if (err) {
			return logIt('Error');
		}
		var randomFollowers = getRandom(data, number);
		_unsubscribeFromFollower(randomFollowers, 0, function () {
			logIt('Finish!');
		});
	});
};

var startProcess = function () {
	logIt('Process started');
	subscribeMode = $('#objects:checked').val();
	subscriptionMode = $('#subscriptionMode:checked').val();
	logIt('Subscribe mode: ' + subscribeMode);
	logIt('Subscription mode: ' + subscriptionMode);
	$('#stop').prop('disabled', false);
}

var stopProcess = function () {
	logIt('Process interrupted');
	$('#stop').prop('disabled', true);
	if (hTimeout) {
		clearTimeout(hTimeout);
	}
	hTimeout = null;
}

$('#subscribe').bind('click', function () {
	startProcess();
	subscribe();
});

$('#unsubscribe').bind('click', function () {
	startProcess();
	unsubscribeFollowers();
});

$('#stop').bind('click', function () {
	stopProcess();
});

$('input[name=subscriptionMode]').bind('change', function () {
	$('#subscribeUsers').prop('placeholder', $('#subscriptionMode:checked').data('placeholder'));
});
});


/*
function getCurrentTabUrl(callback) {
var queryInfo = {
active: true,
currentWindow: true
};

chrome.tabs.query(queryInfo, function(tabs) {
var tab = tabs[0];
var url = tab.url;
console.assert(typeof url == 'string', 'tab.url should be a string');
callback(url);
});
}

function getImageUrl(searchTerm, callback, errorCallback) {
var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
'?v=1.0&q=' + encodeURIComponent(searchTerm);
var x = new XMLHttpRequest();
x.open('GET', searchUrl);
// The Google image search API responds with JSON, so let Chrome parse it.
x.responseType = 'json';
x.onload = function() {
// Parse and process the response from Google Image Search.
var response = x.response;
if (!response || !response.responseData || !response.responseData.results ||
	response.responseData.results.length === 0) {
	errorCallback('No response from Google Image search!');
	return;
}
var firstResult = response.responseData.results[0];
// Take the thumbnail instead of the full image to get an approximately
// consistent image size.
var imageUrl = firstResult.tbUrl;
var width = parseInt(firstResult.tbWidth);
var height = parseInt(firstResult.tbHeight);
console.assert(
	typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
	'Unexpected respose from the Google Image Search API!');
callback(imageUrl, width, height);
};
x.onerror = function() {
errorCallback('Network error.');
};
x.send();
}

function renderStatus(statusText) {
document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {

document.getElementById('gotoinst').onclick = function () {
	gotoInstagram(function() {});
}

getCurrentTabUrl(function(url) {
// Put the image URL in Google search.
renderStatus('Performing Google Image search for ' + url);

getImageUrl(url, function(imageUrl, width, height) {

	renderStatus('Search term: ' + url + '\n' +
		'Google image search result: ' + imageUrl);
	var imageResult = document.getElementById('image-result');
	// Explicitly set the width/height to minimize the number of reflows. For
	// a single image, this does not matter, but if you're going to embed
	// multiple external images in your page, then the absence of width/height
	// attributes causes the popup to resize multiple times.
	imageResult.width = width;
	imageResult.height = height;
	imageResult.src = imageUrl;
	imageResult.hidden = false;

}, function(errorMessage) {
	renderStatus('Cannot display image. ' + errorMessage);
});
});
});
*/