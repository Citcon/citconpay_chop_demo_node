var express = require('express');
var app = express();
var bodyParser  = require('body-parser');
var https = require('https');
var querystring = require('querystring');

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/pay', urlencodedParser, function (req, res) {
    // change the following 2 parameters to suit your deployment
    var baseurl = "http://dev.citconpay.com:3000/";
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
              "callback_url_fail":callback_url_fail
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

app.use(express.static('public'));

app.listen(3000, function () {
  console.log('Citcon CHOP node.js demo listening on port 3000!');
});
