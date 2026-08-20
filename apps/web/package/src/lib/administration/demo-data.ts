export type UserStatus="ACTIF"|"EN_ATTENTE"|"SUSPENDU"|"BLOQUE"|"DESACTIVE";
export type RoleRequestStatus="SOUMISE"|"EN_EXAMEN"|"COMPLEMENT_REQUIS"|"APPROUVEE"|"REFUSEE";
export type AdStatus="BROUILLON"|"EN_ATTENTE"|"PUBLIEE"|"REJETEE"|"SUSPENDUE"|"EXPIREE"|"ARCHIVEE";
export type ReportStatus="NOUVEAU"|"EN_ANALYSE"|"ACTION_PRISE"|"REJETE"|"CLOTURE";

export const adminUsers=[
{id:"u1",name:"Mamadou Diallo",email:"mamadou@example.com",phone:"+224 622 10 20 30",role:"PROPRIETAIRE",status:"ACTIF" as UserStatus,createdAt:"12 juillet 2026",lastLogin:"Aujourd’hui à 09:42",properties:3,ads:4},
{id:"u2",name:"Habitat Conakry",email:"contact@habitat.example",phone:"+224 621 44 55 66",role:"AGENCE",status:"ACTIF" as UserStatus,createdAt:"08 juillet 2026",lastLogin:"Aujourd’hui à 08:30",properties:18,ads:21},
{id:"u3",name:"Aïssatou Camara",email:"aissatou@example.com",phone:"+224 620 11 00 44",role:"UTILISATEUR",status:"EN_ATTENTE" as UserStatus,createdAt:"31 juillet 2026",lastLogin:"Jamais",properties:0,ads:0},
{id:"u4",name:"Ibrahima Bah",email:"ibrahima@example.com",phone:"+224 625 77 88 99",role:"PROPRIETAIRE",status:"SUSPENDU" as UserStatus,createdAt:"19 juin 2026",lastLogin:"29 juillet 2026",properties:2,ads:1},
{id:"u5",name:"Fatoumata Sylla",email:"fatoumata@example.com",phone:"+224 623 11 22 90",role:"UTILISATEUR",status:"BLOQUE" as UserStatus,createdAt:"02 juin 2026",lastLogin:"20 juillet 2026",properties:0,ads:0}
];

export const roleRequests=[
{id:"rr1",reference:"ROLE-2026-00081",name:"Aïssatou Camara",email:"aissatou@example.com",requestedRole:"PROPRIETAIRE",status:"SOUMISE" as RoleRequestStatus,submittedAt:"Aujourd’hui à 10:10",documents:3,risk:"FAIBLE"},
{id:"rr2",reference:"ROLE-2026-00079",name:"Immo Plus Guinée",email:"contact@immoplus.example",requestedRole:"AGENCE",status:"EN_EXAMEN" as RoleRequestStatus,submittedAt:"Hier à 15:40",documents:5,risk:"MOYEN"},
{id:"rr3",reference:"ROLE-2026-00074",name:"Abdoulaye Sow",email:"sow@example.com",requestedRole:"PROPRIETAIRE",status:"COMPLEMENT_REQUIS" as RoleRequestStatus,submittedAt:"30 juillet 2026",documents:2,risk:"MOYEN"},
{id:"rr4",reference:"ROLE-2026-00069",name:"Conakry Habitat",email:"info@conakryhabitat.example",requestedRole:"AGENCE",status:"APPROUVEE" as RoleRequestStatus,submittedAt:"27 juillet 2026",documents:6,risk:"FAIBLE"},
{id:"rr5",reference:"ROLE-2026-00062",name:"Mory Keita",email:"mory@example.com",requestedRole:"PROPRIETAIRE",status:"REFUSEE" as RoleRequestStatus,submittedAt:"24 juillet 2026",documents:1,risk:"ELEVE"}
];

