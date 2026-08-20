export const endpoints = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    session: "/api/auth/session",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  users: {
    me: "/users/me",
    notifications: "/users/me/notifications",
    favorites: "/users/me/favorites",
    contactRequests: "/users/me/contact-requests",
  },
  roleRequests: {
    root: "/role-requests",
    current: "/role-requests/current",
  },
  properties: {
    public: "/properties",
    owner: "/owner/properties",
    agency: "/agency/properties",
  },
  announcements: {
    public: "/announcements",
    owner: "/owner/announcements",
    agency: "/agency/announcements",
  },
  administration: {
    users: "/admin/users",
    roleRequests: "/admin/role-requests",
    announcements: "/admin/announcements",
    reports: "/admin/reports",
    audit: "/admin/audit",
  },
} as const;
