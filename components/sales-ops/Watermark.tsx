// Visible watermark removed on purpose. Sales Ops surfaces now rely on the
// silent PageviewBeacon + ScreenshotSignals combo so attribution is tracked
// server-side without tipping the viewer. Keeping the file as a no-op so the
// layout import doesn't need to change if we flip the mode back on later.
export default function Watermark() {
  return null;
}
