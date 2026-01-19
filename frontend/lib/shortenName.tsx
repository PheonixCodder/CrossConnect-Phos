export function getFirstTwoLetters(fullName: string) {
  // Ensure the input is a string and trim any leading/trailing whitespace
  if (typeof fullName !== "string") {
    return "";
  }
  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return "";
  }

  // Split the name into words
  const words = trimmedName.split(/\s+/);

  if (words.length >= 2) {
    // If two or more words, take the first letter of the first word
    // and the first letter of the second word
    const firstInitial = words[0].charAt(0);
    const secondInitial = words[1].charAt(0);
    return (firstInitial + secondInitial).toUpperCase();
  } else {
    // If only one word, take the first two letters of that word
    // (handling names shorter than 2 characters gracefully by taking all available chars)
    return trimmedName.substring(0, 2).toUpperCase();
  }
}
