"use client";

import { useCallback, useEffect, useState } from "react";

import type { OwnerProperty } from "@/lib/proprietaire/demo-data";
import {
  getOwnerAds,
  getOwnerContacts,
  getOwnerProperties,
  type OwnerAdRecord,
  type OwnerContactRecord,
} from "@/lib/proprietaire/storage";

export function useOwnerStorage() {
  const [ready, setReady] = useState(false);
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [ads, setAds] = useState<OwnerAdRecord[]>([]);
  const [contacts, setContacts] = useState<OwnerContactRecord[]>([]);

  const refresh = useCallback(() => {
    setProperties(getOwnerProperties());
    setAds(getOwnerAds());
    setContacts(getOwnerContacts());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  return { ready, properties, ads, contacts, refresh };
}
