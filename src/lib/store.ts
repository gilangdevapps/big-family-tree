// LocalStorage data store for Big Family Tree
// Replaces Supabase for local development/testing

export interface User {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

export interface FamilyTree {
  id: string;
  owner_id: string;
  name: string;
  root_person_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  tree_id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  death_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  birth_place: string | null;
  location: string | null;
  occupation: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  photo_data?: string | null; // base64 for localStorage
  is_adopted: boolean;
  is_root: boolean;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  tree_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: 'spouse' | 'parent_child' | 'step_sibling';
  is_primary: boolean;
  marriage_date: string | null;
  divorce_date: string | null;
  ended_reason: 'divorce' | 'death' | null | 'null';
  created_at: string;
}

export interface TreeMembership {
  id: string;
  tree_id: string;
  user_id: string;
  role: 'admin' | 'family_member';
  invited_at: string;
  joined_at: string | null;
}

export interface InviteToken {
  id: string;
  tree_id: string;
  token: string;
  email: string;
  role: 'admin' | 'family_member';
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

// ── Store Keys ────────────────────────────────────────────────────────────────

const KEYS = {
  currentUser: 'bft_current_user',
  users: 'bft_users',
  trees: 'bft_trees',
  members: 'bft_members',
  relationships: 'bft_relationships',
  memberships: 'bft_memberships',
  invites: 'bft_invites',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

function storeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function storeSet<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── User / Auth ───────────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  return storeGet<User | null>(KEYS.currentUser, null);
}

export function setCurrentUser(user: User | null): void {
  if (user) storeSet(KEYS.currentUser, user);
  else localStorage.removeItem(KEYS.currentUser);
}

export function getUsers(): User[] {
  return storeGet<User[]>(KEYS.users, []);
}

export function getOrCreateUser(email: string): User {
  const users = getUsers();
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = { id: uuid(), email, created_at: now(), updated_at: now() };
    storeSet(KEYS.users, [...users, user]);
  }
  return user;
}

// ── Trees ─────────────────────────────────────────────────────────────────────

export function getTrees(): FamilyTree[] {
  return storeGet<FamilyTree[]>(KEYS.trees, []);
}

export function getTree(id: string): FamilyTree | undefined {
  return getTrees().find(t => t.id === id);
}

export function getTreesForUser(userId: string): FamilyTree[] {
  const memberships = getMembershipsForUser(userId);
  const treeIds = new Set(memberships.map(m => m.tree_id));
  return getTrees().filter(t => treeIds.has(t.id) || t.owner_id === userId);
}

export function createTree(name: string, ownerId: string): FamilyTree {
  const tree: FamilyTree = {
    id: uuid(),
    owner_id: ownerId,
    name,
    root_person_id: null,
    settings: {},
    created_at: now(),
    updated_at: now(),
  };
  storeSet(KEYS.trees, [...getTrees(), tree]);
  return tree;
}

export function updateTree(id: string, updates: Partial<FamilyTree>): FamilyTree | null {
  const trees = getTrees();
  const idx = trees.findIndex(t => t.id === id);
  if (idx === -1) return null;
  trees[idx] = { ...trees[idx], ...updates, updated_at: now() };
  storeSet(KEYS.trees, trees);
  return trees[idx];
}

export function deleteTree(id: string): void {
  storeSet(KEYS.trees, getTrees().filter(t => t.id !== id));
  storeSet(KEYS.members, getMembers().filter(m => m.tree_id !== id));
  storeSet(KEYS.relationships, getRelationships().filter(r => r.tree_id !== id));
  storeSet(KEYS.memberships, getMemberships().filter(m => m.tree_id !== id));
  storeSet(KEYS.invites, getInvites().filter(i => i.tree_id !== id));
}

export function transferOwnership(treeId: string, newOwnerId: string): void {
  updateTree(treeId, { owner_id: newOwnerId });
  // old owner becomes admin if not already
  const user = getCurrentUser();
  if (user) {
    const mems = getMembershipsForTree(treeId);
    const oldOwnerMem = mems.find(m => m.user_id === user.id);
    if (oldOwnerMem && oldOwnerMem.role !== 'admin') {
      updateMembership(oldOwnerMem.id, { role: 'admin' });
    } else if (!oldOwnerMem) {
      addMembership(treeId, user.id, 'admin');
    }
  }
}

// ── Members ───────────────────────────────────────────────────────────────────

export function getMembers(): FamilyMember[] {
  return storeGet<FamilyMember[]>(KEYS.members, []);
}

export function getMembersForTree(treeId: string): FamilyMember[] {
  return getMembers().filter(m => m.tree_id === treeId);
}

export function getMember(id: string): FamilyMember | undefined {
  return getMembers().find(m => m.id === id);
}

export function addMember(treeId: string, data: Partial<FamilyMember>): FamilyMember {
  const user = getCurrentUser();
  const member: FamilyMember = {
    id: uuid(),
    tree_id: treeId,
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    birth_date: data.birth_date || null,
    death_date: data.death_date || null,
    gender: data.gender || null,
    birth_place: data.birth_place || null,
    location: data.location || null,
    occupation: data.occupation || null,
    bio: data.bio || null,
    email: data.email || null,
    phone: data.phone || null,
    profile_photo_url: data.profile_photo_url || null,
    photo_data: data.photo_data || null,
    is_adopted: data.is_adopted || false,
    is_root: data.is_root || false,
    last_edited_by: user?.id || null,
    last_edited_at: now(),
    created_at: now(),
    updated_at: now(),
  };
  storeSet(KEYS.members, [...getMembers(), member]);
  return member;
}

export function updateMember(id: string, updates: Partial<FamilyMember>): FamilyMember | null {
  const user = getCurrentUser();
  const members = getMembers();
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) return null;
  members[idx] = {
    ...members[idx],
    ...updates,
    last_edited_by: user?.id || members[idx].last_edited_by,
    last_edited_at: now(),
    updated_at: now(),
  };
  storeSet(KEYS.members, members);
  return members[idx];
}

