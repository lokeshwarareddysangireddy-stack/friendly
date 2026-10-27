export const GROCERY_SLUG = "grocery-and-daily-needs";

export interface GroceryCategory {
  tag: string;
  name: string;
  slug: string;
  illustration: string;
  /** Cover image shown on the category-first landing page. */
  image: string;
  /** Short description used for the card and the category header. */
  blurb: string;
}

const CATEGORY_COVER = "/images/categories/grocery";

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  {
    tag: "rice-rice-products",
    name: "Rice & Rice Products",
    slug: "rice-and-rice-products",
    illustration: "🌾",
    image: `${CATEGORY_COVER}/rice-and-rice-products.jpg`,
    blurb: "Basmati, Sona Masoori, BPT and everyday rice in handy packs.",
  },
  {
    tag: "dals-pulses",
    name: "Dals & Pulses",
    slug: "dals-and-pulses",
    illustration: "🫘",
    image: `${CATEGORY_COVER}/dals-and-pulses.jpg`,
    blurb: "Toor, moong, chana and masoor dals plus whole pulses and grams.",
  },
  {
    tag: "flour-grains",
    name: "Flour & Grains",
    slug: "flour-and-grains",
    illustration: "🌾",
    image: `${CATEGORY_COVER}/flour-and-grains.jpg`,
    blurb: "Atta, rava, besan, dalia and everyday flours for every recipe.",
  },
  {
    tag: "cooking-oils-ghee",
    name: "Cooking Oils & Ghee",
    slug: "cooking-oils-and-ghee",
    illustration: "🫒",
    image: `${CATEGORY_COVER}/cooking-oils-and-ghee.jpg`,
    blurb: "Refined, cold-pressed and blended oils along with pure ghee.",
  },
  {
    tag: "salt-sugar-jaggery",
    name: "Salt, Sugar & Jaggery",
    slug: "salt-sugar-and-jaggery",
    illustration: "🧂",
    image: `${CATEGORY_COVER}/salt-sugar-and-jaggery.jpg`,
    blurb: "Iodised and rock salt, sugar, jaggery and everyday sweeteners.",
  },
  {
    tag: "spices-masalas",
    name: "Spices & Masalas",
    slug: "spices-and-masalas",
    illustration: "🌶️",
    image: `${CATEGORY_COVER}/spices-and-masalas.jpg`,
    blurb: "Whole spices, ground powders and ready-to-cook masala blends.",
  },
  {
    tag: "dry-fruits-nuts-seeds",
    name: "Dry Fruits, Nuts & Seeds",
    slug: "dry-fruits-nuts-and-seeds",
    illustration: "🥜",
    image: `${CATEGORY_COVER}/dry-fruits-nuts-and-seeds.jpg`,
    blurb: "Almonds, cashews, dates, raisins, makhana and health seeds.",
  },
  {
    tag: "breakfast-cereals",
    name: "Breakfast & Cereals",
    slug: "breakfast-and-cereals",
    illustration: "🥣",
    image: `${CATEGORY_COVER}/breakfast-and-cereals.jpg`,
    blurb: "Oats, corn flakes, poha, upma and ready breakfast mixes.",
  },
  {
    tag: "biscuits-cookies-rusks",
    name: "Biscuits, Cookies & Rusks",
    slug: "biscuits-cookies-and-rusks",
    illustration: "🍪",
    image: `${CATEGORY_COVER}/biscuits-cookies-and-rusks.jpg`,
    blurb: "Tea-time biscuits, cookies, rusk and cream crackers.",
  },
  {
    tag: "snacks-namkeen",
    name: "Snacks & Namkeen",
    slug: "snacks-and-namkeen",
    illustration: "🍿",
    image: `${CATEGORY_COVER}/snacks-and-namkeen.jpg`,
    blurb: "Chips, namkeen, mixtures, peanuts and savoury bites.",
  },
  {
    tag: "noodles-pasta-ready-mix",
    name: "Noodles, Pasta & Ready Mix",
    slug: "noodles-pasta-and-ready-mix",
    illustration: "🍝",
    image: `${CATEGORY_COVER}/noodles-pasta-and-ready-mix.jpg`,
    blurb: "Instant noodles, pasta, vermicelli and ready cooking mixes.",
  },
  {
    tag: "pickles-sauces-spreads",
    name: "Pickles, Sauces & Spreads",
    slug: "pickles-sauces-and-spreads",
    illustration: "🫙",
    image: `${CATEGORY_COVER}/pickles-sauces-and-spreads.jpg`,
    blurb: "Achar, ketchup, chilli sauce, jam and chocolate spreads.",
  },
  {
    tag: "dairy-refrigerated",
    name: "Dairy & Refrigerated",
    slug: "dairy-and-refrigerated",
    illustration: "🥛",
    image: `${CATEGORY_COVER}/dairy-and-refrigerated.jpg`,
    blurb: "Milk, curd, paneer, butter, cheese and chilled everyday essentials.",
  },
  {
    tag: "tea-coffee-beverages",
    name: "Tea, Coffee & Beverages",
    slug: "tea-coffee-and-beverages",
    illustration: "☕",
    image: `${CATEGORY_COVER}/tea-coffee-and-beverages.jpg`,
    blurb: "Tea dust, coffee, juices, health drinks and flavoured milk.",
  },
  {
    tag: "chocolates-sweets",
    name: "Chocolates & Sweets",
    slug: "chocolates-and-sweets",
    illustration: "🍫",
    image: `${CATEGORY_COVER}/chocolates-and-sweets.jpg`,
    blurb: "Chocolates, toffees, lollipops, cookies and Indian mithai.",
  },
  {
    tag: "baking-cooking",
    name: "Baking & Cooking",
    slug: "baking-and-cooking",
    illustration: "🧁",
    image: `${CATEGORY_COVER}/baking-and-cooking.jpg`,
    blurb: "Baking powder, soda, essence, corn starch and bread crumbs.",
  },
  {
    tag: "frozen-canned",
    name: "Frozen & Canned",
    slug: "frozen-and-canned",
    illustration: "🥫",
    image: `${CATEGORY_COVER}/frozen-and-canned.jpg`,
    blurb: "Frozen vegetables, fries, nuggets and canned goodness.",
  },
];

export const OTHER_GROCERY: GroceryCategory = {
  tag: "other-grocery",
  name: "More Grocery & Daily Needs",
  slug: "more-grocery-and-daily-needs",
  illustration: "🛒",
  image: `${CATEGORY_COVER}/more-grocery-and-daily-needs.jpg`,
  blurb: "Fresh produce and household essentials that round out your basket.",
};

export const GROCERY_TAGS = GROCERY_CATEGORIES.map((category) => category.tag);
export const GROCERY_ALIASES: Record<string, string[]> = {
  "rice-rice-products": ["rice"],
  "dals-pulses": ["dal"],
  "cooking-oils-ghee": ["oil"],
  "tea-coffee-beverages": ["tea"],
  "biscuits-cookies-rusks": ["biscuits"],
};
export function groceryGroup(tags: string[] = []) {
  return (
    GROCERY_TAGS.find((tag) => tags.includes(tag)) ||
    GROCERY_TAGS.find((tag) =>
      (GROCERY_ALIASES[tag] || []).some((alias) => tags.includes(alias))
    ) ||
    OTHER_GROCERY.tag
  );
}
