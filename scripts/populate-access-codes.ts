import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

function generateAccessCode(): string {
  return randomBytes(8).toString('hex')
}

async function populateAccessCodes() {
  try {
    console.log('Starting to populate access codes for existing boards...')
    
    // Find boards without access codes
    const boardsWithoutCodes = await prisma.board.findMany({
      where: {
        accessCode: null
      }
    })
    
    console.log(`Found ${boardsWithoutCodes.length} boards without access codes`)
    
    // Update each board with a unique access code
    for (const board of boardsWithoutCodes) {
      const accessCode = generateAccessCode()
      await prisma.board.update({
        where: { id: board.id },
        data: { accessCode }
      })
      console.log(`Updated board "${board.title}" with access code: ${accessCode}`)
    }
    
    console.log('Successfully populated access codes!')
  } catch (error) {
    console.error('Error populating access codes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateAccessCodes()