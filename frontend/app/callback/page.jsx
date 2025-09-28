'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { AUTH_CONFIG } from '@/config'
import { UAParser } from 'ua-parser-js'

const Callback = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [errorData, setErrorData] = useState(null)
    const [deviceName, setDeviceName] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const parser = new UAParser()
        const result = parser.getResult()

        const name = result.device.type
            ? `${result.device.vendor || ""} ${result.device.model || ""}`.trim()
            : `${result.os.name} ${result.os.version} - ${result.browser.name}`

        setDeviceName(name)

        async function login() {
            const login_id = searchParams.get("login_id")
            if (!login_id) { 
                router.push("/")
                return 
            }

            try {
                const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/check`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        login_id,
                        device_info: navigator.userAgent,
                        device_name: name
                    })
                })

                if (res.ok) {
                    router.push("/dashboard")
                } else {
                    const err = await res.json()
                    setErrorData(err.detail || { message: "Login denied" })
                    setIsLoading(false)
                }
            } catch (e) {
                setErrorData({ message: "Authentication failed" })
                setIsLoading(false)
            }
        }

        login()
    }, [router, searchParams])

     return (
        <div className="min-h-screen bg-[#0F1724]">
            {/* Subtle gradient overlay */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#131B2E] to-[#0F1724] pointer-events-none"></div>

            <div className="relative min-h-screen flex items-center justify-center px-4">
                {isLoading && !errorData ? (
                    <div className="text-center relative">
                        <div className="relative mb-6">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1B2B4B] border-t-[#4B9EFD]"></div>
                        </div>
                        <h2 className="text-2xl font-semibold text-white mb-2">Authenticating Device</h2>
                        <p className="text-[#94A3B8]">Validating your login session...</p>
                        <div className="mt-4 bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-lg p-4 backdrop-blur-sm">
                            <p className="text-[#94A3B8] text-sm">Device: {deviceName}</p>
                        </div>
                    </div>
                ) : errorData ? (
                    <div className="max-w-6xl w-full relative">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2D1B23] border-2 border-[#FF4E64] rounded-full mb-4">
                                <span className="text-2xl">🚫</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
                            <p className="text-[#94A3B8] text-lg">{errorData.message}</p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Current Device Info */}
                            <div className="bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-xl p-6 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                                    <span className="mr-2">📱</span> 
                                    Attempting Device
                                </h2>
                                <div className="bg-[#131B2E] border border-[#2C3B5B] rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">{deviceName}</p>
                                            <p className="text-[#94A3B8] text-sm">Current device</p>
                                        </div>
                                        <div className="w-3 h-3 bg-[#FF4E64] rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-[#2C3B5B]">
                                    <button
                                        onClick={() => router.push("/")}
                                        className="w-full px-4 py-3 bg-[#4B9EFD] hover:bg-[#5BA8FF] text-white rounded-lg transition-all duration-200 font-medium"
                                    >
                                        ← Back to Home
                                    </button>
                                </div>
                            </div>

                            {/* Active Devices */}
                            <div className="bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-xl p-6 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center justify-between">
                                    <span className="flex items-center">
                                        <span className="mr-2">🔒</span>
                                        Active Sessions
                                    </span>
                                    <span className="text-sm bg-[#2D1B23] text-[#FF4E64] px-3 py-1 rounded-full border border-[#FF4E64]/20">
                                        Limit Reached
                                    </span>
                                </h2>
                                
                                {errorData.devices && errorData.devices.length > 0 ? (
                                    <div className="space-y-3">
                                        {errorData.devices.map((device, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-[#131B2E] border border-[#2C3B5B] rounded-lg p-4 hover:bg-[#1B2B4B] transition-all duration-200 group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <div className="w-2 h-2 bg-[#4B9EFD] rounded-full"></div>
                                                            <p className="text-white font-medium text-sm">{device.device_name}</p>
                                                        </div>
                                                        <p className="text-[#94A3B8] text-xs font-mono">{device.device_ip}</p>
                                                        <p className="text-[#4A5568] text-xs mt-1">
                                                            {device.session_count} session{device.session_count > 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="text-[#FF4E64] hover:text-[#FF6B7E] text-xs px-2 py-1 rounded border border-[#FF4E64]/30 hover:border-[#FF4E64]/50">
                                                            Force Logout
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-[#4A5568]">No active devices found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="mt-8 bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-xl p-6 text-center backdrop-blur-sm">
                            <h3 className="text-white font-semibold mb-2">💡 What can you do?</h3>
                            <p className="text-[#94A3B8] text-sm">
                                To login from this device, you'll need to logout from one of your active sessions above.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default Callback