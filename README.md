# AppID SPA Custom UI

## How to start

### AppID

- ユーザーを数名登録
  - 後述のアプリ実行時にオンラインサインアップも可

- RWA(Regular Web Application) のアプリケーションを登録

- コールバック URL に RWA のコールバック URL を設定

- RWA の環境変数で使う以下の値を取得：
  - SECRET
  - CLIENT_ID
  - TENANT_ID
  - REGION

- RWA の環境変数で使う以下の値を（IBM Cloud から）取得：
  - APIKEY

### RWA(Regular Web Application)

- `web/` サブフォルダ

- 以下の環境変数を設定：
  - API_KEY : APIKEY 値
  - APPID_SECRET : SECRET 値
  - APPID_CLIENT_ID : CLIENT_ID 値
  - APPID_TENANT_ID : TENANT_ID 値
  - APPID_REGION : REGION 値
  - APPID_REDIRECT_URI : AppID のリダイレクトURI
  - SPA_URL : （後述の）SPA アプリケーションの URL

- 実行
  - `$ npm run start`

### SPA(Single Page Application)

- `spa/` サブフォルダ

- 以下の環境変数を設定：
  - REACT_APP_WEBAPP_URL : （前述の）RWA アプリのトップページ URL

- 実行
  - `$ npm run start`


## How to use

- 以下のフローで画面遷移する：

  - SPA アプリケーションにアクセス **(S)**

  - （最初は未ログイン状態なので）`Login` ボタンが表示されるのでクリック **(S)**

  - カスタムログイン画面が表示されるので、ID とパスワードを指定してログイン **(W)**

  - ログインが成功すると SPA アプリケーション画面に戻る **(S)**

  - （この時点ではログイン状態なので）ユーザー名とメールアドレス、そして `Logout` ボタンが表示される **(S)**

  - `Logout` ボタンをクリックすると未ログイン状態に戻って `Login` ボタンが表示される **(S)**

- 上述の **(S)** は SPA の画面、**(W)** は RWA の画面が表示されている

  - SPA 内でカスタマイズされたログイン画面を実現できている


## 課題

- [ ] SPA に直接 URL パラメータを付けてアクセスすると認証を回避できてしまう

  - パラメータ形式がバレたら対処できない？

  - 一応時刻で（現状は３秒以内の再認証で）対処

- [ ] やはり ID & PASS で認証するべき？

  - ここで何をしているのかを理解した上で SPA 側に移植する必要がある？

```
app.post( '/appid/login/submit', bodyParser.urlencoded({extended: false}), passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
	successRedirect: '/appid/loggedin',
	failureRedirect: '/?message=login failed.',
	failureFlash : false
}));
```

- [x] ランダム文字列によるチャレンジ機能を実装して対応


## 参考

Web アプリケーションを使わない、標準の AppID を PKCE プロトコルで使った（通常版の） SPA サンプル

- `spa-normal/` サブフォルダ

- 以下の環境変数を設定：
  - REACT_APP_CLIENT_ID : AppID の CLIENT_ID 値
  - REACT_APP_ENDPOINT : AppID の Discovery Endpoint URL 値 

- 実行
  - `$ npm run start`

