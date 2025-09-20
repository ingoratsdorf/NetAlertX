<?php

// Constants
define('CONFIG_PATH', $_SERVER['DOCUMENT_ROOT'] . "/../config/app.conf");
define('COOKIE_SAVE_LOGIN_NAME', "NetAlertX_SaveLogin");

// Utility Functions
function getConfigLine($pattern, $config_lines) {
    $matches = preg_grep($pattern, $config_lines);
    return !empty($matches) ? explode("=", array_values($matches)[0]) : null;
}

function getConfigValue($pattern, $config_lines, $delimiter = "'") {
    $line = preg_grep($pattern, $config_lines);
    return !empty($line) ? explode($delimiter, array_values($line)[0])[1] : '';
}

function redirect($url) {
    header("Location: $url");
    exit();
}

// Initialization
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

// Parse the URL and extract the path component
// error_log("-------------");
$parsedUrl = parse_url($url, PHP_URL_PATH);

// Normalize the path: treat '/' (root) and '/index.php' as equivalent
$isLogonPage = ($parsedUrl === '/' || $parsedUrl === '/index.php');

$authHeader = apache_request_headers()['Authorization'] ?? '';
$sessionLogin = isset($_SESSION['login']) ? $_SESSION['login'] : 0;

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Handle logout
if (!empty($_REQUEST['action']) && $_REQUEST['action'] == 'logout') {
    session_destroy();
    setcookie(COOKIE_SAVE_LOGIN_NAME, "", time() - 3600);
    redirect('index.php');
}

// Load configuration
if (!file_exists(CONFIG_PATH)) {
    die("Configuration file not found in " . $_SERVER['DOCUMENT_ROOT'] . "/../config/app.conf");
}
$configLines = file(CONFIG_PATH);

// Handle web protection and password
$nax_WebProtection = strtolower(trim(getConfigLine('/^SETPWD_enable_password.*=/', $configLines)[1] ?? 'false'));
$nax_Password = getConfigValue('/^SETPWD_password.*=/', $configLines);
$api_token = getConfigValue('/^API_TOKEN.*=/', $configLines, "'");

$expectedToken = 'Bearer ' . $api_token;

// Authentication Handling
if ($nax_WebProtection == 'true') {
    if ($authHeader === $expectedToken) {
        $_SESSION['login'] = 1; // User authenticated with bearer token
    } elseif (!empty($authHeader)) {
        echo "[Security] Incorrect Bearer Token";
    }

    // Safely check if the session login exists before checking its value
    $isLoggedIn = isset($_SESSION['login']) && $_SESSION['login'] == 1;

    // Determine if the user should be redirected
    if ($isLoggedIn || $isLogonPage || (isset($_COOKIE[COOKIE_SAVE_LOGIN_NAME]) && $nax_Password === $_COOKIE[COOKIE_SAVE_LOGIN_NAME])) {
        // Logged in or stay on this page if we are on the index.php already
    } else {
        // We need to redirect
        redirect('/index.php');
        exit; // exit is needed to prevent authentication bypass
    }
}

?>
