import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Buffer } from 'buffer';

import logo from './logo.svg';
import './Main.css';

function Main() {
  const allowedDeltaMiilis = 0; //. 指定ミリ秒以内の認証であった場合のみ許可
  const navigate = useNavigate();

  const search = (useLocation()).search;
  const params = (search.startsWith('?') ? search.substr(1) : '');

  const [loginInfo, setLoginInfo] = React.useState( null );

  //. チャレンジ用のランダム文字列を作成する（デフォルトは16文字）
  const randomStr = ( n = 16 ) => {
    const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from(Array(n)).map(()=>S[Math.floor(Math.random()*S.length)]).join('');
  }

  //. ログアウト
  const logoutAction = async () => {
    try{
      //. sessionStorage 内のログイン情報を消去
      sessionStorage.setItem( 'loginInfo', '' );
      setLoginInfo( null );
    }catch( e ){
      console.log( e );
    }
  }

  //. ログイン
  const loginAction = () => {
    const timeout = setTimeout( () => {
      //. チャレンジ情報を生成して sessionStorage に格納してからログイン画面へ
      const str = randomStr();
      sessionStorage.setItem( 'str', str );
      window.location.replace( process.env.REACT_APP_WEBAPP_URL + '?str=' + str );
    }, 3000 );

    return () => clearTimeout( timeout );
  }

  useEffect(() => {
    ( async () => {
      const t = ( new Date() ).getTime();
      let loginInfoStr = sessionStorage.getItem( 'loginInfo' );
      if( loginInfoStr ){
        //. ログイン情報が sessionStorage に入っている場合
        const _loginInfo = JSON.parse( loginInfoStr );
        setLoginInfo( _loginInfo );
      }else{
        //. ログイン情報が sessionStorage に入っていない場合
        if( params ){
          //. パラメータが含まれていたら解析
          params.split('&').forEach((param) => {
            const p = param.split('=');
            if (p[0] === 'code') {
              const code = Buffer.from( p[1], 'base64' ).toString();
              try{
                //. パラメータを取り出して、ログイン前に sessionStorage に格納したチャレンジ情報と比較
                const user = JSON.parse( code );
                const str = sessionStorage.getItem( 'str' );
                sessionStorage.setItem( 'str', '' );
                //console.log( t, str, user );
                if( user && user.time ){
                  if( str == user.str ){
                    if( allowedDeltaMiilis ){
                      if( user.time + allowedDeltaMiilis > t && user.time - allowedDeltaMiilis < t ){
                        //. チャレンジ成功したらログイン情報を sessionStorage に格納
                        console.log( 'OK' );
                        sessionStorage.setItem( 'loginInfo', code );
                        setLoginInfo( user );
                      }else{
                        //. 時刻に差がありすぎる？？
                        console.log( t, user.time );  
                        alert( 'Be sure both spa/web app has same timeclock, and no too low network latency.' );
                      }
                    }else{
                      //. チャレンジ成功したらログイン情報を sessionStorage に格納
                      console.log( 'OK' );
                      sessionStorage.setItem( 'loginInfo', code );
                      setLoginInfo( user );
                    }
                  }else{
                    console.log( 'challenge str unmatched.' );  
                  }
                }
              }catch( e ){
                console.log( {e} );
              }

              //. 結果に関わらず再描画
              navigate( '/' );
            }
          });
        }
      }
    })();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        { ( loginInfo && loginInfo.name ) &&
          <>
          <p>{loginInfo.name}({loginInfo.email})</p>
          <button onClick={logoutAction} id="logout">Logout</button>
          </>
        }
        { ( !loginInfo || !loginInfo.name ) &&
          <>
          <button onClick={loginAction} id="login">Login</button>
          </>
        }
      </header>
    </div>
  );
}

export default Main;
