import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Buffer } from 'buffer';

import logo from './logo.svg';
import './Main.css';

function Main() {
  const navigate = useNavigate();

  const search = (useLocation()).search;
  const params = (search.startsWith('?') ? search.substr(1) : '');

  const [loginInfo, setLoginInfo] = React.useState( null );

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
      window.location.replace( process.env.REACT_APP_WEBAPP_URL );
    }, 3000 );

    return () => clearTimeout( timeout );
  }

  useEffect(() => {
    ( async () => {
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
              sessionStorage.setItem( 'loginInfo', code );
              try{
                const user = JSON.parse( code );
                setLoginInfo( user );
              }catch( e ){
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
