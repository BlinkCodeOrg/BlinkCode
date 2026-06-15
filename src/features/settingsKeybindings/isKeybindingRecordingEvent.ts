export function isKeybindingRecordingEvent(event: KeyboardEvent): boolean {
  return event.target instanceof Element
    && Boolean(event.target.closest('[data-keybinding-recording="true"]'));
}
