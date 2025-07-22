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

  const clearText = () => {
    setText('')
    setError('')
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 dark:from-purple-600/20 dark:to-pink-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h.01m0-.01h4.01" />
              </svg>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-12 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Générateur de Codes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
            Créez facilement des QR codes et codes-barres professionnels. Interface moderne, téléchargement instantané.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Configuration Card */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration</h2>
            </div>

            {/* Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Type de code
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'qrcode', label: 'QR Code', icon: '⚡' },
                  { id: 'ean13', label: 'EAN-13', icon: '📊' },
                  { id: 'code128', label: 'Code128', icon: '🏷️' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setType(option.id as any)}
                    className={`relative overflow-hidden px-4 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                      type === option.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-lg'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                    {type === option.id && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Contenu à encoder
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={getPlaceholder()}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-purple-500/25 focus:border-purple-500 transition-all duration-300 shadow-inner"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {text && (
                  <button
                    onClick={clearText}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-8 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl shadow-inner">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">{error}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={download}
              disabled={!text.trim() || !!error}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-2xl hover:shadow-3xl transform hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-2xl"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-lg">Télécharger {type === 'qrcode' ? 'PNG' : 'SVG'}</span>
              </div>
            </button>
          </div>

          {/* Preview Card */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aperçu</h2>
            </div>

            <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-inner">
              {text.trim() && !error ? (
                <div className="flex flex-col items-center space-y-6 p-6">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl opacity-20 animate-pulse"></div>
                    <div className="relative bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl">
                      {type === 'qrcode' ? (
                        <QRCodeCanvas 
                          value={text} 
                          size={220} 
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
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow-lg">
                      ✨ Code généré avec succès
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h.01m0-.01h4.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      {error ? '❌ Corrigez l\'erreur ci-dessus' : '📝 Saisissez du contenu'}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Votre code apparaîtra ici en temps réel
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