export const adminAds=[
{id:"ad1",title:"Villa contemporaine à louer à Kipé",owner:"Mamadou Diallo",type:"Villa",status:"PUBLIEE" as AdStatus,submittedAt:"31 juillet 2026",risk:12,views:642,reports:0},
{id:"ad2",title:"Appartement standing à vendre à Minière",owner:"Habitat Conakry",type:"Appartement",status:"EN_ATTENTE" as AdStatus,submittedAt:"Aujourd’hui à 08:45",risk:34,views:0,reports:0},
{id:"ad3",title:"Terrain résidentiel à Sonfonia",owner:"Mamadou Diallo",type:"Terrain",status:"BROUILLON" as AdStatus,submittedAt:"Non soumise",risk:8,views:0,reports:0},
{id:"ad4",title:"Maison familiale à Matoto",owner:"Ibrahima Bah",type:"Maison",status:"SUSPENDUE" as AdStatus,submittedAt:"26 juillet 2026",risk:82,views:311,reports:4},
{id:"ad5",title:"Bureaux modernes à Kaloum",owner:"Habitat Conakry",type:"Bureau",status:"REJETEE" as AdStatus,submittedAt:"29 juillet 2026",risk:58,views:0,reports:0}
];

export const reports=[
{id:"rp1",reference:"SIG-2026-00124",target:"Maison familiale à Matoto",reason:"Contenu trompeur",status:"EN_ANALYSE" as ReportStatus,risk:"ELEVE",createdAt:"Aujourd’hui à 07:50",reporter:"IDENTITE_PROTEGEE",count:4},
{id:"rp2",reference:"SIG-2026-00121",target:"Villa contemporaine à louer à Kipé",reason:"Prix incohérent",status:"NOUVEAU" as ReportStatus,risk:"MOYEN",createdAt:"Hier à 18:10",reporter:"IDENTITE_PROTEGEE",count:1},
{id:"rp3",reference:"SIG-2026-00118",target:"Appartement premium à Conakry",reason:"Doublon probable",status:"ACTION_PRISE" as ReportStatus,risk:"ELEVE",createdAt:"31 juillet 2026",reporter:"IDENTITE_PROTEGEE",count:2},
{id:"rp4",reference:"SIG-2026-00107",target:"Terrain à Coyah",reason:"Mauvaise catégorie",status:"REJETE" as ReportStatus,risk:"FAIBLE",createdAt:"28 juillet 2026",reporter:"IDENTITE_PROTEGEE",count:1}
];

export const auditLogs=[
{id:"au1",actor:"admin@demeureguinee.com",action:"APPROBATION_ROLE",target:"ROLE-2026-00069",result:"SUCCES",date:"Aujourd’hui à 10:21",ip:"10.20.30.40"},
{id:"au2",actor:"moderateur@demeureguinee.com",action:"SUSPENSION_ANNONCE",target:"ad4",result:"SUCCES",date:"Aujourd’hui à 09:35",ip:"10.20.30.41"},
{id:"au3",actor:"admin@demeureguinee.com",action:"MODIFICATION_REFERENTIEL",target:"Quartier Kipé",result:"SUCCES",date:"Hier à 17:20",ip:"10.20.30.40"},
{id:"au4",actor:"support@demeureguinee.com",action:"CONSULTATION_UTILISATEUR",target:"u4",result:"AUTORISE",date:"Hier à 15:45",ip:"10.20.30.42"},
{id:"au5",actor:"inconnu",action:"CONNEXION_ADMIN",target:"Administration",result:"ECHEC",date:"31 juillet 2026",ip:"196.20.10.8"}
];

export const referenceData={
villes:["Conakry","Kindia","Boké","Labé","Kankan","Nzérékoré","Coyah","Dubréka"],
quartiers:["Kipé","Lambanyi","Sonfonia","Minière","Matoto Centre","Kaloum","Dixinn","Taouyah"],
categories:["Villa","Appartement","Maison","Terrain","Bureau","Local commercial"],
equipements:["Parking","Jardin","Piscine","Groupe électrogène","Réservoir d’eau","Gardiennage"]
};
