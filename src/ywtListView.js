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
      fileKey
    });
    // プロフィール画像レンダリング
    const elems = document.querySelectorAll(".icon");
    var url = window.URL || window.webkitURL;
    elems[rowIndex].src = url.createObjectURL(response);
  };

  (async () => {
    // YWTアプリのレコードを取得
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
      }
      return r;
    });

    new Vue({
      // Vueを適用するelement
      el: '#customize_view',
      methods: {
        showDetail: function (record, rowIndex) {
          // 行選択表示
          const rows = document.querySelectorAll('.list_row');
          rows.forEach(function (row, i) {
            if (i == rowIndex) {
              row.classList.add('row_selected');
            }
            else {
              row.classList.remove('row_selected');
            }
          });
          document.getElementById('id').value = record.レコード番号.value;
          document.getElementById('memo').value = record.memo.value;
          document.getElementById('feedback').value = record.feedback.value;
          document.getElementById('y').value = record.comment_y.value;
          document.getElementById('w').value = record.comment_w.value;
          document.getElementById('t').value = record.comment_t.value;
        },
        edit: function (record) {
          location.href = "/k/3/edit?record=" + record.レコード番号.value;
        },
        update: function () {
          const id = document.getElementById('id').value;
          if (!id) {
            return;
          }
          const memo = document.getElementById('memo').value;
          const feedback = document.getElementById('feedback').value;
          const comment_y = document.getElementById('y').value;
          const comment_w = document.getElementById('w').value;
          const comment_t = document.getElementById('t').value;
          const record = {
            memo: {
              value: memo
            },
            feedback: {
              value: feedback
            },
            comment_y: {
              value: comment_y
            },
            comment_w: {
              value: comment_w
            },
            comment_t: {
              value: comment_t
            },
          };
          kintoneUtility.rest.putRecord({
            app: kintone.app.getId(),
            id: id,
            record: record
          }).then(function (response) {
            // ローカルデータに反映
            for (const rec of records) {
              if (rec.レコード番号.value === id) {
                rec.memo.value = memo;
                rec.feedback.value = feedback;
                rec.comment_y.value = comment_y;
                rec.comment_w.value = comment_w;
                rec.comment_t.value = comment_t;
                break;
              }
            }
            alert("変更を保存しました．");
          }).catch(function (error) {
            alert("変更の保存に失敗しました．¥n" + JSON.stringify(error));
          });;
        }
      },
      data: {
        records,
      },
    });
  })();
});
