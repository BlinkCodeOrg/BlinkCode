export async function fetchQuickOpenFiles(): Promise<string[]> {
  const res = await fetch('/api/files');
  const data = await res.json();
  return data.files || [];
}
