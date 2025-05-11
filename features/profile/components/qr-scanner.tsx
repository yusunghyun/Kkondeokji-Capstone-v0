"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface QrScannerProps {
  onScan: (code: string) => void
  onError: (error: string) => void
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const containerId = "qr-scanner-container"
    containerRef.current.id = containerId

    // Initialize scanner
    scannerRef.current = new Html5Qrcode(containerId)

    // Start scanning
    startScanner()

    // Cleanup on unmount
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    if (!scannerRef.current) return

    try {
      setIsScanning(true)

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // On successful scan
          onScan(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Ignore errors during scanning
          console.log(errorMessage)
        },
      )
    } catch (error) {
      setIsScanning(false)
      onError("카메라를 활성화할 수 없습니다. 카메라 접근 권한을 확인해주세요.")
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        setIsScanning(false)
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100"></div>
      <p className="text-sm text-center mt-2 text-gray-500">QR 코드를 카메라에 비춰주세요</p>
    </div>
  )
}
