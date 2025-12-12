// jwriveros/lehanastudio/lib/chatUtils.ts

export const isStaffMessage = (m: any) =>
  m.sender_role === "staff" ||
  m.sender_role === "agent" ||
  m.direction === "outbound";

export const getSenderRole = (m: any): "client" | "staff" =>
  isStaffMessage(m) ? "staff" : "client";

export const normalizePhone = (phone: any) =>
  String(phone || "")
    .replace(/\D/g, "") // quitar todo lo que no es número
    .replace(/^57/, "57"); // dejamos 57 al inicio si está, solo limpiamos símbolos
