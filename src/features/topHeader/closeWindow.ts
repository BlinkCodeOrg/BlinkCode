export async function closeWindow(): Promise<void> {
  window.dispatchEvent(new CustomEvent('blinkcode:requestCloseWindow'));
}
