'use client'

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Cookies from 'js-cookie';
import { AUTH_CONFIG } from '../../config';

const Callback = () =>{
    const router = useRouter();

    useEffect(()=>{
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');

        if (accessToken){
            // storing cookie
            Cookies.set('access_token',accessToken,{expires:1});
            setTimeout(router.push('/dashboard') // redirecting to dashboard
            ,5000)
        }else{
            router.push('/');
        }

    },[])

    return <p>Loggin in...</p>
}

export default Callback;