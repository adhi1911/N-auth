'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { AUTH_CONFIG } from '@/config'

const Callback = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [errorData, setErrorData] = useState(null)

    useEffect(() => {
        async function login() {
            const login_id = searchParams.get("login_id")
            if (!login_id) { router.push("/"); return }

            try {
                const validate = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/validate`, {
                    method: "GET",
                    credentials: "include"
                })

                if (validate.ok) { router.push("/dashboard"); return }

                const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/check`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        login_id,
                        device_info: navigator.userAgent
                    })
                })

                if (res.ok) {
                    router.push("/dashboard")
                } else {
                    const err = await res.json()
                    setErrorData(err.detail || { message: "Login denied" })
                }
            } catch (e) {
                setErrorData({ message: "Unexpected error occurred" })
            }
        }

        login()
    }, [router, searchParams])

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            {!errorData && (
                <p className="text-gray-400 text-lg animate-pulse">Logging you in…</p>
            )}

            {errorData && (
                <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Error message */}
                    <div className="flex justify-center">
                        <div className="bg-gray-800 text-white rounded-lg px-6 py-4 shadow-md max-w-md text-center">
                            <p className="text-lg font-medium">{errorData.message}</p>
                            <button
                                onClick={() => router.push("/")}
                                className="mt-3 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition text-sm text-white"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>

                    {/* Right: Device cards */}
                    <div className="flex flex-col space-y-4">
                        {errorData.devices && errorData.devices.length > 0 ? (
                            errorData.devices.map((d, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gray-800 text-white p-4 rounded-lg shadow-md flex justify-between items-center hover:bg-gray-700 transition"
                                >
                                    <div>
                                        <p className="font-mono">{d.device_ip}</p>
                                        <p className="text-gray-300 text-sm">
                                            {d.session_count} session{d.session_count > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    {/* Optional logout button */}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center">No other active devices</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Callback
