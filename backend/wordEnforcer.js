import profanityFilter from 'profanity-util';


//=============================================================
// This is a helper function that will enforce the word rules.
// This is used before user inputs enter the game wordbank.
//=============================================================

export function wordEnforcer(word) {

	// Extract only the first word (split by space and take the first element)
	word = word.trim().split(/\s+/)[0];

	// Remove special characters and numbers (keep only letters)
	word = word.replace(/[^a-zA-Z]/g, "");

	//Check if contains bad words
	if (profanityFilter.check(word).length > 0) {
		return "****"; // Return pointless string if it's a bad word
	}

	if (word == "") {
		return "****"; //If empty string, return pointless to be handled 
	}

	return word
}

export function removeBadWord(word) {
	//Check if contains bad words
	if (profanityFilter.check(word).length > 0) {
		return "****"; // Return pointless string if it's a bad word
	}

	return word
}