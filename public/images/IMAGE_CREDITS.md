# Image Credits & Asset Notes

## Grocery category covers (`categories/grocery/`)

The 17 grocery category covers and the "more grocery" cover are **AI-generated product
photography** produced by the open text-to-image endpoint
[Pollinations](https://pollinations.ai) (`https://image.pollinations.ai/prompt/...`), rendered by
`scripts/generate-grocery-images.mjs`. They contain no third-party logos or packaging, and the
generator watermark is cropped off before the file is written.

| File | Aspect | Source |
| --- | --- | --- |
| `categories/grocery/rice-and-rice-products.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/dals-and-pulses.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/flour-and-grains.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/cooking-oils-and-ghee.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/salt-sugar-and-jaggery.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/spices-and-masalas.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/dry-fruits-nuts-and-seeds.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/breakfast-and-cereals.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/biscuits-cookies-and-rusks.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/snacks-and-namkeen.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/noodles-pasta-and-ready-mix.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/pickles-sauces-and-spreads.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/dairy-and-refrigerated.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/tea-coffee-and-beverages.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/chocolates-and-sweets.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/baking-and-cooking.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/frozen-and-canned.jpg` | 4:3 | AI generated (Pollinations) |
| `categories/grocery/more-grocery-and-daily-needs.jpg` | 4:3 | AI generated (Pollinations) |

## Grocery product photography

Individual grocery product images are **not** stored in this folder. They are sourced from the
Flipkart and Amazon India public catalogues and stored permanently in Cloudinary by
`scripts/enrich-grocery-images.mjs`; the original source URL, source website, image type and
verification status are recorded on every product record and summarised in
`reports/grocery-image-report.md`.

## Other photographs in `public/images/`

All other photographs in `public/images/` are **license-free stock placeholders** sourced from
[Pexels](https://www.pexels.com) (Pexels License: free to use, no attribution required).
They are **not** final brand photography and are intended to be replaced with Friendly
Basket's own product and lifestyle photos.

To replace an image, drop a new file at the same path (keep the filename). Prefer
optimised `.jpg`/`.webp` files around the listed aspect ratio for best results.

## Hero

| File | Aspect | Source |
| --- | --- | --- |
| `hero/friendly-basket-hero.jpg` | 8:5 | Pexels photo `10079399` |
| `hero/floating-grocery-basket.jpg` | 2:3 | Pexels photo `10080934` |

## Banners

| File | Aspect | Source |
| --- | --- | --- |
| `banners/fresh-delivery-campaign.jpg` | 5:2 | Pexels photo `12765459` |

## Categories

| File | Source |
| --- | --- |
| `categories/fruits-vegetables.jpg` | Pexels photo `11669641` |
| `categories/grocery-daily-needs.jpg` | Pexels photo `12081286` |
| `categories/cafe-style-food.jpg` | Pexels photo `10679778` |
| `categories/biryani.jpg` | Pexels photo `12669168` |
| `categories/curries-meals.jpg` | Pexels photo `10464100` |
| `categories/medicines-health.jpg` | Pexels photo `11768811` |

## Products

| File | Source |
| --- | --- |
| `products/pizza.jpg` | Pexels photo `10260552` |
| `products/burger.jpg` | Pexels photo `11220676` |
| `products/sandwich.jpg` | Pexels photo `12664774` |
| `products/milkshake-dessert.jpg` | Pexels photo `10066812` |
| `products/chicken-biryani.jpg` | Pexels photo `14731625` |
| `products/special-biryani.jpg` | Pexels photo `16743486` |
| `products/chicken-curry.jpg` | Pexels photo `10172749` |
| `products/mutton-curry.jpg` | Pexels photo `10445627` |
| `products/fish-curry.jpg` | Pexels photo `10377019` |
| `products/veg-meal.jpg` | Pexels photo `10508207` |
| `products/fresh-vegetables.jpg` | Pexels photo `11509871` |
| `products/fresh-fruits.jpg` | Pexels photo `11745615` |
| `products/grocery-essentials.jpg` | Pexels photo `12586599` |
| `products/snacks-beverages.jpg` | Pexels photo `10576540` |

## Lifestyle

| File | Source |
| --- | --- |
| `lifestyle/packing-groceries.jpg` | Pexels photo `12519455` |
| `lifestyle/delivery-bag.jpg` | Pexels photo `13432255` |
| `lifestyle/kitchen-countertop.jpg` | Pexels photo `10827340` |

## Original brand assets

`basket.svg`, `logo-mark.svg` and `promo-poster.svg` are original vector assets. See
`BRAND_ASSETS_MISSING.txt` for brand-supplied assets that are still outstanding.
