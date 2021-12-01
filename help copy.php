<?php

$ip = "unset";
$externalContent = file_get_contents('http://checkip.dyndns.com/');
preg_match('/Current IP Address: \[?([:.0-9a-fA-F]+)\]?/', $externalContent, $m);
$externalIp = $m[1];
// print($externalIp . "<br>");
// print(var_export(strcasecmp($externalIp, "80.169.207.179") == 0));
$is_mfs = (strcasecmp($externalIp, "80.169.207.179") != 0 || strcasecmp($externalIp, "31.121.142.10") == 0);

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php if ($is_mfs) { ?>
        <title>MFS Help</title>
    <?php } else {?>
        <title>SAR Helpdesk</title>
    <?php } ?>

    <script charset="utf-8" type="text/javascript" src="//js-eu1.hsforms.net/forms/shell.js"></script>

    <style>
        body {
            display: flex;
            justify-content: center;
            flex-direction: column;
            width: 95vw;
        }

        h1 {
            font-family: Tahoma, Verdana, Geneva, sans-serif;
            margin: 0 auto;
            color: #012758;
            padding-top: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #012758;
        }

        h1 > img {
            position: relative;
            height: 32px;
            top: 3.5px;
        }

        .form-template {
            position: relative;
            overflow-y: hidden;
            padding: 20px;
            margin: 0 auto;
        }
    </style>
</head>


<body>
    <h1><?php if ($is_mfs) { ?><img src="./mfs_logo.jpg">Help<?php } else {?>SAR Helpdesk<?php } ?></h1>
<div class="form-template">
    
    <?php if ($is_mfs) {    ?>
        <!-- inside -->
        <script>
            hbspt.forms.create({
                region: "eu1",
                portalId: "24898102",
                formId: "f1be2210-6a1c-4d4c-b6ef-f101065921ba"
            });
        </script>    
        <style>
            h1 {
                max-width: 700px;
                width: 80%;
            }
            .form-template {
                max-width: 700px;
                width: 80%;
            }
        </style>
    <?php  } else { ?>
        <!-- outside -->
        <script>
            hbspt.forms.create({
                region: "eu1",
                portalId: "24898102",
                formId: "bc12dd1c-acbd-496b-86f4-a3b1a00d4af4"
            });
        </script>
        <style>
            h1 {
                max-width: 470px;
                padding-left: 30px;
            }
            .form-template {
                max-width: 470px;
                padding: 20px 0px 20px 30px;
            }
        </style>
    <?php }; ?>
</div>
</body>
</html>