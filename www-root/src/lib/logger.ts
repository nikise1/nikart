export function devDebug(message: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") return;

  if (data) {
    console.debug(message, data);
    return;
  }

  console.debug(message);
}
