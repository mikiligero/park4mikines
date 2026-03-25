import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.configurableList.upsert({
    where: { type: 'FOOD' },
    update: {},
    create: {
      name: 'Despensa & Comida 🍎',
      type: 'FOOD',
      icon: 'UtensilsCrossed',
      isVisible: true,
    },
  })

  await prisma.configurableList.upsert({
    where: { type: 'GEAR' },
    update: {},
    create: {
      name: 'Gear & Tareas 🎒',
      type: 'GEAR',
      icon: 'Backpack',
      isVisible: true,
    },
  })

  console.log('Lists seeded.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
