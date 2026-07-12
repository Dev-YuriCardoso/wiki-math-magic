import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Turma, Material, StudentSubmission, Payment, LMSData, UserRole, Announcement, AttendanceRecord, MaterialProgress, GameTimeTransaction, GameSession, Expense, Computer, getSessionRemainingSeconds } from '@/types/lms';

interface LMSContextType {
  currentUser: User | null;
  isInitialized: boolean;
  users: User[];
  turmas: Turma[];
  materials: Material[];
  submissions: StudentSubmission[];
  payments: Payment[];
  announcements: Announcement[];
  attendanceRecords: AttendanceRecord[];
  materialProgress: MaterialProgress[];
  loginByCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addTurma: (turma: Omit<Turma, 'id' | 'createdAt'>) => void;
  updateTurma: (id: string, data: Partial<Turma>) => void;
  deleteTurma: (id: string) => void;
  addMaterial: (material: Omit<Material, 'id' | 'uploadedAt'>) => void;
  deleteMaterial: (id: string) => void;
  addSubmission: (submission: Omit<StudentSubmission, 'id' | 'submittedAt' | 'status'>) => void;
  updateSubmission: (id: string, data: Partial<StudentSubmission>) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, data: Partial<Payment>) => void;
  markPaymentAsPaid: (id: string) => void;
  markPaymentAsPending: (id: string) => void;
  getStudentsByTurma: (turmaId: string) => User[];
  getMaterialsByTurma: (turmaId: string) => Material[];
  getSubmissionsByTurma: (turmaId: string) => StudentSubmission[];
  getPaymentsByStudent: (studentId: string) => Payment[];
  getTurmaById: (id: string) => Turma | undefined;
  getUserById: (id: string) => User | undefined;
  getTurmasByProfessor: (professorId: string) => Turma[];
  generate2026Payments: (studentId: string) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  deleteAnnouncement: (id: string) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  getAttendanceByTurmaAndDate: (turmaId: string, date: string) => AttendanceRecord | undefined;
  getAttendanceByTurma: (turmaId: string) => AttendanceRecord[];
  getStudentAttendance: (studentId: string) => { date: string; present: boolean; note?: string; turmaId: string }[];
  toggleMaterialProgress: (studentId: string, materialId: string) => void;
  getStudentProgress: (studentId: string) => MaterialProgress[];
  gameTimeTransactions: GameTimeTransaction[];
  gameSessions: GameSession[];
  addGameTime: (userId: string, minutes: number, amountPaid: number, note?: string, opts?: { computerId?: string; paymentMethod?: string; operation?: string }) => void;
  removeGameTime: (userId: string, minutes: number, note?: string) => void;
  getUserTimeBalance: (userId: string) => number;
  getUserTimeTransactions: (userId: string) => GameTimeTransaction[];
  importGameTransactions: (txs: GameTimeTransaction[]) => number;
  getGameSession: (userId: string) => GameSession | undefined;
  startGameSession: (userId: string) => void;
  pauseGameSession: (userId: string) => void;
  finishGameSession: (userId: string) => void;
  computers: Computer[];
  addComputer: (name?: string) => void;
  removeComputer: (id: string) => void;
  renameComputer: (id: string, name: string) => void;
  assignComputer: (userId: string, computerId: string | undefined) => void;
  getSessionByComputer: (computerId: string) => GameSession | undefined;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdBy'>) => void;
  deleteExpense: (id: string) => void;
  importExpenses: (expenses: Expense[]) => number;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const uid = () => crypto.randomUUID();

const emptyData: LMSData = {
  users: [], turmas: [], materials: [], announcements: [], attendanceRecords: [],
  materialProgress: [], submissions: [], payments: [], gameTimeTransactions: [],
  gameSessions: [], expenses: [], computers: [],
};

