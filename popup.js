$(function () {
    function gotoUrl(url, callback) {
        var queryInfo = {
            active: true,
            currentWindow: true
        };
        chrome.tabs.query(queryInfo, function(tabs) {
            var tab = tabs[0];
            chrome.tabs.update(tab.id, {url: url});
        });
    }

    function getAppInfo() {
        return {
            clientId: $('#clientId').val(),
            accessToken: $('#accessToken').val(),
            nickname: $('#nickname').val()
        };
    }

    function findUser(user, callback) {
        var appInfo = getAppInfo();
        var url = 'https://api.instagram.com/v1/users/search?q=' + user + '&access_token=' + appInfo.accessToken;
        $.ajax({
            url: url,
            jsonp: 'callback',
            dataType: 'jsonp',
            data: { q: user, access_token: appInfo.accessToken },
            success: function (data) {
                if (data.length == 0) {
                    callback('not found');
                }
                callback(null, data[0]);
             },
            error: function () {
                callback('error')
            }
        });
    }

    function getUserFollowers(user, callback) {
        findUser(user, function(err, data) {
            if (err) {
                callback('error');
            } else {
                callback(null, data);
            }
        });
    }

    function _subscribeFollowers(users, index, callback) {
        if (index >= users.length) {
            return callback();
        }
        getUserFollowers(users[index], function (err, data) {
            console.log(users[index]);
            if (err) {
                console.log('error');
            } else {
                console.log(data);
            }
            _subscribeFollowers(users, (index+1), callback);
        })
    }

    function subscribeFollowers() {
        var users = $('#subscribeUsers').val();
        users = users.split(/[ ,]+/);
        _subscribeFollowers(users, 0, function () {
            console.log('finish');
        });
    }

    function unsubscribeFollowers() {
        var appInfo = getAppInfo();
        var number = $('#unsubscribeNumber').val();
    }

    $('#subscribe').bind('click', function () {
        subscribeFollowers();
    })

    $('#unsubscribe').bind('click', function () {
        unsubscribeFollowers();
    })
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