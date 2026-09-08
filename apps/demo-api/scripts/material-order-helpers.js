/**
 * Helpers partagés des tests commandes matériaux.
 */

async function completeVerification(api, id, notes = "Client confirmé par téléphone.") {
  return api("PATCH", `/materials/orders/${id}/verification`, {
    customerVerified: true,
    addressVerified: true,
    stockVerified: true,
    notes,
    changedBy: "admin",
  });
}

async function validateAfterVerification(api, patchStatus, id) {
  const checklist = await completeVerification(api, id);
  if (checklist.status !== 200) {
    throw new Error(`vérification ${checklist.status} ${JSON.stringify(checklist.json)}`);
  }
  return patchStatus(id, "VALIDEE");
}

async function requestPayment(patchStatus, id) {
  return patchStatus(id, "PAIEMENT_EN_ATTENTE");
}

async function confirmAgentPaid(api, order, headers = {}) {
  const started = await api(
    "POST",
    `/materials/orders/${order.id}/payments`,
    {
      channel: "AGENT_WHATSAPP",
      accessToken: order.accessToken,
    },
    headers,
  );
  if (started.status !== 200) {
    throw new Error(
      `paiement agent ${started.status} ${JSON.stringify(started.json)}`,
    );
  }
  const confirmed = await api(
    "POST",
    `/materials/orders/${order.id}/payments/confirm-agent`,
    { changedBy: "admin" },
  );
  if (confirmed.status !== 200) {
    throw new Error(
      `confirmation agent ${confirmed.status} ${JSON.stringify(confirmed.json)}`,
    );
  }
  return confirmed;
}

module.exports = {
  completeVerification,
  validateAfterVerification,
  requestPayment,
  confirmAgentPaid,
};
