# BiteLens MVP PRD

## Product summary

BiteLens is a public, camera-first PWA that helps people scan packaged food and real food to understand what they are about to eat.

The product remains intentionally focused. It is **not** a calorie tracker, not a meal logger, not a household inventory system, and not a multi-user platform. Its core promise is still: **scan, explain, decide**.

Compared with the earlier stripped-down MVP, this version adds a richer decision layer and a few supporting product surfaces that make the scanner more useful in real life without turning it into a bloated health platform.

The user should be able to:

- scan a barcode on packaged food
- take a photo of real food or a meal
- instantly see nutrition and ingredient information
- get a clear verdict about whether the food looks good, questionable, or worth avoiding
- understand the exact reasons behind that verdict
- see processing and scoring signals like Nutri-Score, NOVA group, and Eco-Score when available
- view flagged additives with risk labels and short explanations
- see healthier alternatives for weak products
- compare two products side by side
- browse recent scans and rediscover products quickly
- optionally set lightweight food preferences such as diet type, allergens to watch, and nutrition goals

## Product goals

### Primary goal

Help a user make faster and better food decisions at the moment of purchase or consumption.

### Secondary goals

- Make food evaluation feel immediate and useful on mobile.
- Reduce dependence on label-reading and manual ingredient analysis.
- Surface additives, ingredients, processing, and food-quality signals clearly.
- Reuse previous scan results so the app gets faster over time.
- Help users find better alternatives instead of just warning them.
- Support lightweight personalization without introducing account complexity.

## Non-goals

The MVP will **not** include:

- mandatory user accounts
- family profiles
- per-person nutrient plans
- supplements tracking
- meal logging
- calorie logging
- pantry or fridge inventory
- wearable integrations
- gamification
- social features
- admin dashboards
- advanced medical advice

Anything that does not directly improve scanning, explanation, comparison, or fast food decisions should be excluded from version one.

## Target user

A user who wants a very fast way to scan food and understand whether it is a good choice.

Typical motivations:

- avoiding additives or E numbers
- checking ingredient quality
- understanding nutrition at a glance
- judging whether a product is highly processed
- finding better versions of the same food
- checking whether a product conflicts with allergens or food preferences
- getting a rough assessment of a meal from a photo

## Core product promise

When a user scans food, the app should answer these questions immediately:

1. What is this?
2. What is in it?
3. Should I eat it?
4. Why is it flagged?
5. Is there a better alternative?

The answer must be visual, direct, and explained.

## Core features

### 1. Barcode scanner

The user opens the app, points the camera at a packaged product barcode, and receives a result page.

The result should include:

- product name
- brand
- ingredients
- nutrition facts
- detected additives / E numbers if present
- allergen or processing-related flags when available
- Nutri-Score badge when available
- NOVA group when available
- Eco-Score badge when available
- overall verdict
- short explanation of why the verdict was given

### 2. Food photo scan

The user takes a photo of real food, a plate, or an unpackaged food item.

The app should attempt to identify the likely food items and return:

- likely food name or components
- estimated calories and macros
- estimated nutrition summary where available
- confidence level
- verdict and explanation

Because image recognition is less certain than barcode lookup, the UI should make confidence visible and clearly distinguish estimated results from structured product results.

### 3. Verdict engine

Every scan result should produce a simple verdict:

- Good
- Caution
- Avoid

The verdict must be derived from transparent rules, not from a mysterious black-box score. A user should always be able to expand the explanation and see why a result was classified that way.

### 4. Score badges and processing signals

When source data is available, the product should display:

- Nutri-Score
- NOVA group
- Eco-Score

These badges should support the verdict, not replace it. The app should still summarize what the signals mean in plain language.

### 5. Additives analysis

For products with known additives, the result should show an additives section with:

- additive code or name
- risk level, such as none, low, moderate, or high
- short explanation of what it is
- short explanation of why it was flagged

This section is important because users often care about additive transparency more than raw macro data.

### 6. Healthier alternatives

For Caution and Avoid results, the app should surface healthier alternatives when similar products exist in the dataset.

