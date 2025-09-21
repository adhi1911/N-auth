'use client'

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useSearchParams } from "next/navigation";
import { AUTH_CONFIG } from '@/config';
import Cookies from 'js-cookie';


const Callback = () =>{
    const router = useRouter();
    const searchParams = useSearchParams();

    console.log("In callback")

    useEffect(()=>{
        async function login(){
            console.log("in callback effect")
            const login_id = searchParams.get("login_id"); 
            if (!login_id) {router.push("/"); return}

            console.log("Got login id")

            const validate = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/validate`, {
            method: "GET",
            credentials: "include"
            });

            console.log("sent validation request")
            if (validate.ok){router.push("/dashboard"); return}


            // const result = await fp.get()

            const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/check`,{
                method: "POST",
                headers:{"Content-Type":"application/json"},
                credentials:"include",
                body: JSON.stringify({
                    login_id,
                    device_info: navigator.userAgent
                })
            })

            console.log(navigator.userAgent)
            if(res.ok){router.push("/dashboard")}else{
                const err = await res.json()
                console.error("Session denied",err)
            }
        }

        login()
    },[router])


    return <p>Loggin in...</p>  
}

export default Callback;