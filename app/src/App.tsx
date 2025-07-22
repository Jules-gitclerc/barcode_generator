import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import JsBarcode from 'jsbarcode'

function App() {
  const [text, setText] = useState('')
  const [type, setType] = useState<'qrcode' | 'ean13' | 'code128'>('qrcode')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (type !== 'qrcode' && svgRef.current) {
      if (text.trim() === '') {
        svgRef.current.innerHTML = ''
        return
      }
      JsBarcode(svgRef.current, text, {
        format: type === 'ean13' ? 'ean13' : 'code128',
        lineColor: '#000',
        width: 2,
        height: 100,
        displayValue: true,
      })
    }
  }, [text, type])

  const download = () => {
    if (type === 'qrcode' && canvasRef.current) {
      const link = document.createElement('a')
      link.download = 'qrcode.png'
      link.href = canvasRef.current.toDataURL('image/png')
      link.click()
    } else if (svgRef.current) {
      const serializer = new XMLSerializer()
      const source = serializer.serializeToString(svgRef.current)
      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'barcode.svg'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const toggleTheme = () => {
    setDark(!dark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">Barcode &amp; QR Code Generator</h1>
      <input
        type="text"
        placeholder="Enter text or URL"
        className="w-full p-2 border rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <select
        className="w-full p-2 border rounded"
        value={type}
        onChange={(e) => setType(e.target.value as any)}
      >
        <option value="qrcode">QR Code</option>
        <option value="ean13">EAN-13</option>
        <option value="code128">Code128</option>
      </select>
      <div className="flex gap-2 justify-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={download}
          disabled={!text.trim()}
        >
          Download
        </button>
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded"
          onClick={toggleTheme}
        >
          Toggle Theme
        </button>
      </div>
      <div className="flex justify-center p-4 bg-white dark:bg-gray-800" id="result">
        {text.trim() ? (
          type === 'qrcode' ? (
            <QRCodeCanvas value={text} size={256} includeMargin ref={canvasRef} />
          ) : (
            <svg ref={svgRef} />
          )
        ) : null}
      </div>
    </div>
  )
}

export default App
