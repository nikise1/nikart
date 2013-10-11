<?php

header('Content-Type: application/json; charset=utf-8');

require('get_data_from_db.php');
$dataObj = new GetDataFromDb();

$siteData = array();
$siteData['success'] = TRUE;
$siteData['id'] = 'main';
$siteData['title'] = 'Main';
$siteData['type'] = 'main';
$siteData['menu'] = $dataObj->getAllTables('main');
$siteData['other'] = $dataObj->getOther();
$dataObj->close();

if (isset($_GET["pretty"]) && $_GET["pretty"]) {
    $json = json_encode($siteData, JSON_PRETTY_PRINT);
} else {
    $json = json_encode($siteData);
}

//echo mb_detect_encoding($json) . '<br />';

echo $json;

?>