The alternatives experience should:

- suggest better-scoring options
- make the comparison obvious
- help the user act immediately rather than just read a warning

### 7. Compare flow

The app should support side-by-side product comparison.

Comparison rows should include at least:

- overall verdict or score
- Nutri-Score
- NOVA group
- calories
- sugar
- protein
- sodium
- fiber
- additive count

### 8. Cached scan memory and history

If a product has been scanned before, the app should return the cached result quickly and avoid repeating unnecessary processing.

Caching and history should support:

- faster repeat scans
- reduced API costs
- local recent history for the user
- graceful behavior when network conditions are weak
- filterable history by Good, Caution, and Avoid

### 9. Lightweight profile preferences

The app may include a simple local profile screen with:

- diet preference, such as omnivore, vegetarian, vegan, pescatarian
- allergens to avoid or watch
- nutrition goals, such as low sugar, high protein, low sodium, less processed, high fiber

This is not a full user account system. It is only a local preference layer used to personalize alerts and flags.

## User flows

### Flow 1: packaged food

1. Open app.
2. Tap **Scan barcode**.
3. Camera opens immediately.
4. Barcode is detected.
5. App checks cache.
6. If cached, show cached result.
7. If not cached, fetch product data.
8. Normalize ingredients and nutrition data.
9. Apply rules.
10. Render result screen with verdict, badges, additives, and alternatives.

### Flow 2: real food / meal

1. Open app.
2. Tap **Scan food**.
3. Camera opens immediately.
4. User captures food image.
5. App sends image to recognition service.
6. Receive likely food matches and nutrition estimates.
7. Apply rules.
8. Show verdict screen with confidence and explanation.

### Flow 3: recent result reuse

1. User opens **History**.
2. Filters or searches previous scans.
3. Selects a previously scanned item.
4. App loads stored result instantly.
5. User reviews details, compares it, or rescans.

### Flow 4: compare products

1. User opens a result.
2. Taps **Compare**.
3. Selects another product from history, alternatives, or discover.
4. App shows side-by-side comparison.
5. Better values are visually highlighted.

### Flow 5: preference-aware warning

1. User sets allergens or food goals in **You**.
2. User scans a product.
3. If the product matches a watched allergen or preference conflict, the result screen shows a prominent alert.
4. Matching allergen chips are highlighted to explain the warning.

## Screens

The MVP now includes a few more screens than the earliest version, but it should still feel light and scanner-first.

### 1. Home

Purpose:

- immediate entry point
- minimal friction
- fast access to scan
- light overview of recent usage

Content:

- app name
- Scan barcode button
- Scan food button
- quick stats strip, such as average score, good-picks ratio, or weekly count
- profile summary banner showing watched allergens and active goals
- recent scans shortcut

### 2. Camera scan screen

Purpose:

- handle barcode scanning or food photo capture

Requirements:

- open fast
- obvious framing area
- clear permission handling
- visible success feedback
- manual fallback if camera fails
- clean loading state before results

### 3. Result screen

Purpose:

- deliver the decision and explanation

Sections:

- brand line and product identity
- verdict banner: Good / Caution / Avoid
- short summary
- score badges: Nutri-Score, NOVA, Eco-Score where available
- allergen alert banner when relevant
- reasons / triggered flags
- nutrition summary
- ingredients list or recognized components
- additives list with risk metadata and explanations
- healthier alternatives carousel when relevant
- favorite action
- compare action
- rescan button

### 4. Discover

Purpose:

- let the user browse and search products without scanning

Content:

- search field
- category tiles, such as Snacks, Drinks, Dairy, Meals, Sweets, Pantry
- brand discovery
- top-rated products or featured items

### 5. History

Purpose:

- let the user revisit already scanned items

Content:

- search field
- filters: All / Good / Caution / Avoid
- recent item cards
- scan type icon
- last scanned timestamp
- cached verdict badge

### 6. Compare

Purpose:

- help the user evaluate two products side by side

Content:

- both product names and brands
- key metrics rows
- highlighted winner per row where appropriate
- quick back link to product details

