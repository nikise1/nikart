<?php

require_once('database.php');

class GetDataFromDb {

    private $db;
    private $hostName = 'localhost';
    private $userName = 'nikisehmi';
    private $password = 'wh4p4456';
    private $dbName = 'nikart';
    private $tableDataObj;
    private $counter = 0;

    public function __construct() {
        $this->db = new Database($this->hostName, $this->userName, $this->password, $this->dbName, 0);
    }

    public function close() {
        $this->db->close();
    }

    public function getAllTables($curTable) {
        $this->tableDataObj = $this->getTable($curTable);
        $this->fillInFeatured();
        return $this->tableDataObj;
    }

    private function getTable($curTable) {
        $tableSql = "SELECT * FROM nikart_$curTable WHERE active='1'";
        $result = $this->db->query($tableSql);

        $containerObj = array();
        while ($row = $result->fetch_assoc()) {
            $subObj = array();
            $this->getIfExists($row, $subObj, 'id', false);
            $this->getIfExists($row, $subObj, 'type', false);
            if ($row['type'] == 'men') {
                $subObj['menu'] = $this->getTable($row['id']);
            }
            if ($row['type'] != 'lnk') {
                $this->setDetails($row, $subObj);
            }
            $containerObj[] = $subObj;
        }
        return $containerObj;
    }

    private function getIfExists($row, &$subObj, $id, $isNumber, $isFeatured = false) {
        $idValue = $row[$id];
        if ($idValue) {

            if ($isNumber) {

                $idValue = intval($idValue);
                $subObj[$id] = $idValue;

            } else if (!$isFeatured) {
                //*** First sweep not 'lnk'

                $transValue = $row[$id . '_es'];
                if (!$transValue) {
                    $subObj[$id] = $this->encodeCorrectly($idValue);
//                    echo $idValue . ': ' . mb_detect_encoding($idValue) . ', ';
                } else {
                    $subObj[$id] = array();
                    $subObj[$id]['en'] = $this->encodeCorrectly($idValue);
                    $subObj[$id]['es'] = $this->encodeCorrectly($transValue);
                }
            } else {
                //*** getting data fron 'lnk' if multi language ***

                if (!is_array($idValue)) {
                    $subObj[$id] = $idValue;
//                    echo $idValue . ': ' . mb_detect_encoding($idValue) . ', ';
                } else {
                    $subObj[$id] = array();
                    $subObj[$id]['en'] = $idValue['en'];
                    $subObj[$id]['es'] = $idValue['es'];
                }
            }
        }
    }

    private function encodeCorrectly($str) {
        $str = $this->convertIntoBr($str);
        $str = mb_convert_encoding($str, 'UTF-8', 'ISO-8859-1');
//        $str = utf8_encode($str);
//        $str = mb_convert_encoding($str, 'UTF-8');
//    $str = mb_convert_encoding($str, 'UTF-8', 'HTML-ENTITIES');
        return $str;
    }

    private function convertIntoBr($str) {
        $newStr = str_replace("\r\n", "<br />", $str);
        $newStr = str_replace("\n", "<br />", $newStr);
        return $newStr;
    }

    private function setDetails($row, &$subObj, $isFeatured = false) {
        $this->getIfExists($row, $subObj, 'title', false, $isFeatured);
        $this->getIfExists($row, $subObj, 'desc', false, $isFeatured);
        $this->getIfExists($row, $subObj, 'imgs', true, $isFeatured);
        $this->getIfExists($row, $subObj, 'url', false, $isFeatured);
        $this->getIfExists($row, $subObj, 'launch', false, $isFeatured);
        $this->getIfExists($row, $subObj, 'pop', false, $isFeatured);
    }

    private function fillInFeatured() {
        foreach ($this->tableDataObj as &$value) {
            $this->searchArrForLnk($value);
        }
    }

    private function searchArrForLnk(&$obj) {

        if ($obj['type'] == 'men') {
            foreach ($obj['menu'] as &$value) {
                $this->searchArrForLnk($value);
            }
        } else if ($obj['type'] == 'lnk') {
            $this->searchAllForFeaturedContent($obj);
        }
    }

    private function searchAllForFeaturedContent(&$featuredObj) {
        foreach ($this->tableDataObj as &$value) {
            $this->searchRecursiveForFeaturedContent($featuredObj, $value);
        }
    }

    private function searchRecursiveForFeaturedContent(&$featuredObj, &$obj) {
        if ($obj['type'] == 'men') {
            foreach ($obj['menu'] as &$value) {
                $this->searchRecursiveForFeaturedContent($featuredObj, $value);
            }
        } else {
            if ($obj['id'] == $featuredObj['id'] && $obj['type'] != 'lnk') {
                $this->counter += 1;
//                echo $this->counter . ' ' . $featuredObj['id'] . ' ' . $obj['id'] . ' ';
//                echo ', desc: ' . $obj['desc'] . ', ';
                $this->setDetails($obj, $featuredObj, true);
                $this->getIfExists($obj, $featuredObj, 'type', false, true);
            }
        }
    }

    public function getOther() {
        $tableSql = "SELECT * FROM nikart_other";
        $result = $this->db->query($tableSql);

        $containerObj = array();
        while ($row = $result->fetch_assoc()) {
            $idValue = $row['id'];
            if ($idValue) {
                $transValue = $row['es'];
                if (!$transValue) {
                    $subObj = $this->encodeCorrectly($row['en']);
                } else {
                    $subObj = array();
                    $subObj['en'] = $this->encodeCorrectly($row['en']);
                    if ($transValue) {
                        $subObj['es'] = $this->encodeCorrectly($row['es']);
                    }
                }
                $containerObj[$idValue] = $subObj;
            }
        }
        return $containerObj;
    }
}

?>