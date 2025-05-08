
// A generalized list of wordbank presets to always be present in the player's wordbank.
// Helps to prevent players from being subjected to use of minimal wordbanks.


//Imported into matchmakingHandler.js in which this array is saved to the database on initialization.


const defaultWordbank = [
	"the",
	"in",
	"around",
	"a",
	"for",
	"at",
	"4K",
	"black-and-white",
	"comicbook-style",
	"photograph",
	"realistic",
	"surreal",
	"minimalist",
	"and",
	"fighting",
	"hugging",
	"running",
	"jumping"
];

// Themed wordbanks
const themedWordbanks = {
	medieval: [
		"castle", "knight", "sword", "dragon", "kingdom", "wizard", "armor", "siege", "torch", "scroll"
	],
	scienceFiction: [
		"spaceship", "laser", "robot", "planet", "AI", "cyborg", "quantum", "alien", "galaxy", "clone"
	],
	spooky: [
		"ghost", "haunted", "midnight", "fog", "cemetery", "scream", "cursed", "witch", "coffin", "shadow"
	],
	vacation: [
		"beach", "island", "surfboard", "passport", "sunburn", "suitcase", "cocktail", "snorkel", "flight", "hotel"
	],
	animals: [
		"lion", "penguin", "koala", "giraffe", "dolphin", "eagle", "snake", "panda", "tiger", "kangaroo"
	],
	nature: [
		"mountain", "river", "tree", "meadow", "sunrise", "rainfall", "valley", "canyon", "cloud", "lake"
	]
};

// Returns default wordbank + a random themed one
export default function getRandomWordbank() {
	const themes = Object.keys(themedWordbanks);
	const randomTheme = themes[Math.floor(Math.random() * themes.length)];
	return [...defaultWordbank, ...themedWordbanks[randomTheme]];
}