### 7. You

Purpose:

- lightweight local personalization

Content:

- diet preference selector
- allergens chips
- nutrition goal chips
- short explanation of how preferences affect alerts and results

## Navigation

The app should use a simple bottom tab model:

- Scan
- Discover
- History
- You

The bottom bar may hide during immersive scan or compare flows if that improves focus.

## Rules engine

The rules engine should be simple and editable in code for the MVP.

### Input signals

Possible signals include:

- additive or E-number presence
- ingredient matches on a denylist
- ultra-processed indicators
- Nutri-Score
- NOVA group
- Eco-Score when useful
- allergen matches based on local profile preferences
- high sugar indicators
- seed oils or other disliked ingredients
- low protein / high calorie imbalance for certain foods
- weak-confidence image recognition

### Output

The engine should return:

- verdict level
- triggered rules
- brief explanation
- optional confidence score
- additive-level explanations when relevant
- personalized warnings when relevant

### Example verdict behavior

- **Good**: low concern ingredients, acceptable nutrition profile, and no blocked items found
- **Caution**: mixed profile, uncertain recognition, moderate additive concerns, or one to two moderate warning signals
- **Avoid**: blocked ingredients, multiple high-concern signals, high-risk additive pattern, or clearly poor nutrition / processing profile

## Data model needs

The MVP does not need a heavy schema, but the app should be able to store or cache these fields per product when available:

- barcode
- product name
- brand
- image
- ingredients
- nutrition facts
- allergens list
- additives list with risk metadata
- Nutri-Score
- NOVA group
- Eco-Score
- verdict
- explanation summary
- alternative product references
- last scanned timestamp
- favorite status

## Data sources

### Packaged products

Use Open Food Facts as the initial packaged-product source because it supports barcode product lookup and provides ingredient and nutrition information appropriate for MVP ingestion.

### Food photo recognition

Use a food-recognition API for meal and real-food analysis because image-based services can identify foods and estimate nutrition from photos.

### Optional enrichment later

Future versions may add web-enriched ingredient research or stronger additive sources, but version one should keep the output deterministic and source-based.

## Technical approach

### Frontend

- Next.js
- PWA setup
- mobile-first responsive UI
- camera-first flows
- local cache for recent scans, favorites, and lightweight preferences

### Backend

A lightweight backend layer should handle:

- barcode lookup proxying where needed
- response normalization
- result caching
- rules evaluation
- image scan orchestration
- alternatives lookup
- compare payload shaping

### Deployment

- Vercel deployment
- environment variables for external APIs
- edge or serverless routes where useful

## UX principles

- Fast first action.
- Very low friction.
- Minimal navigation.
- Large camera-first controls.
- Clear verdicts.
- Explanations over mystery.
- Strong mobile readability.
- Useful without signup.
- Rich details only when expanded.
- Better alternatives should be actionable.

The app should feel sharp and modern, but the experience should prioritize speed and clarity over complexity.

## Success criteria

The MVP is successful if a user can:

- open the app quickly
- scan a barcode in seconds
- photograph a meal in seconds
- understand the verdict immediately
- inspect the reasoning if desired
- notice additives, processing level, and scoring signals quickly
- compare two products quickly
- see a better alternative when a product is weak
- reopen a previously scanned product instantly

## Build order

### Phase 1

- Home screen
- Barcode scanner
- packaged-food integration
- Result screen
- Basic rules engine
- Recent scans cache
- score badges and additive display

### Phase 2

- Food photo scan
- Nutrition estimation for meals
- AI confidence handling
- better explanations
- History filters
- favorites
- Compare flow

### Phase 3

- Discover screen
- alternatives graph and carousel
- local profile preferences
- allergen-aware alerting
- stronger offline behavior
- optional public share link for a scan result

## Final product definition

BiteLens should be treated as a **food scanner and explainer with smart comparison and guidance**, not a health operating system.

That reduced scope is intentional. The value of the app comes from being fast, clear, and useful at the exact moment a user is deciding what to buy or eat, while adding just enough depth to make repeat use worthwhile.