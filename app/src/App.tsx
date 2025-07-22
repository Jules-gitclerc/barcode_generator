import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import JsBarcode from 'jsbarcode'

function App() {
  const [text, setText] = useState('')
  const [type, setType] = useState<'qrcode' | 'ean13' | 'code128'>('qrcode')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [error, setError] = useState('')

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  // Update theme when isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Clear previous content when changing type
  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.innerHTML = ''
    }
    setError('')
  }, [type])

  // Generate barcode
  useEffect(() => {
    if (type !== 'qrcode' && svgRef.current && text.trim()) {
      try {
        let processedText = text.trim()
        
        // Validate and process EAN-13
        if (type === 'ean13') {
          // Remove non-digits
          const digits = processedText.replace(/[^0-9]/g, '')
          
          if (digits.length === 12) {
            // Calculate check digit
            let sum = 0
            for (let i = 0; i < 12; i++) {
              sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
            }
            const checkDigit = (10 - (sum % 10)) % 10
            processedText = digits + checkDigit
          } else if (digits.length === 13) {
            processedText = digits
          } else {
            throw new Error(`EAN-13 nécessite 12 ou 13 chiffres (${digits.length} fournis)`)
          }
        }
        
        JsBarcode(svgRef.current, processedText, {
          format: type === 'ean13' ? 'EAN13' : 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
          background: 'transparent',
          lineColor: isDark ? '#ffffff' : '#000000',
          fontSize: 16,
          textMargin: 2,
          margin: 10
        })
        setError('')
      } catch (err) {
        console.error('Erreur génération code-barres:', err)
        setError(err instanceof Error ? err.message : 'Format invalide')
        svgRef.current.innerHTML = ''
      }
    } else if (type !== 'qrcode') {
      setError('')
    }
  }, [text, type, isDark])

  const download = () => {
    if (!text.trim()) return
    
    if (type === 'qrcode' && canvasRef.current) {
      const link = document.createElement('a')
      link.download = `qrcode-${Date.now()}.png`
      link.href = canvasRef.current.toDataURL('image/png')
      link.click()
    } else if (svgRef.current && svgRef.current.innerHTML) {
      const serializer = new XMLSerializer()
      const source = serializer.serializeToString(svgRef.current)
      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-${Date.now()}.svg`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const getPlaceholder = () => {
    switch (type) {
      case 'qrcode':
        return 'Entrez du texte, une URL...'
      case 'ean13':
        return 'Entrez 12 ou 13 chiffres (ex: 123456789012)'
      case 'code128':
        return 'Entrez du texte ou des chiffres'
      default:
        return 'Entrez votre texte'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Générateur de Codes
            </h1>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Configuration</h2>
            
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Type de code
              </label>
              <div className="flex space-x-2">
                {[
                  { id: 'qrcode', label: 'QR Code' },
                  { id: 'ean13', label: 'EAN-13' },
                  { id: 'code128', label: 'Code128' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setType(option.id as any)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      type === option.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Contenu à encoder
              </label>
              <input
                type="text"
                placeholder={getPlaceholder()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={download}
              disabled={!text.trim() || !!error}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
            >
              Télécharger {type === 'qrcode' ? 'PNG' : 'SVG'}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Aperçu</h2>
            
            <div className="flex items-center justify-center min-h-[300px] bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              {text.trim() && !error ? (
                <div className="flex flex-col items-center p-4">
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
                    {type === 'qrcode' ? (
                      <QRCodeCanvas 
                        value={text} 
                        size={200} 
                        includeMargin 
                        ref={canvasRef}
                        bgColor={isDark ? '#111827' : '#ffffff'}
                        fgColor={isDark ? '#ffffff' : '#000000'}
                      />
                    ) : (
                      <svg ref={svgRef} className="max-w-full h-auto" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h.01m0-.01h4.01" />
                  </svg>
                  <p className="text-sm">
                    {error ? 'Corrigez l\'erreur ci-dessus' : 'Saisissez du contenu pour voir l\'aperçu'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
