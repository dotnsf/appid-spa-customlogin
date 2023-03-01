import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Buffer } from 'buffer';

import logo from './logo.svg';
import './Main.css';

function Main() {
  const allowedDeltaMiilis = 3000; //. ３秒以内の認証であった場合のみ許可
  const navigate = useNavigate();

  const search = (useLocation()).search;
  const params = (search.startsWith('?') ? search.substr(1) : '');

  const [loginInfo, setLoginInfo] = React.useState( null );
  //const [str, setStr] = React.useState( '' );  //. 一度他のページに遷移するとリセットされてしまう？

  const randomStr = ( n = 16 ) => {
    const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from(Array(n)).map(()=>S[Math.floor(Math.random()*S.length)]).join('');
  }

  const logoutAction = async () => {
    try{
      sessionStorage.setItem( 'loginInfo', '' );
      setLoginInfo( null );
    }catch( e ){
      console.log( e );
    }
  }

  const loginAction = () => {
    const timeout = setTimeout( () => {
      const str = randomStr();
      //setStr( s );
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
        const _loginInfo = JSON.parse( loginInfoStr );
        setLoginInfo( _loginInfo );
      }else{
        if( params ){
          params.split('&').forEach((param) => {
            const p = param.split('=');
            if (p[0] === 'code') {
              const code = Buffer.from( p[1], 'base64' ).toString();
              try{
                const user = JSON.parse( code );
                const str = sessionStorage.getItem( 'str' );
                sessionStorage.setItem( 'str', '' );
                //console.log( t, str, user );
                if( user && user.time ){
                  if( str == user.str ){
                    //if( user.time + allowedDeltaMiilis > t && user.time - allowedDeltaMiilis < t ){
                      console.log( 'OK' );
                      sessionStorage.setItem( 'loginInfo', code );
                      setLoginInfo( user );
                    //}else{
                      //. 時刻に差がありすぎる？？
                    //  console.log( t, user.time );  
                    //  alert( 'Be sure both spa/web app has same timeclock, and no too low network latency.' );
                    //}
                  }else{
                    console.log( 'challenge str unmatched.' );  
                  }
                }
              }catch( e ){
                console.log( {e} );
              }
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
