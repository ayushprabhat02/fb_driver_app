class PaymentHelper {
  getJsonData(merchantDetails) {
    let jsonString = '';
    merchantDetails.paymentMode
      ? (jsonString =
          '{ "payInstrument": { "headDetails": { "version": "OTSv1.1", "api": "AUTH", "platform": "FLASH" }, "merchDetails": { "merchId": "' +
          merchantDetails.merchantId +
          '", "userId": "", "password": "' +
          merchantDetails.password +
          '", "merchTxnId": "' +
          merchantDetails.merchTxnId +
          '", "merchTxnDate": "' +
          merchantDetails.txnDate +
          '" }, "payModeSpecificData": { "subChannel" : "' +
          merchantDetails.paymentMode +
          '" }, "payDetails": { "amount": ' +
          merchantDetails.amount +
          ', "product": "' +
          merchantDetails.productId +
          '", "custAccNo": "213232323", "txnCurrency": "INR" }, "custDetails": { "custFirstName": "' +
          merchantDetails.custFirstName +
          '", "custEmail": "' +
          merchantDetails.custEmailId +
          '", "custMobile": "' +
          merchantDetails.custMobileNumber +
          '" }, "extras": { "udf1":"' +
          merchantDetails.udf1 +
          '", "udf2":"' +
          merchantDetails.udf2 +
          '", "udf3":"' +
          merchantDetails.udf3 +
          '", "udf4":"' +
          merchantDetails.udf4 +
          '", "udf5":"' +
          merchantDetails.udf5 +
          '" } }}')
      : (jsonString =
          '{ "payInstrument": { "headDetails": { "version": "OTSv1.1", "api": "AUTH", "platform": "FLASH" }, "merchDetails": { "merchId": "' +
          merchantDetails.merchantId +
          '", "userId": "", "password": "' +
          merchantDetails.password +
          '", "merchTxnId": "' +
          merchantDetails.merchTxnId +
          '", "merchTxnDate": "' +
          merchantDetails.txnDate +
          '" }, "payDetails": { "amount": ' +
          merchantDetails.amount +
          ', "product": "' +
          merchantDetails.productId +
          '", "custAccNo": "213232323", "txnCurrency": "INR" }, "custDetails": { "custFirstName": "' +
          merchantDetails.custFirstName +
          '", "custEmail": "' +
          merchantDetails.custEmailId +
          '", "custMobile": "' +
          merchantDetails.custMobileNumber +
          '" }, "extras": { "udf1":"' +
          merchantDetails.udf1 +
          '", "udf2":"' +
          merchantDetails.udf2 +
          '", "udf3":"' +
          merchantDetails.udf3 +
          '", "udf4":"' +
          merchantDetails.udf4 +
          '", "udf5":"' +
          merchantDetails.udf5 +
          '" } }}');
    return jsonString;
  }

  openAipayPopUp(atomTokenId, merchantDetails, callbackReturnUrl) {
    let setReturnUrl = callbackReturnUrl;
    // merchantDetails.mode == 'uat'
    //   ? 'https://pgtest.atomtech.in/mobilesdk/param'
    //   : 'https://payment.atomtech.in/mobilesdk/param';
    let cdnVal = merchantDetails.mode == 'uat' ? 'pgtest' : 'psa';
    let htmlPage =
      '<!DOCTYPE html><html lang="en"><head><title>AtomInstaPay</title> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> </head><body><p style="text-align:center;margin-top:20%;">Please wait</p> <script src="https://' +
      cdnVal +
      '.atomtech.in/staticdata/ots/js/atomcheckout.js?v=' +
      Date.now() +
      '"></script> <script> openPay(); function openPay(){ const options={"atomTokenId": "' +
      atomTokenId +
      '", "merchId": "' +
      merchantDetails.merchantId +
      '", "custEmail": "' +
      merchantDetails.custEmailId +
      '", "custMobile": "' +
      merchantDetails.custMobileNumber +
      '", "returnUrl": "' +
      setReturnUrl +
      '", "userAgent": "mobile_webView"}; var atom=new AtomPaynetz(options, "uat"); }</script></body></html>';
    return htmlPage;
  }

  // openAipayPopUp(atomTokenId, merchantDetails, callbackReturnUrl) {
  //   const cdnUrl =
  //     'https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js?v=' +
  //     Date.now();

  //   const htmlPage = `
  //         <!DOCTYPE html>
  //         <html lang="en">
  //         <head>
  //             <meta charset="utf-8">
  //             <meta http-equiv="X-UA-Compatible" content="IE=edge">
  //             <meta name="viewport" content="width=device-width, initial-scale=1">
  //             <title>ATOM PAYMENT GATEWAY</title>
  //             <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
  //             <script>
  //                 var cdnScript = document.createElement('script');
  //                 cdnScript.setAttribute('src', '${cdnUrl}');
  //                 document.head.appendChild(cdnScript);
  //             </script>
  //         </head>
  //         <body>
  //             <div class="container my-5">
  //                 <h3>Summary</h3>
  //                 <p>Product</p>
  //                 <p>Customer Email Id: ${merchantDetails.custEmailId}</p>
  //                 <p>Customer  Id: ${merchantDetails.custMobileNumber}</p>
  //                 <p>Pay Rs. ${merchantDetails?.amount}</p>
  //                 <a class="btn btn-primary my-3" href="javascript:openPay()" role="button">Pay Now</a>
  //                 <button class="btn btn-secondary my-3" id="goBackButton">Go Back</button>
  //             </div>
  //             <script>
  //                 function openPay() {
  //                     const options = {
  //                         "atomTokenId": "${atomTokenId}",
  //                         "merchId": "${merchantDetails.merchantId}",
  //                         "custEmail": "${merchantDetails.custEmailId}",
  //                         "custMobile": "${merchantDetails.custMobileNumber}",
  //                         "returnUrl": "${callbackReturnUrl}"
  //                     };
  //                     let atom = new AtomPaynetz(options, 'uat');
  //                 }

  //                 // Handle Go Back button click
  //                 document.getElementById('goBackButton').onclick = function() {
  //                     if (window.ReactNativeWebView) {
  //                         window.ReactNativeWebView.postMessage('goBack');
  //                     }
  //                 };
  //             </script>
  //         </body>
  //         </html>
  //     `;
  //   return htmlPage;
  // }

  getAtomTokenId(encStr, merchantDetails) {
    var data = 'encData=' + encStr + '&merchId=' + merchantDetails.merchantId;
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    return new Promise((resolve, reject) => {
      xhr.addEventListener('readystatechange', function () {
        if (this.readyState === 4) {
          var splitResponse = xhr.responseText.split('&');
          if (splitResponse[1].includes('encData')) {
            let splitEncData = splitResponse[1].split('=');
            resolve(splitEncData[1]); // sending encrypted string only
          }
        }
      });
      let authAPIUrl =
        merchantDetails.mode === 'uat'
          ? 'https://caller.atomtech.in/ots/aipay/auth'
          : 'https://payment1.atomtech.in/ots/aipay/auth';
      xhr.open('POST', authAPIUrl);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(data);
    });
  }

  createSigStr(parsedResponse) {
    let merchId =
      parsedResponse['payInstrument']['merchDetails']['merchId'].toString();
    let atomTxnId =
      parsedResponse['payInstrument']['payDetails']['atomTxnId'].toString();
    let merchTxnId =
      parsedResponse['payInstrument']['merchDetails']['merchTxnId'].toString();
    let totalAmount = parsedResponse['payInstrument']['payDetails'][
      'totalAmount'
    ]
      .toFixed(2)
      .toString();
    let statusCode =
      parsedResponse['payInstrument']['responseDetails'][
        'statusCode'
      ].toString();
    let subChannel =
      parsedResponse['payInstrument']['payModeSpecificData'][
        'subChannel'
      ][0].toString();
    let bankTxnId =
      parsedResponse['payInstrument']['payModeSpecificData']['bankDetails'][
        'bankTxnId'
      ].toString();
    let signatureStr =
      merchId +
      atomTxnId +
      merchTxnId +
      totalAmount +
      statusCode +
      subChannel +
      bankTxnId;
    return signatureStr;
  }
}
export default PaymentHelper;
