'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { AUTH_CONFIG } from '@/config'
import { UAParser } from 'ua-parser-js'
import { set } from 'zod'

const Callback = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [errorData, setErrorData] = useState(null)
    const [deviceName, setDeviceName] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isForceLoggingOut, setIsForceLoggingOut] = useState(false)
    const [targetDevice, setTargetDevice] = useState(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [deviceToLogout, setDeviceToLogout] = useState(null)
    const [shouldReload, setShouldReload] = useState(false)


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

                const data = await res.json()

                if (res.ok) {
                    // router.push("/dashboard")
                    setTimeout(() => {
                        window.location.href = "/dashboard"
                    }, 500)
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


    // Handle force logout from another device

    const handleForceLogoutConfirm = (device) => {
    setDeviceToLogout(device)
    setShowConfirmModal(true)
}

    const handleForceLogout = async () => {
        if (!deviceToLogout) return;

        try {
            setIsForceLoggingOut(true)
            // setForceLogoutError(null)
            setTargetDevice(deviceToLogout.device_ip)
            
            const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/logout/force`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ 
                    logout_device_ip: deviceToLogout.device_ip,
                    device_name: deviceName || "Unknown Device",
                    device_info: navigator.userAgent
                })
            })

            const data = await res.json()

            if (!res.ok) {
                const err = await res.json()
                console.log('Force logout failed:', err)
                // setForceLogoutError(err)
                setShowConfirmModal(false) // Hide confirm modal
                return
            }
            
            if (data.success) {
                // Update UI
                setErrorData(prev => ({
                    ...prev,
                    devices: prev.devices.filter(d => d.device_ip !== deviceToLogout.device_ip)
                }))
                
                // Redirect to continue login
                const login_id = searchParams.get("login_id")
                if (login_id) {
                    // router.refresh()
                    // router.push(`/callback?login_id=${login_id}`)
                    setShouldReload(true)
                }
            }

        } catch (e) {
            console.error(e)
        } finally {
            setIsForceLoggingOut(false)
            setTargetDevice(null)
            setShowConfirmModal(false)
            setDeviceToLogout(null)
        }
    }

    useEffect(() => {
        if (shouldReload) {
            const login_id = searchParams.get("login_id")
            if (login_id) {
                // reseting all states
                setIsLoading(true)
                setErrorData(null)
                setDeviceToLogout(null)
                setShowConfirmModal(false)
                setIsForceLoggingOut(false)
                setTargetDevice(null)
                
                setTimeout(() => {
                    window.location.href = `/callback?login_id=${login_id}`
                }, 500)
            }
            setShouldReload(false)
        }
    }, [shouldReload, searchParams])

        const renderDeviceItem = (device, idx) => (
                <div
                    key={idx}
                    className="bg-[#131B2E] border border-[#2C3B5B] rounded-lg p-4 hover:bg-[#1B2B4B] transition-all duration-200 group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {/* IP Address */}
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-[#4B9EFD] rounded-full"></div>
                                <p className="text-white font-medium text-sm">{device.device_ip}</p>
                            </div>

                            {/* Device Names List */}
                            <div className="space-y-1 ml-4 mb-2">
                                {device.device_names.map((name, nameIdx) => (
                                    <div key={nameIdx} className="flex items-center space-x-2">
                                        <span className="text-[#94A3B8] text-xs">•</span>
                                        <p className="text-[#94A3B8] text-xs">{name}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Session Count */}
                            <p className="text-[#4A5568] text-xs mt-2">
                                {device.session_count} active session{device.session_count > 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Force Logout Button */}
                        <button
                            onClick={() => handleForceLogoutConfirm(device)}
                            disabled={isForceLoggingOut}
                            className={`
                                text-[#FF4E64] text-xs px-3 py-1.5 rounded border 
                                ${isForceLoggingOut && targetDevice === device.device_ip
                                    ? 'bg-[#2D1B23] border-[#FF4E64] cursor-wait'
                                    : 'border-[#FF4E64]/30 hover:border-[#FF4E64]/50 hover:bg-[#2D1B23]/50'
                                }
                                transition-all duration-200
                            `}
                        >
                            {isForceLoggingOut && targetDevice === device.device_ip ? (
                                <span className="flex items-center">
                                    <div className="w-3 h-3 border-2 border-[#FF4E64]/30 border-t-[#FF4E64] rounded-full animate-spin mr-2"></div>
                                    Logging out...
                                </span>
                            ) : (
                                'Force Logout'
                            )}
                        </button>
                    </div>
                </div>
            )

        const ConfirmationModal = () => {
            if (!showConfirmModal || !deviceToLogout) return null

            return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1B2B4B] border border-[#2C3B5B] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-semibold text-white mb-2">Confirm Force Logout</h3>
                        <p className="text-[#94A3B8] mb-4">
                            Are you sure you want to force logout all sessions from this device?
                        </p>
                            <div className="bg-[#131B2E] border border-[#2C3B5B] rounded-lg p-4 mb-6">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 bg-[#4B9EFD] rounded-full"></div>
                                    <p className="text-white font-medium">{deviceToLogout.device_ip}</p>
                                </div>
                                <div className="space-y-1 ml-4">
                                    {deviceToLogout.device_names.map((name, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <span className="text-[#94A3B8] text-xs">•</span>
                                            <p className="text-[#94A3B8] text-xs">{name}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[#4A5568] text-xs mt-2">
                                    {deviceToLogout.session_count} active session{deviceToLogout.session_count > 1 ? 's' : ''}
                                </p>
                            </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-2 bg-[#2C3B5B] hover:bg-[#3C4B6B] text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleForceLogout}
                                className="flex-1 px-4 py-2 bg-[#FF4E64] hover:bg-[#FF3954] text-white rounded-lg transition-colors"
                            >
                                Force Logout
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        

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
                                            {errorData.devices.map((device, idx) => renderDeviceItem(device, idx))}
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
            {showConfirmModal && <ConfirmationModal />}

        </div>
    )
}

export default Callback