// ---- Mappers (DB row -> app type) ----
const rowTurma = (r: any): Turma => ({ id: r.id, name: r.name, description: r.description || '', professorId: r.professor_id || '', createdAt: r.created_at });
const rowMaterial = (r: any): Material => ({ id: r.id, turmaId: r.turma_id, professorId: r.professor_id, title: r.title, type: r.type, fileName: r.file_name || undefined, fileType: r.file_type || undefined, fileData: r.file_data || undefined, videoUrl: r.video_url || undefined, uploadedAt: r.uploaded_at });
const rowAnn = (r: any): Announcement => ({ id: r.id, title: r.title, content: r.content || '', authorId: r.author_id, turmaId: r.turma_id || undefined, createdAt: r.created_at });
const rowAtt = (r: any): AttendanceRecord => ({ id: r.id, turmaId: r.turma_id, date: r.date, professorId: r.professor_id, records: r.records || [], createdAt: r.created_at });
const rowProg = (r: any): MaterialProgress => ({ id: r.id, studentId: r.student_id, materialId: r.material_id, completedAt: r.completed_at });
const rowSub = (r: any): StudentSubmission => ({ id: r.id, studentId: r.student_id, turmaId: r.turma_id, fileName: r.file_name, fileType: r.file_type || undefined, fileData: r.file_data || undefined, submittedAt: r.submitted_at, status: r.status });
const rowPay = (r: any): Payment => ({ id: r.id, studentId: r.student_id, month: r.month, amount: Number(r.amount), status: r.status, paidAt: r.paid_at || undefined });
const rowComp = (r: any): Computer => ({ id: r.id, name: r.name, createdAt: r.created_at });
const rowSess = (r: any): GameSession => ({ userId: r.user_id, status: r.status, remainingSeconds: r.remaining_seconds, lastStartedAt: r.last_started_at || undefined, updatedAt: r.updated_at, computerId: r.computer_id || undefined });
const rowTx = (r: any): GameTimeTransaction => ({ id: r.id, userId: r.user_id, sellerId: r.seller_id || '', minutes: r.minutes, amountPaid: Number(r.amount_paid), note: r.note || undefined, createdAt: r.created_at, computerId: r.computer_id || undefined, paymentMethod: r.payment_method || undefined, operation: r.operation || undefined });
const rowExp = (r: any): Expense => ({ id: r.id, description: r.description, category: r.category, amount: Number(r.amount), note: r.note || undefined, createdAt: r.created_at, createdBy: r.created_by || '' });

const sessToRow = (s: GameSession) => ({ user_id: s.userId, status: s.status, remaining_seconds: s.remainingSeconds, last_started_at: s.lastStartedAt ?? null, computer_id: s.computerId ?? null, updated_at: s.updatedAt });

