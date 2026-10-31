import { Haptics, ImpactStyle } from "@capacitor/haptics";

export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Light) {
  try {
    await Haptics.impact({ style });
  } catch (e) {
    // Silently fail if Haptics is not available (e.g. web browser)
  }
}
