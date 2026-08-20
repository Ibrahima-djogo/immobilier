/**
 * Dossiers de vérification DEMO — jeux de données complets et additifs.
 *
 * Objectif : permettre de tester réellement le contrôle admin des demandes de
 * rôle (affichage, revue pièce par pièce, A_CORRIGER, configuration, décision)
 * sans jamais toucher aux autres données de db.json.
 *
 * Toutes les valeurs sont manifestement fictives (références DEMO-*) et les
 * fichiers joints sont des maquettes marquées « DOCUMENT DEMO / NON VALABLE ».
 */

const fs = require("fs");
const path = require("path");

const accountScopes = require("./account-scopes");
const demoAssets = require("./demo-assets");
const {
  computeCompleteness,
  docsForRequest,
} = require("./role-verification");

const UPLOAD_DIR = path.join(__dirname, "uploads", "verification");
const DEMO_ISSUER = "Autorité fictive — DEMO";
const DEMO_NOTE = "MAQUETTE DE TEST - VERIFICATION INTERNE DEMEURE GUINEE";

/** Horodatages figés : les dossiers restent identiques d’un boot à l’autre. */
const AT = {
  ownerCreated: "2026-08-09T08:40:00.000Z",
  ownerSubmitted: "2026-08-10T09:15:00.000Z",
  correctionCreated: "2026-08-04T10:05:00.000Z",
  correctionSubmitted: "2026-08-05T11:20:00.000Z",
  correctionReviewed: "2026-08-07T15:45:00.000Z",
  agencyCreated: "2026-08-08T07:30:00.000Z",
  agencySubmitted: "2026-08-11T14:05:00.000Z",
  promoterCreated: "2026-08-06T09:00:00.000Z",
  promoterSubmitted: "2026-08-12T10:35:00.000Z",
  approvedOwnerSubmitted: "2026-06-02T09:10:00.000Z",
  approvedOwnerReviewed: "2026-06-03T16:20:00.000Z",
  approvedAgencySubmitted: "2026-05-14T08:25:00.000Z",
  approvedAgencyReviewed: "2026-05-16T17:40:00.000Z",
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function fileLines(pairs) {
  return pairs.filter(Boolean).map(([key, value]) => `${key}: ${value}`);
}

/* ------------------------------------------------------------------ */
/* Pièces jointes de démonstration                                     */
/* ------------------------------------------------------------------ */

function identityDocs({
  keyPrefix,
  holderName,
  reference,
  issuedAt,
  expiresAt,
  labelPrefix = "Pièce d’identité",
  rectoStatus = "EN_ATTENTE",
  versoStatus = "EN_ATTENTE",
  rectoRejection = null,
  rectoNote = DEMO_NOTE,
  rectoTone = "accent",
}) {
  const commonLines = fileLines([
    ["NOM", holderName],
    ["NUMERO", reference],
    ["DELIVRE LE", issuedAt],
    ["EXPIRE LE", expiresAt],
    ["EMETTEUR", "AUTORITE FICTIVE DEMO"],
  ]);
  return [
    {
      idSuffix: "cni-recto",
      documentType: "CNI_RECTO",
      label: `${labelPrefix} — recto`,
      side: "RECTO",
      reference,
      issuer: DEMO_ISSUER,
      issuedAt,
      expiresAt,
      holderName,
      verificationStatus: rectoStatus,
      rejectionReason: rectoRejection,
      fileName: `demo-${keyPrefix}-cni-recto.png`,
      file: {
        title: "CARTE D IDENTITE DEMO - RECTO",
        subtitle: `Reference ${reference}`,
        lines: commonLines,
        tone: rectoTone,
        note: rectoNote,
      },
    },
    {
      idSuffix: "cni-verso",
      documentType: "CNI_VERSO",
      label: `${labelPrefix} — verso`,
      side: "VERSO",
      reference,
      issuer: DEMO_ISSUER,
      issuedAt,
      expiresAt,
      holderName,
      verificationStatus: versoStatus,
      fileName: `demo-${keyPrefix}-cni-verso.png`,
      file: {
        title: "CARTE D IDENTITE DEMO - VERSO",
        subtitle: `Reference ${reference}`,
        lines: commonLines,
        note: DEMO_NOTE,
      },
    },
  ];
}

function selfieDoc({ keyPrefix, holderName, status = "EN_ATTENTE" }) {
  return {
    idSuffix: "selfie",
    documentType: "SELFIE_VERIFICATION",
    label: "Photo de vérification",
    holderName,
    verificationStatus: status,
    fileName: `demo-${keyPrefix}-selfie.png`,
    file: {
      title: "PHOTO DE VERIFICATION DEMO",
      subtitle: "Silhouette generique - aucune personne reelle",
      lines: [
        `TITULAIRE DECLARE: ${holderName}`,
        "USAGE: CONTROLE INTERNE DEMEURE GUINEE",
        "IMAGE PLACEHOLDER SANS VISAGE",
      ],
      note: DEMO_NOTE,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Définition des scénarios                                            */
/* ------------------------------------------------------------------ */

function buildScenarios() {
  const scenarios = [];

  /* C — Propriétaire, dossier complet EN_ATTENTE */
  const ownerName = "Mamadou Alpha Diallo";
  scenarios.push({
    key: "OWNER_PENDING",
    user: {
      id: "user-demo-pending",
      email: "pending.owner@demo.demeureguinee.com",
      firstName: "Mamadou Alpha",
      lastName: "Diallo",
      phone: "+224 600 00 01 01",
      role: "USER",
      forceRole: false,
    },
    request: {
      id: "rr-demo-pending",
      reference: "ROLE-DEMO-OWNER-001",
      requestedRole: "PROPRIETAIRE",
      activityType: null,
      status: "EN_ATTENTE",
      risk: "FAIBLE",
      createdAt: AT.ownerCreated,
      submittedAt: AT.ownerSubmitted,
      personalInformation: {
        firstName: "Mamadou Alpha",
        lastName: "Diallo",
        birthDate: "1990-04-12",
        birthPlace: "Conakry",
        nationality: "Guinéenne",
        email: "pending.owner@demo.demeureguinee.com",
        phone: "+224 600 00 01 01",
        whatsapp: "+224 600 00 01 01",
        secondaryPhone: "+224 600 00 01 02",
        profession: "Commerçant",
        idType: "CNI",
        idNumber: "DEMO-CNI-OWNER-001",
        idIssuedAt: "2024-01-15",
        idExpiresAt: "2034-01-15",
        idIssuer: DEMO_ISSUER,
        city: "Conakry",
        commune: "Ratoma",
        district: "Kipé",
        landmark: "Près du carrefour principal — DEMO",
        address: "Kipé, Ratoma, Conakry — Adresse fictive Demo",
        additionalInfo:
          "Je souhaite proposer un terrain familial actuellement disponible à la vente.",
      },
      declaredPropertyIntents: [
        { propertyType: "TERRAIN", operations: ["VENTE"], quantityRange: "ONE" },
      ],
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      sectionReviews: {
        identity: { status: "EN_ATTENTE" },
        documents: { status: "EN_ATTENTE" },
        declaredProfile: { status: "EN_ATTENTE" },
        company: { status: "EN_ATTENTE" },
      },
      history: [
        { at: AT.ownerCreated, label: "Dossier Demo initialisé" },
        { at: AT.ownerSubmitted, label: "Demande soumise par le demandeur" },
      ],
    },
    documents: [
      ...identityDocs({
        keyPrefix: "owner",
        holderName: ownerName,
        reference: "DEMO-CNI-OWNER-001",
        issuedAt: "2024-01-15",
        expiresAt: "2034-01-15",
      }),
      selfieDoc({ keyPrefix: "owner", holderName: ownerName }),
      {
        idSuffix: "domicile",
        documentType: "JUSTIFICATIF_DOMICILE",
        label: "Justificatif de domicile",
        required: false,
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-owner-justificatif-domicile.pdf",
        file: {
          title: "Justificatif de domicile DEMO",
          subtitle: "Piece facultative de demonstration",
          lines: [
            `Titulaire: ${ownerName}`,
            "Adresse: Kipe, Ratoma, Conakry - Adresse fictive Demo",
            "Periode: Juillet 2026",
            "Emetteur: Service fictif DEMO",
          ],
        },
      },
    ],
  });

  /* D — Propriétaire, dossier A_CORRIGER (recto flou) */
  const correctionName = "Lamine Camara";
  scenarios.push({
    key: "OWNER_CORRECTION",
    user: {
      id: "user-demo-correction",
      email: "correction@demo.demeureguinee.com",
      firstName: "Lamine",
      lastName: "Camara",
      phone: "+224 600 00 01 03",
      role: "USER",
      forceRole: false,
    },
    request: {
      id: "rr-demo-correction",
      reference: "ROLE-DEMO-OWNER-CORRECTION-001",
      requestedRole: "PROPRIETAIRE",
      activityType: null,
      status: "A_CORRIGER",
      risk: "MOYEN",
      createdAt: AT.correctionCreated,
      submittedAt: AT.correctionSubmitted,
      reviewedAt: AT.correctionReviewed,
      correctionMessage:
        "Veuillez remplacer uniquement le recto de votre pièce d’identité.",
      correctionTarget: "documents",
      personalInformation: {
        firstName: "Lamine",
        lastName: "Camara",
        birthDate: "1986-11-30",
        birthPlace: "Kindia",
        nationality: "Guinéenne",
        email: "correction@demo.demeureguinee.com",
        phone: "+224 600 00 01 03",
        whatsapp: "+224 600 00 01 03",
        profession: "Enseignant",
        idType: "CNI",
        idNumber: "DEMO-CNI-OWNER-002",
        idIssuedAt: "2023-06-08",
        idExpiresAt: "2033-06-08",
        idIssuer: DEMO_ISSUER,
        city: "Conakry",
        commune: "Matoto",
        district: "Dabompa",
        landmark: "Face à l’école primaire — DEMO",
        address: "Dabompa, Matoto, Conakry — Adresse fictive Demo",
        additionalInfo:
          "Je gère une maison familiale à louer et un terrain à vendre.",
      },
      declaredPropertyIntents: [
        { propertyType: "TERRAIN", operations: ["VENTE"], quantityRange: "ONE" },
        { propertyType: "MAISON", operations: ["LOCATION"], quantityRange: "ONE" },
      ],
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      sectionReviews: {
        identity: {
          status: "VERIFIE",
          message: "Identité cohérente avec la pièce transmise.",
          updatedAt: AT.correctionReviewed,
        },
        documents: {
          status: "A_CORRIGER",
          message: "1 pièce à remplacer : recto de la CNI (image floue).",
          updatedAt: AT.correctionReviewed,
        },
        declaredProfile: { status: "VERIFIE", updatedAt: AT.correctionReviewed },
        company: { status: "EN_ATTENTE" },
      },
      history: [
        { at: AT.correctionCreated, label: "Dossier Demo initialisé" },
        { at: AT.correctionSubmitted, label: "Demande soumise par le demandeur" },
        { at: AT.correctionReviewed, label: "Identité → VERIFIE" },
        {
          at: AT.correctionReviewed,
          label: "Document Pièce d’identité — recto → A_CORRIGER",
          reason:
            "Le fichier transmis est trop flou. Merci d’envoyer une image plus nette du recto.",
        },
        {
          at: AT.correctionReviewed,
          label: "Corrections demandées",
          reason:
            "Veuillez remplacer uniquement le recto de votre pièce d’identité.",
        },
      ],
    },
    documents: [
      ...identityDocs({
        keyPrefix: "correction",
        holderName: correctionName,
        reference: "DEMO-CNI-OWNER-002",
        issuedAt: "2023-06-08",
        expiresAt: "2033-06-08",
        rectoStatus: "A_CORRIGER",
        versoStatus: "VALIDE",
        rectoRejection:
          "Le fichier transmis est trop flou. Merci d’envoyer une image plus nette du recto.",
        rectoTone: "warn",
        rectoNote: "FICHIER VOLONTAIREMENT NON EXPLOITABLE POUR LE TEST",
      }),
      selfieDoc({
        keyPrefix: "correction",
        holderName: correctionName,
        status: "VALIDE",
      }),
      {
        idSuffix: "domicile",
        documentType: "JUSTIFICATIF_DOMICILE",
        label: "Justificatif de domicile",
        required: false,
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-correction-justificatif-domicile.pdf",
        file: {
          title: "Justificatif de domicile DEMO",
          subtitle: "Piece facultative de demonstration",
          lines: [
            `Titulaire: ${correctionName}`,
            "Adresse: Dabompa, Matoto, Conakry - Adresse fictive Demo",
            "Periode: Juin 2026",
          ],
        },
      },
    ],
  });

  /* E — Agence immobilière, dossier complet EN_ATTENTE */
  const agencyRepName = "Fatou Mariama Camara";
  scenarios.push({
    key: "AGENCY_PENDING",
    user: {
      id: "user-demo-agency-pending",
      email: "pending.agency@demo.demeureguinee.com",
      firstName: "Fatou Mariama",
      lastName: "Camara",
      phone: "+224 600 00 02 02",
      role: "USER",
      forceRole: false,
    },
    request: {
      id: "rr-demo-agency-pending",
      reference: "ROLE-DEMO-AGENCY-001",
      requestedRole: "AGENCE",
      activityType: "AGENCE_IMMOBILIERE",
      status: "EN_ATTENTE",
      risk: "FAIBLE",
      createdAt: AT.agencyCreated,
      submittedAt: AT.agencySubmitted,
      personalInformation: {
        firstName: "Fatou Mariama",
        lastName: "Camara",
        birthDate: "1988-07-21",
        birthPlace: "Conakry",
        nationality: "Guinéenne",
        email: "representant.demo@demeureguinee.test",
        phone: "+224 600 00 02 02",
        whatsapp: "+224 600 00 02 02",
        profession: "Gérante",
        idType: "CNI",
        idNumber: "DEMO-CNI-REP-001",
        idIssuedAt: "2022-09-12",
        idExpiresAt: "2032-09-12",
        idIssuer: DEMO_ISSUER,
        city: "Conakry",
        commune: "Kaloum",
        district: "Almamya",
        address: "Kaloum, Conakry — Adresse fictive Demo",
        additionalInfo:
          "Agence fictive utilisée exclusivement pour tester le processus de vérification.",
      },
      companyInformation: {
        legalName: "Demeure Test Immobilier SARL — DEMO",
        tradeName: "DT Immobilier Demo",
        legalForm: "SARL",
        rccm: "DEMO-RCCM-GN-001",
        nif: "DEMO-NIF-001",
        creationDate: "2021-05-10",
        professionalPhone: "+224 600 00 02 01",
        professionalEmail: "pending.agency@demo.demeureguinee.com",
        address: "Kaloum, Conakry — Adresse fictive Demo",
        city: "Conakry",
        commune: "Kaloum",
        website: null,
        experienceStartYear: "2021",
        experienceYears: "5",
        specialties: "Vente, Location, Terrain, Résidentiel",
        experienceSummary:
          "Agence fictive utilisée exclusivement pour tester le processus de vérification Demeure Guinée.",
      },
      representative: {
        firstName: "Fatou Mariama",
        lastName: "Camara",
        function: "Gérante",
        birthDate: "1988-07-21",
        nationality: "Guinéenne",
        phone: "+224 600 00 02 02",
        email: "representant.demo@demeureguinee.test",
        idType: "CNI",
        idNumber: "DEMO-CNI-REP-001",
      },
      declaredPropertyIntents: [
        {
          propertyType: "TERRAIN",
          operations: ["VENTE", "LOCATION"],
          quantityRange: "MORE_THAN_FIVE",
        },
        {
          propertyType: "MAISON",
          operations: ["VENTE", "LOCATION"],
          quantityRange: "TWO_TO_FIVE",
        },
        {
          propertyType: "VILLA",
          operations: ["VENTE"],
          quantityRange: "TWO_TO_FIVE",
        },
        {
          propertyType: "APPARTEMENT",
          operations: ["LOCATION"],
          quantityRange: "MORE_THAN_FIVE",
        },
      ],
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      sectionReviews: {
        identity: { status: "EN_ATTENTE" },
        documents: { status: "EN_ATTENTE" },
        declaredProfile: { status: "EN_ATTENTE" },
        company: { status: "EN_ATTENTE" },
      },
      history: [
        { at: AT.agencyCreated, label: "Dossier Demo initialisé" },
        { at: AT.agencySubmitted, label: "Demande soumise par le demandeur" },
      ],
    },
    documents: [
      ...identityDocs({
        keyPrefix: "agency-rep",
        holderName: agencyRepName,
        reference: "DEMO-CNI-REP-001",
        issuedAt: "2022-09-12",
        expiresAt: "2032-09-12",
        labelPrefix: "Pièce d’identité du représentant",
      }),
      selfieDoc({ keyPrefix: "agency-rep", holderName: agencyRepName }),
      {
        idSuffix: "rccm",
        documentType: "RCCM",
        label: "Extrait RCCM",
        reference: "DEMO-RCCM-GN-001",
        issuer: DEMO_ISSUER,
        issuedAt: "2021-05-10",
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-agency-rccm.pdf",
        file: {
          title: "Extrait RCCM DEMO",
          subtitle: "Reference DEMO-RCCM-GN-001",
          lines: [
            "Raison sociale: Demeure Test Immobilier SARL - DEMO",
            "Nom commercial: DT Immobilier Demo",
            "Forme juridique: SARL",
            "RCCM: DEMO-RCCM-GN-001",
            "NIF: DEMO-NIF-001",
            "Date de creation: 2021-05-10",
            "Siege: Kaloum, Conakry - Adresse fictive Demo",
          ],
        },
      },
      {
        idSuffix: "statuts",
        documentType: "STATUTS_SOCIETE",
        label: "Statuts de la société",
        reference: "DEMO-STATUTS-001",
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-agency-statuts.pdf",
        file: {
          title: "Statuts de societe DEMO",
          subtitle: "Document constitutif fictif",
          lines: [
            "Societe: Demeure Test Immobilier SARL - DEMO",
            "Forme: SARL",
            "Capital declare: 10 000 000 GNF (fictif)",
            "Gerante: Fatou Mariama Camara",
            "Objet: Transactions immobilieres (demonstration)",
          ],
        },
      },
      {
        idSuffix: "siege",
        documentType: "JUSTIFICATIF_SIEGE",
        label: "Justificatif du siège",
        required: false,
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-agency-justificatif-siege.pdf",
        file: {
          title: "Justificatif de siege DEMO",
          subtitle: "Piece facultative",
          lines: [
            "Occupant: Demeure Test Immobilier SARL - DEMO",
            "Adresse: Kaloum, Conakry - Adresse fictive Demo",
            "Periode: 2026",
          ],
        },
      },
      {
        idSuffix: "experience",
        documentType: "EXPERIENCE_PROOF",
        label: "Justificatif d’expérience",
        required: false,
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-agency-experience.pdf",
        file: {
          title: "Justificatif d experience DEMO",
          subtitle: "Piece facultative recommandee",
          lines: [
            "Structure: Demeure Test Immobilier SARL - DEMO",
            "Debut d activite: 2021",
            "Annees d experience: 5",
            "Specialites: Vente, Location, Terrain, Residentiel",
          ],
        },
      },
    ],
  });

  /* H — Promoteur immobilier : documents conditionnels */
  const promoterRepName = "Ibrahima Sory Bah";
  scenarios.push({
    key: "PROMOTER_PENDING",
    user: {
      id: "user-demo-promoter-pending",
      email: "promoter.pending@demo.demeureguinee.com",
      firstName: "Ibrahima Sory",
      lastName: "Bah",
      phone: "+224 600 00 03 02",
      role: "USER",
      forceRole: false,
    },
    request: {
      id: "rr-demo-promoter-pending",
      reference: "ROLE-DEMO-PROMOTEUR-001",
      requestedRole: "AGENCE",
      activityType: "PROMOTEUR_IMMOBILIER",
      status: "EN_ATTENTE",
      risk: "MOYEN",
      createdAt: AT.promoterCreated,
      submittedAt: AT.promoterSubmitted,
      personalInformation: {
        firstName: "Ibrahima Sory",
        lastName: "Bah",
        birthDate: "1982-02-17",
        birthPlace: "Labé",
        nationality: "Guinéenne",
        email: "representant.promoteur.demo@demeureguinee.test",
        phone: "+224 600 00 03 02",
        whatsapp: "+224 600 00 03 02",
        profession: "Directeur général",
        idType: "CNI",
        idNumber: "DEMO-CNI-REP-002",
        idIssuedAt: "2021-03-04",
        idExpiresAt: "2031-03-04",
        idIssuer: DEMO_ISSUER,
        city: "Conakry",
        commune: "Dixinn",
        district: "Belle-Vue",
        address: "Dixinn, Conakry — Adresse fictive Demo",
        additionalInfo:
          "Dossier Demo destiné à tester les pièces conditionnelles promoteur.",
      },
      companyInformation: {
        legalName: "Demeure Test Promotion SA — DEMO",
        tradeName: "DT Promotion Demo",
        legalForm: "SA",
        rccm: "DEMO-RCCM-GN-002",
        nif: "DEMO-NIF-002",
        creationDate: "2019-03-04",
        professionalPhone: "+224 600 00 03 01",
        professionalEmail: "promoter.pending@demo.demeureguinee.com",
        address: "Dixinn, Conakry — Adresse fictive Demo",
        city: "Conakry",
        commune: "Dixinn",
        website: null,
        experienceStartYear: "2019",
        experienceYears: "7",
        specialties: "Promotion immobilière, Terrains, Résidentiel",
        experienceSummary:
          "Promoteur fictif utilisé exclusivement pour tester les pièces conditionnelles.",
      },
      representative: {
        firstName: "Ibrahima Sory",
        lastName: "Bah",
        function: "Directeur général",
        birthDate: "1982-02-17",
        nationality: "Guinéenne",
        phone: "+224 600 00 03 02",
        email: "representant.promoteur.demo@demeureguinee.test",
        idType: "CNI",
        idNumber: "DEMO-CNI-REP-002",
      },
      declaredPropertyIntents: [
        {
          propertyType: "TERRAIN",
          operations: ["VENTE"],
          quantityRange: "MORE_THAN_FIVE",
        },
        {
          propertyType: "APPARTEMENT",
          operations: ["VENTE"],
          quantityRange: "MORE_THAN_FIVE",
        },
        {
          propertyType: "VILLA",
          operations: ["VENTE"],
          quantityRange: "TWO_TO_FIVE",
        },
      ],
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      sectionReviews: {
        identity: { status: "EN_ATTENTE" },
        documents: { status: "EN_ATTENTE" },
        declaredProfile: { status: "EN_ATTENTE" },
        company: { status: "EN_ATTENTE" },
      },
      history: [
        { at: AT.promoterCreated, label: "Dossier Demo initialisé" },
        { at: AT.promoterSubmitted, label: "Demande soumise par le demandeur" },
      ],
    },
    documents: [
      ...identityDocs({
        keyPrefix: "promoteur-rep",
        holderName: promoterRepName,
        reference: "DEMO-CNI-REP-002",
        issuedAt: "2021-03-04",
        expiresAt: "2031-03-04",
        labelPrefix: "Pièce d’identité du représentant",
      }),
      selfieDoc({ keyPrefix: "promoteur-rep", holderName: promoterRepName }),
      {
        idSuffix: "rccm",
        documentType: "RCCM",
        label: "Extrait RCCM",
        reference: "DEMO-RCCM-GN-002",
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-promoteur-rccm.pdf",
        file: {
          title: "Extrait RCCM DEMO",
          subtitle: "Reference DEMO-RCCM-GN-002",
          lines: [
            "Raison sociale: Demeure Test Promotion SA - DEMO",
            "Forme juridique: SA",
            "RCCM: DEMO-RCCM-GN-002",
            "NIF: DEMO-NIF-002",
            "Date de creation: 2019-03-04",
          ],
        },
      },
      {
        idSuffix: "statuts",
        documentType: "STATUTS_SOCIETE",
        label: "Statuts de la société",
        reference: "DEMO-STATUTS-002",
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-promoteur-statuts.pdf",
        file: {
          title: "Statuts de societe DEMO",
          subtitle: "Document constitutif fictif",
          lines: [
            "Societe: Demeure Test Promotion SA - DEMO",
            "Forme: SA",
            "Objet: Promotion immobiliere (demonstration)",
            "Directeur general: Ibrahima Sory Bah",
          ],
        },
      },
      {
        idSuffix: "agrement",
        documentType: "AGREMENT_PROMOTEUR",
        label: "Agrément promoteur",
        reference: "DEMO-AGREMENT-001",
        issuer: DEMO_ISSUER,
        issuedAt: "2022-01-20",
        expiresAt: "2027-01-20",
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-promoteur-agrement.pdf",
        file: {
          title: "Agrement promoteur DEMO",
          subtitle: "Piece conditionnelle - activite PROMOTEUR_IMMOBILIER",
          lines: [
            "Beneficiaire: Demeure Test Promotion SA - DEMO",
            "Reference: DEMO-AGREMENT-001",
            "Valide du: 2022-01-20 au 2027-01-20",
            "Emetteur: Autorite fictive DEMO",
          ],
        },
      },
      {
        idSuffix: "qualifications",
        documentType: "QUALIFICATIONS_REPRESENTANT",
        label: "Qualifications du représentant",
        reference: "DEMO-QUALIF-001",
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-promoteur-qualifications.pdf",
        file: {
          title: "Qualifications du representant DEMO",
          subtitle: "Piece conditionnelle - activite PROMOTEUR_IMMOBILIER",
          lines: [
            "Representant: Ibrahima Sory Bah",
            "Formation declaree: Gestion immobiliere (fictive)",
            "Reference: DEMO-QUALIF-001",
          ],
        },
      },
      {
        idSuffix: "garantie",
        documentType: "GARANTIE_FINANCIERE",
        label: "Garantie financière",
        reference: "DEMO-GARANTIE-001",
        required: false,
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-promoteur-garantie-financiere.pdf",
        file: {
          title: "Garantie financiere DEMO",
          subtitle: "Piece conditionnelle complementaire",
          lines: [
            "Souscripteur: Demeure Test Promotion SA - DEMO",
            "Montant declare: 500 000 000 GNF (fictif)",
            "Reference: DEMO-GARANTIE-001",
          ],
        },
      },
      {
        idSuffix: "assurance",
        documentType: "ASSURANCE_RCP",
        label: "Assurance RC professionnelle",
        reference: "DEMO-ASSURANCE-001",
        required: false,
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-promoteur-assurance-rcp.pdf",
        file: {
          title: "Assurance RC professionnelle DEMO",
          subtitle: "Piece conditionnelle complementaire",
          lines: [
            "Assure: Demeure Test Promotion SA - DEMO",
            "Police: DEMO-ASSURANCE-001",
            "Periode: 2026",
          ],
        },
      },
      {
        idSuffix: "casier",
        documentType: "CASIER_JUDICIAIRE_REP",
        label: "Casier judiciaire (représentant)",
        reference: "DEMO-CASIER-001",
        required: false,
        verificationStatus: "EN_ATTENTE",
        fileName: "demo-promoteur-casier-judiciaire.pdf",
        file: {
          title: "Extrait de casier DEMO",
          subtitle: "Piece conditionnelle complementaire",
          lines: [
            "Concerne: Ibrahima Sory Bah",
            "Reference: DEMO-CASIER-001",
            "Document fictif sans valeur",
          ],
        },
      },
    ],
  });

  /* F — Propriétaire déjà approuvé : historique + configuration */
  const approvedOwnerName = "Sékou Touré";
  scenarios.push({
    key: "OWNER_APPROVED",
    user: {
      id: "user-demo-owner",
      email: "owner@demo.demeureguinee.com",
      role: "PROPRIETAIRE",
      forceRole: true,
    },
    request: {
      id: "rr-demo-owner-approved",
      reference: "ROLE-DEMO-OWNER-APPROVED-001",
      requestedRole: "PROPRIETAIRE",
      activityType: null,
      status: "APPROUVEE",
      risk: "FAIBLE",
      createdAt: AT.approvedOwnerSubmitted,
      submittedAt: AT.approvedOwnerSubmitted,
      reviewedAt: AT.approvedOwnerReviewed,
      reviewedByAdminId: "adm-1",
      personalInformation: {
        firstName: "Sékou",
        lastName: "Touré",
        birthDate: "1979-05-03",
        birthPlace: "Conakry",
        nationality: "Guinéenne",
        email: "owner@demo.demeureguinee.com",
        phone: "+224 600 00 05 05",
        whatsapp: "+224 600 00 05 05",
        profession: "Propriétaire bailleur",
        idType: "CNI",
        idNumber: "DEMO-CNI-OWNER-APPROVED-001",
        idIssuedAt: "2020-02-11",
        idExpiresAt: "2030-02-11",
        idIssuer: DEMO_ISSUER,
        city: "Conakry",
        commune: "Ratoma",
        district: "Nongo",
        address: "Nongo, Ratoma, Conakry — Adresse fictive Demo",
      },
      declaredPropertyIntents: [
        {
          propertyType: "TERRAIN",
          operations: ["VENTE", "LOCATION"],
          quantityRange: "TWO_TO_FIVE",
        },
      ],
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      sectionReviews: {
        identity: {
          status: "VERIFIE",
          message: "Identité vérifiée (dossier Demo historique).",
          updatedAt: AT.approvedOwnerReviewed,
          updatedByAdminId: "adm-1",
        },
        documents: {
          status: "VERIFIE",
          message: "Toutes les pièces obligatoires validées.",
          updatedAt: AT.approvedOwnerReviewed,
          updatedByAdminId: "adm-1",
        },
        declaredProfile: {
          status: "VERIFIE",
          updatedAt: AT.approvedOwnerReviewed,
        },
        company: { status: "EN_ATTENTE" },
      },
      configuration: {
        role: "PROPRIETAIRE",
        profileType: "PARTICULIER",
        preset: "PROPRIETAIRE_PARTICULIER",
        activityType: null,
        allowedPropertyScopes: [
          { propertyType: "TERRAIN", operations: ["VENTE", "LOCATION"] },
        ],
        reason: "Configuration Demo historique",
      },
      history: [
        { at: AT.approvedOwnerSubmitted, label: "Demande soumise par le demandeur" },
        { at: AT.approvedOwnerReviewed, label: "Identité → VERIFIE" },
        { at: AT.approvedOwnerReviewed, label: "Documents obligatoires → VALIDE" },
        {
          at: AT.approvedOwnerReviewed,
          label: "Demande approuvée et compte configuré",
          reason: "Terrain — Vente + Location",
        },
      ],
    },
    documents: [
      ...identityDocs({
        keyPrefix: "owner-approved",
        holderName: approvedOwnerName,
        reference: "DEMO-CNI-OWNER-APPROVED-001",
        issuedAt: "2020-02-11",
        expiresAt: "2030-02-11",
        rectoStatus: "VALIDE",
        versoStatus: "VALIDE",
      }),
      selfieDoc({
        keyPrefix: "owner-approved",
        holderName: approvedOwnerName,
        status: "VALIDE",
      }),
    ],
  });

  /* G — Agence déjà approuvée : historique + configuration */
  const approvedAgencyRepName = "Fatoumata Bah";
  scenarios.push({
    key: "AGENCY_APPROVED",
    user: {
      id: "user-demo-agence",
      email: "agence@demo.demeureguinee.com",
      role: "AGENCE",
      forceRole: true,
    },
    agencyId: "ag-demo-1",
    request: {
      id: "rr-demo-agence-approved",
      reference: "ROLE-DEMO-AGENCY-APPROVED-001",
      requestedRole: "AGENCE",
      activityType: "AGENCE_IMMOBILIERE",
      status: "APPROUVEE",
      risk: "FAIBLE",
      createdAt: AT.approvedAgencySubmitted,
      submittedAt: AT.approvedAgencySubmitted,
      reviewedAt: AT.approvedAgencyReviewed,
      reviewedByAdminId: "adm-1",
      personalInformation: {
        firstName: "Fatoumata",
        lastName: "Bah",
        birthDate: "1985-12-02",
        birthPlace: "Conakry",
        nationality: "Guinéenne",
        email: "agence@demo.demeureguinee.com",
        phone: "+224 600 00 06 06",
        profession: "Directrice",
        idType: "CNI",
        idNumber: "DEMO-CNI-REP-003",
        idIssuedAt: "2019-08-19",
        idExpiresAt: "2029-08-19",
        idIssuer: DEMO_ISSUER,
        city: "Conakry",
        commune: "Ratoma",
        address: "Kipé, Ratoma, Conakry — Adresse fictive Demo",
      },
      companyInformation: {
        legalName: "Demeure Demo Agence SARL — DEMO",
        tradeName: "Demeure Demo Agence",
        legalForm: "SARL",
        rccm: "DEMO-RCCM-GN-003",
        nif: "DEMO-NIF-003",
        creationDate: "2018-04-06",
        professionalPhone: "+224 600 00 06 06",
        professionalEmail: "agence@demo.demeureguinee.com",
        address: "Kipé, Ratoma, Conakry — Adresse fictive Demo",
        city: "Conakry",
        commune: "Ratoma",
        experienceStartYear: "2018",
        experienceYears: "8",
        specialties: "Vente, Location, Gestion locative, Terrains",
        experienceSummary:
          "Agence Demo historique déjà vérifiée — sert de référence pour l’affichage d’un dossier approuvé.",
      },
      representative: {
        firstName: "Fatoumata",
        lastName: "Bah",
        function: "Directrice",
        nationality: "Guinéenne",
        phone: "+224 600 00 06 06",
        email: "agence@demo.demeureguinee.com",
        idType: "CNI",
        idNumber: "DEMO-CNI-REP-003",
      },
      declaredPropertyIntents: [
        {
          propertyType: "TERRAIN",
          operations: ["VENTE", "LOCATION"],
          quantityRange: "MORE_THAN_FIVE",
        },
        {
          propertyType: "MAISON",
          operations: ["VENTE", "LOCATION"],
          quantityRange: "MORE_THAN_FIVE",
        },
        {
          propertyType: "VILLA",
          operations: ["VENTE", "LOCATION"],
          quantityRange: "TWO_TO_FIVE",
        },
        {
          propertyType: "APPARTEMENT",
          operations: ["VENTE", "LOCATION"],
          quantityRange: "MORE_THAN_FIVE",
        },
      ],
      declarations: {
        accuracy: true,
        authorization: true,
        processing: true,
        privacy: true,
      },
      sectionReviews: {
        identity: {
          status: "VERIFIE",
          updatedAt: AT.approvedAgencyReviewed,
          updatedByAdminId: "adm-1",
        },
        documents: {
          status: "VERIFIE",
          updatedAt: AT.approvedAgencyReviewed,
          updatedByAdminId: "adm-1",
        },
        declaredProfile: {
          status: "VERIFIE",
          updatedAt: AT.approvedAgencyReviewed,
        },
        company: {
          status: "VERIFIE",
          message: "Entreprise vérifiée (dossier Demo historique).",
          updatedAt: AT.approvedAgencyReviewed,
        },
      },
      configuration: {
        role: "AGENCE",
        profileType: null,
        preset: "AGENCE_IMMOBILIERE",
        activityType: "AGENCE_IMMOBILIERE",
        allowedPropertyScopes: [
          { propertyType: "TERRAIN", operations: ["VENTE", "LOCATION"] },
          { propertyType: "MAISON", operations: ["VENTE", "LOCATION"] },
          { propertyType: "VILLA", operations: ["VENTE", "LOCATION"] },
          { propertyType: "APPARTEMENT", operations: ["VENTE", "LOCATION"] },
        ],
        reason: "Configuration Demo historique",
      },
      history: [
        { at: AT.approvedAgencySubmitted, label: "Demande soumise par le demandeur" },
        { at: AT.approvedAgencyReviewed, label: "Entreprise → VERIFIE" },
        { at: AT.approvedAgencyReviewed, label: "Documents obligatoires → VALIDE" },
        {
          at: AT.approvedAgencyReviewed,
          label: "Demande approuvée et compte configuré",
          reason: "Terrain, Maison, Villa, Appartement — Vente + Location",
        },
      ],
    },
    documents: [
      ...identityDocs({
        keyPrefix: "agence-approved-rep",
        holderName: approvedAgencyRepName,
        reference: "DEMO-CNI-REP-003",
        issuedAt: "2019-08-19",
        expiresAt: "2029-08-19",
        labelPrefix: "Pièce d’identité du représentant",
        rectoStatus: "VALIDE",
        versoStatus: "VALIDE",
      }),
      selfieDoc({
        keyPrefix: "agence-approved-rep",
        holderName: approvedAgencyRepName,
        status: "VALIDE",
      }),
      {
        idSuffix: "rccm",
        documentType: "RCCM",
        label: "Extrait RCCM",
        reference: "DEMO-RCCM-GN-003",
        verificationStatus: "VALIDE",
        fileName: "demo-agence-approved-rccm.pdf",
        file: {
          title: "Extrait RCCM DEMO",
          subtitle: "Reference DEMO-RCCM-GN-003",
          lines: [
            "Raison sociale: Demeure Demo Agence SARL - DEMO",
            "RCCM: DEMO-RCCM-GN-003",
            "NIF: DEMO-NIF-003",
            "Date de creation: 2018-04-06",
          ],
        },
      },
      {
        idSuffix: "statuts",
        documentType: "STATUTS_SOCIETE",
        label: "Statuts de la société",
        reference: "DEMO-STATUTS-003",
        verificationStatus: "VALIDE",
        fileName: "demo-agence-approved-statuts.pdf",
        file: {
          title: "Statuts de societe DEMO",
          subtitle: "Document constitutif fictif",
          lines: [
            "Societe: Demeure Demo Agence SARL - DEMO",
            "Forme: SARL",
            "Objet: Transactions immobilieres (demonstration)",
          ],
        },
      },
    ],
  });

  return scenarios;
}

/* ------------------------------------------------------------------ */
/* Application idempotente                                            */
/* ------------------------------------------------------------------ */

function ensureScenarioUser(db, scenario, { demoPassword, stamp, reset }) {
  const spec = scenario.user;
  let user =
    db.users.find((u) => u.id === spec.id) ||
    db.users.find((u) => normalizeEmail(u.email) === normalizeEmail(spec.email));
  let changed = false;

  if (!user) {
    user = {
      id: spec.id,
      firstName: spec.firstName || "",
      lastName: spec.lastName || "",
      name: [spec.firstName, spec.lastName].filter(Boolean).join(" ") || spec.id,
      email: spec.email,
      phone: spec.phone || null,
      role: spec.role,
      status: "ACTIF",
      roleVerified: spec.role !== "USER",
      documentsVerified: spec.role !== "USER",
      phoneVerified: true,
      verificationMethod: "DEMO",
      verificationStatus: spec.role !== "USER" ? "VERIFIE" : null,
      reportsCount: 0,
      password: demoPassword,
      demo: true,
      demoScenario: scenario.key,
      createdAt: stamp,
      updatedAt: stamp,
    };
    db.users.push(user);
    return { user, changed: true };
  }

  const patch = {
    id: spec.id,
    email: spec.email,
    password: demoPassword,
    verificationMethod: "DEMO",
    phoneVerified: true,
    demo: true,
    demoScenario: scenario.key,
  };
  if (reset) {
    patch.role = spec.role;
    patch.roleVerified = spec.role !== "USER";
    patch.documentsVerified = spec.role !== "USER";
    patch.verificationStatus = spec.role !== "USER" ? "VERIFIE" : null;
  }
  if (spec.firstName) patch.firstName = spec.firstName;
  if (spec.lastName) patch.lastName = spec.lastName;
  if (spec.firstName || spec.lastName) {
    patch.name = [spec.firstName, spec.lastName].filter(Boolean).join(" ");
  }
  if (spec.phone) patch.phone = spec.phone;
  if (spec.forceRole) patch.role = spec.role;
  if (user.status === "BLOQUE" || user.status === "DESACTIVE") {
    patch.status = "ACTIF";
  }

  for (const [key, value] of Object.entries(patch)) {
    if (user[key] !== value) {
      user[key] = value;
      changed = true;
    }
  }
  if (changed) user.updatedAt = stamp;
  return { user, changed };
}

function demoDocumentId(scenario, spec) {
  return `vdoc-demo-${scenario.key.toLowerCase().replace(/_/g, "-")}-${spec.idSuffix}`;
}

function ensureScenarioDocument(db, scenario, request, spec, { reset, stamp }) {
  const asset = demoAssets.ensureDemoFile(UPLOAD_DIR, spec.fileName, {
    title: spec.file?.title || spec.label,
    subtitle: spec.file?.subtitle,
    lines: spec.file?.lines,
    tone: spec.file?.tone,
    note: spec.file?.note,
  });
  const docId = demoDocumentId(scenario, spec);
  let doc = (db.verificationDocuments || []).find((d) => d.id === docId);
  let changed = false;

  const fileMeta = {
    fileName: asset.fileName,
    storedFileName: asset.fileName,
    fileUrl: `/verification-files/${asset.fileName}`,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
  };

  if (!doc) {
    doc = {
      id: docId,
      ownerType: "USER",
      ownerId: request.userId,
      userId: request.userId,
      roleRequestId: request.id,
      propertyId: null,
      documentType: spec.documentType,
      label: spec.label,
      side: spec.side || null,
      reference: spec.reference || null,
      issuer: spec.issuer || null,
      issuedAt: spec.issuedAt || null,
      expiresAt: spec.expiresAt || null,
      holderName: spec.holderName || null,
      required: spec.required !== false,
      ...fileMeta,
      verificationStatus: spec.verificationStatus || "EN_ATTENTE",
      rejectionReason: spec.rejectionReason || null,
      verifiedByAdminId:
        spec.verificationStatus === "VALIDE" ? "adm-1" : null,
      verifiedAt: spec.verificationStatus === "VALIDE" ? request.reviewedAt || stamp : null,
      demo: true,
      demoScenario: scenario.key,
      createdAt: request.createdAt || stamp,
      updatedAt: stamp,
    };
    db.verificationDocuments.push(doc);
    return { doc, changed: true };
  }

  // Réparation : relations et libellés. Le fichier n’est réattaché que s’il
  // manque réellement (une revue admin déjà faite reste intacte).
  const fileMissing =
    !doc.storedFileName ||
    !fs.existsSync(path.join(UPLOAD_DIR, String(doc.storedFileName)));
  const patch = {
    ownerType: "USER",
    ownerId: request.userId,
    userId: request.userId,
    roleRequestId: request.id,
    documentType: spec.documentType,
    label: spec.label,
    side: spec.side || null,
    reference: spec.reference || null,
    required: spec.required !== false,
    demo: true,
    demoScenario: scenario.key,
    ...(fileMissing ? fileMeta : {}),
  };
  if (reset) {
    Object.assign(patch, fileMeta);
    patch.verificationStatus = spec.verificationStatus || "EN_ATTENTE";
    patch.rejectionReason = spec.rejectionReason || null;
    patch.verifiedByAdminId =
      spec.verificationStatus === "VALIDE" ? "adm-1" : null;
  }
  for (const [key, value] of Object.entries(patch)) {
    if (doc[key] !== value) {
      doc[key] = value;
      changed = true;
    }
  }
  if (changed) doc.updatedAt = stamp;
  return { doc, changed };
}

function buildHistory(entries) {
  return (entries || []).map((entry, index) => ({
    id: `hist-demo-${index + 1}`,
    at: entry.at,
    label: entry.label,
    ...(entry.reason ? { reason: entry.reason } : {}),
  }));
}

function ensureScenarioRequest(db, scenario, user, { reset, stamp }) {
  const spec = scenario.request;
  let request = db.roleRequests.find((r) => r.id === spec.id);
  let changed = false;
  const intents = accountScopes.normalizeIntentList(spec.declaredPropertyIntents);
  const flat = accountScopes.flatFromIntents(intents);

  const structural = {
    reference: spec.reference,
    userId: user.id,
    requestedRole: spec.requestedRole,
    activityType: spec.activityType || null,
    verificationLevel: "STRUCTURED_V1",
    personalInformation: spec.personalInformation,
    companyInformation: spec.companyInformation || null,
    representative: spec.representative || null,
    declarations: spec.declarations,
    declaredPropertyIntents: intents,
    declaredPropertyTypes: flat.types,
    declaredOperations: flat.operations,
    declaredPortfolioSize: flat.portfolioSize,
    risk: spec.risk || "FAIBLE",
    submittedAt: spec.submittedAt || null,
    demo: true,
    demoScenario: scenario.key,
    demoLabel: "Dossier DEMO",
  };

  if (!request) {
    request = {
      id: spec.id,
      ...structural,
      status: spec.status,
      sectionReviews: normalizeSections(spec.sectionReviews),
      proposedConfiguration: null,
      savedConfiguration: null,
      appliedConfiguration: null,
      documentIds: [],
      correctionMessage: spec.correctionMessage || null,
      correctionTarget: spec.correctionTarget || null,
      completeness: 0,
      createdAt: spec.createdAt || stamp,
      updatedAt: stamp,
      reviewedAt: spec.reviewedAt || null,
      reviewedByAdminId: resolveAdminId(db, spec.reviewedByAdminId),
      history: buildHistory(spec.history),
    };
    db.roleRequests.unshift(request);
    changed = true;
  } else {
    // Première montée de version d’un ancien seed : le dossier est complété.
    // Ensuite, seules les valeurs manquantes sont réparées afin de préserver
    // les modifications faites pendant les tests (revues, resoumissions…).
    const upgraded = request.demoScenario === scenario.key;
    for (const [key, value] of Object.entries(structural)) {
      const current = request[key];
      const isEmpty =
        current === undefined ||
        current === null ||
        (Array.isArray(current) && current.length === 0) ||
        (typeof current === "object" &&
          !Array.isArray(current) &&
          Object.keys(current).length === 0);
      if (!upgraded || isEmpty) {
        if (JSON.stringify(current) !== JSON.stringify(value)) {
          request[key] = value;
          changed = true;
        }
      }
    }
    if (!upgraded) {
      request.status = spec.status;
      request.sectionReviews = normalizeSections(spec.sectionReviews);
      request.correctionMessage = spec.correctionMessage || null;
      request.correctionTarget = spec.correctionTarget || null;
      request.reviewedAt = spec.reviewedAt || null;
      request.reviewedByAdminId = resolveAdminId(db, spec.reviewedByAdminId);
      request.history = buildHistory(spec.history);
      changed = true;
    }
    if (!request.sectionReviews) {
      request.sectionReviews = normalizeSections(spec.sectionReviews);
      changed = true;
    }
    if (!Array.isArray(request.history) || request.history.length === 0) {
      request.history = buildHistory(spec.history);
      changed = true;
    }
    if (reset) {
      request.status = spec.status;
      request.sectionReviews = normalizeSections(spec.sectionReviews);
      request.correctionMessage = spec.correctionMessage || null;
      request.correctionTarget = spec.correctionTarget || null;
      request.appliedConfiguration = null;
      request.savedConfiguration = null;
      request.reviewedAt = spec.reviewedAt || null;
      request.reviewedByAdminId = resolveAdminId(db, spec.reviewedByAdminId);
      request.history = buildHistory(spec.history);
      changed = true;
    }
    if (changed) request.updatedAt = stamp;
  }

  return { request, changed };
}

function normalizeSections(sections) {
  const base = accountScopes.defaultSectionReviews();
  for (const [key, value] of Object.entries(sections || {})) {
    base[key] = {
      status: value.status || "EN_ATTENTE",
      message: value.message || null,
      updatedAt: value.updatedAt || null,
      updatedByAdminId: value.updatedByAdminId || null,
    };
  }
  return base;
}

function resolveAdminId(db, adminId) {
  if (!adminId) return null;
  return (db.admins || []).some((a) => a.id === adminId) ? adminId : null;
}

/** Applique la configuration Demo sans écraser une configuration admin réelle. */
function sameScopes(current, target) {
  return (
    JSON.stringify(accountScopes.normalizeScopeList(current || [])) ===
    JSON.stringify(accountScopes.normalizeScopeList(target || []))
  );
}

function applyDemoConfiguration(db, scenario, request) {
  const config = scenario.request.configuration;
  if (!config) return false;
  const admin = { id: resolveAdminId(db, scenario.request.reviewedByAdminId) };
  const flat = accountScopes.scopesToFlat(config.allowedPropertyScopes || []);
  let changed = false;

  if (!request.appliedConfiguration) {
    const stamp =
      request.reviewedAt || request.updatedAt || new Date().toISOString();
    request.appliedConfiguration = {
      ...config,
      allowedPropertyScopes: accountScopes.normalizeScopeList(
        config.allowedPropertyScopes || [],
      ),
      allowedPropertyTypes: flat.types,
      allowedOperations: flat.operations,
      capabilities: accountScopes.CAPABILITY_PRESETS[config.preset] || null,
      configuredAt: stamp,
      configuredByAdminId: admin.id,
      approvedAt: stamp,
      approvedByAdminId: admin.id,
    };
    // Un dossier approuvé a forcément eu une configuration enregistrée.
    request.savedConfiguration = { ...request.appliedConfiguration };
    changed = true;
  }

  const target = config.allowedPropertyScopes || [];

  if (config.role === "AGENCE") {
    const agency = (db.agencies || []).find((a) => a.id === scenario.agencyId);
    if (!agency) return changed;
    // Une configuration décidée par un admin n’est jamais écrasée.
    const configuredByAdmin =
      agency.configuredByAdminId &&
      agency.configuredByAdminId !== "system-migration";
    if (configuredByAdmin) return changed;
    if (
      sameScopes(agency.allowedPropertyScopes, target) &&
      agency.verificationStatus === "VERIFIE"
    ) {
      return changed;
    }
    accountScopes.applyAgencyConfiguration(db, agency, config, admin);
    return true;
  }

  const profile = accountScopes.findOwnerProfile(db, request.userId);
  const configuredByAdmin =
    profile?.configuredByAdminId &&
    profile.configuredByAdminId !== "system-migration";
  if (configuredByAdmin) return changed;
  if (
    profile &&
    sameScopes(profile.allowedPropertyScopes, target) &&
    profile.verificationStatus === "VERIFIE"
  ) {
    return changed;
  }
  accountScopes.upsertOwnerProfile(db, request.userId, config, admin);
  return true;
}

/**
 * Réarmement (`reset`) : efface uniquement les effets de bord produits par un
 * test d’approbation sur un scénario censé rester « à vérifier ».
 * Les comptes déjà approuvés par scénario (owner@demo / agence@demo) ne sont
 * pas concernés : leur configuration fait partie du jeu de données.
 */
function clearScenarioSideEffects(db, scenario) {
  if (scenario.user.role !== "USER") return false;
  const userId = scenario.user.id;
  let changed = false;

  const beforeProfiles = db.ownerProfiles.length;
  db.ownerProfiles = db.ownerProfiles.filter((p) => p.userId !== userId);
  if (db.ownerProfiles.length !== beforeProfiles) changed = true;

  const beforeAgencies = db.agencies.length;
  db.agencies = db.agencies.filter((a) => a.userId !== userId);
  if (db.agencies.length !== beforeAgencies) changed = true;

  const beforeHistory = db.accountScopeHistory.length;
  db.accountScopeHistory = db.accountScopeHistory.filter(
    (h) => h.userId !== userId,
  );
  if (db.accountScopeHistory.length !== beforeHistory) changed = true;

  const beforeScopeRequests = db.accountScopeRequests.length;
  db.accountScopeRequests = db.accountScopeRequests.filter(
    (r) => r.userId !== userId,
  );
  if (db.accountScopeRequests.length !== beforeScopeRequests) changed = true;

  return changed;
}

/**
 * Crée / répare les dossiers Demo de vérification.
 * Additif : aucune collection n’est vidée, aucun dossier hors Demo n’est touché.
 * @param {object} db
 * @param {{demoPassword?:string, reset?:boolean}} [options]
 */
function ensureDemoVerificationScenarios(db, options = {}) {
  const demoPassword = options.demoPassword || "Demo1234!";
  const reset = options.reset === true;
  const stamp = new Date().toISOString();

  db.users = Array.isArray(db.users) ? db.users : [];
  db.agencies = Array.isArray(db.agencies) ? db.agencies : [];
  db.roleRequests = Array.isArray(db.roleRequests) ? db.roleRequests : [];
  db.verificationDocuments = Array.isArray(db.verificationDocuments)
    ? db.verificationDocuments
    : [];
  accountScopes.ensureAccountScopeCollections(db);

  let changed = false;

  for (const scenario of buildScenarios()) {
    const userResult = ensureScenarioUser(db, scenario, {
      demoPassword,
      stamp,
      reset,
    });
    changed = userResult.changed || changed;
    if (reset) {
      changed = clearScenarioSideEffects(db, scenario) || changed;
    }

    const requestResult = ensureScenarioRequest(db, scenario, userResult.user, {
      reset,
      stamp,
    });
    const request = requestResult.request;
    changed = requestResult.changed || changed;

    const docIds = [];
    for (const docSpec of scenario.documents || []) {
      const demoDocId = demoDocumentId(scenario, docSpec);
      // Une pièce renvoyée par le demandeur pendant un test remplace la
      // maquette Demo : on ne la réinjecte pas en double.
      const replaced =
        !reset &&
        (request.documentIds || []).some((id) => {
          if (id === demoDocId) return false;
          const other = (db.verificationDocuments || []).find((d) => d.id === id);
          return other?.documentType === docSpec.documentType;
        });
      if (replaced) continue;
      const docResult = ensureScenarioDocument(db, scenario, request, docSpec, {
        reset,
        stamp,
      });
      changed = docResult.changed || changed;
      docIds.push(docResult.doc.id);
    }

    // Conserve d’éventuelles pièces ajoutées par un test manuel.
    const extraIds = (request.documentIds || []).filter(
      (id) =>
        !docIds.includes(id) &&
        (db.verificationDocuments || []).some((d) => d.id === id),
    );
    const nextIds = [...docIds, ...extraIds];
    if (JSON.stringify(request.documentIds) !== JSON.stringify(nextIds)) {
      request.documentIds = nextIds;
      changed = true;
    }

    if (request.status === "APPROUVEE") {
      changed = applyDemoConfiguration(db, scenario, request) || changed;
    }

    request.proposedConfiguration = accountScopes.proposeConfigFromRequest(request);
    const completeness = computeCompleteness(request, docsForRequest(db, request));
    if (request.completeness !== completeness) {
      request.completeness = completeness;
      changed = true;
    }
  }

  // Comptes volontairement vierges : aucune demande de rôle.
  const blankUserIds = new Set(["user-demo-1", "user-demo-2"]);
  const before = db.roleRequests.length;
  db.roleRequests = db.roleRequests.filter(
    (r) => !blankUserIds.has(String(r.userId || "")),
  );
  if (db.roleRequests.length !== before) changed = true;

  return changed;
}

module.exports = {
  ensureDemoVerificationScenarios,
  buildScenarios,
  UPLOAD_DIR,
};