export function LMSProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<LMSData>(emptyData);
  const [isInitialized, setIsInitialized] = useState(false);

  const buildUsers = async (): Promise<User[]> => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
    ]);
    const roleMap = new Map<string, UserRole>();
    (roles || []).forEach((r: any) => { if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role); });
    return (profiles || []).map((p: any): User => ({
      id: p.id, name: p.name, email: p.email || '', password: '',
      cpf: p.cpf || undefined, phone: p.phone || undefined, address: p.address || undefined,
      role: roleMap.get(p.id) || 'cliente',
      turmaId: p.turma_id || undefined, turmaIds: p.turma_ids || undefined,
      createdAt: p.created_at, enrollmentDate: p.enrollment_date || undefined,
      courseStartDate: p.course_start_date || undefined, courseEndDate: p.course_end_date || undefined,
    }));
  };

  const loadAll = async () => {
    const [users, turmas, materials, announcements, attendance, progress, submissions, payments, computers, sessions, txs, expenses] = await Promise.all([
      buildUsers(),
      supabase.from('turmas').select('*'),
      supabase.from('materials').select('*'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('attendance_records').select('*'),
      supabase.from('material_progress').select('*'),
      supabase.from('submissions').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('computers').select('*'),
      supabase.from('game_sessions').select('*'),
      supabase.from('game_time_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
    ]);
    setData({
      users,
      turmas: (turmas.data || []).map(rowTurma),
      materials: (materials.data || []).map(rowMaterial),
      announcements: (announcements.data || []).map(rowAnn),
      attendanceRecords: (attendance.data || []).map(rowAtt),
      materialProgress: (progress.data || []).map(rowProg),
      submissions: (submissions.data || []).map(rowSub),
      payments: (payments.data || []).map(rowPay),
      computers: (computers.data || []).map(rowComp),
      gameSessions: (sessions.data || []).map(rowSess),
      gameTimeTransactions: (txs.data || []).map(rowTx),
      expenses: (expenses.data || []).map(rowExp),
    });
  };

  const loadCurrentUser = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const authUser = sess.session?.user;
    if (!authUser) { setCurrentUser(null); return; }
    const users = await buildUsers();
    const me = users.find(u => u.id === authUser.id) || null;
    setCurrentUser(me);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // defer supabase calls out of the callback
        setTimeout(() => { loadCurrentUser(); loadAll(); }, 0);
      } else {
        setCurrentUser(null);
        setData(emptyData);
      }
    });

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session?.user) {
        await Promise.all([loadCurrentUser(), loadAll()]);
      }
      setIsInitialized(true);
    })();

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginByCredentials = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      const msg = /invalid login credentials/i.test(error.message) ? 'E-mail ou senha incorretos' : error.message;
      return { success: false, error: msg };
    }
    await Promise.all([loadCurrentUser(), loadAll()]);
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setData(emptyData);
  };

  // ===== Users (via edge functions) =====
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const { data: res, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: userData.email, password: userData.password || 'senha123', name: userData.name,
        role: userData.role, cpf: userData.cpf, phone: userData.phone, address: userData.address,
        turmaId: userData.turmaId, turmaIds: userData.turmaIds,
        enrollmentDate: userData.enrollmentDate, courseStartDate: userData.courseStartDate, courseEndDate: userData.courseEndDate,
      },
    });
    if (error || (res as any)?.error) {
      return { success: false, error: (res as any)?.error || error?.message || 'Erro ao criar usuário' };
    }
    await loadAll();
    return { success: true };
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setData(prev => {
      const target = prev.users.find(u => u.id === id);
      const syncTurmas = target?.role === 'professor' && userData.turmaIds !== undefined;
      const newTurmaIds = userData.turmaIds || [];
      return {
        ...prev,
        users: prev.users.map(u => (u.id === id ? { ...u, ...userData } : u)),
        turmas: syncTurmas
          ? prev.turmas.map(t => {
              if (newTurmaIds.includes(t.id)) return { ...t, professorId: id };
              if (t.professorId === id && !newTurmaIds.includes(t.id)) return { ...t, professorId: '' };
              return t;
            })
          : prev.turmas,
      };
    });
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
    // persist profile fields
    const patch: any = {};
    if (userData.name !== undefined) patch.name = userData.name;
    if (userData.cpf !== undefined) patch.cpf = userData.cpf || null;
    if (userData.phone !== undefined) patch.phone = userData.phone || null;
    if (userData.address !== undefined) patch.address = userData.address || null;
    if (userData.turmaId !== undefined) patch.turma_id = userData.turmaId || null;
    if (userData.turmaIds !== undefined) patch.turma_ids = userData.turmaIds;
    if (userData.enrollmentDate !== undefined) patch.enrollment_date = userData.enrollmentDate || null;
    if (userData.courseStartDate !== undefined) patch.course_start_date = userData.courseStartDate || null;
    if (userData.courseEndDate !== undefined) patch.course_end_date = userData.courseEndDate || null;
    if (Object.keys(patch).length) supabase.from('profiles').update(patch).eq('id', id).then(() => {});
    if (userData.email !== undefined) supabase.from('profiles').update({ email: userData.email }).eq('id', id).then(() => {});
    if (userData.role !== undefined) {
      supabase.from('user_roles').delete().eq('user_id', id).then(() =>
        supabase.from('user_roles').insert({ user_id: id, role: userData.role }).then(() => {})
      );
    }
    // sync turma professor assignment
    const target = data.users.find(u => u.id === id);
    if (target?.role === 'professor' && userData.turmaIds !== undefined) {
      supabase.from('turmas').update({ professor_id: null }).eq('professor_id', id).then(() => {
        if (userData.turmaIds!.length) supabase.from('turmas').update({ professor_id: id }).in('id', userData.turmaIds!).then(() => {});
      });
    }
  };

  const deleteUser = (id: string) => {
    setData(prev => {
      const target = prev.users.find(u => u.id === id);
      const isProfessor = target?.role === 'professor';
      return {
        ...prev,
        users: prev.users.filter(u => u.id !== id),
        payments: prev.payments.filter(p => p.studentId !== id),
        submissions: prev.submissions.filter(s => s.studentId !== id),
        materialProgress: prev.materialProgress.filter(p => p.studentId !== id),
        attendanceRecords: prev.attendanceRecords.map(r => ({ ...r, records: r.records.filter(rec => rec.studentId !== id) })),
        turmas: isProfessor ? prev.turmas.map(t => (t.professorId === id ? { ...t, professorId: '' } : t)) : prev.turmas,
        materials: isProfessor ? prev.materials.filter(m => m.professorId !== id) : prev.materials,
      };
    });
    // clean related rows then delete auth user
    Promise.all([
      supabase.from('payments').delete().eq('student_id', id),
      supabase.from('submissions').delete().eq('student_id', id),
      supabase.from('material_progress').delete().eq('student_id', id),
      supabase.from('turmas').update({ professor_id: null }).eq('professor_id', id),
    ]).then(() => supabase.functions.invoke('admin-delete-user', { body: { userId: id } }).then(() => loadAll()));
  };

  // ===== Turmas =====
  const addTurma = (turmaData: Omit<Turma, 'id' | 'createdAt'>) => {
    const id = uid();
    const newTurma: Turma = { ...turmaData, id, createdAt: new Date().toISOString() };
    setData(prev => ({
      ...prev,
      turmas: [...prev.turmas, newTurma],
      users: prev.users.map(u => u.id === turmaData.professorId ? { ...u, turmaIds: [...(u.turmaIds || []), id] } : u),
    }));
    supabase.from('turmas').insert({ id, name: turmaData.name, description: turmaData.description, professor_id: turmaData.professorId || null }).then(() => {
      if (turmaData.professorId) {
        const prof = data.users.find(u => u.id === turmaData.professorId);
        const ids = [...(prof?.turmaIds || []), id];
        supabase.from('profiles').update({ turma_ids: ids }).eq('id', turmaData.professorId).then(() => {});
      }
    });
  };

  const updateTurma = (id: string, turmaData: Partial<Turma>) => {
    const existing = data.turmas.find(t => t.id === id);
    const oldProf = existing?.professorId;
    const newProf = turmaData.professorId;
    const profChanged = newProf !== undefined && newProf !== oldProf;
    setData(prev => ({
      ...prev,
      turmas: prev.turmas.map(t => (t.id === id ? { ...t, ...turmaData } : t)),
      users: profChanged ? prev.users.map(u => {
        if (u.id === oldProf) return { ...u, turmaIds: (u.turmaIds || []).filter(tid => tid !== id) };
        if (u.id === newProf) { const ids = u.turmaIds || []; return { ...u, turmaIds: ids.includes(id) ? ids : [...ids, id] }; }
        return u;
      }) : prev.users,
    }));
    const patch: any = {};
    if (turmaData.name !== undefined) patch.name = turmaData.name;
    if (turmaData.description !== undefined) patch.description = turmaData.description;
    if (turmaData.professorId !== undefined) patch.professor_id = turmaData.professorId || null;
    supabase.from('turmas').update(patch).eq('id', id).then(() => {});
    if (profChanged) {
      if (oldProf) { const ids = (data.users.find(u => u.id === oldProf)?.turmaIds || []).filter(t => t !== id); supabase.from('profiles').update({ turma_ids: ids }).eq('id', oldProf).then(() => {}); }
      if (newProf) { const cur = data.users.find(u => u.id === newProf)?.turmaIds || []; const ids = cur.includes(id) ? cur : [...cur, id]; supabase.from('profiles').update({ turma_ids: ids }).eq('id', newProf).then(() => {}); }
    }
  };

  const deleteTurma = (id: string) => {
    setData(prev => {
      const materialIds = prev.materials.filter(m => m.turmaId === id).map(m => m.id);
      return {
        ...prev,
        turmas: prev.turmas.filter(t => t.id !== id),
        materials: prev.materials.filter(m => m.turmaId !== id),
        submissions: prev.submissions.filter(s => s.turmaId !== id),
        attendanceRecords: prev.attendanceRecords.filter(r => r.turmaId !== id),
        materialProgress: prev.materialProgress.filter(p => !materialIds.includes(p.materialId)),
        users: prev.users.map(u => {
          if (u.turmaId === id) return { ...u, turmaId: undefined };
          if (u.turmaIds?.includes(id)) return { ...u, turmaIds: u.turmaIds.filter(tid => tid !== id) };
          return u;
        }),
      };
    });
    Promise.all([
      supabase.from('materials').delete().eq('turma_id', id),
      supabase.from('submissions').delete().eq('turma_id', id),
      supabase.from('attendance_records').delete().eq('turma_id', id),
      supabase.from('turmas').delete().eq('id', id),
    ]).then(() => loadAll());
  };

  // ===== Materials =====
  const addMaterial = (m: Omit<Material, 'id' | 'uploadedAt'>) => {
    const id = uid();
    const newMaterial: Material = { ...m, id, uploadedAt: new Date().toISOString() };
    setData(prev => ({ ...prev, materials: [...prev.materials, newMaterial] }));
    supabase.from('materials').insert({ id, turma_id: m.turmaId || null, professor_id: m.professorId || null, title: m.title, type: m.type, file_name: m.fileName ?? null, file_type: m.fileType ?? null, file_data: m.fileData ?? null, video_url: m.videoUrl ?? null }).then(() => {});
  };

  const deleteMaterial = (id: string) => {
    setData(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
    supabase.from('materials').delete().eq('id', id).then(() => {});
  };

  // ===== Submissions =====
  const addSubmission = (s: Omit<StudentSubmission, 'id' | 'submittedAt' | 'status'>) => {
    const id = uid();
    const newSub: StudentSubmission = { ...s, id, submittedAt: new Date().toISOString(), status: 'pending' };
    setData(prev => ({ ...prev, submissions: [...prev.submissions, newSub] }));
    supabase.from('submissions').insert({ id, student_id: s.studentId, turma_id: s.turmaId || null, file_name: s.fileName, file_type: s.fileType ?? null, file_data: s.fileData ?? null, status: 'pending' }).then(() => {});
  };

  const updateSubmission = (id: string, s: Partial<StudentSubmission>) => {
    setData(prev => ({ ...prev, submissions: prev.submissions.map(x => x.id === id ? { ...x, ...s } : x) }));
    const patch: any = {};
    if (s.status !== undefined) patch.status = s.status;
    if (s.fileName !== undefined) patch.file_name = s.fileName;
    supabase.from('submissions').update(patch).eq('id', id).then(() => {});
  };

  // ===== Payments =====
  const addPayment = (p: Omit<Payment, 'id'>) => {
    const id = uid();
    setData(prev => ({ ...prev, payments: [...prev.payments, { ...p, id }] }));
    supabase.from('payments').insert({ id, student_id: p.studentId, month: p.month, amount: p.amount, status: p.status, paid_at: p.paidAt ?? null }).then(() => {});
  };

  const updatePayment = (id: string, p: Partial<Payment>) => {
    setData(prev => ({ ...prev, payments: prev.payments.map(x => x.id === id ? { ...x, ...p } : x) }));
    const patch: any = {};
    if (p.amount !== undefined) patch.amount = p.amount;
    if (p.status !== undefined) patch.status = p.status;
    if (p.paidAt !== undefined) patch.paid_at = p.paidAt ?? null;
    supabase.from('payments').update(patch).eq('id', id).then(() => {});
  };

  const markPaymentAsPaid = (id: string) => {
    const paidAt = new Date().toISOString();
    setData(prev => ({ ...prev, payments: prev.payments.map(p => p.id === id ? { ...p, status: 'paid', paidAt } : p) }));
    supabase.from('payments').update({ status: 'paid', paid_at: paidAt }).eq('id', id).then(() => {});
  };

  const markPaymentAsPending = (id: string) => {
    setData(prev => ({ ...prev, payments: prev.payments.map(p => p.id === id ? { ...p, status: 'pending', paidAt: undefined } : p) }));
    supabase.from('payments').update({ status: 'pending', paid_at: null }).eq('id', id).then(() => {});
  };

  const generate2026Payments = (studentId: string) => {
    const existingMonths = data.payments.filter(p => p.studentId === studentId && p.month.startsWith('2026')).map(p => p.month);
    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const newPayments: Payment[] = [];
    months.forEach(m => { const key = `2026-${m}`; if (!existingMonths.includes(key)) newPayments.push({ id: uid(), studentId, month: key, amount: 299.9, status: 'pending' }); });
    if (newPayments.length) {
      setData(prev => ({ ...prev, payments: [...prev.payments, ...newPayments] }));
      supabase.from('payments').insert(newPayments.map(p => ({ id: p.id, student_id: p.studentId, month: p.month, amount: p.amount, status: p.status }))).then(() => {});
    }
  };

  // ===== Announcements =====
  const addAnnouncement = (a: Omit<Announcement, 'id' | 'createdAt'>) => {
    const id = uid();
    const newA: Announcement = { ...a, id, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, announcements: [newA, ...prev.announcements] }));
    supabase.from('announcements').insert({ id, title: a.title, content: a.content, author_id: a.authorId || null, turma_id: a.turmaId || null }).then(() => {});
  };

  const deleteAnnouncement = (id: string) => {
    setData(prev => ({ ...prev, announcements: prev.announcements.filter(a => a.id !== id) }));
    supabase.from('announcements').delete().eq('id', id).then(() => {});
  };

  // ===== Attendance =====
  const addAttendanceRecord = (recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const existing = data.attendanceRecords.find(r => r.turmaId === recordData.turmaId && r.date === recordData.date);
    if (existing) {
      setData(prev => ({ ...prev, attendanceRecords: prev.attendanceRecords.map(r => r.id === existing.id ? { ...r, records: recordData.records } : r) }));
      supabase.from('attendance_records').update({ records: recordData.records }).eq('id', existing.id).then(() => {});
    } else {
      const id = uid();
      const newRecord: AttendanceRecord = { ...recordData, id, createdAt: new Date().toISOString() };
      setData(prev => ({ ...prev, attendanceRecords: [...prev.attendanceRecords, newRecord] }));
      supabase.from('attendance_records').insert({ id, turma_id: recordData.turmaId, date: recordData.date, professor_id: recordData.professorId || null, records: recordData.records }).then(() => {});
    }
  };

  const getAttendanceByTurmaAndDate = (turmaId: string, date: string) => data.attendanceRecords.find(r => r.turmaId === turmaId && r.date === date);
  const getAttendanceByTurma = (turmaId: string) => data.attendanceRecords.filter(r => r.turmaId === turmaId).sort((a, b) => b.date.localeCompare(a.date));
  const getStudentAttendance = (studentId: string) => {
    const result: { date: string; present: boolean; note?: string; turmaId: string }[] = [];
    data.attendanceRecords.forEach(r => { const rec = r.records.find(x => x.studentId === studentId); if (rec) result.push({ date: r.date, present: rec.present, note: rec.note, turmaId: r.turmaId }); });
    return result.sort((a, b) => b.date.localeCompare(a.date));
  };

  // ===== Progress =====
  const toggleMaterialProgress = (studentId: string, materialId: string) => {
    const existing = data.materialProgress.find(p => p.studentId === studentId && p.materialId === materialId);
    if (existing) {
      setData(prev => ({ ...prev, materialProgress: prev.materialProgress.filter(p => p.id !== existing.id) }));
      supabase.from('material_progress').delete().eq('id', existing.id).then(() => {});
    } else {
      const id = uid();
      setData(prev => ({ ...prev, materialProgress: [...prev.materialProgress, { id, studentId, materialId, completedAt: new Date().toISOString() }] }));
      supabase.from('material_progress').insert({ id, student_id: studentId, material_id: materialId }).then(() => {});
    }
  };

  const getStudentProgress = (studentId: string) => data.materialProgress.filter(p => p.studentId === studentId);
  const getStudentsByTurma = (turmaId: string) => data.users.filter(u => u.role === 'aluno' && u.turmaId === turmaId);
  const getMaterialsByTurma = (turmaId: string) => data.materials.filter(m => m.turmaId === turmaId);
  const getSubmissionsByTurma = (turmaId: string) => data.submissions.filter(s => s.turmaId === turmaId);
  const getPaymentsByStudent = (studentId: string) => data.payments.filter(p => p.studentId === studentId);
  const getTurmaById = (id: string) => data.turmas.find(t => t.id === id);
  const getUserById = (id: string) => data.users.find(u => u.id === id);
  const getTurmasByProfessor = (professorId: string) => {
    const professor = data.users.find(u => u.id === professorId);
    if (!professor?.turmaIds) return data.turmas.filter(t => t.professorId === professorId);
    return data.turmas.filter(t => professor.turmaIds?.includes(t.id));
  };

  // ===== Game sessions helpers =====
  const persistSession = (s: GameSession) => { supabase.from('game_sessions').upsert(sessToRow(s), { onConflict: 'user_id' }).then(() => {}); };
  const deleteSessionRow = (userId: string) => { supabase.from('game_sessions').delete().eq('user_id', userId).then(() => {}); };

  const buildAdjusted = (existing: GameSession | undefined, userId: string, deltaSeconds: number): GameSession => {
    const now = new Date().toISOString();
    const settled = getSessionRemainingSeconds(existing, Date.now());
    const nextRemaining = Math.max(0, settled + deltaSeconds);
    const running = existing?.status === 'running' && nextRemaining > 0;
    return { userId, status: running ? 'running' : 'paused', remainingSeconds: nextRemaining, lastStartedAt: running ? now : undefined, updatedAt: now, computerId: existing?.computerId };
  };

  const addGameTime = (userId: string, minutes: number, amountPaid: number, note?: string, opts?: { computerId?: string; paymentMethod?: string; operation?: string }) => {
    if (minutes <= 0) return;
    const id = uid();
    const tx: GameTimeTransaction = { id, userId, sellerId: currentUser?.id || '', minutes, amountPaid, note, createdAt: new Date().toISOString(), computerId: opts?.computerId, paymentMethod: opts?.paymentMethod, operation: opts?.operation || 'Adição de tempo' };
    const existing = data.gameSessions.find(s => s.userId === userId);
    const updated = buildAdjusted(existing, userId, minutes * 60);
    setData(prev => ({ ...prev, gameTimeTransactions: [tx, ...prev.gameTimeTransactions], gameSessions: [...prev.gameSessions.filter(s => s.userId !== userId), updated] }));
    supabase.from('game_time_transactions').insert({ id, user_id: userId, seller_id: tx.sellerId || null, minutes, amount_paid: amountPaid, note: note ?? null, computer_id: opts?.computerId ?? null, payment_method: opts?.paymentMethod ?? null, operation: tx.operation }).then(() => {});
    persistSession(updated);
  };

  const removeGameTime = (userId: string, minutes: number, note?: string) => {
    if (minutes <= 0) return;
    const id = uid();
    const tx: GameTimeTransaction = { id, userId, sellerId: currentUser?.id || '', minutes: -Math.abs(minutes), amountPaid: 0, note, createdAt: new Date().toISOString() };
    const existing = data.gameSessions.find(s => s.userId === userId);
    const updated = buildAdjusted(existing, userId, -Math.abs(minutes) * 60);
    setData(prev => ({ ...prev, gameTimeTransactions: [tx, ...prev.gameTimeTransactions], gameSessions: [...prev.gameSessions.filter(s => s.userId !== userId), updated] }));
    supabase.from('game_time_transactions').insert({ id, user_id: userId, seller_id: tx.sellerId || null, minutes: tx.minutes, amount_paid: 0, note: note ?? null }).then(() => {});
    persistSession(updated);
  };

  const getUserTimeBalance = (userId: string) => data.gameTimeTransactions.filter(t => t.userId === userId).reduce((s, t) => s + t.minutes, 0);
  const getUserTimeTransactions = (userId: string) => data.gameTimeTransactions.filter(t => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const importGameTransactions = (txs: GameTimeTransaction[]) => {
    if (!txs.length) return 0;
    const existingIds = new Set(data.gameTimeTransactions.map(t => t.id));
    const toAdd = txs.filter(t => t.id && !existingIds.has(t.id));
    if (!toAdd.length) return 0;
    setData(prev => ({ ...prev, gameTimeTransactions: [...toAdd, ...prev.gameTimeTransactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }));
    supabase.from('game_time_transactions').insert(toAdd.map(t => ({ id: t.id, user_id: t.userId, seller_id: t.sellerId || null, minutes: t.minutes, amount_paid: t.amountPaid, note: t.note ?? null, computer_id: t.computerId ?? null, payment_method: t.paymentMethod ?? null, operation: t.operation ?? null, created_at: t.createdAt }))).then(() => {});
    return toAdd.length;
  };

  const getGameSession = (userId: string) => data.gameSessions.find(s => s.userId === userId);

  const startGameSession = (userId: string) => {
    const existing = data.gameSessions.find(s => s.userId === userId);
    const settled = getSessionRemainingSeconds(existing, Date.now());
    if (settled <= 0) return;
    const now = new Date().toISOString();
    const updated: GameSession = { userId, status: 'running', remainingSeconds: settled, lastStartedAt: now, updatedAt: now, computerId: existing?.computerId };
    setData(prev => ({ ...prev, gameSessions: [...prev.gameSessions.filter(s => s.userId !== userId), updated] }));
    persistSession(updated);
  };

  const pauseGameSession = (userId: string) => {
    const existing = data.gameSessions.find(s => s.userId === userId);
    if (!existing) return;
    const settled = getSessionRemainingSeconds(existing, Date.now());
    const now = new Date().toISOString();
    const updated: GameSession = { userId, status: 'paused', remainingSeconds: settled, lastStartedAt: undefined, updatedAt: now, computerId: existing?.computerId };
    setData(prev => ({ ...prev, gameSessions: [...prev.gameSessions.filter(s => s.userId !== userId), updated] }));
    persistSession(updated);
  };

  const finishGameSession = (userId: string) => {
    const existing = data.gameSessions.find(s => s.userId === userId);
    const settled = getSessionRemainingSeconds(existing, Date.now());
    const now = new Date().toISOString();
    if (settled > 0) {
      const mins = Math.ceil(settled / 60);
      const id = uid();
      const tx: GameTimeTransaction = { id, userId, sellerId: currentUser?.id || '', minutes: -mins, amountPaid: 0, note: 'Sessão finalizada', createdAt: now, computerId: existing?.computerId, operation: 'Finalização' };
      setData(prev => ({ ...prev, gameTimeTransactions: [tx, ...prev.gameTimeTransactions], gameSessions: prev.gameSessions.filter(s => s.userId !== userId) }));
      supabase.from('game_time_transactions').insert({ id, user_id: userId, seller_id: tx.sellerId || null, minutes: -mins, amount_paid: 0, note: 'Sessão finalizada', computer_id: existing?.computerId ?? null, operation: 'Finalização' }).then(() => {});
    } else {
      setData(prev => ({ ...prev, gameSessions: prev.gameSessions.filter(s => s.userId !== userId) }));
    }
    deleteSessionRow(userId);
  };

  // ===== Computers =====
  const getSessionByComputer = (computerId: string) => data.gameSessions.find(s => s.computerId === computerId);

  const addComputer = (name?: string) => {
    const id = uid();
    const nm = name?.trim() || `PC${String(data.computers.length + 1).padStart(2, '0')}`;
    setData(prev => ({ ...prev, computers: [...prev.computers, { id, name: nm, createdAt: new Date().toISOString() }] }));
    supabase.from('computers').insert({ id, name: nm }).then(() => {});
  };

  const removeComputer = (id: string) => {
    setData(prev => ({ ...prev, computers: prev.computers.filter(c => c.id !== id), gameSessions: prev.gameSessions.map(s => s.computerId === id ? { ...s, computerId: undefined } : s) }));
    supabase.from('game_sessions').update({ computer_id: null }).eq('computer_id', id).then(() => supabase.from('computers').delete().eq('id', id).then(() => {}));
  };

  const renameComputer = (id: string, name: string) => {
    const nm = name.trim();
    if (!nm) return;
    setData(prev => ({ ...prev, computers: prev.computers.map(c => c.id === id ? { ...c, name: nm } : c) }));
    supabase.from('computers').update({ name: nm }).eq('id', id).then(() => {});
  };

  const assignComputer = (userId: string, computerId: string | undefined) => {
    const existing = data.gameSessions.find(s => s.userId === userId);
    const now = new Date().toISOString();
    // free the computer from another player first
    const toFree = computerId ? data.gameSessions.filter(s => s.userId !== userId && s.computerId === computerId) : [];
    setData(prev => {
      let sessions = prev.gameSessions;
      if (computerId) sessions = sessions.map(s => s.userId !== userId && s.computerId === computerId ? { ...s, computerId: undefined } : s);
      if (existing) sessions = sessions.map(s => s.userId === userId ? { ...s, computerId } : s);
      else sessions = [...sessions, { userId, status: 'paused', remainingSeconds: 0, updatedAt: now, computerId }];
      return { ...prev, gameSessions: sessions };
    });
    toFree.forEach(s => persistSession({ ...s, computerId: undefined }));
    const updated: GameSession = existing ? { ...existing, computerId } : { userId, status: 'paused', remainingSeconds: 0, updatedAt: now, computerId };
    persistSession(updated);
  };

  // ===== Expenses =====
  const addExpense = (expense: Omit<Expense, 'id' | 'createdBy'>) => {
    const id = uid();
    const newExpense: Expense = { ...expense, id, createdBy: currentUser?.id || '' };
    setData(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
    supabase.from('expenses').insert({ id, description: expense.description, category: expense.category, amount: expense.amount, note: expense.note ?? null, created_by: currentUser?.id ?? null, created_at: expense.createdAt }).then(() => {});
  };

  const deleteExpense = (id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    supabase.from('expenses').delete().eq('id', id).then(() => {});
  };

  const importExpenses = (expenses: Expense[]) => {
    const ids = new Set(data.expenses.map(e => e.id));
    const toAdd = expenses.filter(e => !ids.has(e.id));
    if (!toAdd.length) return 0;
    setData(prev => ({ ...prev, expenses: [...toAdd, ...prev.expenses] }));
    supabase.from('expenses').insert(toAdd.map(e => ({ id: e.id, description: e.description, category: e.category, amount: e.amount, note: e.note ?? null, created_by: currentUser?.id ?? null, created_at: e.createdAt }))).then(() => {});
    return toAdd.length;
  };

  return (
    <LMSContext.Provider value={{
      currentUser, isInitialized,
      users: data.users, turmas: data.turmas, materials: data.materials, submissions: data.submissions,
      payments: data.payments, announcements: data.announcements, attendanceRecords: data.attendanceRecords,
      materialProgress: data.materialProgress,
      loginByCredentials, logout, addUser, updateUser, deleteUser, addTurma, updateTurma, deleteTurma,
      addMaterial, deleteMaterial, addSubmission, updateSubmission, addPayment, updatePayment,
      markPaymentAsPaid, markPaymentAsPending, getStudentsByTurma, getMaterialsByTurma, getSubmissionsByTurma,
      getPaymentsByStudent, getTurmaById, getUserById, getTurmasByProfessor, generate2026Payments,
      addAnnouncement, deleteAnnouncement, addAttendanceRecord, getAttendanceByTurmaAndDate, getAttendanceByTurma,
      getStudentAttendance, toggleMaterialProgress, getStudentProgress,
      gameTimeTransactions: data.gameTimeTransactions, gameSessions: data.gameSessions,
      addGameTime, removeGameTime, getUserTimeBalance, getUserTimeTransactions, importGameTransactions,
      getGameSession, startGameSession, pauseGameSession, finishGameSession,
      computers: data.computers, addComputer, removeComputer, renameComputer, assignComputer, getSessionByComputer,
      expenses: data.expenses, addExpense, deleteExpense, importExpenses,
    }}>
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  const context = useContext(LMSContext);
  if (!context) throw new Error('useLMS must be used within a LMSProvider');
  return context;
}
