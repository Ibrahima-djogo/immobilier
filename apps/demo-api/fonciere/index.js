/**
 * Routes Demo API — vérification foncière officielle.
 */

const {
  applyAdminMeta,
  applyAdminStatus,
  applyOwnerResponse,
  createRequest,
  ensureFonciereCollections,
  findRequest,
  listRequests,
  publicRequest,
} = require("./fonciere-requests");

function registerFonciereRoutes(app, { readDb, writeDb }) {
  app.get("/fonciere-verifications", (_req, res) => {
    const db = readDb();
    res.json(listRequests(db).map(publicRequest));
  });

  app.get("/fonciere-verifications/:id", (req, res) => {
    const db = readDb();
    const item = findRequest(db, req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Dossier foncier introuvable." });
    }
    res.json(publicRequest(item));
  });

  app.post("/fonciere-verifications", (req, res) => {
    try {
      const db = readDb();
      const created = createRequest(db, req.body || {});
      writeDb(db);
      res.status(201).json(publicRequest(created));
    } catch (error) {
      res.status(error.status || 400).json({
        error: error.message || "Impossible de créer la demande foncière.",
      });
    }
  });

  app.patch("/fonciere-verifications/:id/owner-response", (req, res) => {
    const db = readDb();
    const item = findRequest(db, req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Dossier foncier introuvable." });
    }
    try {
      const body = req.body || {};
      const action = body.action || body.response || body.status;
      const actorId = String(body.actorId || "proprietaire").trim() || "proprietaire";
      applyOwnerResponse(item, action, actorId);
      writeDb(db);
      res.json(publicRequest(item));
    } catch (error) {
      res.status(error.status || 400).json({
        error: error.message || "Impossible d’enregistrer la réponse propriétaire.",
      });
    }
  });

  app.patch("/fonciere-verifications/:id/status", (req, res) => {
    const db = readDb();
    const item = findRequest(db, req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Dossier foncier introuvable." });
    }
    try {
      const body = req.body || {};
      if (body.status) {
        applyAdminStatus(
          item,
          body.status,
          body.message,
          String(body.actorId || "admin").trim() || "admin",
        );
      }
      applyAdminMeta(item, body);
      writeDb(db);
      res.json(publicRequest(item));
    } catch (error) {
      res.status(error.status || 400).json({
        error: error.message || "Impossible de mettre à jour le dossier foncier.",
      });
    }
  });
}

module.exports = {
  ensureFonciereCollections,
  registerFonciereRoutes,
};
