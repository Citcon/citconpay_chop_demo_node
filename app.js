var express = require('express');
var app = express();
var bodyParser  = require('body-parser');
var https = require('https');
var querystring = require('querystring');
var md5 = require('js-md5');

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/pay', urlencodedParser, function (req, res) {
    // change the following 2 parameters to suit your deployment
    var baseurl = "http://dev.citconpay.com:8000/";
    var token = "1234567890abcdef1234567890abcdeq";
    // you are welcome to change the parameters below, but shouldn't need to
    var amount = 1; // hardcode to 1 cent for testing
    var payment_method = req.body.payment_method;
    var currency = "USD";
    var reference = req.body.transaction_id;
    var callback_url_success = baseurl+"receipt_success.html";
    var ipn_url = baseurl+"ipn";
    var mobile_result_url = baseurl+"receipt_success.html?reference="+reference;
    var callback_url_fail = "";
    // no need to change below this line
    var params = {
              "payment_method":payment_method,
              "currency":currency,
              "amount":amount,
              "reference":reference,
              "ipn_url":ipn_url,
              "mobile_result_url":mobile_result_url,
              "callback_url_success":callback_url_success,
              "callback_url_fail":callback_url_fail,
              "allow_duplicates":"yes"
    };  
    // create post_data
    post_data = querystring.stringify(params);
    // prepare the header
    var postheaders = {
        'Authorization' : 'Bearer ' + token,
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(post_data, 'utf8')
    };
    var optionspost = {
      host: "dev.citconpay.com",
      port: 443,
      path: '/chop/chop',
      method: 'POST',
      headers : postheaders
    };
    // do the POST call
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    var reqPost = https.request(optionspost, function(resp) {
        resp.on('data', function(d) {
            var result = JSON.parse(d);
            if (result.result == 'success') {
                res.redirect(result.url);
            }
        });
    });
    // write the json data
    reqPost.write(post_data);
    reqPost.end();
    reqPost.on('error', function(e) {
        console.error(e);
    });
});

app.post('/ipn', urlencodedParser, function (req, res) {
    var sign = req.body.sign;
    var fields = req.body.fields;
    var keys = [];
    var dict = {};
    dict['fields'] = fields;
    keys.push('fields');
    var tok = fields.split(",");
    var arrayLength = tok.length;
    for (var i = 0; i < arrayLength; i++) {
        var key = tok[i];
        keys.push(key);
        dict[key] = req.body[key];        
    }
    // sort dict by key
    keys.sort();
    // compose sorted flat string for sign
    var len = keys.length;
    var flatString = "";
    for (i = 0; i < len; i++) {
        k = keys[i];
        flatString = flatString + k + '=' + dict[k] + '&';
    }
    var token = "1234567890abcdef1234567890abcdeq";
    flatString = flatString + "token=" + token;

    console.log("flatString=" + flatString);
    // sign
    var mySign = md5(flatString);
    console.log("mySign=" + mySign);
    console.log("sign in IPN = " + sign);
    if (sign == mySign) {
        console.log("sign verified in IPN, fulfilling order");
        res.send("ok");
    } else {
        res.status(500);
        res.send("sign failed");
    }
});

app.use(express.static('public'));

app.listen(8000, function () {
  console.log('Citcon CHOP node.js demo listening on port 8000!');
});
