import { db } from "./db"

async function main() {
  try {
    // Créer un utilisateur par défaut si aucun n'existe
    const userCount = await db.user.count()
    if (userCount === 0) {
      const defaultUser = await db.user.create({
        data: {
          id: "user-1",
          email: "demo@zenlist.com",
          name: "Demo User",
        },
      })
      console.log("Created default user:", defaultUser)
    }

    // Créer un workspace par défaut
    const workspaceCount = await db.workspace.count()
    if (workspaceCount === 0) {
      const defaultWorkspace = await db.workspace.create({
        data: {
          name: "Workspace par défaut",
          description: "Workspace créé automatiquement",
          ownerId: "user-1",
        },
      })
      console.log("Created default workspace:", defaultWorkspace)

      // Créer un projet par défaut
      const defaultProject = await db.project.create({
        data: {
          name: "Projet par défaut",
          workspaceId: defaultWorkspace.id,
        },
      })
      console.log("Created default project:", defaultProject)
    }

    console.log("Database seeded successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })