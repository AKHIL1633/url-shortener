import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    return NextResponse.json({ qr: qrDataUrl })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}