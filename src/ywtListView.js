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

  const user = kintone.getLoginUser();
  let isModify = false;
  // アイコン用画像設定
  const fileDownload = async function (fileKey, rowIndex) {
    const response = await kintoneUtility.rest.downloadFile({
      fileKey
    });
    // プロフィール画像レンダリング
    const elems = document.querySelectorAll(".icon");
    const url = window.URL || window.webkitURL;
    elems[rowIndex].src = url.createObjectURL(response);
  };

  // 内部メモは初期は非表示
  document.getElementById('memo_area').style.display = "none";

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
      // レコード作成者以外は編集不可
      if (r.作成者.value.code === user.code) {
        r.editable = true;
      }
      else {
        r.editable = false;
      }
      return r;
    });

    new Vue({
      // Vueを適用するelement
      el: '#customize_view',
      methods: {
        showDetail: function (record, rowIndex) {
          if (isModify) {
            if (!confirm("変更を破棄しますか？")) {
              return;
            }
          }
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
          // 内部メモは作成者以外見えない、かつ更新不可
          const memo_elem = document.getElementById('memo_area');
          const updateButtons = document.querySelectorAll('form button');
          if (user.code === record.作成者.value.code) {
            document.getElementById('memo').value = record.memo.value;
            memo_elem.style.display = "inherit";
            for (const button of updateButtons) {
              button.style.display = "inherit";
            }
          }
          else {
            memo_elem.style.display = "none";
            const buttons = document.querySelectorAll('form button');
            for (const button of updateButtons) {
              button.style.display = "none";
            }
          }
          document.getElementById('id').value = record.レコード番号.value;
          document.getElementById('feedback').value = record.feedback.value;
          document.getElementById('y').value = record.comment_y.value;
          document.getElementById('w').value = record.comment_w.value;
          document.getElementById('t').value = record.comment_t.value;
          isModify = false;
        },
        edit: function (record) {
          location.href = "/k/3/edit?record=" + record.レコード番号.value;
        },
        update: function () {
          if (!isModify) {
            return;
          }
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
            isModify = false;
            alert("変更を保存しました．");
          }).catch(function (error) {
            alert("変更の保存に失敗しました．¥n" + JSON.stringify(error));
          });
        },
        updateForm: function () {
          isModify = true;
        }
      },
      data: {
        records,
        isModify
      },
    });
  })();
});
