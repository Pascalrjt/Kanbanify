import { prisma } from './db'

export async function seedDatabase() {
  try {
    // Clear existing data
    await prisma.cardAssignment.deleteMany()
    await prisma.cardLabel.deleteMany()
    await prisma.checklistItem.deleteMany()
    await prisma.card.deleteMany()
    await prisma.list.deleteMany()
    await prisma.label.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.board.deleteMany()

    // Create a default board
    const board = await prisma.board.create({
      data: {
        title: 'Website Redesign',
        description: 'Complete redesign of the company website',
        background: '#0079bf',
      },
    })

    // Create team members
    const teamMembers = await Promise.all([
      prisma.teamMember.create({
        data: {
          name: 'Alice Johnson',
          color: '#e91e63',
          boardId: board.id,
        },
      }),
      prisma.teamMember.create({
        data: {
          name: 'Bob Smith',
          color: '#2196f3',
          boardId: board.id,
        },
      }),
      prisma.teamMember.create({
        data: {
          name: 'Carol Davis',
          color: '#4caf50',
          boardId: board.id,
        },
      }),
      prisma.teamMember.create({
        data: {
          name: 'David Wilson',
          color: '#ff9800',
          boardId: board.id,
        },
      }),
      prisma.teamMember.create({
        data: {
          name: 'Eve Brown',
          color: '#9c27b0',
          boardId: board.id,
        },
      }),
    ])

    // Create lists
    const lists = await Promise.all([
      prisma.list.create({
        data: {
          title: 'To Do',
          position: 1000,
          boardId: board.id,
        },
      }),
      prisma.list.create({
        data: {
          title: 'In Progress',
          position: 2000,
          boardId: board.id,
        },
      }),
      prisma.list.create({
        data: {
          title: 'Review',
          position: 3000,
          boardId: board.id,
        },
      }),
      prisma.list.create({
        data: {
          title: 'Done',
          position: 4000,
          boardId: board.id,
        },
      }),
    ])

    // Create cards
    const cards = await Promise.all([
      // To Do cards
      prisma.card.create({
        data: {
          title: 'Design new landing page',
          description: 'Create wireframes and mockups for the new homepage',
          position: 1000,
          dueDate: new Date('2024-01-15'),
          priority: 'high',
          listId: lists[0].id,
          assignees: {
            create: [
              { teamMemberId: teamMembers[0].id },
              { teamMemberId: teamMembers[1].id },
            ],
          },
          checklist: {
            create: [
              { content: 'Create wireframes', completed: true, position: 1000 },
              { content: 'Design mockups', completed: true, position: 2000 },
              { content: 'Review with stakeholders', completed: false, position: 3000 },
              { content: 'Finalize design system', completed: false, position: 4000 },
            ],
          },
        },
      }),
      prisma.card.create({
        data: {
          title: 'Update documentation',
          description: 'Review and update API documentation',
          position: 2000,
          dueDate: new Date('2024-01-20'),
          priority: 'medium',
          listId: lists[0].id,
          assignees: {
            create: [{ teamMemberId: teamMembers[2].id }],
          },
          checklist: {
            create: [
              { content: 'Review existing docs', completed: true, position: 1000 },
              { content: 'Update API endpoints', completed: false, position: 2000 },
              { content: 'Add examples', completed: false, position: 3000 },
            ],
          },
        },
      }),
      // In Progress cards
      prisma.card.create({
        data: {
          title: 'Implement user authentication',
          description: 'Set up OAuth and session management',
          position: 1000,
          dueDate: new Date('2024-01-18'),
          priority: 'high',
          listId: lists[1].id,
          assignees: {
            create: [{ teamMemberId: teamMembers[3].id }],
          },
          checklist: {
            create: [
              { content: 'Set up OAuth provider', completed: true, position: 1000 },
              { content: 'Implement login flow', completed: true, position: 2000 },
              { content: 'Add session management', completed: true, position: 3000 },
              { content: 'Write unit tests', completed: false, position: 4000 },
              { content: 'Update user interface', completed: false, position: 5000 },
            ],
          },
        },
      }),
      // Review cards
      prisma.card.create({
        data: {
          title: 'Code review for payment system',
          description: 'Review pull request for Stripe integration',
          position: 1000,
          dueDate: new Date('2024-01-16'),
          priority: 'high',
          listId: lists[2].id,
          assignees: {
            create: [
              { teamMemberId: teamMembers[0].id },
              { teamMemberId: teamMembers[4].id },
            ],
          },
        },
      }),
      // Done cards
      prisma.card.create({
        data: {
          title: 'Set up CI/CD pipeline',
          description: 'Configure GitHub Actions for automated testing',
          position: 1000,
          dueDate: new Date('2024-01-10'),
          priority: 'medium',
          listId: lists[3].id,
          assignees: {
            create: [{ teamMemberId: teamMembers[3].id }],
          },
          checklist: {
            create: [
              { content: 'Configure GitHub Actions', completed: true, position: 1000 },
              { content: 'Set up automated testing', completed: true, position: 2000 },
              { content: 'Configure deployment pipeline', completed: true, position: 3000 },
            ],
          },
        },
      }),
    ])

    console.log('Database seeded successfully!')
    console.log(`Created:`)
    console.log(`- 1 board`)
    console.log(`- ${teamMembers.length} team members`)
    console.log(`- ${lists.length} lists`)
    console.log(`- ${cards.length} cards`)

    return { board, teamMembers, lists, cards }
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}