"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, Clock, Mail, Phone, Send, User } from "lucide-react";
import styles from "./VisitForm.module.css";

export function VisitForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    timeSlot: "Matin (09h - 12h)",
    message: "Bonjour, je souhaite visiter ce bien ou obtenir plus d'informations.",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.visitFormCard}>
      <h4 className={styles.title}>
        <Calendar size={18} aria-hidden="true" />
        Demander une visite
      </h4>

      {submitted ? (
        <div className={styles.successBox}>
          <CheckCircle2 size={32} color="#2b6248" aria-hidden="true" />
          <p>
            Votre demande de visite a bien été enregistrée !
          </p>
          <small style={{ opacity: 0.8, fontSize: "0.74rem" }}>
            Elle a été transmise à l’équipe Demeure Guinée, qui vous
            recontactera pour organiser la suite.
          </small>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="visit-name">Nom complet *</label>
            <div className={styles.inputControl}>
              <User size={16} aria-hidden="true" />
              <input
                id="visit-name"
                type="text"
                required
                placeholder="Ex. Alpha Diallo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="visit-phone">Numéro de téléphone *</label>
            <div className={styles.inputControl}>
              <Phone size={16} aria-hidden="true" />
              <input
                id="visit-phone"
                type="tel"
                required
                placeholder="Ex. +224 6XX XX XX XX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="visit-email">Adresse e-mail</label>
            <div className={styles.inputControl}>
              <Mail size={16} aria-hidden="true" />
              <input
                id="visit-email"
                type="email"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="visit-date">Date souhaitée</label>
            <div className={styles.inputControl}>
              <Calendar size={16} aria-hidden="true" />
              <input
                id="visit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="visit-timeslot">Créneau horaire</label>
            <div className={styles.inputControl}>
              <Clock size={16} aria-hidden="true" />
              <select
                id="visit-timeslot"
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              >
                <option value="Matin (09h - 12h)">Matin (09h - 12h)</option>
                <option value="Après-midi (14h - 17h)">Après-midi (14h - 17h)</option>
                <option value="Fin de journée (17h - 19h)">Fin de journée (17h - 19h)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="visit-message">Message</label>
            <textarea
              id="visit-message"
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <Send size={16} aria-hidden="true" />
            Demander une visite
          </button>

          <p className={styles.disclaimer}>
            Votre demande sera transmise à l’équipe Demeure Guinée.
          </p>
        </form>
      )}
    </div>
  );
}
