<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <?php

        $form_id = 'formId: "922c2109-75c3-4730-8a40-5e63daa9a9b1"';
        $form_head_title = 'SAR Helpdesk';
        $form_body_title = '';
        $externalIp = 'unset';
        try 
        {
            $externalContent = file_get_contents('http://checkip.dyndns.com/');
            preg_match('/Current IP Address: \[?([:.0-9a-fA-F]+)\]?/', $externalContent, $m);
            $externalIp = $m[1];
            if (strcasecmp($externalIp, '80.169.207.180') == 0 || strcasecmp($externalIp, '31.121.142.10') == 0)
            {
                $form_id = 'formId: "f1be2210-6a1c-4d4c-b6ef-f101065921ba"';
                $form_head_title = 'MFS Help';
                $form_body_title = '<div class="help-form-title"><h1><img src="./mfs_logo.jpg">Help</h1></div>';
            }
        }
        catch (Exception $err) { print("<script> console.log($err) </script>"); }

        // print(implode(", ", [$form_id, $externalIp]));
    ?>

    <title>
        <?php print($form_head_title); ?>
    </title>

    <script charset="utf-8" type="text/javascript" src="//js-eu1.hsforms.net/forms/shell.js">
        console.log("ip address:<?php print($externalIp); ?>");
    </script>

    <style>
        .help-body {
            display: flex;
            position: relative;
            justify-content: center;
            flex-direction: column;
            width: 95%;
        }

        .form-template {
            position: relative;
            padding: 20px 0px;
            margin: 0 auto;
            max-width: 700px;
            width: 100%;
        }

        .help-form-title {
            display: block;
            position: relative;
            max-width: 700px;
            margin: 0 auto 20px;
            padding-top: 30px;
            width: 100%;
        }

        .help-form-title > h1 {
            display: inline;
            font-family: Tahoma, Verdana, Geneva, sans-serif;
            color: #012758;
            padding-bottom: 20px;
            border-bottom: 1px solid #012758;
        }

        .help-form-title > h1 > img {
            position: relative;
            height: 32px;
            top: 3.5px;
        }
    </style>
</head>


<body>

    <?php print($form_body_title) ?> 

    <div class="form-body">
        <div class="form-template">
            <script>
                hbspt.forms.create({
                    region: 'eu1',
                    portalId: '24898102',
                    <?php print($form_id); ?>
                });
            </script>
        </div>
    </div>
</body>
</html>