/**
 * Identité Demo API — token = user.id (Authorization Bearer ou X-User-Id).
 * Ne jamais identifier un utilisateur par e-mail, téléphone ou nom.
 */

function readAuthToken(req) {
  const headerUserId = String((req && req.headers && req.headers["x-user-id"]) || "").trim();
  const bearer = String((req && req.headers && req.headers.authorization) || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  return headerUserId || bearer || "";
}

function resolveAuthenticatedUser(req, db) {
  const token = readAuthToken(req);
  if (!token) return null;
  return ((db && db.users) || []).find((user) => user.id === token) || null;
}

module.exports = {
  readAuthToken,
  resolveAuthenticatedUser,
};
