"use client";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Check,FileCheck2,ImagePlus,Save,Trash2} from "lucide-react";
import {type ChangeEvent,type FormEvent,useState} from "react";
import AgencyShell from "@/components/agence/AgencyShell";
import styles from "./page.module.css";

type Img={id:string;name:string;url:string};
export default function NewAgencyPropertyPage(){
 const [step,setStep]=useState(1);const [done,setDone]=useState(false);const [images,setImages]=useState<Img[]>([]);
 const [form,setForm]=useState({mandateType:"SIMPLE",clientReference:"",clientDisplayName:"",operation:"VENTE",type:"VILLA",title:"",price:"",city:"Conakry",commune:"",quarter:"",area:"",bedrooms:"",bathrooms:"",description:"",accurate:false,authorized:false});
 function update(e:ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>){const t=e.target;setForm(v=>({...v,[t.name]:t instanceof HTMLInputElement&&t.type==="checkbox"?t.checked:t.value}))}
 function addImages(e:ChangeEvent<HTMLInputElement>){const next=Array.from(e.target.files??[]).slice(0,12-images.length).map(file=>({id:`${file.name}-${file.lastModified}-${Math.random()}`,name:file.name,url:URL.createObjectURL(file)}));setImages(v=>[...v,...next]);e.target.value=""}
 function submit(e:FormEvent){e.preventDefault();setDone(true)}
 if(done)return <AgencyShell active="biens" eyebrow="Création terminée" title="Bien prêt à intégrer le portefeuille" description="La démonstration front-end est terminée."><section className={`${styles.card} ${styles.success}`}><FileCheck2 size={44}/><h2>{form.title||"Nouveau bien"}</h2><p>Le bien sera enregistré comme brouillon après connexion à l’API.</p><Link href="/agence/biens">Voir le portefeuille</Link></section></AgencyShell>;
 return <AgencyShell active="biens" eyebrow="Nouveau bien professionnel" title="Ajouter un bien au portefeuille" description="Créez la fiche et associez-la à un mandat ou une autorisation.">
  <div className={styles.steps}>{["Mandat et bien","Localisation","Caractéristiques","Photos","Vérification"].map((l,i)=><span key={l} className={step===i+1?styles.current:step>i+1?styles.done:""}><b>{step>i+1?<Check size={14}/>:i+1}</b><small>{l}</small></span>)}</div>
  <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
   {step===1&&<section><h2>Mandat, client et informations commerciales</h2><div className={styles.grid2}>
    <label>Type de mandat<select name="mandateType" value={form.mandateType} onChange={update}><option value="EXCLUSIF">Exclusif</option><option value="SIMPLE">Simple</option><option value="INTERNE">Bien propre à l’agence</option></select></label>
    <label>Référence client<input name="clientReference" value={form.clientReference} onChange={update}/></label>
    <label className={styles.full}>Nom d’affichage du client<input name="clientDisplayName" value={form.clientDisplayName} onChange={update}/></label>
    <label>Opération<select name="operation" value={form.operation} onChange={update}><option value="VENTE">Vente</option><option value="LOCATION">Location</option></select></label>
    <label>Type<select name="type" value={form.type} onChange={update}><option>VILLA</option><option>APPARTEMENT</option><option>MAISON</option><option>TERRAIN</option><option>BUREAU</option><option>COMMERCE</option></select></label>
    <label className={styles.full}>Titre interne<input name="title" value={form.title} onChange={update}/></label>
    <label>Prix<input name="price" type="number" value={form.price} onChange={update}/></label>
   </div></section>}
   {step===2&&<section><h2>Localisation</h2><div className={styles.grid2}><label>Ville<select name="city" value={form.city} onChange={update}><option>Conakry</option><option>Kindia</option><option>Labé</option><option>Kankan</option></select></label><label>Commune<input name="commune" value={form.commune} onChange={update}/></label><label>Quartier<input name="quarter" value={form.quarter} onChange={update}/></label><div className={styles.map}>Position cartographique à connecter.</div></div></section>}
   {step===3&&<section><h2>Caractéristiques</h2><div className={styles.grid3}><label>Surface<input name="area" type="number" value={form.area} onChange={update}/></label><label>Chambres<input name="bedrooms" type="number" value={form.bedrooms} onChange={update}/></label><label>Salles d’eau<input name="bathrooms" type="number" value={form.bathrooms} onChange={update}/></label><label className={styles.full}>Description<textarea rows={7} name="description" value={form.description} onChange={update}/></label></div></section>}
   {step===4&&<section><h2>Photos</h2><label className={styles.upload}><ImagePlus size={33}/><strong>Ajouter des images</strong><small>Maximum 12</small><input type="file" accept="image/*" multiple onChange={addImages}/></label><div className={styles.images}>{images.map(img=><article key={img.id}><img src={img.url} alt={img.name}/><button type="button" onClick={()=>setImages(v=>v.filter(x=>x.id!==img.id))}><Trash2 size={15}/></button></article>)}</div></section>}
   {step===5&&<section><h2>Vérification</h2><div className={styles.review}><p><span>Titre</span><strong>{form.title||"Non renseigné"}</strong></p><p><span>Client</span><strong>{form.clientDisplayName||"Non renseigné"}</strong></p><p><span>Mandat</span><strong>{form.mandateType}</strong></p><p><span>Photos</span><strong>{images.length}</strong></p></div><label className={styles.check}><input type="checkbox" name="accurate" checked={form.accurate} onChange={update}/>Je confirme l’exactitude des informations.</label><label className={styles.check}><input type="checkbox" name="authorized" checked={form.authorized} onChange={update}/>Je confirme que l’agence dispose d’une autorisation valable.</label></section>}
   <div className={styles.actions}><div>{step>1&&<button type="button" onClick={()=>setStep(s=>s-1)}><ArrowLeft size={16}/>Précédent</button>}<button type="button"><Save size={16}/>Brouillon</button></div>{step<5?<button type="button" className={styles.primary} onClick={()=>setStep(s=>s+1)}>Continuer<ArrowRight size={16}/></button>:<button type="submit" className={styles.primary} disabled={!form.accurate||!form.authorized}><FileCheck2 size={16}/>Créer le bien</button>}</div>
  </form>
 </AgencyShell>
}
