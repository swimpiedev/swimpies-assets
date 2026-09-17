/* ============================================================
           SWIMPIE'S ASSETS - SITE DATA & ENGINE
           ============================================================

           Sections 1-8 are CONTENT / CONFIGURATION (what you edit).
           Section 9 is the WEBSITE ENGINE (rendering, filtering, routing).

           Ctrl+F these banner names to jump between sections:
             SITE CONFIGURATION, SITE CONTENT, HOMEPAGE CONFIGURATION,
             CATEGORIES, ASSETS, FEATURED ASSETS, DOCUMENTATION DATA,
             WEBSITE LOGIC
           ============================================================ */


        // ============================================================
        // SITE CONFIGURATION
        // ============================================================
        // Global settings for the whole site.

        const siteConfig = {
            // Shown in the header, footer and browser tab title.
            siteName: "Swimpie's Assets",

            // The main slogan, shown in the hero and the footer.
            slogan: "Cut Dev Time. Not Your Budget.",

            // Your logo image. Used automatically as the header icon, the
            // footer icon and the browser tab icon (favicon).
            // TIP: download your logo, put the file next to index.html (for
            // example "images/icon.png") and use that path here. Local files
            // always work; remote URLs can expire.
            logo: "images/icon.png",

            // Currency symbol shown next to asset prices.
            // A price of 0 always displays as "Free" instead.
            currency: "â‚¬",

            // ----- EXTERNAL LINKS -----------------------------------
            // Edit these ONCE. They are reused automatically wherever
            // needed (hero, Discord section, contact page, footer,
            // asset pages).
            links: {
                // Your Unity Asset Store publisher profile page.
                unityPublisher: "YOUR UNITY PUBLISHER PROFILE URL",

                // Your overall itch.io PROFILE page (not a single asset page).
                itchProfile: "YOUR ITCH.IO PROFILE URL",

                // Your Discord server invite link.
                discord: "YOUR DISCORD INVITE URL",

                // Your contact email address.
                email: "YOUR EMAIL ADDRESS"
            }
        };


        // ============================================================
        // SITE CONTENT
        // ============================================================
        // All frequently edited text lives here. Each section's copy has
        // its own job: the hero says what you make, About says how the
        // brand works, Why gives the reasons to buy. Avoid restating the
        // same sentence in multiple sections.
        //
        // TEXT FORMATTING (works in "text" fields marked with a *):
        //   \n\n      -> new paragraph
        //   \n        -> line break
        //   - item    -> list item (when a paragraph contains only lines
        //                starting with "- ")
        //   **text**  -> bold
        //   `text`    -> inline code styling

        const siteContent = {

            // ----- HERO (top of the homepage) ------------------------
            hero: {
                // Main heading (usually your brand name).
                title: "Swimpie's Assets",

                // The slogan, displayed right under the title.
                slogan: "Cut Dev Time. Not Your Budget.",

                // * One concrete paragraph about what you make. Specific
                // beats sweeping here.
                description: "I'm Swimpie. I build Unity editor tools, gameplay systems, VFX packs and sound packs, write the documentation myself, and keep everything maintained after release.",

                // The hero's single primary call-to-action button.
                // (Contact and the external profile links live in the
                // header, the footer and the Discord section instead.)
                primaryCtaText: "Browse Assets"
            },

            // ----- QUICK CATEGORY BROWSER ----------------------------
            categoryBrowser: {
                title: "Browse by Category",
                text: "Everything in the catalog, grouped by what it is."
            },

            // ----- ABOUT (text column, shown next to the Why column) --
            about: {
                title: "About Swimpie's Assets",

                // * How the brand works. Keep it distinct from the hero
                // and the Why points so nothing restates itself.
                text: "Swimpie's Assets is my personal Unity asset brand. I write the code, the documentation and the store pages, and I'm the one replying when something breaks.\n\nThe catalog stays small on purpose. Each package starts as something I needed in one of my own projects, then gets cleaned up until it's worth handing to other people. Prices sit where a solo developer can pay them without thinking twice."
            },

            // ----- WHY (text column, shown next to the About column) --
            // Each point is a bold lead-in followed by its text. Vary the
            // sentence lengths and structures; don't force parallel
            // phrasing across the points.
            why: {
                title: "Why Swimpie's Assets?",
                text: "The short version of what you're paying for.",
                points: [
                    {
                        title: "Save Development Time",
                        text: "The repetitive parts of a project eat the most hours. A package that already handles them puts those hours back into the parts of your game players actually notice."
                    },
                    {
                        title: "Accessible Pricing",
                        text: "A useful tool shouldn't eat a noticeable chunk of your game's budget. Everything here is priced so buying it isn't a decision you agonize over."
                    },
                    {
                        title: "Practical Quality",
                        text: "No demo-scene polish that falls apart in a real project. The goal is code and content you can drop into your game and still like six months later."
                    },
                    {
                        title: "Direct Development",
                        text: "I build and maintain everything myself. If something breaks or a feature is missing, you're talking to the person who wrote it, not a support queue."
                    }
                ]
            },

            // ----- FEATURED ASSETS SECTION -----------------------------
            // The first featured asset renders as a wide flagship card;
            // the rest render as normal cards below it.
            featured: {
                title: "Featured Assets",
                text: "The packages I'd point you to first.",
                viewAllText: "View all assets"
            },

            // ----- DISCORD SECTION -------------------------------------
            discord: {
                title: "Join the Discord",
                text: "The Discord server is where everything around my assets happens. It's the fastest way to reach me if you need a hand, and a friendly corner of the internet for developers who build games.",
                points: [
                    "Get help when something misbehaves",
                    "Request features or changes",
                    "Suggest assets you wish existed",
                    "Report bugs straight to me",
                    "Talk shop with other Unity developers",
                    "Commission custom work (paid)"
                ],
                buttonText: "Join the Discord",
                buttonNote: "See you there!"
            },

            // ----- ASSETS CATALOG PAGE ---------------------------------
            assetsPage: {
                title: "Browse Assets",
                text: "Everything I've published so far in one place. Search by name, filter by category and tags, and sort the results however you like."
            },

            // ----- CONTACT PAGE -----------------------------------------
            contact: {
                title: "Get in Touch",
                text: "Need help with one of my assets, found a bug, have an idea, or want something custom built? You can always reach me directly: no ticket systems, no middle layer.",
                emailTitle: "Email",
                emailText: "Best for detailed questions, bug reports, asset requests and custom work inquiries.",
                discordTitle: "Discord",
                discordText: "Best for quick questions, feature requests, bug reports, and hanging out with other developers.",
                topicsTitle: "Good reasons to get in touch",
                topics: [
                    "A question about one of my assets",
                    "A bug you found",
                    "A feature you'd like to see",
                    "An idea for an asset you wish existed",
                    "Custom work (paid)"
                ]
            },

            // ----- FOOTER ------------------------------------------------
            footer: {
                // Short line under the slogan in the footer. Give it its
                // own job instead of repeating the slogan.
                about: "Unity tools and content, built and documented by me.",

                // Bottom copyright line. {year} is replaced automatically.
                copyright: "Â© {year} Swimpie's Assets. All rights reserved."
            }
        };


        // ============================================================
        // HOMEPAGE CONFIGURATION
        // ============================================================
        // Turn major homepage sections on or off here.
        // The render order is: hero (with its Browse Assets CTA),
        // featured assets, category list, about + why, discord.
        // Set a value to false to remove that section from the homepage
        // completely, with no HTML editing required.

        const homepageConfig = {
            showFeaturedAssets: true,    // Featured assets directly under the hero
            showCategoryBrowser: true,   // Category index list
            showAbout: true,             // "About" column (next to "Why")
            showWhy: true,               // "Why" column (next to "About")
            showDiscord: true            // Discord community section
        };


        // ============================================================
        // CATEGORIES
        // ============================================================
        // The single source of truth for categories.
        // Adding a category here automatically makes it appear in the
        // homepage category list AND in the assets page filters.
        // Assets reference categories by their "id".
        //
        // CATEGORY TEMPLATE: copy this to add a new category:
        //
        // {
        //     id: "new-category",              // unique, lowercase, no spaces
        //     name: "New Category",            // name shown to visitors
        //     description: "What fits here."  // short text shown in the category list
        // }

        const categories = [
            {
                id: "scripts-systems",
                name: "Scripts & Systems",
                description: "Unity scripts, gameplay systems and editor tools."
            },
            {
                id: "3d-models",
                name: "3D Models",
                description: "3D models, props and environment pieces."
            },
            {
                id: "vfx",
                name: "VFX",
                description: "Visual effects, particles and shaders."
            },
            {
                id: "sfx",
                name: "SFX",
                description: "Sound effects and audio packs."
            },
            {
                id: "addons",
                name: "Add-ons",
                description: "Extensions that build on my other assets."
            }
        ];


        // ============================================================
        // ASSETS`r`n        // Asset data is loaded asynchronously by engine.js from assets/index.json.`r`n`r`n        // FEATURED ASSETS
        // ============================================================
        // Add/remove featured asset IDs here. Each ID must match an asset
        // in the assets/index.json manifest. The homepage looks them up
        // automatically, so nothing else needs to be edited.
        // The order here is the display order on the homepage. The FIRST
        // entry renders as a wide flagship card; the rest render as
        // normal cards below it.

        const featuredAssets = [
            "example-inventory",   // demo: flagship card, sale + full documentation
            "example-vfx",         // demo: animated media
            "example-unity-tool"   // demo: video media + itch.io link + changelog
        ];


        // ============================================================
        // DOCUMENTATION DATA
        // ============================================================
        // Documentation lives INSIDE each asset, in its "documentation"
        // property, so everything about one product is in one place.
        // This section only contains templates and reference material.
        //
        // DOCUMENTATION TEMPLATE: copy into any asset:
        //
        // documentation: {
        //     enabled: true,     // set to false (or delete it) to hide docs
        //
        //     sections: [
        //         // Text section:
        //         { type: "text", title: "Overview", content: "..." },
        //
        //         // Code section. The Copy button is added automatically:
        //         { type: "code", title: "Basic Usage", language: "csharp", code: `
        // // Add your example C# code here
        // var example = GetComponent<ExampleComponent>();
        // example.Initialize();
        // ` },
        //
        //         // Note / callout section (optional):
        //         { type: "note", title: "Note", content: "..." }
        //     ]
        // }
        //
        // SUPPORTED BLOCK TYPES
        //   text : title (optional) + formatted text
        //   code : title (optional) + language label + code + Copy button
        //   note : title (optional) + highlighted callout box
        //
        // The order of the sections array is the order on the page.
        // A table of contents appears automatically when there are
        // four or more titled text/code sections.


        // ============================================================

