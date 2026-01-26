export enum ProjectPermissionKey {
    // View
    VIEW_PROJECT = "project.view",
    VIEW_TASKS = "project.tasks.view",
    VIEW_SPRINTS = "project.sprints.view",
    VIEW_DOCS = "project.docs.view",
    VIEW_MEMBERS = "project.members.view",
    VIEW_TEAMS = "project.teams.view",

    // Create
    CREATE_TASKS = "project.tasks.create",
    CREATE_SPRINTS = "project.sprints.create",
    CREATE_DOCS = "project.docs.create",

    // Edit
    EDIT_TASKS = "project.tasks.edit",
    EDIT_SPRINTS = "project.sprints.edit",
    EDIT_DOCS = "project.docs.edit",

    // Delete
    DELETE_TASKS = "project.tasks.delete",
    DELETE_SPRINTS = "project.sprints.delete",
    DELETE_DOCS = "project.docs.delete",

    // Sprint actions
    START_SPRINT = "project.sprints.start",
    COMPLETE_SPRINT = "project.sprints.complete",

    // Member management
    MANAGE_MEMBERS = "project.members.manage",
    MANAGE_TEAMS = "project.teams.manage",
    MANAGE_PERMISSIONS = "project.permissions.manage",

    // Settings
    EDIT_SETTINGS = "project.settings.edit",
    DELETE_PROJECT = "project.delete",
}
