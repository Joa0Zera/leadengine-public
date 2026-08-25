import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json';
import { Lead, SiteTemplate, FinancialProject, ProspectingCopy, LeadGroup } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if specified
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
const auth = getAuth(app);

export { db };

// ERROR HANDLING TYPES AND HELPER FOR FIRESTORE SECURITY RULES DIAGNOSIS
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to recursively remove keys with undefined values from objects
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj as object)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        result[key] = removeUndefinedFields(val);
      }
    }
    return result as T;
  }
  return obj;
}

// COLLECTION NAMES
const LEADS_COL = 'leads';
const TEMPLATES_COL = 'templates';
const PROJECTS_COL = 'projects';
const COPIES_COL = 'copies';
const GROUPS_COL = 'groups';

// Fetch all leads from Firestore
export async function dbFetchLeads(): Promise<Lead[]> {
  try {
    const querySnapshot = await getDocs(collection(db, LEADS_COL));
    const leads: Lead[] = [];
    querySnapshot.forEach((doc) => {
      leads.push(doc.data() as Lead);
    });
    return leads;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, LEADS_COL);
    return []; // fallback but unreachable since handleFirestoreError throws
  }
}

// Add or update a lead in Firestore
export async function dbSaveLead(lead: Lead): Promise<void> {
  const path = `${LEADS_COL}/${lead.id}`;
  try {
    const leadDocRef = doc(db, LEADS_COL, lead.id);
    const sanitized = removeUndefinedFields(lead);
    await setDoc(leadDocRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a lead from Firestore
export async function dbDeleteLead(leadId: string): Promise<void> {
  const path = `${LEADS_COL}/${leadId}`;
  try {
    const leadDocRef = doc(db, LEADS_COL, leadId);
    await deleteDoc(leadDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save all leads (bulk/seeding)
export async function dbSaveAllLeads(leads: Lead[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    leads.forEach((lead) => {
      const docRef = doc(db, LEADS_COL, lead.id);
      const sanitized = removeUndefinedFields(lead);
      batch.set(docRef, sanitized);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, LEADS_COL);
  }
}

// Fetch templates
export async function dbFetchTemplates(): Promise<SiteTemplate[]> {
  try {
    const querySnapshot = await getDocs(collection(db, TEMPLATES_COL));
    const templates: SiteTemplate[] = [];
    querySnapshot.forEach((doc) => {
      templates.push(doc.data() as SiteTemplate);
    });
    return templates;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TEMPLATES_COL);
    return [];
  }
}

// Save or add a template
export async function dbSaveTemplate(template: SiteTemplate): Promise<void> {
  const path = `${TEMPLATES_COL}/${template.id}`;
  try {
    const docRef = doc(db, TEMPLATES_COL, template.id);
    const sanitized = removeUndefinedFields(template);
    await setDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a template
export async function dbDeleteTemplate(id: string): Promise<void> {
  const path = `${TEMPLATES_COL}/${id}`;
  try {
    const docRef = doc(db, TEMPLATES_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save all templates (bulk/seeding)
export async function dbSaveAllTemplates(templates: SiteTemplate[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    templates.forEach((t) => {
      const docRef = doc(db, TEMPLATES_COL, t.id);
      const sanitized = removeUndefinedFields(t);
      batch.set(docRef, sanitized);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TEMPLATES_COL);
  }
}

// Fetch financial projects
export async function dbFetchProjects(): Promise<FinancialProject[]> {
  try {
    const querySnapshot = await getDocs(collection(db, PROJECTS_COL));
    const projects: FinancialProject[] = [];
    querySnapshot.forEach((doc) => {
      projects.push(doc.data() as FinancialProject);
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PROJECTS_COL);
    return [];
  }
}

// Save or add a financial project
export async function dbSaveProject(project: FinancialProject): Promise<void> {
  const path = `${PROJECTS_COL}/${project.id}`;
  try {
    const docRef = doc(db, PROJECTS_COL, project.id);
    const sanitized = removeUndefinedFields(project);
    await setDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a financial project
export async function dbDeleteProject(id: string): Promise<void> {
  const path = `${PROJECTS_COL}/${id}`;
  try {
    const docRef = doc(db, PROJECTS_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save all projects (bulk/seeding)
export async function dbSaveAllProjects(projects: FinancialProject[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    projects.forEach((p) => {
      const docRef = doc(db, PROJECTS_COL, p.id);
      const sanitized = removeUndefinedFields(p);
      batch.set(docRef, sanitized);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PROJECTS_COL);
  }
}

// Clear all leads from Firestore
export async function dbClearAllLeads(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, LEADS_COL));
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, LEADS_COL);
  }
}

// Fetch all copies from Firestore
export async function dbFetchCopies(): Promise<ProspectingCopy[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COPIES_COL));
    const copies: ProspectingCopy[] = [];
    querySnapshot.forEach((doc) => {
      copies.push(doc.data() as ProspectingCopy);
    });
    return copies;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COPIES_COL);
    return [];
  }
}

// Save or add a copy
export async function dbSaveCopy(copy: ProspectingCopy): Promise<void> {
  const path = `${COPIES_COL}/${copy.id}`;
  try {
    const docRef = doc(db, COPIES_COL, copy.id);
    const sanitized = removeUndefinedFields(copy);
    await setDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a copy
export async function dbDeleteCopy(id: string): Promise<void> {
  const path = `${COPIES_COL}/${id}`;
  try {
    const docRef = doc(db, COPIES_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save all copies (bulk/seeding)
export async function dbSaveAllCopies(copies: ProspectingCopy[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    copies.forEach((c) => {
      const docRef = doc(db, COPIES_COL, c.id);
      const sanitized = removeUndefinedFields(c);
      batch.set(docRef, sanitized);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COPIES_COL);
  }
}

// Fetch all lead groups from Firestore
export async function dbFetchGroups(): Promise<LeadGroup[]> {
  try {
    const querySnapshot = await getDocs(collection(db, GROUPS_COL));
    const groups: LeadGroup[] = [];
    querySnapshot.forEach((doc) => {
      groups.push(doc.data() as LeadGroup);
    });
    return groups;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, GROUPS_COL);
    return [];
  }
}

// Save or add a lead group
export async function dbSaveGroup(group: LeadGroup): Promise<void> {
  const path = `${GROUPS_COL}/${group.id}`;
  try {
    const docRef = doc(db, GROUPS_COL, group.id);
    const sanitized = removeUndefinedFields(group);
    await setDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a lead group
export async function dbDeleteGroup(id: string): Promise<void> {
  const path = `${GROUPS_COL}/${id}`;
  try {
    const docRef = doc(db, GROUPS_COL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save all lead groups (bulk/seeding)
export async function dbSaveAllGroups(groups: LeadGroup[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    groups.forEach((g) => {
      const docRef = doc(db, GROUPS_COL, g.id);
      const sanitized = removeUndefinedFields(g);
      batch.set(docRef, sanitized);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, GROUPS_COL);
  }
}
