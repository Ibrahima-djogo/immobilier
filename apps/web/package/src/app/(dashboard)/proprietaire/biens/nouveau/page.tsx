"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileCheck2, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";

import OwnerShell from "@/components/proprietaire/OwnerShell";
import styles from "./page.module.css";

type ImageItem = { id:string; name:string; url:string };

export default function NewPropertyPage() {
  const [step,setStep] = useState(1);
  const [saving,setSaving] = useState(false);
  const [done,setDone] = useState(false);
  const [images,setImages] = useState<ImageItem[]>([]);
  const [form,setForm] = useState({
    operation:"VENTE",type:"VILLA",title:"",price:"",city:"Conakry",commune:"",quarter:"",
    area:"",bedrooms:"",bathrooms:"",description:"",accurate:false,authorized:false
  });

  function update(e: ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) {
    const t=e.target;
    setForm(v=>({...v,[t.name]:t instanceof HTMLInputElement && t.type==="checkbox"?t.checked:t.value}));
  }

  function addImages(e:ChangeEvent<HTMLInputElement>) {
    const next=Array.from(e.target.files??[]).slice(0,12-images.length).map(file=>({
      id:`${file.name}-${file.lastModified}-${Math.random()}`,name:file.name,url:URL.createObjectURL(file)
    }));
    setImages(current=>[...current,...next]);
    e.target.value="";
  }

  async function saveDraft() {
    setSaving(true); await new Promise(r=>setTimeout(r,500)); setSaving(false);
  }

  async function submit(e:FormEvent) {
    e.preventDefault(); setSaving(true); await new Promise(r=>setTimeout(r,700)); setSaving(false); setDone(true);
  }

  if(done) return (
    <OwnerShell active="biens" eyebrow="Création terminée" title="Bien prêt à être enregistré" description="La démonstration front-end est terminée.">
      <section className={`${styles.card} ${styles.success}`}>
        <FileCheck2 size={44}/>
        <h2>{form.title || "Nouveau bien"}</h2>
        <p>Aucune donnée n’a réellement été enregistrée. Le bien sera créé comme brouillon après connexion de l’API.</p>
        <div><Link href="/proprietaire/biens">Voir mes biens</Link><button onClick={()=>setDone(false)}>Recommencer</button></div>
      </section>
    </OwnerShell>
  );

  return (
    <OwnerShell active="biens" eyebrow="Nouveau bien" title="Ajouter un bien" description="Créez la fiche du bien avant de préparer son annonce.">
      <div className={styles.steps}>{["Type et prix","Localisation","Caractéristiques","Photos","Vérification"].map((label,index)=><span key={label} className={step===index+1?styles.current:step>index+1?styles.done:""}><b>{step>index+1?<Check size={14}/>:index+1}</b><small>{label}</small></span>)}</div>
      <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
        {step===1 && <section><h2>Type et prix</h2><div className={styles.grid2}>
          <label>Opération<select name="operation" value={form.operation} onChange={update}><option value="VENTE">Vente</option><option value="LOCATION">Location</option></select></label>
          <label>Type de bien<select name="type" value={form.type} onChange={update}><option>VILLA</option><option>APPARTEMENT</option><option>MAISON</option><option>TERRAIN</option><option>BUREAU</option></select></label>
          <label className={styles.full}>Titre<input name="title" value={form.title} onChange={update} placeholder="Villa contemporaine à Kipé"/></label>
          <label>Prix<input name="price" type="number" value={form.price} onChange={update}/></label>
        </div></section>}
        {step===2 && <section><h2>Localisation</h2><div className={styles.grid2}>
          <label>Ville<select name="city" value={form.city} onChange={update}><option>Conakry</option><option>Kindia</option><option>Labé</option><option>Kankan</option></select></label>
          <label>Commune<input name="commune" value={form.commune} onChange={update}/></label>
          <label>Quartier<input name="quarter" value={form.quarter} onChange={update}/></label>
          <div className={styles.map}>Position cartographique à connecter à l’API.</div>
        </div></section>}
        {step===3 && <section><h2>Caractéristiques</h2><div className={styles.grid3}>
          <label>Surface (m²)<input name="area" type="number" value={form.area} onChange={update}/></label>
          <label>Chambres<input name="bedrooms" type="number" value={form.bedrooms} onChange={update}/></label>
          <label>Salles d’eau<input name="bathrooms" type="number" value={form.bathrooms} onChange={update}/></label>
          <label className={styles.full}>Description<textarea name="description" rows={7} value={form.description} onChange={update}/></label>
        </div></section>}
        {step===4 && <section><h2>Photos</h2><label className={styles.upload}><ImagePlus size={33}/><strong>Ajouter des images</strong><small>JPG, PNG ou WebP — maximum 12</small><input type="file" accept="image/*" multiple onChange={addImages}/></label>
          <div className={styles.images}>{images.map(img=><article key={img.id}><img src={img.url} alt={img.name}/><button type="button" onClick={()=>setImages(v=>v.filter(x=>x.id!==img.id))}><Trash2 size={15}/></button></article>)}</div>
        </section>}
        {step===5 && <section><h2>Vérification</h2><div className={styles.review}>
          <p><span>Titre</span><strong>{form.title||"Non renseigné"}</strong></p><p><span>Localisation</span><strong>{form.quarter||"Non renseignée"}, {form.city}</strong></p><p><span>Surface</span><strong>{form.area||0} m²</strong></p><p><span>Photos</span><strong>{images.length}</strong></p>
        </div>
        <label className={styles.check}><input type="checkbox" name="accurate" checked={form.accurate} onChange={update}/> Je confirme l’exactitude des informations.</label>
        <label className={styles.check}><input type="checkbox" name="authorized" checked={form.authorized} onChange={update}/> Je confirme être autorisé à gérer ce bien.</label>
        </section>}
        <div className={styles.actions}>
          <div>{step>1&&<button type="button" onClick={()=>setStep(s=>s-1)}><ArrowLeft size={16}/>Précédent</button>}<button type="button" onClick={saveDraft}><Save size={16}/>{saving?"Enregistrement...":"Brouillon"}</button></div>
          {step<5?<button type="button" className={styles.primary} onClick={()=>setStep(s=>s+1)}>Continuer<ArrowRight size={16}/></button>:<button type="submit" className={styles.primary} disabled={saving||!form.accurate||!form.authorized}>{saving?<Loader2 className={styles.spin}/>:<FileCheck2 size={16}/>}Créer le bien</button>}
        </div>
      </form>
    </OwnerShell>
  );
}
