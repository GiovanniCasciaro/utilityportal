import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('bolletta') as File
    const nome = formData.get('nome') as string
    const cognome = formData.get('cognome') as string
    const email = formData.get('email') as string

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Bolletta non fornita' },
        { status: 400 }
      )
    }

    // Validazione file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Formato file non supportato. Usa PDF, JPEG o PNG' },
        { status: 400 }
      )
    }

    // Validazione dimensione (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File troppo grande. Massimo 5MB' },
        { status: 400 }
      )
    }

    // Simulazione analisi bolletta
    // In futuro qui si può integrare un servizio di OCR/AI per analizzare realmente la bolletta
    
    // Dati mock per la simulazione
    const tipoBolletta = file.name.toLowerCase().includes('gas') ? 'gas' : 'luce'
    const consumoAnnuale = tipoBolletta === 'luce' 
      ? Math.floor(Math.random() * 2000) + 1500 // kWh
      : Math.floor(Math.random() * 1000) + 500 // smc
    
    const costoMensile = tipoBolletta === 'luce'
      ? Math.random() * 40 + 50 // €50-90
      : Math.random() * 30 + 40 // €40-70
    
    const costoAttuale = costoMensile * 12

    // Genera offerte simulate
    const offerte = [
      {
        id: '1',
        fornitore: 'Enel Energia',
        nome: 'Enel Luce Verde',
        prezzoMensile: costoMensile * 0.82,
        risparmioAnnuale: costoAttuale - (costoMensile * 0.82 * 12),
        risparmioPercentuale: 18,
        caratteristiche: ['Energia 100% rinnovabile', 'Prezzo bloccato 12 mesi', 'Nessun costo nascosto'],
      },
      {
        id: '2',
        fornitore: 'Iren',
        nome: 'Iren Smart',
        prezzoMensile: costoMensile * 0.79,
        risparmioAnnuale: costoAttuale - (costoMensile * 0.79 * 12),
        risparmioPercentuale: 21,
        caratteristiche: ['Prezzo fisso 24 mesi', 'App mobile inclusa', 'Assistenza 24/7'],
      },
      {
        id: '3',
        fornitore: 'Edison',
        nome: 'Edison Next',
        prezzoMensile: costoMensile * 0.86,
        risparmioAnnuale: costoAttuale - (costoMensile * 0.86 * 12),
        risparmioPercentuale: 14,
        caratteristiche: ['Prezzo variabile', 'Bonus fedeltà', 'Servizio clienti dedicato'],
      },
      {
        id: '4',
        fornitore: 'Eni Plenitude',
        nome: 'Eni Plenitude Luce',
        prezzoMensile: costoMensile * 0.84,
        risparmioAnnuale: costoAttuale - (costoMensile * 0.84 * 12),
        risparmioPercentuale: 16,
        caratteristiche: ['Energia verde', 'Prezzo fisso 18 mesi', 'Sconti su altri servizi'],
      },
    ]

    // Trova l'offerta migliore
    const miglioreOfferta = offerte.reduce((best, current) => 
      current.risparmioAnnuale > (best?.risparmioAnnuale || 0) ? current : best
    )

    return NextResponse.json({
      success: true,
      analisi: {
        consumoAnnuale,
        costoAttuale,
        costoMensile,
        tipoBolletta,
        offerte,
        miglioreOfferta,
      },
      utente: {
        nome,
        cognome,
        email,
      },
    })
  } catch (error) {
    console.error('Errore analisi bolletta:', error)
    return NextResponse.json(
      { success: false, message: 'Errore durante l\'analisi della bolletta' },
      { status: 500 }
    )
  }
}

