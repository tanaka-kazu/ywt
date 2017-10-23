import Vue from 'vue';
import kintoneUtility from 'kintone-utility/docs/kintoneUtility';
import HTML_TEMPLATE from './ywtListView.html';
import style from './ywtListView.scss';

kintone.events.on('app.record.index.show', (event) => {

  if (event.viewName !== 'ywt一覧') {
    return;
  }

  if (document.getElementById('customize_view') !== null) {
    return;
  }
  // カスタマイズビューの場合のみスタイルシートを適用
  style.use();

  // kintoneに設定済みのタグを自作のHTMLファイルで置換
  const tableNode = document.querySelector('table#view');
  const pagerNode = document.querySelector('#pager');
  const { parentNode } = tableNode;
  tableNode.insertAdjacentHTML('beforebegin', HTML_TEMPLATE);
  parentNode.removeChild(tableNode);
  parentNode.removeChild(pagerNode);

  const fileDownload = async function (fileKey, rowIndex) {
    const response = await kintoneUtility.rest.downloadFile({
      fileKey: fileKey
    });
    // プロフィール画像レンダリング
    const elems = document.querySelectorAll(".icon");
    var url = window.URL || window.webkitURL;
    elems[rowIndex].src = url.createObjectURL(response);
  };

  (async () => {
    // YKTアプリのレコードを取得
    const { records: mainRecords } = await kintoneUtility.rest.getRecords({
      app: kintone.app.getId(),
      query: kintone.app.getQuery(),
    });

    const { records: optRecords } = await kintoneUtility.rest.getRecords({
      app: kintone.app.getLookupTargetAppId('mail'),
    });

    const records = mainRecords.map((r, i) => {
      // プロフィール画像取得
      for (const o of optRecords) {
        if (r.mail.value === o.mail.value) {
          const fileKey = o.profile_img.value.length > 0 ? o.profile_img.value[0].fileKey : false;
          if (fileKey) {
            fileDownload(fileKey, i);
          }
        }
      };
      return r;
    });

    new Vue({
      // Vueを適用するelement
      el: '#customize_view',
      data: {
        records,
      },
    });
  })();
});
