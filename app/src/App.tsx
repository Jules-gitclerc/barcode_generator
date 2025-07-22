import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import useDebounce from './hooks/useDebounce'

interface GeneratedCode {
  id: string
  text: string
  type: 'qrcode' | 'ean13' | 'code128'
  canvas?: HTMLCanvasElement
  svg?: string
  error?: string
}

interface TooltipProps {
  children: React.ReactNode
  content: string
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, className = '' }) => {
  return (
    <div className={`group relative ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
      </div>
    </div>
  )
}

function App() {
  const [text, setText] = useState('')
  const [type, setType] = useState<'qrcode' | 'ean13' | 'code128'>('qrcode')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [error, setError] = useState('')
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [batchText, setBatchText] = useState('')
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([])
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false)
  
  // Debounced values to optimize performance
  const debouncedText = useDebounce(text, 300)
  const debouncedBatchText = useDebounce(batchText, 300)

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

  // Generate barcode automatically
  useEffect(() => {
    if (type !== 'qrcode' && svgRef.current && debouncedText.trim()) {
      try {
        let processedText = debouncedText.trim()
        
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
            // Validate check digit
            let sum = 0
            for (let i = 0; i < 12; i++) {
              sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
            }
            const calculatedCheckDigit = (10 - (sum % 10)) % 10
            const providedCheckDigit = parseInt(digits[12])
            if (calculatedCheckDigit !== providedCheckDigit) {
              throw new Error(`Chiffre de contrôle invalide. Attendu: ${calculatedCheckDigit}, fourni: ${providedCheckDigit}`)
            }
            processedText = digits
          } else {
            throw new Error(`EAN-13 nécessite 12 ou 13 chiffres (${digits.length} fournis)`)
          }
        }
        
        JsBarcode(svgRef.current, processedText, {
          format: type === 'ean13' ? 'EAN13' : 'CODE128',
          width: 3,
          height: 100,
          displayValue: true,
          background: 'transparent',
          lineColor: isDark ? '#ffffff' : '#000000',
          fontSize: 18,
          textMargin: 4,
          margin: 15
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
  }, [debouncedText, type, isDark])

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

  const processText = (inputText: string, codeType: typeof type): { text: string; error?: string } => {
    const trimmedText = inputText.trim()
    if (!trimmedText) return { text: '', error: 'Texte vide' }

    if (codeType === 'ean13') {
      const digits = trimmedText.replace(/[^0-9]/g, '')
      if (digits.length === 12) {
        let sum = 0
        for (let i = 0; i < 12; i++) {
          sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
        }
        const checkDigit = (10 - (sum % 10)) % 10
        return { text: digits + checkDigit }
      } else if (digits.length === 13) {
        // Validate check digit
        let sum = 0
        for (let i = 0; i < 12; i++) {
          sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
        }
        const calculatedCheckDigit = (10 - (sum % 10)) % 10
        const providedCheckDigit = parseInt(digits[12])
        if (calculatedCheckDigit !== providedCheckDigit) {
          return { text: trimmedText, error: `Chiffre de contrôle invalide. Attendu: ${calculatedCheckDigit}, fourni: ${providedCheckDigit}` }
        }
        return { text: digits }
      } else {
        return { text: trimmedText, error: `EAN-13 nécessite 12 ou 13 chiffres (${digits.length} fournis)` }
      }
    }
    return { text: trimmedText }
  }

  const generateBatchCodes = async () => {
    setIsGeneratingBatch(true)
    const lines = debouncedBatchText.split('\n').filter(line => line.trim())
    const codes: GeneratedCode[] = []

    // Process codes in chunks to avoid blocking UI
    const chunkSize = 5 // Process 5 codes at a time
    
    for (let chunkStart = 0; chunkStart < lines.length; chunkStart += chunkSize) {
      const chunkEnd = Math.min(chunkStart + chunkSize, lines.length)
      const chunk = lines.slice(chunkStart, chunkEnd)
      
      // Process current chunk
      for (let i = 0; i < chunk.length; i++) {
        const line = chunk[i]
        const index = chunkStart + i
        const { text: processedText, error } = processText(line, type)
        const id = `code-${Date.now()}-${index}`
        
        if (error) {
          codes.push({ id, text: line, type, error })
          continue
        }

        try {
          if (type === 'qrcode') {
            // We'll generate QR codes in the rendering phase
            codes.push({ id, text: processedText, type })
          } else {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            // Paramètres optimisés pour l'affichage en miniature dans le mode lot
            JsBarcode(svg, processedText, {
              format: type === 'ean13' ? 'EAN13' : 'CODE128',
              width: 1.5, // Plus fin pour l'affichage miniature
              height: 60, // Plus court pour s'adapter à la fenêtre
              displayValue: true,
              background: 'transparent',
              lineColor: isDark ? '#ffffff' : '#000000',
              fontSize: 12, // Police plus petite
              textMargin: 2,
              margin: 8 // Marges réduites
            })
            const serializer = new XMLSerializer()
            const svgString = serializer.serializeToString(svg)
            codes.push({ id, text: processedText, type, svg: svgString })
          }
        } catch (err) {
          codes.push({ 
            id, 
            text: line, 
            type, 
            error: err instanceof Error ? err.message : 'Erreur de génération' 
          })
        }
      }
      
      // Update UI with current progress and yield to browser
      setGeneratedCodes([...codes])
      
      // Yield to browser for UI updates between chunks
      if (chunkEnd < lines.length) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    setIsGeneratingBatch(false)
  }

  const downloadBatchCodes = () => {
    generatedCodes.forEach((code, index) => {
      if (code.error) return
      
      setTimeout(() => {
        if (code.type === 'qrcode' && code.canvas) {
          const link = document.createElement('a')
          link.download = `qrcode-${code.text}-${index + 1}.png`
          link.href = code.canvas.toDataURL('image/png')
          link.click()
        } else if (code.svg) {
          const svgBlob = new Blob([code.svg], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(svgBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${code.type}-${code.text}-${index + 1}.svg`
          link.click()
          URL.revokeObjectURL(url)
        }
      }, index * 150) // Augmenter le délai pour un séquencement plus lisse
    })
  }

  const clearBatch = () => {
    setGeneratedCodes([])
    setBatchText('')
  }

  const generateRandomCode = (codeType: typeof type): string => {
    switch (codeType) {
      case 'qrcode':
        const qrOptions = [
          // URLs fictives
          `https://example.com/page/${Math.random().toString(36).substring(2, 8)}`,
          `https://shop.demo/product/${Math.floor(Math.random() * 10000)}`,
          `https://test.app/user/${Math.random().toString(36).substring(2, 10)}`,
          // Textes divers
          `Code aléatoire: ${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
          `ID-${Math.floor(Math.random() * 100000)}`,
          `Test ${new Date().getTime()}`,
          // Coordonnées GPS fictives
          `geo:${(Math.random() * 180 - 90).toFixed(6)},${(Math.random() * 360 - 180).toFixed(6)}`,
          // Email fictif
          `mailto:test${Math.floor(Math.random() * 1000)}@example.com`,
          // Téléphone fictif
          `tel:+33${Math.floor(Math.random() * 900000000 + 100000000)}`,
          // WiFi fictif
          `WIFI:T:WPA;S:TestNetwork${Math.floor(Math.random() * 100)};P:password${Math.floor(Math.random() * 1000)};;`
        ]
        return qrOptions[Math.floor(Math.random() * qrOptions.length)]
        
      case 'ean13':
        // Générer 12 chiffres aléatoires
        let digits = ''
        for (let i = 0; i < 12; i++) {
          digits += Math.floor(Math.random() * 10).toString()
        }
        // Calculer le chiffre de contrôle
        let sum = 0
        for (let i = 0; i < 12; i++) {
          sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
        }
        const checkDigit = (10 - (sum % 10)) % 10
        return digits + checkDigit
        
      case 'code128':
        const code128Options = [
          // Codes produit
          `PROD${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
          `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          `ITEM${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
          // Codes série
          `SN${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          `SERIAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          // Codes de lot
          `BATCH${new Date().getMonth() + 1}${new Date().getDate()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          // Codes alphanumériques
          Math.random().toString(36).substring(2, 15).toUpperCase(),
          `REF-${Math.floor(Math.random() * 1000000)}`,
          `CODE${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(Math.random() * 100)}`,
          // Identifiants
          `ID${Math.floor(Math.random() * 10000000)}`,
        ]
        return code128Options[Math.floor(Math.random() * code128Options.length)]
        
      default:
        return Math.random().toString(36).substring(2, 12)
    }
  }

  const generateRandomCodes = (count: number): string[] => {
    const codes: string[] = []
    const usedCodes = new Set<string>()
    
    while (codes.length < count) {
      const newCode = generateRandomCode(type)
      if (!usedCodes.has(newCode)) {
        usedCodes.add(newCode)
        codes.push(newCode)
      }
    }
    
    return codes
  }

  const handleGenerateRandom = () => {
    if (isBatchMode) {
      const randomCodes = generateRandomCodes(10) // Génère 10 codes par défaut
      setBatchText(randomCodes.join('\n'))
    } else {
      const randomCode = generateRandomCode(type)
      setText(randomCode)
    }
  }

  const getPlaceholder = () => {
    switch (type) {
      case 'qrcode':
        return isBatchMode ? 'Entrez plusieurs textes/URLs, un par ligne...' : 'Entrez du texte, une URL...'
      case 'ean13':
        return isBatchMode ? 'Entrez plusieurs codes EAN-13, un par ligne...' : 'Entrez 12 ou 13 chiffres (ex: 123456789012)'
      case 'code128':
        return isBatchMode ? 'Entrez plusieurs textes, un par ligne...' : 'Entrez du texte ou des chiffres'
      default:
        return isBatchMode ? 'Entrez plusieurs valeurs, une par ligne...' : 'Entrez votre texte'
    }
  }

  // Fonction pour obtenir des informations sur la saisie EAN-13
  const getEanInfo = () => {
    if (type === 'ean13' && !isBatchMode) {
      const digits = text.replace(/[^0-9]/g, '')
      const remaining = Math.max(0, 12 - digits.length)
      const isComplete = digits.length >= 12
      
      return {
        digits: digits.length,
        remaining,
        isComplete,
        message: digits.length === 0 
          ? 'Saisissez les chiffres de votre code EAN-13'
          : digits.length < 12 
            ? `${digits.length}/13 chiffres - Il reste ${remaining} chiffres à saisir`
            : digits.length === 12
              ? 'Code complet (le chiffre de contrôle sera calculé automatiquement)'
              : digits.length === 13
                ? 'Code EAN-13 complet'
                : `Trop de chiffres (${digits.length}/13 maximum)`
      }
    }
    return null
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
            
            {/* Mode Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mode de génération
                </label>
                <button
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isBatchMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isBatchMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isBatchMode ? 'Mode lot : générez plusieurs codes en même temps' : 'Mode simple : générez un code à la fois'}
              </p>
            </div>

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

            {/* Text Input - Simple Mode */}
            {!isBatchMode && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contenu à encoder
                  </label>
                  <button
                    onClick={handleGenerateRandom}
                    className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-2 py-1 rounded transition-colors"
                    title="Générer un code aléatoire"
                  >
                    🎲 Aléatoire
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={getPlaceholder()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                {/* Info EAN-13 */}
                {getEanInfo() && (
                  <div className={`mt-2 text-xs px-3 py-2 rounded-md ${
                    getEanInfo()!.isComplete
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        {getEanInfo()!.isComplete ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1">{getEanInfo()!.message}</span>
                      {getEanInfo()!.digits > 0 && (
                        <div className="flex-shrink-0 font-mono text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                          {getEanInfo()!.digits}/13
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Batch Input */}
            {isBatchMode && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contenus à encoder (un par ligne)
                  </label>
                  <button
                    onClick={handleGenerateRandom}
                    className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-2 py-1 rounded transition-colors"
                    title="Générer 10 codes aléatoires"
                  >
                    🎲 10 aléatoires
                  </button>
                </div>
                <textarea
                  placeholder={getPlaceholder()}
                  className="w-full px-3 py-2 h-32 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {batchText.split('\n').filter(line => line.trim()).length} ligne(s) à traiter
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && !isBatchMode && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Batch Controls */}
            {isBatchMode && (
              <div className="mb-6 space-y-3">
                <button
                  onClick={generateBatchCodes}
                  disabled={!batchText.trim() || isGeneratingBatch}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isGeneratingBatch ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Génération en cours...</span>
                    </>
                  ) : (
                    <span>Générer les codes ({batchText.split('\n').filter(line => line.trim()).length})</span>
                  )}
                </button>
                {generatedCodes.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={downloadBatchCodes}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Télécharger tout ({generatedCodes.filter(c => !c.error).length})
                    </button>
                    <button
                      onClick={clearBatch}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Vider
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Simple Mode Download Button - Auto-enabled when code is valid */}
            {!isBatchMode && (
              <button
                onClick={download}
                disabled={!text.trim() || !!error}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Télécharger {type === 'qrcode' ? 'PNG' : 'SVG'}</span>
              </button>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {isBatchMode ? 'Codes générés' : 'Aperçu'}
            </h2>
            
            {/* Simple Mode Preview */}
            {!isBatchMode && (
              <div className="flex items-center justify-center min-h-[500px] bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                {text.trim() && !error ? (
                  <div className="flex flex-col items-center p-6">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
                      {type === 'qrcode' ? (
                        <QRCodeCanvas 
                          value={text} 
                          size={250} 
                          includeMargin 
                          ref={canvasRef}
                          bgColor={isDark ? '#111827' : '#ffffff'}
                          fgColor={isDark ? '#ffffff' : '#000000'}
                        />
                      ) : (
                        <div className="flex items-center justify-center min-h-[200px]">
                          <svg ref={svgRef} className="max-w-full h-auto" style={{minWidth: '300px'}} />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📱 Optimisé pour le scan mobile
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h.01m0-.01h4.01" />
                    </svg>
                    <p className="text-sm font-medium">
                      {error ? 'Corrigez l\'erreur ci-dessus' : 'Saisissez du contenu pour voir l\'aperçu'}
                    </p>
                    <p className="text-xs mt-2">
                      Le code sera optimisé pour le scan mobile
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Batch Mode Preview */}
            {isBatchMode && (
              <div className="min-h-[500px] bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6">
                {generatedCodes.length > 0 ? (
                  <div className="space-y-5 max-h-[600px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {generatedCodes.length} code(s) - {generatedCodes.filter(c => !c.error).length} valide(s) - {generatedCodes.filter(c => c.error).length} erreur(s)
                      </p>
                    </div>
                    {generatedCodes.map((code) => (
                      <div key={code.id} className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-600 shadow-sm">
                        {code.error ? (
                          <div className="flex items-center space-x-4">
                            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 dark:text-white truncate">{code.text}</p>
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{code.error}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-5">
                            <div className="flex-shrink-0 bg-white dark:bg-gray-900 p-3 rounded-lg border shadow-sm">
                              {code.type === 'qrcode' ? (
                                <QRCodeCanvas 
                                  value={code.text} 
                                  size={80} 
                                  includeMargin={false}
                                  bgColor={isDark ? '#111827' : '#ffffff'}
                                  fgColor={isDark ? '#ffffff' : '#000000'}
                                />
                              ) : (
                                code.svg && <div className="w-36 h-24 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: code.svg.replace(/width="\d+"/, 'width="144"').replace(/height="\d+"/, 'height="96"') }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{code.text}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{code.type.toUpperCase()}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">📱 Prêt pour le scan</p>
                            </div>
                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-16">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-sm font-medium">
                        Saisissez vos données et cliquez sur "Générer les codes"
                      </p>
                      <p className="text-xs mt-2">
                        Tous les codes seront optimisés pour le scan mobile
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
