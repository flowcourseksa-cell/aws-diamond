// بيانات وهمية للوحة Center Admin

export const ADMIN_STATS = {
  totalStudents: 248,
  activeSubscriptions: 193,
  monthlyRevenue: 14450,
  completionRate: 68,
};

export const ADMIN_STUDENTS = [
  { id: "s1", name: "خالد العمري",    email: "khalid@email.com",   joinDate: "01 يونيو 2026", level: "A+", status: "active"  as const },
  { id: "s2", name: "سارة الحربي",    email: "sara@email.com",     joinDate: "03 يونيو 2026", level: "A",  status: "active"  as const },
  { id: "s3", name: "عبدالرحمن القرني",email: "abdulrahman@email.com",joinDate:"05 يونيو 2026",level:"B+", status: "pending" as const },
  { id: "s4", name: "نوف السبيعي",    email: "nouf@email.com",     joinDate: "07 يونيو 2026", level: "A",  status: "active"  as const },
  { id: "s5", name: "فيصل الدوسري",   email: "faisal@email.com",   joinDate: "08 يونيو 2026", level: "B",  status: "expired" as const },
  { id: "s6", name: "ريم العنزي",     email: "reem@email.com",     joinDate: "09 يونيو 2026", level: "A+", status: "active"  as const },
  { id: "s7", name: "تركي الزهراني",  email: "turki@email.com",    joinDate: "10 يونيو 2026", level: "B+", status: "active"  as const },
  { id: "s8", name: "لمى المطيري",    email: "lama@email.com",     joinDate: "11 يونيو 2026", level: "A",  status: "pending" as const },
  { id: "s9", name: "ماجد العتيبي",   email: "majed@email.com",    joinDate: "12 يونيو 2026", level: "B",  status: "expired" as const },
  { id: "s10",name: "هند القحطاني",   email: "hind@email.com",     joinDate: "13 يونيو 2026", level: "A+", status: "active"  as const },
];

export const DAILY_REVENUE = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  revenue: Math.floor(Math.random() * 800) + 300,
}));

export type StudentStatus = "active" | "pending" | "expired";