export function deleteMember(id: string): void {
  storeSet(KEYS.members, getMembers().filter(m => m.id !== id));
  storeSet(KEYS.relationships, getRelationships().filter(
    r => r.person_a_id !== id && r.person_b_id !== id
  ));
}

export function getMemberPhotoUrl(member: FamilyMember): string {
  if (member.photo_data) return member.photo_data;
  if (member.profile_photo_url) return member.profile_photo_url;
  return '';
}

// ── Relationships ─────────────────────────────────────────────────────────────

export function getRelationships(): Relationship[] {
  return storeGet<Relationship[]>(KEYS.relationships, []);
}

export function getRelationshipsForTree(treeId: string): Relationship[] {
  return getRelationships().filter(r => r.tree_id === treeId);
}

export function addRelationship(data: {
  tree_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: 'spouse' | 'parent_child' | 'step_sibling';
  is_primary?: boolean;
  marriage_date?: string | null;
  divorce_date?: string | null;
  ended_reason?: string | null;
  is_adopted?: boolean;
}): Relationship {
  // Auto-resolve is_primary
  let isPrimary = data.is_primary ?? false;
  if (data.relationship_type === 'spouse' && !data.is_primary) {
    const existingSpouses = getRelationships().filter(
      r => r.tree_id === data.tree_id &&
        r.relationship_type === 'spouse' &&
        (r.person_a_id === data.person_a_id || r.person_b_id === data.person_a_id)
    );
    if (existingSpouses.length === 0) isPrimary = true;
  }
  if (data.relationship_type === 'parent_child' && !data.is_primary) {
    const existingParents = getRelationships().filter(
      r => r.tree_id === data.tree_id &&
        r.relationship_type === 'parent_child' &&
        r.person_b_id === data.person_b_id
    );
    if (existingParents.length === 0) isPrimary = true;
  }

  const rel: Relationship = {
    id: uuid(),
    tree_id: data.tree_id,
    person_a_id: data.person_a_id,
    person_b_id: data.person_b_id,
    relationship_type: data.relationship_type,
    is_primary: isPrimary,
    marriage_date: data.marriage_date || null,
    divorce_date: data.divorce_date || null,
    ended_reason: data.ended_reason || null,
    created_at: now(),
  };

  // If adopted child, mark member as adopted
  if (data.relationship_type === 'parent_child' && data.is_adopted) {
    updateMember(data.person_b_id, { is_adopted: true });
  }

  storeSet(KEYS.relationships, [...getRelationships(), rel]);
  return rel;
}

export function updateRelationship(id: string, updates: Partial<Relationship>): Relationship | null {
  const rels = getRelationships();
  const idx = rels.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rels[idx] = { ...rels[idx], ...updates };
  storeSet(KEYS.relationships, rels);
  return rels[idx];
}

export function removeRelationship(id: string): void {
  storeSet(KEYS.relationships, getRelationships().filter(r => r.id !== id));
}

