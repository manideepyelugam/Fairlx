export enum ProjectPermissionKey {
    // View
    VIEW_PROJECT = "project.view",
    VIEW_TASKS = "project.tasks.view",
    VIEW_SPRINTS = "project.sprints.view",
    VIEW_DOCS = "project.docs.view",
    VIEW_MEMBERS = "project.members.view",
    VIEW_TEAMS = "project.teams.view",
    VIEW_BOARD = "project.board.view",
    VIEW_REPORTS = "project.reports.view",

    // Create
    CREATE_TASKS = "project.tasks.create",
    CREATE_SPRINTS = "project.sprints.create",
    CREATE_DOCS = "project.docs.create",
    CREATE_TEAMS = "project.teams.create",
    CREATE_COMMENTS = "project.comments.create",
    CREATE_ROLES = "project.roles.create",

    // Edit / Update
    EDIT_TASKS = "project.tasks.edit",
    EDIT_SPRINTS = "project.sprints.edit",
    EDIT_DOCS = "project.docs.edit",
    EDIT_SETTINGS = "project.settings.edit",
    UPDATE_BOARD = "project.board.update",
    ASSIGN_TASKS = "project.tasks.assign",

    // Delete
    DELETE_TASKS = "project.tasks.delete",
    DELETE_SPRINTS = "project.sprints.delete",
    DELETE_DOCS = "project.docs.delete",
    DELETE_PROJECT = "project.delete",
    DELETE_COMMENTS = "project.comments.delete",
    DELETE_ROLES = "project.roles.delete",

    // Sprint actions
    START_SPRINT = "project.sprints.start",
    COMPLETE_SPRINT = "project.sprints.complete",

    // Management
    MANAGE_MEMBERS = "project.members.manage",
    MANAGE_TEAMS = "project.teams.manage",
    MANAGE_PERMISSIONS = "project.permissions.manage",
    MANAGE_SETTINGS = "project.settings.manage",
    
    // Member actions
    INVITE_MEMBERS = "project.members.invite",
    REMOVE_MEMBERS = "project.members.remove",
}
