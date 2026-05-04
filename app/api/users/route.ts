import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_BASE_ID = 'appXdaIokH3G3cSAM'
const AIRTABLE_TABLE_ID = 'tbluUi9WMzHPFjrND'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                name,
                email,
                password,
                role,
                rewardPoints: 0,
                createdAt: new Date().toISOString().split('T')[0],
              },
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Airtable error:', errorData)
      return NextResponse.json(
        { error: 'Failed to save user to Airtable', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const createdRecord = data.records[0]

    return NextResponse.json({
      success: true,
      user: {
        id: createdRecord.id,
        name: createdRecord.fields.name,
        email: createdRecord.fields.email,
        role: createdRecord.fields.role,
        rewardPoints: createdRecord.fields.rewardPoints || 0,
        createdAt: createdRecord.fields.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`
    
    if (email) {
      const filterFormula = encodeURIComponent(`{email} = '${email}'`)
      url += `?filterByFormula=${filterFormula}`
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: 'Failed to fetch users', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const users = data.records.map((record: { id: string; fields: Record<string, unknown> }) => ({
      id: record.id,
      name: record.fields.name,
      email: record.fields.email,
      role: record.fields.role,
      rewardPoints: record.fields.rewardPoints || 0,
      createdAt: record.fields.createdAt,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