export function checkRelationshipExists(treeId: string, type: string, personA: string, personB: string): boolean {
  return getRelationships().some(r =>
    r.tree_id === treeId &&
    r.relationship_type === type &&
    ((r.person_a_id === personA && r.person_b_id === personB) ||
     (r.person_a_id === personB && r.person_b_id === personA))
  );
}

// ── Memberships ──────────────────────────────────────────────────────────────

export function getMemberships(): TreeMembership[] {
  return storeGet<TreeMembership[]>(KEYS.memberships, []);
}

export function getMembershipsForTree(treeId: string): TreeMembership[] {
  return getMemberships().filter(m => m.tree_id === treeId);
}

export function getMembershipsForUser(userId: string): TreeMembership[] {
  return getMemberships().filter(m => m.user_id === userId);
}

export function addMembership(treeId: string, userId: string, role: 'admin' | 'family_member'): TreeMembership {
  const existing = getMemberships().find(m => m.tree_id === treeId && m.user_id === userId);
  if (existing) return existing;
  const mem: TreeMembership = {
    id: uuid(),
    tree_id: treeId,
    user_id: userId,
    role,
    invited_at: now(),
    joined_at: now(),
  };
  storeSet(KEYS.memberships, [...getMemberships(), mem]);
  return mem;
}

export function updateMembership(id: string, updates: Partial<TreeMembership>): TreeMembership | null {
  const mems = getMemberships();
  const idx = mems.findIndex(m => m.id === id);
  if (idx === -1) return null;
  mems[idx] = { ...mems[idx], ...updates };
  storeSet(KEYS.memberships, mems);
  return mems[idx];
}

export function removeMembership(id: string): void {
  storeSet(KEYS.memberships, getMemberships().filter(m => m.id !== id));
}

export function getUserMembershipForTree(treeId: string, userId: string): TreeMembership | undefined {
  return getMemberships().find(m => m.tree_id === treeId && m.user_id === userId);
}

export function userHasAccess(treeId: string, userId: string): boolean {
  if (!userId) return false;
  const tree = getTree(treeId);
  if (tree?.owner_id === userId) return true;
  return getMemberships().some(m => m.tree_id === treeId && m.user_id === userId);
}

export function userIsAdmin(treeId: string, userId: string): boolean {
  const tree = getTree(treeId);
  if (tree?.owner_id === userId) return true;
  const mem = getUserMembershipForTree(treeId, userId);
  return mem?.role === 'admin';
}

// ── Invites ───────────────────────────────────────────────────────────────────

export function getInvites(): InviteToken[] {
  return storeGet<InviteToken[]>(KEYS.invites, []);
}

export function getInvitesForTree(treeId: string): InviteToken[] {
  return getInvites().filter(i => i.tree_id === treeId && !i.used_at);
}

export function getInviteByToken(token: string): InviteToken | undefined {
  return getInvites().find(i => i.token === token);
}

export function createInvite(treeId: string, email: string, role: 'admin' | 'family_member'): InviteToken {
  const invite: InviteToken = {
    id: uuid(),
    tree_id: treeId,
    token: uuid().replace(/-/g, ''),
    email,
    role,
    expires_at: null,
    used_at: null,
    created_at: now(),
  };
  storeSet(KEYS.invites, [...getInvites(), invite]);
  return invite;
}

export function acceptInvite(token: string): InviteToken | null {
  const invites = getInvites();
  const idx = invites.findIndex(i => i.token === token);
  if (idx === -1) return null;
  invites[idx] = { ...invites[idx], used_at: now() };
  storeSet(KEYS.invites, invites);
  return invites[idx];
}

export function revokeInvite(id: string): void {
  storeSet(KEYS.invites, getInvites().filter(i => i.id !== id));
}

// ── Search ────────────────────────────────────────────────────────────────────

export function searchMembers(query: string, userId: string): FamilyMember[] {
  if (!query || query.length < 2) return [];
  const treeIds = new Set(getMembershipsForUser(userId).map(m => m.tree_id));
  const q = query.toLowerCase();
  return getMembers()
    .filter(m => treeIds.has(m.tree_id))
    .filter(m =>
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q)
    )
    .slice(0, 20);
}

// ── Graph (tree view data) ────────────────────────────────────────────────────

export function getGraph(treeId: string) {
  const members = getMembersForTree(treeId);
  const relationships = getRelationshipsForTree(treeId);
  const tree = getTree(treeId);
  return { members, relationships, root_person_id: tree?.root_person_id || null };
}

