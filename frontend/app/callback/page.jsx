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
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {isLoading && !errorData ? (
                <div className="text-center relative">
                    <div className="relative mb-6">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-zinc-700 border-t-emerald-500 mx-auto"></div>
                        <div className="absolute inset-0 rounded-full animate-ping border-2 border-emerald-500 opacity-20"></div>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Authenticating Device</h2>
                    <p className="text-zinc-400">Validating your login session...</p>
                    <div className="mt-4 bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 max-w-sm">
                        <p className="text-zinc-300 text-sm">Device: {deviceName}</p>
                    </div>
                </div>
            ) : errorData ? (
                <div className="max-w-6xl w-full relative">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full mb-4">
                            <span className="text-2xl">🚫</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
                        <p className="text-zinc-400 text-lg">{errorData.message}</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Current Device Info */}
                        <div className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <span className="mr-2">📱</span> 
                                Attempting Device
                            </h2>
                            <div className="bg-zinc-900/50 border border-zinc-600 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">{deviceName}</p>
                                        <p className="text-zinc-400 text-sm">Current device</p>
                                    </div>
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-zinc-700">
                                <button
                                    onClick={() => router.push("/")}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                                >
                                    ← Back to Home
                                </button>
                            </div>
                        </div>

                        {/* Active Devices */}
                        <div className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center justify-between">
                                <span className="flex items-center">
                                    <span className="mr-2">🔒</span>
                                    Active Sessions
                                </span>
                                <span className="text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-full">
                                    Limit Reached
                                </span>
                            </h2>
                            
                            {errorData.devices && errorData.devices.length > 0 ? (
                                <div className="space-y-3">
                                    {errorData.devices.map((device, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-zinc-900/50 border border-zinc-600 rounded-lg p-4 hover:bg-zinc-900/70 transition-all duration-200 hover:border-amber-500/30 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                        <p className="text-white font-medium text-sm">{device.device_name}</p>
                                                    </div>
                                                    <p className="text-zinc-400 text-xs font-mono">{device.device_ip}</p>
                                                    <p className="text-zinc-500 text-xs mt-1">
                                                        {device.session_count} session{device.session_count > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-600/30 hover:border-red-500">
                                                        Force Logout
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-zinc-500">No active devices found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="mt-8 bg-amber-900/20 border border-amber-600/30 rounded-xl p-6 text-center">
                        <h3 className="text-amber-200 font-semibold mb-2">💡 What can you do?</h3>
                        <p className="text-amber-300/80 text-sm">
                            To login from this device, you'll need to logout from one of your active sessions above.
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default Callback