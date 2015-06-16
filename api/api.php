<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
    $query = http_build_query(array('q' => $nickname, 'access_token' => ACCESS_TOKEN));
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

function get_followers_by_url($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

function get_user_followers($user_id) {
    $user_id = (int)$user_id;
    $query = http_build_query(array('access_token' => ACCESS_TOKEN));
    $endpoint = 'https://api.instagram.com/v1/users/' . $user_id . '/followed-by';
    $url = $endpoint . '?' . $query;

    $followers = array();
    do {
        $data = get_followers_by_url($url);
        $data = json_decode($data, true);
        foreach ($data['data'] as $follower) {
            $followers[] = $follower;
        }
        if (isset($data['pagination']) && isset($data['pagination']['next_url'])) {
            $url = $data['pagination']['next_url'];
        } else {
            $url = null;
        }
    } while ($url != null);

    $data = array('data' => $followers);
    $data = json_encode($data);
    header('Content-Type: application/json');
    echo $data;
}
