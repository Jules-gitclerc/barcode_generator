import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import JsBarcode from 'jsbarcode'

function App() {
  const [text, setText] = useState('')
  const [type, setType] = useState<'qrcode' | 'ean13' | 'code128'>('qrcode')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })
  const [error, setError] = useState('')

  // Initialize theme on mount
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  useEffect(() => {
    if (type !== 'qrcode' && svgRef.current) {
      if (text.trim() === '') {
        svgRef.current.innerHTML = ''
        setError('')
        return
      }
      
      try {
        // Validate input for different barcode types
        if (type === 'ean13') {
          const cleanText = text.replace(/[^0-9]/g, '')
          if (cleanText.length !== 13) {
            setError('EAN-13 doit contenir exactement 13 chiffres')
            svgRef.current.innerHTML = ''
            return
          }
        }
        
        JsBarcode(svgRef.current, text, {
          format: type === 'ean13' ? 'ean13' : 'code128',
          lineColor: dark ? '#ffffff' : '#000000',
          width: 2,
          height: 100,
          displayValue: true,
          background: 'transparent',
          fontSize: 14,
        })
        setError('')
      } catch (err) {
        setError(`Erreur: ${err instanceof Error ? err.message : 'Format invalide'}`)
        svgRef.current.innerHTML = ''
      }
    } else {
      setError('')
    }
  }, [text, type, dark])

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
    setDark(!dark)
  }

  const clearText = () => {
    setText('')
    setError('')
  }

  const getPlaceholder = () => {
    switch (type) {
      case 'qrcode':
        return 'Saisissez du texte, une URL, un numéro...'
      case 'ean13':
        return 'Saisissez 13 chiffres (ex: 1234567890123)'
      case 'code128':
        return 'Saisissez du texte ou des chiffres'
      default:
        return 'Saisissez votre texte'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h.01m0-.01h4.01" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Générateur de Codes
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              title={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
            >
              {dark ? (
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configuration</h2>
            
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Type de code
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[{id: 'qrcode', label: 'QR Code'}, {id: 'ean13', label: 'EAN-13'}, {id: 'code128', label: 'Code128'}].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setType(option.id as any)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      type === option.id
                        ? 'bg-blue-500 text-white shadow-lg scale-105'
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
              <div className="relative">
                <input
                  type="text"
                  placeholder={getPlaceholder()}
                  className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {text && (
                  <button
                    onClick={clearText}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={download}
              disabled={!text.trim() || !!error}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Télécharger {type === 'qrcode' ? 'PNG' : 'SVG'}</span>
            </button>
          </div>

          {/* Preview Panel */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Aperçu</h2>
            
            <div className="flex items-center justify-center min-h-[300px] bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              {text.trim() && !error ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
                    {type === 'qrcode' ? (
                      <QRCodeCanvas 
                        value={text} 
                        size={200} 
                        includeMargin 
                        ref={canvasRef}
                        bgColor={dark ? '#111827' : '#ffffff'}
                        fgColor={dark ? '#ffffff' : '#000000'}
                      />
                    ) : (
                      <svg ref={svgRef} className="max-w-full h-auto" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs break-words">
                    {text.length > 50 ? `${text.substring(0, 50)}...` : text}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h.01m0-.01h4.01" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    {error ? 'Corrigez l\'erreur ci-dessus' : 'Saisissez du texte pour voir l\'aperçu'}
                  </p>
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
