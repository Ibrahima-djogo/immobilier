export type PropertyStatus="ACTIF"|"BROUILLON"|"ARCHIVE";
export type AdStatus="PUBLIEE"|"BROUILLON"|"EN_ATTENTE"|"REJETEE";
export type ProspectStatus="NOUVEAU"|"EN_COURS"|"QUALIFIE"|"CLOTURE";

export const agencyProperties=[
 {id:"ap1",slug:"villa-premium-kipe",reference:"HC-B-2026-0018",title:"Villa premium avec jardin à Kipé",type:"Villa",operation:"LOCATION",location:"Kipé, Ratoma, Conakry",price:6500000,area:420,bedrooms:6,bathrooms:5,status:"ACTIF" as PropertyStatus,completeness:100,views:892,contacts:18,mandateType:"EXCLUSIF",ownerDisplayName:"Client propriétaire #1042",description:"Villa haut standing confiée à l’agence avec mandat exclusif vérifié.",images:["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=86","https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=86"]},
 {id:"ap2",slug:"appartement-standing-miniere",reference:"HC-B-2026-0023",title:"Appartement standing à Minière",type:"Appartement",operation:"VENTE",location:"Minière, Dixinn, Conakry",price:1250000000,area:175,bedrooms:4,bathrooms:3,status:"ACTIF" as PropertyStatus,completeness:100,views:430,contacts:7,mandateType:"SIMPLE",ownerDisplayName:"Client propriétaire #1098",description:"Appartement récent dans une résidence sécurisée.",images:["https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=86","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=86"]},
 {id:"ap3",slug:"terrain-commercial-matoto",reference:"HC-B-2026-0029",title:"Terrain à vocation commerciale",type:"Terrain",operation:"VENTE",location:"Matoto Centre, Conakry",price:980000000,area:950,bedrooms:0,bathrooms:0,status:"BROUILLON" as PropertyStatus,completeness:71,views:0,contacts:0,mandateType:"SIMPLE",ownerDisplayName:"Client propriétaire #1120",description:"Terrain à compléter avant création de l’annonce.",images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=86"]},
 {id:"ap4",slug:"bureaux-kaloum",reference:"HC-B-2026-0031",title:"Plateau de bureaux à Kaloum",type:"Bureau",operation:"LOCATION",location:"Kaloum, Conakry",price:12000000,area:330,bedrooms:0,bathrooms:3,status:"ACTIF" as PropertyStatus,completeness:100,views:331,contacts:5,mandateType:"EXCLUSIF",ownerDisplayName:"Société cliente #2026-04",description:"Plateau professionnel adapté à une entreprise.",images:["https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=86"]}
];

export const agencyAds=[
 {id:"aa1",propertySlug:"villa-premium-kipe",title:"Villa haut standing à louer à Kipé",status:"PUBLIEE" as AdStatus,views:892,favorites:47,contacts:18,updatedAt:"Aujourd’hui à 10:15"},
 {id:"aa2",propertySlug:"appartement-standing-miniere",title:"Appartement standing à vendre à Minière",status:"PUBLIEE" as AdStatus,views:430,favorites:22,contacts:7,updatedAt:"Hier à 17:20"},
 {id:"aa3",propertySlug:"terrain-commercial-matoto",title:"Terrain commercial à Matoto",status:"BROUILLON" as AdStatus,views:0,favorites:0,contacts:0,updatedAt:"31 juillet 2026"},
 {id:"aa4",propertySlug:"bureaux-kaloum",title:"Bureaux modernes à louer à Kaloum",status:"EN_ATTENTE" as AdStatus,views:0,favorites:0,contacts:0,updatedAt:"30 juillet 2026"},
 {id:"aa5",propertySlug:"appartement-standing-miniere",title:"Appartement premium à Conakry",status:"REJETEE" as AdStatus,views:0,favorites:0,contacts:0,updatedAt:"28 juillet 2026",rejectionReason:"Le titre doit préciser le quartier et le prix doit correspondre au bien rattaché."}
];

export const agencyProspects=[
 {id:"pr1",name:"Mariam Camara",email:"mariam.cam@example.com",phone:"+224 620 11 22 33",propertyTitle:"Villa premium avec jardin à Kipé",subject:"Demande de visite",message:"Je souhaite visiter la villa samedi matin et connaître les conditions de location.",status:"NOUVEAU" as ProspectStatus,createdAt:"Aujourd’hui à 11:25",source:"Formulaire annonce"},
 {id:"pr2",name:"Ibrahima Bah",email:"ibrahima.bah@example.com",phone:"+224 622 44 55 66",propertyTitle:"Appartement standing à Minière",subject:"Demande d’informations",message:"Le prix est-il négociable et les documents du bien sont-ils disponibles ?",status:"EN_COURS" as ProspectStatus,createdAt:"Aujourd’hui à 09:40",source:"Formulaire annonce"},
 {id:"pr3",name:"Société Kamsar Services",email:"contact@kamsar-services.example",phone:"+224 621 77 88 99",propertyTitle:"Plateau de bureaux à Kaloum",subject:"Visite professionnelle",message:"Nous cherchons des bureaux pour une équipe de vingt personnes.",status:"QUALIFIE" as ProspectStatus,createdAt:"Hier à 15:05",source:"Contact agence"},
 {id:"pr4",name:"Fatoumata Sylla",email:"fatoumata@example.com",phone:"+224 625 10 10 10",propertyTitle:"Appartement standing à Minière",subject:"Disponibilité",message:"Le logement est-il toujours disponible ?",status:"CLOTURE" as ProspectStatus,createdAt:"30 juillet 2026",source:"Formulaire annonce"}
];

export const agencyActivity=[
 {id:"ac1",action:"Annonce soumise à modération",target:"Bureaux modernes à louer à Kaloum",date:"Aujourd’hui à 10:03",actor:"Compte agence"},
 {id:"ac2",action:"Prospect marqué en cours",target:"Ibrahima Bah",date:"Aujourd’hui à 09:45",actor:"Compte agence"},
 {id:"ac3",action:"Bien mis à jour",target:"Villa premium avec jardin à Kipé",date:"Hier à 18:30",actor:"Compte agence"},
 {id:"ac4",action:"Annonce publiée",target:"Appartement standing à vendre à Minière",date:"31 juillet 2026",actor:"Administration"},
 {id:"ac5",action:"Profil professionnel modifié",target:"Habitat Conakry",date:"29 juillet 2026",actor:"Compte agence"}
];

export function formatGnf(value:number){return new Intl.NumberFormat("fr-FR").format(value)+" GNF";}
