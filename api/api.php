<?php
header("Access-Control-Allow-Origin: *");

define('CLIENT_ID', '');
define('ACCESS_TOKEN', '');

if (isset($_GET['mode'])) {
    if ($_GET['mode'] == 'search' && isset($_GET['nickname'])) {
        find_user($_GET['nickname']);
    } else if ($_GET['mode'] == 'followers' && isset($_GET['user_id'])) {
        get_user_followers($_GET['user_id']);
    }
}

function find_user($nickname) {
    $query = http_build_query(['q' => $nickname, 'access_token' => ACCESS_TOKEN]);
    $endpoint = 'https://api.instagram.com/v1/users/search';
    $url = $endpoint . '?' . $query;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    $data = curl_exec($ch);
    curl_close($ch);

    header('Content-Type: application/json');
    echo $data;
}

function get_user_followers($user_id) {
    $user_id = (int)$user_id;
    $query = http_build_query(['access_token' => ACCESS_TOKEN]);
    $endpoint = 'https://api.instagram.com/v1/users/' . $user_id . '/followed-by';
    $url = $endpoint . '?' . $query;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    $data = curl_exec($ch);
    curl_close($ch);

    header('Content-Type: application/json');
    echo $data;
}