// ── Seed Demo Data ────────────────────────────────────────────────────────────

export function seedDemoData(): void {
  const alreadySeeded = getTrees().length > 0;
  if (alreadySeeded) return;

  const user = getOrCreateUser('demo@bigfamily.com');
  setCurrentUser(user);

  // Create memberships for demo user
  addMembership('demo-tree-1', user.id, 'admin');

  const members: FamilyMember[] = [
    {
      id: 'demo-member-1',
      tree_id: 'demo-tree-1',
      first_name: 'Sri',
      last_name: 'Hartati',
      birth_date: '1945-03-15',
      death_date: null,
      gender: 'female',
      birth_place: 'Yogyakarta, Indonesia',
      location: 'Jakarta',
      occupation: 'Ibu Rumah Tangga',
      bio: 'Nenek dari keluarga besar. Dikenal karena keramahan dan masakannya.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=47',
      photo_data: null,
      is_adopted: false,
      is_root: true,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-2',
      tree_id: 'demo-tree-1',
      first_name: 'Joko',
      last_name: 'Santoso',
      birth_date: '1942-07-22',
      death_date: null,
      gender: 'male',
      birth_place: 'Surabaya, Indonesia',
      location: 'Jakarta',
      occupation: 'Pensiunan Guru',
      bio: 'Kakek dari keluarga besar. Hobinya berkebun.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=68',
      photo_data: null,
      is_adopted: false,
      is_root: true,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-3',
      tree_id: 'demo-tree-1',
      first_name: 'Budi',
      last_name: 'Santoso',
      birth_date: '1970-05-10',
      death_date: null,
      gender: 'male',
      birth_place: 'Jakarta',
      location: 'Jakarta',
      occupation: 'Manajer Perusahaan',
      bio: 'Anak pertama dari Joko dan Sri. Sudah menikah dan punya 2 anak.',
      email: 'budi.santoso@email.com',
      phone: '+62812345678',
      profile_photo_url: 'https://i.pravatar.cc/150?img=60',
      photo_data: null,
      is_adopted: false,
      is_root: false,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-4',
      tree_id: 'demo-tree-1',
      first_name: 'Siti',
      last_name: 'Santoso',
      birth_date: '1973-09-18',
      death_date: null,
      gender: 'female',
      birth_place: 'Bandung',
      location: 'Jakarta',
      occupation: 'Guru SD',
      bio: 'Istri Budi Santoso. Hobinya memasak dan menjahit.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=45',
      photo_data: null,
      is_adopted: false,
      is_root: false,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-5',
      tree_id: 'demo-tree-1',
      first_name: 'Rina',
      last_name: 'Santoso',
      birth_date: '1998-02-14',
      death_date: null,
      gender: 'female',
      birth_place: 'Jakarta',
      location: 'Jakarta',
      occupation: 'Mahasiswa Kedokteran',
      bio: 'Anak pertama Budi dan Siti. Sekarang kuliah di FKUI.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=44',
      photo_data: null,
      is_adopted: false,
      is_root: false,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-6',
      tree_id: 'demo-tree-1',
      first_name: 'Doni',
      last_name: 'Santoso',
      birth_date: '2001-11-30',
      death_date: null,
      gender: 'male',
      birth_place: 'Jakarta',
      location: 'Jakarta',
      occupation: 'Mahasiswa Informatika',
      bio: 'Anak kedua Budi dan Siti. Hobinya coding dan gaming.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=65',
      photo_data: null,
      is_adopted: false,
      is_root: false,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-7',
      tree_id: 'demo-tree-1',
      first_name: 'Ani',
      last_name: 'Wulandari',
      birth_date: '1975-12-05',
      death_date: null,
      gender: 'female',
      birth_place: 'Yogyakarta',
      location: 'Jakarta',
      occupation: 'Dokter',
      bio: 'Adik Siti, tinggal bersama orang tua. Dokter umum.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=48',
      photo_data: null,
      is_adopted: false,
      is_root: false,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-8',
      tree_id: 'demo-tree-1',
      first_name: 'Ahmad',
      last_name: 'Wibowo',
      birth_date: '1972-04-17',
      death_date: null,
      gender: 'male',
      birth_place: 'Semarang',
      location: 'Jakarta',
      occupation: 'Insinyur',
      bio: 'Suami Ani. Hobinya memancing.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=59',
      photo_data: null,
      is_adopted: false,
      is_root: false,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'demo-member-9',
      tree_id: 'demo-tree-1',
      first_name: 'Fajar',
      last_name: 'Wibowo',
      birth_date: '2003-08-25',
      death_date: null,
      gender: 'male',
      birth_place: 'Jakarta',
      location: 'Jakarta',
      occupation: 'Pelajar SMA',
      bio: ' Anak pertama Ani dan Ahmad.',
      email: null,
      phone: null,
      profile_photo_url: 'https://i.pravatar.cc/150?img=62',
      photo_data: null,
      is_adopted: false,
      is_root: false,
      last_edited_by: user.id,
      last_edited_at: now(),
      created_at: now(),
      updated_at: now(),
    },
  ];

  const relationships: Relationship[] = [
    // Joko and Sri — spouses (root couple)
    { id: 'demo-rel-1', tree_id: 'demo-tree-1', person_a_id: 'demo-member-1', person_b_id: 'demo-member-2', relationship_type: 'spouse', is_primary: true, marriage_date: '1965-06-10', divorce_date: null, ended_reason: null, created_at: now() },
    // Budi is child of Joko and Sri
    { id: 'demo-rel-2', tree_id: 'demo-tree-1', person_a_id: 'demo-member-2', person_b_id: 'demo-member-3', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    { id: 'demo-rel-3', tree_id: 'demo-tree-1', person_a_id: 'demo-member-1', person_b_id: 'demo-member-3', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    // Budi and Siti — spouses
    { id: 'demo-rel-4', tree_id: 'demo-tree-1', person_a_id: 'demo-member-3', person_b_id: 'demo-member-4', relationship_type: 'spouse', is_primary: true, marriage_date: '1995-03-20', divorce_date: null, ended_reason: null, created_at: now() },
    // Rina child of Budi and Siti
    { id: 'demo-rel-5', tree_id: 'demo-tree-1', person_a_id: 'demo-member-3', person_b_id: 'demo-member-5', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    { id: 'demo-rel-6', tree_id: 'demo-tree-1', person_a_id: 'demo-member-4', person_b_id: 'demo-member-5', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    // Doni child of Budi and Siti
    { id: 'demo-rel-7', tree_id: 'demo-tree-1', person_a_id: 'demo-member-3', person_b_id: 'demo-member-6', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    { id: 'demo-rel-8', tree_id: 'demo-tree-1', person_a_id: 'demo-member-4', person_b_id: 'demo-member-6', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    // Siti and Ani — sisters (step through remarriage of their parent — actually half sisters: Siti's mom Sri also parented Ani after remarriage)
    { id: 'demo-rel-9', tree_id: 'demo-tree-1', person_a_id: 'demo-member-1', person_b_id: 'demo-member-7', relationship_type: 'parent_child', is_primary: false, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    // Ani and Ahmad — spouses
    { id: 'demo-rel-10', tree_id: 'demo-tree-1', person_a_id: 'demo-member-7', person_b_id: 'demo-member-8', relationship_type: 'spouse', is_primary: true, marriage_date: '1998-09-12', divorce_date: null, ended_reason: null, created_at: now() },
    // Fajar child of Ani and Ahmad
    { id: 'demo-rel-11', tree_id: 'demo-tree-1', person_a_id: 'demo-member-7', person_b_id: 'demo-member-9', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    { id: 'demo-rel-12', tree_id: 'demo-tree-1', person_a_id: 'demo-member-8', person_b_id: 'demo-member-9', relationship_type: 'parent_child', is_primary: true, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
    // Siti and Ani are step-siblings (Ani's dad remarried Siti's mom Sri — handled via separate parent links above)
    { id: 'demo-rel-13', tree_id: 'demo-tree-1', person_a_id: 'demo-member-4', person_b_id: 'demo-member-7', relationship_type: 'step_sibling', is_primary: false, marriage_date: null, divorce_date: null, ended_reason: null, created_at: now() },
  ];

  const tree: FamilyTree = {
    id: 'demo-tree-1',
    owner_id: user.id,
    name: 'Keluarga Besar Santoso',
    root_person_id: 'demo-member-1',
    settings: {},
    created_at: now(),
    updated_at: now(),
  };

  storeSet(KEYS.trees, [tree]);
  storeSet(KEYS.members, members);
  storeSet(KEYS.relationships, relationships);
}

// ── Initialize on import ───────────────────────────────────────────────────────
// Uncomment the line below to auto-seed demo data on page load
// seedDemoData();