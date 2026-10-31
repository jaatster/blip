/**
 * The blip voice's pitch (PixelSpeech.pitch): play("blip", { rate: voiceRate(letter, mood) }) for every other voiced
 * letter as text types out. Each letter has its own small step, so a word always sounds the same; vowels sit a step
 * up; happy is higher and sleepy lower.
 */
export type Mood = "plain" | "happy" | "sleepy";

/** The playback rate of a blip for a letter (1 is the blip as made). */
export function voiceRate(char: string, mood: Mood | string = "plain"): number {
  const c = char.toUpperCase();
  const base = mood === "happy" ? 1.18 : mood === "sleepy" ? 0.8 : 1;
  return base * ("AEIOU".includes(c) ? 1.12 : 1) * (1 + ((((c.charCodeAt(0) || 0) * 7) % 5) - 2) * 0.03);
}

/** Whether a character is voiced (letters and digits); spaces and marks are silent. */
export const voiced = (char: string): boolean => /[\p{L}\p{N}]/u.test(char);
