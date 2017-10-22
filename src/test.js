(function () {
  "use strict";

  kintone.events.on("app.record.index.show", function (event) {
    var records = event.records;
    var OrderList = document.getElementById('OrderListTTbody');
    OrderList.innerHTML = '';

    procImages(0);
    return event;

    // ファイル取得、表示
    function procImages(pno) {

      var record = records[pno];
      var row = OrderList.insertRow(OrderList.rows.length);
      row.id = 'TrOrderList';
      var TdProductName = row.insertCell(0);
      var TdProductImage = row.insertCell(1);

      // Product Name
      TdProductName.innerHTML = record.ProductName1.value;

      // Product Image
      var FldProductImage = document.createElement('img');

      if (record.ProductImage.value.length === 0) {
        if (records.length > (pno + 1))
          return procImages(pno + 1);
        return true;
      }

      // file download
      var filekey = record.ProductImage.value[0].fileKey;
      return fileDownload(filekey).then(function (blob) {

        var url = window.URL || window.webkitURL;
        // var image = url.createObjectURL(blob);
        FldProductImage.src = url.createObjectURL(blob);
        TdProductImage.appendChild(FldProductImage);

        if (records.length > (pno + 1))
          return procImages(pno + 1);
        return true;
      });

    }

  });

  // File Download
  function fileDownload(fileKey) {
    return new Promise(function (resolve, reject) {
      var url = kintone.api.url('/k/v1/file', true) + '?fileKey=' + fileKey;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.responseType = 'blob';
      xhr.onload = function () {
        if (xhr.status === 200) {
          // successful
          resolve(xhr.response);
        } else {
          // fails
          reject(Error('File download error:' + xhr.statusText));
        }
      };
      xhr.onerror = function () {
        reject(Error('There was a network error.'));
      };
      xhr.send();
    });
  }


})();