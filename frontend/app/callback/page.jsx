'use client'

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { AUTH_CONFIG } from '@/config';
import Cookies from 'js-cookie';


const Callback = () =>{
    const router = useRouter();
    const params = new URLSearchParams(window.location.search);

    useEffect(()=>{
        async function login(){
            const login_id = params.get("login_id")
            if (!login_id) {router.push("/"); return}

            const validate = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/validate`,{
                method:"GET",
                credentials: "include"
            })

            if (validate.ok){router.push("/dashboard"); return}


            const fp = await FingerprintJS.load()
            const result = await fp.get()

            const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/check`,{
                method: "POST",
                headers:{"Content-Type":"application/json"},
                credentials:"include",
                body: JSON.stringify({
                    login_id,
                    device_fingerprint: result.visitorId,
                    device_info: navigator.userAgnet
                })
            })
            console.log(result)
            console.log(result.visitorId)
            console.log(navigator.userAgent)
            if(res.ok){router.push("/dashboard")}else{
                const err = await res.json()
                console.error("Session denied",err)
            }
        }

        login()
    },[params,router])


    return <p>Loggin in...</p>  
}

export default Callback;