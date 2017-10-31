import Vue from 'vue'
import kintoneUtility from 'kintone-utility/docs/kintoneUtility'
import HTML_TEMPLATE from './ywtListView.html'
import style from './ywtListView.scss'

kintone.events.on('app.record.index.show', event => {
  if (event.viewName !== 'ywt一覧') {
    return
  }

  // kintoneに設定済みのタグを自作のHTMLファイルで置換
  const tableNode = document.querySelector('table#customize-view')
  const { parentNode } = tableNode
  tableNode.insertAdjacentHTML('beforebegin', HTML_TEMPLATE)
  parentNode.removeChild(tableNode)

  // カスタマイズビューの場合のみスタイルシートを適用
  style.use()

  const user = kintone.getLoginUser()
  let isModify = false

    ; (async () => {
      // YWTアプリのレコードを取得
      const { records: mainRecords } = await kintoneUtility.rest.getRecords({
        app: kintone.app.getId(),
        query: kintone.app.getQuery()
      })

      const { records: optRecords } = await kintoneUtility.rest.getRecords({
        app: kintone.app.getLookupTargetAppId('mail')
      })

      const records = mainRecords.map((r, i) => {
        // プロフィール画像取得
        for (const o of optRecords) {
          if (r.mail.value === o.mail.value) {
            r.fileKey =
              o.profile_img.value.length > 0
                ? o.profile_img.value[0].fileKey
                : null
          }
        }
        // レコード作成者以外は編集不可
        r.editable = r.作成者.value.code === user.code
        // プロフィール画像URL
        r.profile_img = ''
        // 行選択フラグ
        r.selected = false

        return r
      })

      const form = {
        id: '',
        memo: '',
        feedback: '',
        commentY: '',
        commentW: '',
        commentT: '',
        editable: false
      }

      Vue.component('icon-img', {
        template:
        '\
        <img class="icon" v-bind:src="record.profile_img" v-on:load="imgLoad" width="40" height="40" />\
      ',
        props: ['record'],
        computed: {
          // アイコン用画像設定
          imgLoad: async function (component) {
            const response = await kintoneUtility.rest.downloadFile({
              fileKey: this.record.fileKey
            })
            // プロフィール画像レンダリング
            const url = window.URL || window.webkitURL
            this.record.profile_img = url.createObjectURL(response)
          }
        }
      })

      const vm = new Vue({
        // Vueを適用するelement
        el: '#customize-view',
        methods: {
          showDetail: function (record) {
            if (isModify && !confirm('変更を破棄しますか？')) {
              return
            }
            // 行選択表示
            for (const rec of this.records) {
              if (rec.レコード番号.value == record.レコード番号.value) {
                rec.selected = true
              } else {
                rec.selected = false
              }
            }
            form.memoStyle = record.editable ? 'inherit' : 'none'
            form.editable = record.editable
            form.id = record.レコード番号.value
            form.memo = record.memo.value
            form.feedback = record.feedback.value
            form.commentY = record.comment_y.value
            form.commentW = record.comment_w.value
            form.commentT = record.comment_t.value
            isModify = false
          },
          edit: function (record) {
            location.href = '/k/3/edit?record=' + record.レコード番号.value
          },
          update: function () {
            if (!isModify) {
              return
            }
            if (!form.id) {
              return
            }
            const record = {
              memo: {
                value: form.memo
              },
              feedback: {
                value: form.feedback
              },
              comment_y: {
                value: form.commentY
              },
              comment_w: {
                value: form.commentW
              },
              comment_t: {
                value: form.commentT
              }
            }
            kintoneUtility.rest
              .putRecord({
                app: kintone.app.getId(),
                id: form.id,
                record
              })
              .then(function (response) {
                // ローカルデータに反映
                for (const rec of records) {
                  if (rec.レコード番号.value === form.id) {
                    rec.memo.value = form.memo
                    rec.feedback.value = form.feedback
                    rec.comment_y.value = form.commentY
                    rec.comment_w.value = form.commentW
                    rec.comment_t.value = form.commentT
                    break
                  }
                }
                isModify = false
                alert('変更を保存しました．')
              })
              .catch(function (error) {
                alert('変更の保存に失敗しました．\n' + JSON.stringify(error))
              })
          },
          updateForm: function () {
            isModify = true
          }
        },
        data: {
          records,
          isModify,
          form
        }
      })
    })()
})
