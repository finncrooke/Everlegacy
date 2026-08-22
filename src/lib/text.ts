/** "James" -> "James'", "Margaret" -> "Margaret's" — standard English possessive rules. */
export function possessive(name: string) {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}
