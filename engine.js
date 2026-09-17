// WEBSITE LOGIC
        // ============================================================
        // Everything below this point is the website engine: utilities,
        // rendering, filtering, sorting, routing and initialization.
        // You normally never need to touch this part. All content
        // lives in the sections above.


        // ============================================================
        // UTILITY FUNCTIONS
        // ============================================================

        /** Escapes text so it can be safely inserted into HTML. */
        function escapeHtml(value) {
            return String(value == null ? "" : value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        /** Timestamp of a "YYYY-MM-DD" date string (invalid dates -> 0). */
        function dateValue(dateString) {
            var date = new Date(dateString + "T00:00:00");
            return isNaN(date.getTime()) ? 0 : date.getTime();
        }

        /** Whole days between a "YYYY-MM-DD" date and today. */
        function daysSince(dateString) {
            var date = new Date(dateString + "T00:00:00");
            if (isNaN(date.getTime())) return 0;
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return Math.round((today - date) / 86400000);
        }

        var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        /** Exact date display, e.g. "September 14, 2025". */
        function formatDate(dateString) {
            var date = new Date(dateString + "T00:00:00");
            if (isNaN(date.getTime())) return dateString || "";
            return MONTH_NAMES[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
        }

        /** Automatic relative text: "Updated today", "Updated 2 weeks ago", ... */
        function formatRelativeDate(dateString) {
            var days = daysSince(dateString);
            if (days <= 0) return "Updated today";
            if (days === 1) return "Updated 1 day ago";
            if (days < 7) return "Updated " + days + " days ago";
            if (days < 14) return "Updated 1 week ago";
            if (days < 30) return "Updated " + Math.floor(days / 7) + " weeks ago";
            if (days < 60) return "Updated 1 month ago";
            if (days < 365) return "Updated " + Math.floor(days / 30) + " months ago";
            var years = Math.floor(days / 365);
            return years === 1 ? "Updated 1 year ago" : "Updated " + years + " years ago";
        }

        /** Formats a numeric price. 0 (or missing) becomes "Free". */
        function formatPrice(price) {
            var value = Number(price);
            if (!isFinite(value) || value <= 0) return "Free";
            return siteConfig.currency + value.toFixed(2);
        }

        /* ---------- Sale pricing ---------- */

        /**
         * Sale discount in percent. Valid range is 1 to 99; anything else
         * (missing, 0, 100 or more) counts as "no sale".
         */
        function getSalePercent(asset) {
            if (typeof asset.sale !== "number") return 0;
            if (asset.sale < 1 || asset.sale > 99) return 0;
            return asset.sale;
        }

        /**
         * True if the asset is currently on sale (paid asset + valid
         * sale percentage).
         */
        function isOnSale(asset) {
            return (Number(asset.price) > 0) && getSalePercent(asset) > 0;
        }

        /** The current effective price as a number, sale discount applied. */
        function getEffectivePrice(asset) {
            var price = Number(asset.price) || 0;
            if (price <= 0) return 0;
            var percent = getSalePercent(asset);
            if (percent <= 0) return price;
            return Math.round(price * (100 - percent)) / 100;
        }

        /** "1 asset" / "3 assets" */
        function formatAssetCount(count) {
            return count + (count === 1 ? " asset" : " assets");
        }

        /** Finds an asset by its id. */
        function getAssetById(assetId) {
            for (var i = 0; i < assets.length; i++) {
                if (assets[i].id === assetId) return assets[i];
            }
            return null;
        }

        /** Finds a category by its id. */
        function getCategoryById(categoryId) {
            for (var i = 0; i < categories.length; i++) {
                if (categories[i].id === categoryId) return categories[i];
            }
            return null;
        }

        /** Number of assets in a category. */
        function getAssetCountForCategory(categoryId) {
            return assets.filter(function (asset) {
                return asset.category === categoryId;
            }).length;
        }

        /** Collects every unique tag used by any asset (sorted A-Z). */
        function getAllTags() {
            var seen = {};
            var list = [];
            assets.forEach(function (asset) {
                (asset.tags || []).forEach(function (tag) {
                    var key = String(tag);
                    if (!seen[key.toLowerCase()]) {
                        seen[key.toLowerCase()] = true;
                        list.push(key);
                    }
                });
            });
            list.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            return list;
        }

        /** True if the asset has usable media (not empty / placeholder). */
        function hasMedia(asset) {
            return typeof asset.media === "string" &&
                asset.media !== "" &&
                asset.media.indexOf("YOUR") !== 0;
        }

        /** Returns an asset's documentation sections, or null if unavailable. */
        function getDocumentation(asset) {
            if (!asset.documentation || !asset.documentation.enabled) return null;
            var sections = asset.documentation.sections;
            if (!Array.isArray(sections) || sections.length === 0) return null;
            return sections;
        }

        /* ---------- Changelog ---------- */

        /**
         * Returns an asset's changelog entries, or null if there are none.
         * Entries are expected to be ordered newest first.
         */
        function getChangelog(asset) {
            if (!Array.isArray(asset.changelog) || asset.changelog.length === 0) return null;
            return asset.changelog;
        }

        /** The newest changelog entry (the first in the list), or null. */
        function getLatestChangelogEntry(asset) {
            var changelog = getChangelog(asset);
            return changelog ? changelog[0] : null;
        }

        /**
         * The effective version: taken from the newest changelog entry.
         * Falls back to the asset's version field when there is no
         * changelog.
         */
        function getAssetVersion(asset) {
            var entry = getLatestChangelogEntry(asset);
            if (entry && entry.version) return String(entry.version);
            return asset.version || "";
        }

        /**
         * The effective last-updated date: taken from the newest
         * changelog entry. Falls back to the asset's updated field when
         * there is no changelog.
         */
        function getAssetUpdatedDate(asset) {
            var entry = getLatestChangelogEntry(asset);
            if (entry && entry.date) return entry.date;
            return asset.updated || "";
        }

        /* ---------- Inline SVG icons (no dependencies) ---------- */

        var ICONS = {
            "box": '<path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7.3 12 12l8.7-4.7"/><path d="M12 22V12"/>',
            "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
            "tag": '<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
            "badge-check": '<circle cx="12" cy="12" r="9"/><path d="m8.4 12.4 2.5 2.5 4.7-5.3"/>',
            "code": '<path d="m8 6-6 6 6 6"/><path d="m16 6 6 6-6 6"/>',
            "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 6.5L21 6"/>',
            "chat": '<path d="M21 14a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
            "check": '<path d="M20 6 9 17l-5-5"/>',
            "arrow-right": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
            "arrow-left": '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
            "external": '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
            "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
            "play": '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 6 3.5-6 3.5z"/>',
            "search": '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
            "filter": '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
            "copy": '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
            "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
        };

        /** Renders an inline SVG icon by name. */
        function icon(name, size) {
            size = size || 18;
            var paths = ICONS[name] || ICONS.check;
            return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + "</svg>";
        }

        /* ---------- Media rendering ---------- */

        /**
         * Renders an asset's media (image / gif / video) with a clean
         * placeholder fallback when the media is missing or fails to load.
         * Must be placed inside a ".media-frame" element.
         */
        function renderMedia(asset) {
            var iconName = (hasMedia(asset) && asset.mediaType === "video") ? "play" : "box";
            var placeholder =
                '<div class="media-placeholder" aria-hidden="true">' +
                    icon(iconName, 34) +
                    "<span>No preview available</span>" +
                "</div>";

            if (!hasMedia(asset)) return placeholder;

            if (asset.mediaType === "video") {
                return placeholder +
                    '<video src="' + escapeHtml(asset.media) + '" controls preload="metadata" ' +
                    'onerror="this.style.display=\'none\'"></video>';
            }

            // "image" and "gif" both render as an <img>. The browser
            // handles the rest (GIFs animate automatically).
            return placeholder +
                '<img src="' + escapeHtml(asset.media) + '" alt="Preview of ' + escapeHtml(asset.name) + '" loading="lazy" ' +
                'onerror="this.style.display=\'none\'">';
        }

        /* ---------- Text formatting ---------- */

        /** Applies inline formatting (**bold** and `code`) to escaped text. */
        function formatInline(text) {
            return escapeHtml(text)
                .replace(/`([^`]+)`/g, "<code>$1</code>")
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        }

        /**
         * Converts documentation/description text into HTML.
         * Blank lines split paragraphs, lines starting with "- " become
         * list items, **bold** and `inline code` are supported.
         */
        function formatDocText(text) {
            if (!text) return "";
            var html = "";
            String(text).split(/\n\s*\n/).forEach(function (chunk) {
                if (!chunk.trim()) return;
                var lines = chunk.split("\n");
                var isList = lines.length > 0 && lines.every(function (line) {
                    return /^\s*-\s+/.test(line);
                });
                if (isList) {
                    html += "<ul>" + lines.map(function (line) {
                        return "<li>" + formatInline(line.replace(/^\s*-\s+/, "")) + "</li>";
                    }).join("") + "</ul>";
                } else {
                    html += "<p>" + lines.map(formatInline).join("<br>") + "</p>";
                }
            });
            return html;
        }

        /* ---------- Code language labels ---------- */

        var LANGUAGE_LABELS = {
            "csharp": "C#", "cs": "C#", "c#": "C#",
            "javascript": "JavaScript", "js": "JavaScript",
            "typescript": "TypeScript", "ts": "TypeScript",
            "json": "JSON", "xml": "XML", "html": "HTML", "css": "CSS",
            "sql": "SQL", "yaml": "YAML", "bash": "Bash", "shell": "Shell",
            "text": "Text"
        };

        /** Label shown on code blocks, e.g. "csharp" -> "C#". */
        function getLanguageLabel(language) {
            if (!language) return "Code";
            return LANGUAGE_LABELS[String(language).toLowerCase()] || escapeHtml(language);
        }

        /* ---------- Internal URL builders ----------
           All internal URLs are HASH-based ("#page=assets" and so on).
           Hash navigation works in every environment: hosted sites,
           local files opened directly from disk, and sandboxed preview
           panes. These helpers are the only places internal URLs are
           built; everything else uses them. Old query-style links
           ("?page=assets") still work too, see getRouteParams(). */

        /** URL of an internal page. */
        function pageUrl(page) {
            return "#page=" + page;
        }

        /** Internal asset page URL, generated automatically from the id. */
        function assetUrl(assetId) {
            return "#asset=" + encodeURIComponent(assetId);
        }

        /** Internal documentation URL, generated automatically from the id. */
        function docsUrl(assetId) {
            return "#docs=" + encodeURIComponent(assetId);
        }

        /** Internal changelog URL, generated automatically from the id. */
        function changelogUrl(assetId) {
            return "#changelog=" + encodeURIComponent(assetId);
        }

        /** Assets page URL with one category pre-selected (deep link). */
        function categoryUrl(categoryId) {
            return "#page=assets&category=" + encodeURIComponent(categoryId);
        }

        /* ---------- Link/button helpers ---------- */

        /** Internal link. Intercepted for smooth, no-reload navigation. */
        function internalLink(url, labelHtml, className, extraAttributes) {
            return '<a data-internal href="' + url + '"' +
                (className ? ' class="' + className + '"' : "") +
                (extraAttributes ? " " + extraAttributes : "") +
                ">" + labelHtml + "</a>";
        }

        /** External button link. Opens in a new tab. Hidden if no URL. */
        function externalButton(url, labelHtml, className) {
            if (!url) return "";
            return '<a class="' + (className || "") + '" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
                labelHtml + " " + icon("external", 13) + "</a>";
        }

        /* ---------- Data validation ---------- */

        /** Logs helpful warnings about data mistakes (never blocks the site). */
        function validateData() {
            var seenIds = {};

            assets.forEach(function (asset) {
                if (!asset.id) {
                    console.warn("[Swimpie's Assets] An asset is missing its id.");
                    return;
                }
                if (seenIds[asset.id]) {
                    console.warn('[Swimpie\'s Assets] Duplicate asset id: "' + asset.id + '". Asset ids must be unique.');
                }
                seenIds[asset.id] = true;

                if (asset.category && !getCategoryById(asset.category)) {
                    console.warn('[Swimpie\'s Assets] Asset "' + asset.id + '" references unknown category "' + asset.category + '".');
                }
                if (typeof asset.price !== "number") {
                    console.warn('[Swimpie\'s Assets] Asset "' + asset.id + '" has no numeric price. Use price: 0 for free assets.');
                }
                if (!asset.updated && !getChangelog(asset)) {
                    console.warn('[Swimpie\'s Assets] Asset "' + asset.id + '" has no updated date and no changelog.');
                }
                if (getChangelog(asset) && (asset.version || asset.updated)) {
                    console.info('[Swimpie\'s Assets] Asset "' + asset.id + '" has a changelog, so its "version" and "updated" fields are ignored. The newest changelog entry provides both.');
                }
                if (asset.sale !== undefined && asset.sale !== null && asset.sale !== false) {
                    var salePercent = Number(asset.sale);
                    if (!(Number(asset.price) > 0)) {
                        console.warn('[Swimpie\'s Assets] Asset "' + asset.id + '" has a sale configured, but its price is 0 (Free). The sale is ignored.');
                    } else if (salePercent !== 0 && (salePercent < 1 || salePercent > 99)) {
                        console.warn('[Swimpie\'s Assets] Asset "' + asset.id + '" has an invalid sale value. Use a percentage between 1 and 99, or remove the line.');
                    }
                }
            });

            featuredAssets.forEach(function (assetId) {
                if (!getAssetById(assetId)) {
                    console.warn('[Swimpie\'s Assets] Featured asset id "' + assetId + '" does not match any asset and was skipped.');
                }
            });
        }


        // ============================================================
        // RENDERING FUNCTIONS
        // ============================================================

        // ---------- Shared components ----------

        /** Section header block (title + optional subtitle). */
        function sectionHeader(title, text, center) {
            return '<div class="section-header' + (center ? " section-header-center" : "") + '">' +
                '<h2 class="section-title">' + escapeHtml(title || "") + "</h2>" +
                (text ? '<p class="section-text">' + escapeHtml(text) + "</p>" : "") +
                "</div>";
        }

        /** Shared empty / "not found" state block. */
        function notFoundState(title, text, actionsHtml, iconName) {
            return '<div class="empty-state">' +
                icon(iconName || "search", 34) +
                "<h3>" + escapeHtml(title) + "</h3>" +
                "<p>" + escapeHtml(text) + "</p>" +
                '<div class="empty-actions">' + (actionsHtml || "") + "</div>" +
            "</div>";
        }

        /** Brand mark: your logo (siteConfig.logo), with an icon fallback. */
        function renderBrandMark() {
            if (siteConfig.logo) {
                return '<img class="brand-logo" src="' + escapeHtml(siteConfig.logo) + '" alt="" aria-hidden="true">';
            }
            return '<span class="brand-mark">' + icon("box", 19) + "</span>";
        }

        /** Price block for asset cards, including the sale display. */
        function renderCardPrice(asset) {
            var isFree = !(Number(asset.price) > 0);
            var currentPrice = isFree ? "Free" : formatPrice(getEffectivePrice(asset));

            if (!isOnSale(asset)) {
                return '<span class="card-price' + (isFree ? " is-free" : "") + '">' + currentPrice + "</span>";
            }

            return '<div class="card-price-group">' +
                '<span class="card-price-top">' +
                    '<span class="sale-badge">-' + getSalePercent(asset) + "%</span>" +
                    '<span class="card-price-old">' + formatPrice(asset.price) + "</span>" +
                "</span>" +
                '<span class="card-price">' + currentPrice + "</span>" +
            "</div>";
        }

        /** Price block for the asset detail page, including the sale display. */
        function renderPurchasePrice(asset) {
            var isFree = !(Number(asset.price) > 0);

            if (!isOnSale(asset)) {
                return '<div class="purchase-price' + (isFree ? " is-free" : "") + '">' +
                    formatPrice(getEffectivePrice(asset)) +
                    "</div>";
            }

            var percent = getSalePercent(asset);
            var oldPrice = Number(asset.price);
            var newPrice = getEffectivePrice(asset);
            var savings = Math.round((oldPrice - newPrice) * 100) / 100;

            return '<div class="purchase-price-row">' +
                    '<span class="sale-badge sale-badge-lg">SALE -' + percent + "%</span>" +
                    "<div>" +
                        '<span class="purchase-price-old">' + formatPrice(oldPrice) + "</span>" +
                        '<div class="purchase-price">' + formatPrice(newPrice) + "</div>" +
                    "</div>" +
                "</div>" +
                '<p class="purchase-save">You save ' + formatPrice(savings) + " (" + percent + "% off).</p>";
        }

        /**
         * Renders one asset card (used on the homepage and the catalog).
         * extraClass optionally adds a CSS class; the featured section
         * uses "asset-card-horizontal" for the wide flagship card.
         */
        function renderAssetCard(asset, extraClass) {
            var extra = (typeof extraClass === "string" && extraClass) ? " " + extraClass : "";
            var category = getCategoryById(asset.category);
            var categoryName = category ? category.name : "Uncategorized";
            var updatedDate = getAssetUpdatedDate(asset);

            return '<article class="asset-card' + extra + '">' +
                internalLink(assetUrl(asset.id), renderMedia(asset), "card-media media-frame",
                    'aria-label="View ' + escapeHtml(asset.name) + '"') +
                '<div class="card-body">' +
                    '<div class="card-meta">' +
                        internalLink(categoryUrl(asset.category), escapeHtml(categoryName), "") +
                        "<span>" + escapeHtml(formatRelativeDate(updatedDate)) + "</span>" +
                    "</div>" +
                    '<h3 class="card-title">' +
                        internalLink(assetUrl(asset.id), escapeHtml(asset.name), "") +
                    "</h3>" +
                    (asset.shortDescription
                        ? '<p class="card-desc">' + escapeHtml(asset.shortDescription) + "</p>"
                        : "") +
                    renderCardTags(asset) +
                    '<div class="card-footer">' +
                        renderCardPrice(asset) +
                        internalLink(assetUrl(asset.id), "View Asset", "btn btn-outline btn-small") +
                    "</div>" +
                "</div>" +
            "</article>";
        }

        /** Tag pills for a card (shows up to 3 tags, then "+N"). */
        function renderCardTags(asset) {
            var tags = asset.tags || [];
            if (!tags.length) return "";
            var pills = tags.slice(0, 3).map(function (tag) {
                return '<span class="tag-pill">' + escapeHtml(tag) + "</span>";
            }).join("");
            var extra = tags.length > 3
                ? '<span class="tag-pill">+' + (tags.length - 3) + "</span>"
                : "";
            return '<div class="card-tags">' + pills + extra + "</div>";
        }

        /** All tag pills (used on the asset detail page). */
        function renderTagPills(asset) {
            return (asset.tags || []).map(function (tag) {
                return '<span class="tag-pill">' + escapeHtml(tag) + "</span>";
            }).join("");
        }

        // ---------- Header and footer ----------

        function renderHeader() {
            document.getElementById("siteHeader").innerHTML =
                '<div class="container header-inner">' +
                    '<a class="brand" data-internal href="' + pageUrl("home") + '">' +
                        renderBrandMark() +
                        "<span>" + escapeHtml(siteConfig.siteName) + "</span>" +
                    "</a>" +
                    '<nav class="main-nav" id="mainNav" aria-label="Main navigation">' +
                        '<a class="nav-link" data-internal data-page="home" href="' + pageUrl("home") + '">Home</a>' +
                        '<a class="nav-link" data-internal data-page="assets" href="' + pageUrl("assets") + '">Assets</a>' +
                        '<a class="nav-link" data-internal data-page="contact" href="' + pageUrl("contact") + '">Contact</a>' +
                    "</nav>" +
                    '<button class="menu-toggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mainNav">' +
                        "<span></span><span></span><span></span>" +
                    "</button>" +
                "</div>";
        }

        function renderFooter() {
            var links = siteConfig.links;
            var year = new Date().getFullYear();
            var copyright = (siteContent.footer.copyright || "").replace("{year}", year);

            function navLink(page, label) {
                return "<li>" + internalLink(pageUrl(page), label) + "</li>";
            }
            function extLink(url, label) {
                if (!url) return "";
                return '<li><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + label + "</a></li>";
            }

            document.getElementById("siteFooter").innerHTML =
                "<div class=\"container\">" +
                    '<div class="footer-grid">' +
                        '<div class="footer-brand">' +
                            '<a class="brand" data-internal href="' + pageUrl("home") + '">' +
                                renderBrandMark() +
                                "<span>" + escapeHtml(siteConfig.siteName) + "</span>" +
                            "</a>" +
                            '<p class="footer-slogan">' + escapeHtml(siteConfig.slogan) + "</p>" +
                            '<p class="footer-about">' + escapeHtml(siteContent.footer.about) + "</p>" +
                        "</div>" +
                        "<div><h3 class=\"footer-heading\">Site</h3><ul class=\"footer-links\">" +
                            navLink("home", "Home") +
                            navLink("assets", "Assets") +
                            navLink("contact", "Contact") +
                        "</ul></div>" +
                        "<div><h3 class=\"footer-heading\">Elsewhere</h3><ul class=\"footer-links\">" +
                            extLink(links.unityPublisher, "Unity Publisher Profile") +
                            extLink(links.itchProfile, "itch.io Profile") +
                            extLink(links.discord, "Discord") +
                            (links.email
                                ? '<li><a href="mailto:' + escapeHtml(links.email) + '">' + escapeHtml(links.email) + "</a></li>"
                                : "") +
                        "</ul></div>" +
                    "</div>" +
                "</div>" +
                '<div class="footer-bottom"><div class="container">' + escapeHtml(copyright) + "</div></div>";
        }

        // ---------- Home page ----------

        /**
         * Builds the homepage from modular section renderers.
         * Render order: hero (with its Browse Assets CTA), featured
         * assets, category list, about + why, discord.
         */
        function renderHomePage(container) {
            var html = "";

            html += renderHeroSection();                                        // Hero is always shown
            if (homepageConfig.showFeaturedAssets)  html += renderFeaturedSection();
            if (homepageConfig.showCategoryBrowser) html += renderCategoryBrowserSection();
            if (homepageConfig.showAbout || homepageConfig.showWhy) html += renderAboutWhySection();
            if (homepageConfig.showDiscord)         html += renderDiscordSection();

            container.innerHTML = '<div class="page">' + html + "</div>";
        }

        function renderHeroSection() {
            var hero = siteContent.hero;
            return '<section class="hero">' +
                '<div class="container hero-inner">' +
                    '<h1 class="hero-title">' + escapeHtml(hero.title) + "</h1>" +
                    '<p class="hero-slogan">' + escapeHtml(hero.slogan) + "</p>" +
                    '<p class="hero-text">' + escapeHtml(hero.description) + "</p>" +
                    '<div class="hero-actions">' +
                        internalLink(pageUrl("assets"),
                            escapeHtml(hero.primaryCtaText || "Browse Assets"), "btn btn-primary") +
                    "</div>" +
                "</div>" +
            "</section>";
        }

        function renderFeaturedSection() {
            var featured = siteContent.featured;

            // Look up each featured ID in the asset database (single source of truth).
            var featuredCards = featuredAssets
                .map(function (assetId) { return getAssetById(assetId); })
                .filter(function (asset) { return asset !== null; });

            if (!featuredCards.length) return "";

            // The first featured asset renders as a wide flagship card
            // (media beside content); the rest as normal cards.
            var cards = featuredCards.map(function (asset, index) {
                return renderAssetCard(asset, index === 0 ? "asset-card-horizontal" : "");
            }).join("");

            return '<section class="section featured-section">' +
                '<div class="container">' +
                    '<div class="section-row">' +
                        sectionHeader(featured.title, featured.text) +
                        internalLink(pageUrl("assets"),
                            escapeHtml(featured.viewAllText || "View all assets") + " " + icon("arrow-right", 15),
                            "section-link") +
                    "</div>" +
                    '<div class="asset-grid">' + cards + "</div>" +
                "</div>" +
            "</section>";
        }

        /** Category browser: index-style rows with hairline dividers. */
        function renderCategoryBrowserSection() {
            if (!categories.length) return "";

            var content = siteContent.categoryBrowser;
            var rows = categories.map(function (category) {
                return internalLink(
                    categoryUrl(category.id),
                    '<span class="category-row-main">' +
                        '<span class="category-row-name">' + escapeHtml(category.name) + "</span>" +
                        '<span class="category-row-count">' + formatAssetCount(getAssetCountForCategory(category.id)) + "</span>" +
                    "</span>" +
                    (category.description
                        ? '<span class="category-row-desc">' + escapeHtml(category.description) + "</span>"
                        : ""),
                    "category-row"
                );
            }).join("");

            return '<section class="section categories-section">' +
                '<div class="container">' +
                    sectionHeader(content.title, content.text) +
                    '<div class="category-list">' + rows + "</div>" +
                "</div>" +
            "</section>";
        }

        /** About & Why: two text columns side by side (no icons). */
        function renderAboutWhySection() {
            var about = siteContent.about;
            var why = siteContent.why;

            var aboutHtml = "";
            if (homepageConfig.showAbout) {
                aboutHtml = '<div class="about-why-col">' +
                    '<h2 class="section-title">' + escapeHtml(about.title) + "</h2>" +
                    '<div class="formatted-text">' + formatDocText(about.text) + "</div>" +
                "</div>";
            }

            var whyHtml = "";
            if (homepageConfig.showWhy) {
                var points = (why.points || []).map(function (point) {
                    return '<p class="why-point"><strong>' + escapeHtml(point.title) + ".</strong> " +
                        escapeHtml(point.text) + "</p>";
                }).join("");
                whyHtml = '<div class="about-why-col">' +
                    '<h2 class="section-title">' + escapeHtml(why.title) + "</h2>" +
                    (why.text ? '<p class="about-why-lead">' + escapeHtml(why.text) + "</p>" : "") +
                    points +
                "</div>";
            }

            if (!aboutHtml && !whyHtml) return "";

            var inner;
            if (aboutHtml && whyHtml) {
                inner = '<div class="about-why-grid">' +
                    aboutHtml +
                    '<div class="about-why-divider" aria-hidden="true"></div>' +
                    whyHtml +
                "</div>";
            } else {
                inner = '<div class="about-why-single">' + (aboutHtml || whyHtml) + "</div>";
            }

            return '<section class="section section-white">' +
                '<div class="container">' + inner + "</div>" +
            "</section>";
        }

        function renderDiscordSection() {
            var discord = siteContent.discord;

            // Plain text items with a thin accent rule: no check icons.
            var points = (discord.points || []).map(function (point) {
                return "<li>" + escapeHtml(point) + "</li>";
            }).join("");

            return '<section class="section discord-section">' +
                '<div class="container">' +
                    '<div class="discord-grid">' +
                        "<div>" +
                            sectionHeader(discord.title, discord.text) +
                            (points ? '<ul class="discord-points">' + points + "</ul>" : "") +
                        "</div>" +
                        '<div class="discord-cta">' +
                            externalButton(siteConfig.links.discord,
                                escapeHtml(discord.buttonText || "Join the Discord"), "btn btn-light") +
                            (discord.buttonNote
                                ? '<p class="discord-cta-note">' + escapeHtml(discord.buttonNote) + "</p>"
                                : "") +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</section>";
        }

        // ---------- Assets catalog page ----------

        /** Current filter/sort state of the assets page. */
        var filterState = {
            search: "",
            categories: [],
            tags: [],
            sort: "newest"
        };

        /** User-facing sorting options (internal values are used for URLs). */
        var SORT_OPTIONS = [
            { value: "newest",     label: "Newest" },
            { value: "oldest",     label: "Oldest" },
            { value: "updated",    label: "Last Updated" },
            { value: "price-high", label: "Highest Price" },
            { value: "price-low",  label: "Lowest Price" }
        ];

        function renderAssetsPage(container, initialFilters) {
            filterState = {
                search: initialFilters.search,
                categories: initialFilters.categories.slice(),
                tags: initialFilters.tags.slice(),
                sort: initialFilters.sort
            };

            container.innerHTML =
                '<div class="page">' +
                    '<div class="container">' +
                        '<div class="page-header">' +
                            '<h1 class="section-title">' + escapeHtml(siteContent.assetsPage.title) + "</h1>" +
                            '<p class="section-text">' + escapeHtml(siteContent.assetsPage.text) + "</p>" +
                        "</div>" +
                        '<div class="catalog-layout">' +
                            renderFilterPanel() +
                            '<div class="catalog-results">' +
                                '<div class="catalog-toolbar">' +
                                    '<button type="button" class="btn btn-outline btn-small filters-toggle" id="filtersToggle" aria-expanded="false" aria-controls="filterPanel">' +
                                        icon("filter", 15) + " Filters" +
                                    "</button>" +
                                    '<span class="result-count" id="resultCount" aria-live="polite"></span>' +
                                    '<div class="active-filters" id="activeFilters"></div>' +
                                "</div>" +
                                '<div class="asset-grid" id="assetGrid"></div>' +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>";

            setupCatalogEvents();
            applyFilters(); // initial results render + panel sync + URL sync
        }

        /** Builds the sidebar filter panel from categories & tags data. */
        function renderFilterPanel() {
            var categoryChips = categories.map(function (category) {
                return filterChip("category", category.id, category.name);
            }).join("");

            var tagChips = getAllTags().map(function (tag) {
                return filterChip("tag", tag, tag);
            }).join("");

            var sortOptions = SORT_OPTIONS.map(function (option) {
                return '<option value="' + option.value + '">' + option.label + "</option>";
            }).join("");

            return '<aside class="filter-panel" id="filterPanel" aria-label="Asset filters">' +
                '<div class="filter-group">' +
                    '<label class="filter-label" for="searchInput">Search</label>' +
                    '<input type="search" id="searchInput" class="search-input" placeholder="Search assets..." autocomplete="off">' +
                "</div>" +
                '<div class="filter-group">' +
                    '<span class="filter-label">Categories</span>' +
                    '<div class="chip-list" id="categoryChips" role="group" aria-label="Filter by category">' +
                        categoryChips +
                    "</div>" +
                "</div>" +
                '<div class="filter-group">' +
                    '<span class="filter-label">Tags</span>' +
                    '<div class="chip-list" id="tagChips" role="group" aria-label="Filter by tag">' +
                        tagChips +
                    "</div>" +
                "</div>" +
                '<div class="filter-group">' +
                    '<label class="filter-label" for="sortSelect">Sort by</label>' +
                    '<select id="sortSelect" class="sort-select">' + sortOptions + "</select>" +
                "</div>" +
                '<button type="button" class="btn btn-outline btn-small btn-block" id="clearFiltersBtn">' +
                    icon("x", 14) + " Clear Filters" +
                "</button>" +
            "</aside>";
        }

        /** One category/tag filter chip button. */
        function filterChip(type, value, label) {
            var active = isFilterActive(type, value);
            return '<button type="button" class="chip' + (active ? " active" : "") + '"' +
                ' data-filter-type="' + escapeHtml(type) + '"' +
                ' data-value="' + escapeHtml(value) + '"' +
                ' aria-pressed="' + active + '">' +
                escapeHtml(label) + "</button>";
        }

        function isFilterActive(type, value) {
            var list = type === "category" ? filterState.categories : filterState.tags;
            return list.indexOf(value) !== -1;
        }

        /** Wires up all catalog interactions (search, chips, sort, clear). */
        function setupCatalogEvents() {
            var searchInput = document.getElementById("searchInput");
            var sortSelect = document.getElementById("sortSelect");
            var filterPanel = document.getElementById("filterPanel");
            var filtersToggle = document.getElementById("filtersToggle");

            // Search. Updates results as you type (keeps input focus).
            searchInput.addEventListener("input", function () {
                filterState.search = searchInput.value;
                refreshResults();
            });

            // Sorting.
            sortSelect.addEventListener("change", function () {
                filterState.sort = sortSelect.value;
                refreshResults();
            });

            // Category & tag chips: one delegated listener for all chips.
            filterPanel.addEventListener("click", function (event) {
                var chip = event.target && event.target.closest
                    ? event.target.closest(".chip[data-filter-type]")
                    : null;
                if (!chip) return;
                toggleFilter(chip.getAttribute("data-filter-type"), chip.getAttribute("data-value"));
                applyFilters();
            });

            // Clear Filters button in the panel.
            document.getElementById("clearFiltersBtn").addEventListener("click", clearAllFilters);

            // Mobile filters toggle.
            filtersToggle.addEventListener("click", function () {
                var open = filterPanel.classList.toggle("open");
                filtersToggle.setAttribute("aria-expanded", open ? "true" : "false");
            });

            // Removable active-filter chips (and "Clear all") in the toolbar.
            document.getElementById("activeFilters").addEventListener("click", function (event) {
                var removeButton = event.target && event.target.closest
                    ? event.target.closest(".remove-filter")
                    : null;
                if (removeButton) {
                    var type = removeButton.getAttribute("data-type");
                    if (type === "search") {
                        filterState.search = "";
                    } else {
                        toggleFilter(type, removeButton.getAttribute("data-value"));
                    }
                    applyFilters();
                    return;
                }
                if (event.target && event.target.closest && event.target.closest(".clear-all-btn")) {
                    clearAllFilters();
                }
            });
        }

        /** Adds/removes a category or tag in the current filter state. */
        function toggleFilter(type, value) {
            var list = type === "category" ? filterState.categories : filterState.tags;
            var index = list.indexOf(value);
            if (index === -1) list.push(value);
            else list.splice(index, 1);
        }

        /** Resets all filters (and the sort order) to their defaults. */
        function clearAllFilters() {
            filterState.search = "";
            filterState.categories = [];
            filterState.tags = [];
            filterState.sort = "newest";
            applyFilters();
        }

        /**
         * Syncs the filter panel controls with the current state,
         * then re-renders the results.
         */
        function applyFilters() {
            var searchInput = document.getElementById("searchInput");
            var sortSelect = document.getElementById("sortSelect");
            if (searchInput) searchInput.value = filterState.search;
            if (sortSelect) sortSelect.value = filterState.sort;
            syncChipStates(document.getElementById("categoryChips"));
            syncChipStates(document.getElementById("tagChips"));
            refreshResults();
        }

        /** Updates chip active states in place (keeps keyboard focus). */
        function syncChipStates(container) {
            if (!container) return;
            Array.prototype.forEach.call(container.querySelectorAll(".chip"), function (chip) {
                var active = isFilterActive(chip.getAttribute("data-filter-type"), chip.getAttribute("data-value"));
                chip.classList.toggle("active", active);
                chip.setAttribute("aria-pressed", active ? "true" : "false");
            });
        }

        /** Re-renders the result grid, count, active filters and the URL. */
        function refreshResults() {
            var grid = document.getElementById("assetGrid");
            if (!grid) return;

            var visible = sortAssets(filterAssets(assets, filterState), filterState.sort);

            grid.innerHTML = visible.length > 0
                ? visible.map(function (asset) { return renderAssetCard(asset); }).join("")
                : emptyResultsHtml();

            // "Clear Filters" button inside the no-results state.
            var emptyClearButton = grid.querySelector("[data-action='clear-filters']");
            if (emptyClearButton) emptyClearButton.addEventListener("click", clearAllFilters);

            document.getElementById("resultCount").textContent =
                formatAssetCount(visible.length) + " found";

            document.getElementById("activeFilters").innerHTML = renderActiveFilters();

            // Show the number of active filters on the mobile toggle button.
            var activeCount = filterState.categories.length + filterState.tags.length +
                (filterState.search.trim() ? 1 : 0);
            document.getElementById("filtersToggle").innerHTML =
                icon("filter", 15) + " Filters" + (activeCount > 0 ? " (" + activeCount + ")" : "");

            syncAssetsUrl();
        }

        /** Removable chips showing the currently applied filters. */
        function renderActiveFilters() {
            var html = "";

            filterState.categories.forEach(function (categoryId) {
                var category = getCategoryById(categoryId);
                html += activeFilterChip("category", categoryId,
                    category ? category.name : categoryId, category ? category.name : categoryId);
            });

            filterState.tags.forEach(function (tag) {
                html += activeFilterChip("tag", tag, tag, tag);
            });

            if (filterState.search.trim()) {
                html += '<span class="active-chip">Search: "' +
                    escapeHtml(filterState.search.trim()) + '"' +
                    removeFilterButton("search", filterState.search.trim(), "search") +
                    "</span>";
            }

            if (!html) return "";
            return html + '<button type="button" class="link-btn clear-all-btn">Clear all</button>';
        }

        function activeFilterChip(type, value, label, ariaLabel) {
            return '<span class="active-chip">' + escapeHtml(label) +
                removeFilterButton(type, value, ariaLabel) + "</span>";
        }

        function removeFilterButton(type, value, ariaLabel) {
            return '<button type="button" class="remove-filter"' +
                ' data-type="' + escapeHtml(type) + '"' +
                ' data-value="' + escapeHtml(value) + '"' +
                ' aria-label="Remove filter: ' + escapeHtml(ariaLabel || value) + '">' +
                icon("x", 12) + "</button>";
        }

        /** The "No assets found" state shown when nothing matches. */
        function emptyResultsHtml() {
            var message = assets.length === 0
                ? "There are no assets in the catalog yet."
                : "No assets match your current search and filters. Try different keywords, or clear the filters.";
            return '<div class="empty-state">' +
                icon("search", 34) +
                "<h3>No assets found</h3>" +
                "<p>" + escapeHtml(message) + "</p>" +
                '<div class="empty-actions">' +
                    '<button type="button" class="btn btn-outline btn-small" data-action="clear-filters">' +
                        icon("x", 14) + " Clear Filters" +
                    "</button>" +
                "</div>" +
            "</div>";
        }

        // ---------- Asset detail page ----------

        /** One row in the metadata list of the asset page. */
        function metaRow(key, valueHtml) {
            return '<li><span class="meta-key">' + key + '</span><span class="meta-value">' + valueHtml + "</span></li>";
        }

        function renderAssetDetailPage(container, asset) {
            var category = getCategoryById(asset.category);
            var description = asset.description || asset.shortDescription || "No description available yet.";
            var docs = getDocumentation(asset);
            var changelog = getChangelog(asset);
            var versionLabel = getAssetVersion(asset);
            var updatedDate = getAssetUpdatedDate(asset);

            // Metadata rows (optional fields are skipped automatically).
            // Version and Last updated come from the newest changelog
            // entry whenever a changelog exists.
            var metaRows = "";
            if (versionLabel) {
                metaRows += metaRow("Version", escapeHtml(versionLabel));
            }
            metaRows += metaRow("Category", category
                ? internalLink(categoryUrl(asset.category), escapeHtml(category.name), "")
                : "Uncategorized");
            if (asset.created) {
                metaRows += metaRow("First released", escapeHtml(formatDate(asset.created)));
            }
            if (updatedDate) {
                metaRows += metaRow("Last updated",
                    escapeHtml(formatRelativeDate(updatedDate)) +
                    ' <span class="meta-exact">(' + escapeHtml(formatDate(updatedDate)) + ")</span>");
            }
            if ((asset.tags || []).length) {
                metaRows += metaRow("Tags", '<span class="detail-tags">' + renderTagPills(asset) + "</span>");
            }

            container.innerHTML =
                '<div class="page detail-page">' +
                    '<div class="container">' +
                        '<div class="detail-top">' +
                            internalLink(pageUrl("assets"), icon("arrow-left", 15) + " Back to Assets", "back-link") +
                        "</div>" +
                        '<div class="detail-layout">' +
                            '<div class="detail-media media-frame">' + renderMedia(asset) + "</div>" +
                            '<div class="detail-info">' +
                                (category
                                    ? '<div class="detail-meta">' +
                                        internalLink(categoryUrl(asset.category), escapeHtml(category.name), "tag-pill") +
                                      "</div>"
                                    : "") +
                                '<h1 class="detail-title">' + escapeHtml(asset.name) + "</h1>" +
                                (asset.shortDescription
                                    ? '<p class="detail-short">' + escapeHtml(asset.shortDescription) + "</p>"
                                    : "") +
                                '<div class="purchase-card">' +
                                    renderPurchasePrice(asset) +
                                    '<div class="purchase-actions">' +
                                        externalButton(asset.unityUrl, "View on Unity Asset Store", "btn btn-primary") +
                                        (asset.itchUrl
                                            ? externalButton(asset.itchUrl, "View on itch.io", "btn btn-outline")
                                            : "") +
                                        (docs
                                            ? internalLink(docsUrl(asset.id),
                                                icon("file-text", 15) + " Documentation", "btn btn-outline")
                                            : "") +
                                        (changelog
                                            ? internalLink(changelogUrl(asset.id),
                                                icon("clock", 15) + " Changelog", "btn btn-outline")
                                            : "") +
                                    "</div>" +
                                "</div>" +
                                (metaRows ? '<ul class="detail-meta-list">' + metaRows + "</ul>" : "") +
                            "</div>" +
                        "</div>" +
                        '<section class="detail-about">' +
                            "<h2>About this asset</h2>" +
                            '<div class="formatted-text">' + formatDocText(description) + "</div>" +
                        "</section>" +
                    "</div>" +
                "</div>";
        }

        // ---------- Documentation page ----------

        /** Renders one documentation block (text, code or note). */
        function renderDocBlock(block, index) {
            if (!block || !block.type) return "";

            var anchorOpen = '<section class="doc-section" id="doc-section-' + index + '">';

            if (block.type === "code") {
                return anchorOpen +
                    (block.title ? '<h2 class="doc-section-title">' + escapeHtml(block.title) + "</h2>" : "") +
                    '<div class="code-block">' +
                        '<div class="code-block-header">' +
                            '<span class="code-language">' + escapeHtml(getLanguageLabel(block.language)) + "</span>" +
                            '<button type="button" class="copy-btn">' + icon("copy", 13) + " Copy</button>" +
                        "</div>" +
                        "<pre><code>" + escapeHtml(block.code || "") + "</code></pre>" +
                    "</div>" +
                "</section>";
            }

            if (block.type === "note") {
                return anchorOpen +
                    '<div class="doc-note">' +
                        (block.title
                            ? '<strong class="doc-note-title">' + escapeHtml(block.title) + "</strong>"
                            : "") +
                        '<div class="formatted-text">' + formatDocText(block.content) + "</div>" +
                    "</div>" +
                "</section>";
            }

            // Default: plain text block.
            return anchorOpen +
                (block.title ? '<h2 class="doc-section-title">' + escapeHtml(block.title) + "</h2>" : "") +
                '<div class="formatted-text">' + formatDocText(block.content) + "</div>" +
            "</section>";
        }

        function renderDocumentationPage(container, asset) {
            var sections = getDocumentation(asset);

            // Documentation requested but not available for this asset.
            if (!sections) {
                container.innerHTML =
                    '<div class="page docs-page"><div class="container">' +
                        '<div class="detail-top">' +
                            internalLink(pageUrl("assets"), icon("arrow-left", 15) + " Back to Assets", "back-link") +
                        "</div>" +
                        notFoundState("Documentation not available",
                            "This asset doesn't have documentation (or it isn't enabled).",
                            internalLink(assetUrl(asset.id), "View asset page", "btn btn-primary btn-small") +
                            internalLink(pageUrl("assets"), "Browse all assets", "btn btn-outline btn-small"),
                            "file-text") +
                    "</div></div>";
                return;
            }

            // Render all blocks + collect table-of-contents entries.
            var blocksHtml = "";
            var tocEntries = [];
            sections.forEach(function (block, index) {
                if (block && block.title && block.type !== "note") {
                    tocEntries.push({ anchor: "doc-section-" + index, title: block.title });
                }
                blocksHtml += renderDocBlock(block, index);
            });

            // A table of contents appears automatically for longer docs.
            var showToc = tocEntries.length >= 4;
            var tocHtml = showToc
                ? '<nav class="docs-toc" aria-label="Documentation sections">' +
                      '<h2 class="docs-toc-title">On this page</h2><ul>' +
                      tocEntries.map(function (entry) {
                          return '<li><a href="#' + entry.anchor + '">' + escapeHtml(entry.title) + "</a></li>";
                      }).join("") +
                      "</ul></nav>"
                : "";

            var versionLabel = getAssetVersion(asset);
            var updatedDate = getAssetUpdatedDate(asset);

            container.innerHTML =
                '<div class="page docs-page">' +
                    '<div class="container">' +
                        '<nav class="breadcrumb" aria-label="Breadcrumb">' +
                            internalLink(pageUrl("assets"), "Assets", "") +
                            '<span class="crumb-sep" aria-hidden="true">/</span>' +
                            internalLink(assetUrl(asset.id), escapeHtml(asset.name), "") +
                            '<span class="crumb-sep" aria-hidden="true">/</span>' +
                            '<span aria-current="page">Documentation</span>' +
                        "</nav>" +
                        '<div class="docs-header">' +
                            '<span class="docs-kicker">Documentation</span>' +
                            '<h1 class="docs-title">' + escapeHtml(asset.name) + "</h1>" +
                            '<p class="docs-subtitle">' +
                                (versionLabel ? "Version " + escapeHtml(versionLabel) + " Â· " : "") +
                                (updatedDate ? escapeHtml(formatRelativeDate(updatedDate)) : "") +
                            "</p>" +
                        "</div>" +
                        '<div class="docs-layout' + (showToc ? "" : " no-toc") + '">' +
                            tocHtml +
                            '<div class="docs-content">' + blocksHtml + "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>";

            setupCopyButtons(container);

            // Smooth-scroll the table of contents. preventDefault keeps the
            // "#doc-section-x" anchors out of the URL (the hash is used for
            // page routing, so it must stay clean).
            Array.prototype.forEach.call(container.querySelectorAll(".docs-toc a"), function (link) {
                link.addEventListener("click", function (event) {
                    event.preventDefault();
                    var target = document.getElementById(link.getAttribute("href").slice(1));
                    if (target) {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                });
            });
        }

        /** Wires up the Copy buttons of all code blocks in a container. */
        function setupCopyButtons(container) {
            Array.prototype.forEach.call(container.querySelectorAll(".copy-btn"), function (button) {
                button.addEventListener("click", function () {
                    var codeBlock = button.closest(".code-block");
                    var codeElement = codeBlock ? codeBlock.querySelector("code") : null;
                    if (!codeElement) return;
                    copyToClipboard(codeElement.textContent, button);
                });
            });
        }

        /**
         * Copies text using the standard Clipboard API, with a fallback
         * for browsers where it is unavailable. Shows "Copied!" feedback.
         */
        function copyToClipboard(text, button) {
            function showCopied() {
                button.innerHTML = icon("check", 13) + " Copied!";
                button.classList.add("copied");
                clearTimeout(button._copyResetTimer);
                button._copyResetTimer = setTimeout(function () {
                    button.innerHTML = icon("copy", 13) + " Copy";
                    button.classList.remove("copied");
                }, 1600);
            }

            function fallbackCopy() {
                var textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                var success = false;
                try { success = document.execCommand("copy"); } catch (error) { /* ignore */ }
                document.body.removeChild(textarea);
                if (success) showCopied();
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(showCopied, fallbackCopy);
            } else {
                fallbackCopy();
            }
        }

        // ---------- Changelog page ----------

        /** Renders the dedicated changelog page for an asset. */
        function renderChangelogPage(container, asset) {
            var changelog = getChangelog(asset);

            // Changelog requested but not available for this asset.
            if (!changelog) {
                container.innerHTML =
                    '<div class="page changelog-page"><div class="container">' +
                        '<div class="detail-top">' +
                            internalLink(pageUrl("assets"), icon("arrow-left", 15) + " Back to Assets", "back-link") +
                        "</div>" +
                        notFoundState("Changelog not available",
                            "This asset doesn't have a changelog (or none is configured).",
                            internalLink(assetUrl(asset.id), "View asset page", "btn btn-primary btn-small") +
                            internalLink(pageUrl("assets"), "Browse all assets", "btn btn-outline btn-small"),
                            "clock") +
                    "</div></div>";
                return;
            }

            // One entry per release, newest first. The first entry is
            // marked as the current version.
            var entries = changelog.map(function (entry, index) {
                entry = entry || {};
                var version = entry.version ? String(entry.version) : "Update";
                return '<article class="changelog-entry">' +
                    '<div class="changelog-entry-head">' +
                        '<h2 class="changelog-version">' + escapeHtml(version) + "</h2>" +
                        (index === 0 ? '<span class="changelog-current">Current</span>' : "") +
                        (entry.date ? '<span class="changelog-date">' + escapeHtml(formatDate(entry.date)) + "</span>" : "") +
                    "</div>" +
                    '<div class="formatted-text">' + formatDocText(entry.changes) + "</div>" +
                "</article>";
            }).join("");

            var versionLabel = getAssetVersion(asset);
            var updatedDate = getAssetUpdatedDate(asset);

            container.innerHTML =
                '<div class="page changelog-page">' +
                    '<div class="container">' +
                        '<nav class="breadcrumb" aria-label="Breadcrumb">' +
                            internalLink(pageUrl("assets"), "Assets", "") +
                            '<span class="crumb-sep" aria-hidden="true">/</span>' +
                            internalLink(assetUrl(asset.id), escapeHtml(asset.name), "") +
                            '<span class="crumb-sep" aria-hidden="true">/</span>' +
                            '<span aria-current="page">Changelog</span>' +
                        "</nav>" +
                        '<div class="docs-header">' +
                            '<span class="docs-kicker">Changelog</span>' +
                            '<h1 class="docs-title">' + escapeHtml(asset.name) + "</h1>" +
                            '<p class="docs-subtitle">' +
                                (versionLabel ? "Version " + escapeHtml(versionLabel) + " Â· " : "") +
                                (updatedDate ? escapeHtml(formatRelativeDate(updatedDate)) : "") +
                            "</p>" +
                        "</div>" +
                        '<div class="changelog-list">' + entries + "</div>" +
                    "</div>" +
                "</div>";
        }

        // ---------- Contact page ----------

        function renderContactPage(container) {
            var contact = siteContent.contact;
            var links = siteConfig.links;

            // Plain list, no icons.
            var topics = (contact.topics || []).map(function (topic) {
                return "<li>" + escapeHtml(topic) + "</li>";
            }).join("");

            container.innerHTML =
                '<div class="page contact-page">' +
                    '<div class="container">' +
                        '<div class="page-header">' +
                            '<h1 class="section-title">' + escapeHtml(contact.title) + "</h1>" +
                            '<p class="section-text">' + escapeHtml(contact.text) + "</p>" +
                        "</div>" +
                        '<div class="contact-grid">' +
                            '<div class="contact-card">' +
                                "<h2>" + escapeHtml(contact.emailTitle) + "</h2>" +
                                "<p>" + escapeHtml(contact.emailText) + "</p>" +
                                (links.email
                                    ? '<a class="contact-link" href="mailto:' + escapeHtml(links.email) + '">' +
                                        escapeHtml(links.email) + "</a>"
                                    : "") +
                            "</div>" +
                            '<div class="contact-card">' +
                                "<h2>" + escapeHtml(contact.discordTitle) + "</h2>" +
                                "<p>" + escapeHtml(contact.discordText) + "</p>" +
                                externalButton(links.discord,
                                    escapeHtml(siteContent.discord.buttonText || "Join the Discord"),
                                    "contact-link") +
                            "</div>" +
                        "</div>" +
                        (topics
                            ? '<div class="contact-topics">' +
                                "<h2>" + escapeHtml(contact.topicsTitle) + "</h2>" +
                                '<ul class="topics-list">' + topics + "</ul>" +
                              "</div>"
                            : "") +
                    "</div>" +
                "</div>";
        }


        // ============================================================
        // FILTERING AND SORTING
        // ============================================================

        /**
         * Applies the combined filter state (search + categories + tags)
         * to a list of assets. Selected tags are combined with AND logic:
         * an asset must carry every selected tag to match.
         */
        function filterAssets(list, state) {
            var query = state.search.trim().toLowerCase();

            return list.filter(function (asset) {
                // Search matches the asset name or short description.
                if (query) {
                    var haystack = (asset.name + " " + (asset.shortDescription || "")).toLowerCase();
                    if (haystack.indexOf(query) === -1) return false;
                }

                // Category filter (asset must be in one of the selected categories).
                if (state.categories.length && state.categories.indexOf(asset.category) === -1) {
                    return false;
                }

                // Tag filter (asset must carry ALL selected tags).
                if (state.tags.length) {
                    var assetTags = asset.tags || [];
                    for (var i = 0; i < state.tags.length; i++) {
                        if (assetTags.indexOf(state.tags[i]) === -1) return false;
                    }
                }

                return true;
            });
        }

        /**
         * Sorts a list of assets. Dates are compared as real date values
         * and prices as real numbers, never as strings. Price sorting uses
         * the effective (sale-discounted) price.
         */
        function sortAssets(list, sort) {
            var sorted = list.slice();

            switch (sort) {
                case "oldest":
                    sorted.sort(function (a, b) { return dateValue(a.created) - dateValue(b.created); });
                    break;
                case "updated":
                    sorted.sort(function (a, b) { return dateValue(b.updated) - dateValue(a.updated); });
                    break;
                case "price-high":
                    sorted.sort(function (a, b) { return getEffectivePrice(b) - getEffectivePrice(a); });
                    break;
                case "price-low":
                    sorted.sort(function (a, b) { return getEffectivePrice(a) - getEffectivePrice(b); });
                    break;
                default: // "newest"
                    sorted.sort(function (a, b) { return dateValue(b.created) - dateValue(a.created); });
            }

            return sorted;
        }

        /** Keeps the browser URL in sync with the current filter state. */
        function syncAssetsUrl() {
            var params = ["page=assets"];
            if (filterState.categories.length) {
                params.push("category=" + encodeURIComponent(filterState.categories.join(",")));
            }
            if (filterState.tags.length) {
                params.push("tag=" + encodeURIComponent(filterState.tags.join(",")));
            }
            if (filterState.search.trim()) {
                params.push("q=" + encodeURIComponent(filterState.search.trim()));
            }
            if (filterState.sort !== "newest") {
                params.push("sort=" + encodeURIComponent(filterState.sort));
            }
            var newHash = "#" + params.join("&");
            if (newHash === window.location.hash) return;

            try {
                // replaceState updates the address bar without adding a
                // history entry for every keystroke.
                history.replaceState(null, "", newHash);
                lastRenderedHash = newHash;
            } catch (error) {
                // replaceState is unavailable in some environments (e.g.
                // local files, sandboxed previews). Filters keep working,
                // the URL just doesn't update.
            }
        }


        // ============================================================
        // ROUTING / NAVIGATION
        // ============================================================
        // Hash-based routing: "#page=assets", "#asset=example-inventory",
        // "#docs=example-inventory", "#changelog=example-inventory",
        // "#page=assets&category=vfx".
        //
        // Hash navigation is pure in-page navigation. Unlike query
        // parameters, it works in EVERY environment: hosted sites,
        // files opened directly from disk, and sandboxed preview panes
        // where the History API and full page loads are blocked.

        /** The hash of the route that is currently on screen. */
        var lastRenderedHash = null;

        /**
         * Reads the route parameters from the URL. Prefers the hash
         * ("#page=assets"); falls back to a query string ("?page=assets")
         * so old-style links keep working.
         */
        function getRouteParams() {
            var source = window.location.hash || window.location.search || "";
            if (source.charAt(0) === "#" || source.charAt(0) === "?") {
                source = source.slice(1);
            }
            return new URLSearchParams(source);
        }

        /**
         * Builds the route object for the current URL.
         * Supported routes:
         *   #page=home            -> home
         *   #page=assets          -> catalog (with optional &category=...,
         *                           &tag=..., &q=..., &sort=... filter params)
         *   #page=contact         -> contact
         *   #asset=example-id     -> asset detail page
         *   #docs=example-id      -> documentation page
         *   #changelog=example-id -> changelog page
         */
        function parseRoute() {
            var params = getRouteParams();

            if (params.get("asset")) {
                return { type: "asset", id: params.get("asset"), pageKey: "assets" };
            }
            if (params.get("docs")) {
                return { type: "docs", id: params.get("docs"), pageKey: "assets" };
            }
            if (params.get("changelog")) {
                return { type: "changelog", id: params.get("changelog"), pageKey: "assets" };
            }

            var page = params.get("page") || "home";

            if (page === "assets") {
                return { type: "assets", pageKey: "assets", filters: readFiltersFromUrl(params) };
            }
            if (page === "contact") {
                return { type: "contact", pageKey: "contact" };
            }

            // Unknown or missing page: homepage.
            return { type: "home", pageKey: "home" };
        }

        /** Reads and validates filter state from URL parameters. */
        function readFiltersFromUrl(params) {
            var sort = params.get("sort") || "newest";
            var sortKnown = SORT_OPTIONS.some(function (option) { return option.value === sort; });
            if (!sortKnown) sort = "newest";

            var availableTags = getAllTags();

            return {
                search: params.get("q") || "",
                categories: (params.get("category") || "").split(",")
                    .filter(Boolean)
                    .filter(function (id) { return getCategoryById(id) !== null; }),
                tags: (params.get("tag") || "").split(",")
                    .filter(Boolean)
                    .filter(function (tag) { return availableTags.indexOf(tag) !== -1; }),
                sort: sort
            };
        }

        /** Renders whatever the current URL points to. */
        function renderRoute() {
            var currentHash = window.location.hash || "";

            // Skip re-renders of the route that is already on screen.
            // This keeps the hashchange and popstate listeners from
            // double-rendering the same navigation.
            if (currentHash === lastRenderedHash) return;
            lastRenderedHash = currentHash;

            var route = parseRoute();
            var app = document.getElementById("app");

            closeMobileMenu();
            document.title = buildPageTitle(route);

            try {
                if (route.type === "asset") {
                    var asset = getAssetById(route.id);
                    if (asset) {
                        renderAssetDetailPage(app, asset);
                    } else {
                        app.innerHTML =
                            '<div class="page detail-page"><div class="container">' +
                                '<div class="detail-top">' +
                                    internalLink(pageUrl("assets"), icon("arrow-left", 15) + " Back to Assets", "back-link") +
                                "</div>" +
                                notFoundState("Asset not found",
                                    "The asset you're looking for doesn't exist or may have been removed.",
                                    internalLink(pageUrl("assets"), "Browse Assets", "btn btn-primary btn-small"),
                                    "box") +
                            "</div></div>";
                    }
                } else if (route.type === "docs") {
                    var docsAsset = getAssetById(route.id);
                    if (docsAsset) {
                        renderDocumentationPage(app, docsAsset);
                    } else {
                        app.innerHTML =
                            '<div class="page docs-page"><div class="container">' +
                                '<div class="detail-top">' +
                                    internalLink(pageUrl("assets"), icon("arrow-left", 15) + " Back to Assets", "back-link") +
                                "</div>" +
                                notFoundState("Documentation not found",
                                    "This documentation doesn't exist. The asset may have been removed.",
                                    internalLink(pageUrl("assets"), "Browse Assets", "btn btn-primary btn-small"),
                                    "file-text") +
                            "</div></div>";
                    }
                } else if (route.type === "changelog") {
                    var changelogAsset = getAssetById(route.id);
                    if (changelogAsset) {
                        renderChangelogPage(app, changelogAsset);
                    } else {
                        app.innerHTML =
                            '<div class="page changelog-page"><div class="container">' +
                                '<div class="detail-top">' +
                                    internalLink(pageUrl("assets"), icon("arrow-left", 15) + " Back to Assets", "back-link") +
                                "</div>" +
                                notFoundState("Changelog not found",
                                    "This changelog doesn't exist. The asset may have been removed.",
                                    internalLink(pageUrl("assets"), "Browse Assets", "btn btn-primary btn-small"),
                                    "clock") +
                            "</div></div>";
                    }
                } else if (route.type === "assets") {
                    renderAssetsPage(app, route.filters);
                } else if (route.type === "contact") {
                    renderContactPage(app);
                } else {
                    renderHomePage(app);
                }
            } catch (error) {
                // Safety net: one broken data entry should never blank the site.
                console.error("[Swimpie's Assets] Rendering error:", error);
                lastRenderedHash = null; // allow a retry on the next click
                app.innerHTML =
                    '<div class="page"><div class="container">' +
                        '<div class="empty-state">' +
                            "<h3>Something went wrong</h3>" +
                            "<p>An error occurred while rendering this page. Check the browser console for details. It is usually caused by a small mistake in the content data.</p>" +
                            '<div class="empty-actions">' +
                                internalLink(pageUrl("home"), "Back to Home", "btn btn-primary btn-small") +
                            "</div>" +
                        "</div>" +
                    "</div></div>";
            }

            updateActiveNav(route.pageKey);

            // Move keyboard/screen-reader focus to the new page content.
            app.setAttribute("tabindex", "-1");
            app.focus({ preventScroll: true });

            window.scrollTo(0, 0);
        }

        /** Browser tab title for the current route. */
        function buildPageTitle(route) {
            var siteName = siteConfig.siteName;

            if (route.type === "asset" || route.type === "docs" || route.type === "changelog") {
                var asset = getAssetById(route.id);
                if (asset) {
                    if (route.type === "docs") return "Documentation | " + asset.name;
                    if (route.type === "changelog") return "Changelog | " + asset.name;
                    return asset.name + " | " + siteName;
                }
                return siteName;
            }
            if (route.type === "assets") return "Assets | " + siteName;
            if (route.type === "contact") return "Contact | " + siteName;
            return siteName;
        }

        /** Highlights the current section in the header navigation. */
        function updateActiveNav(pageKey) {
            var navLinks = document.querySelectorAll(".nav-link[data-page]");
            Array.prototype.forEach.call(navLinks, function (link) {
                link.classList.toggle("active", link.getAttribute("data-page") === pageKey);
            });
        }

        /**
         * Navigates to an internal URL (always starts with "#") without a
         * page reload. Setting location.hash is pure in-page navigation:
         * it works in every environment, including local files and
         * sandboxed previews where the History API is blocked.
         */
        function navigateTo(url) {
            if (window.location.hash !== url) {
                window.location.hash = url; // fires hashchange (see listeners)
            }
            renderRoute(); // render now; the later hashchange is deduplicated
        }

        /** Intercepts clicks on internal links for smooth navigation. */
        function setupInternalNavigation() {
            document.addEventListener("click", function (event) {
                if (event.defaultPrevented || event.button !== 0) return;
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

                var link = event.target && event.target.closest
                    ? event.target.closest("a[data-internal]")
                    : null;
                if (!link) return;

                event.preventDefault();
                closeMobileMenu();
                navigateTo(link.getAttribute("href"));
            });

            // "Skip to content" link: focus the main area instead of letting
            // the browser treat "#app" as a page anchor. (This site uses the
            // hash for routing, so stray anchors must stay out of the URL.)
            var skipLink = document.querySelector(".skip-link");
            if (skipLink) {
                skipLink.addEventListener("click", function (event) {
                    event.preventDefault();
                    var app = document.getElementById("app");
                    app.setAttribute("tabindex", "-1");
                    app.focus();
                });
            }

            // Browser Back / Forward buttons. Both events are listened to
            // for maximum compatibility; renderRoute deduplicates them.
            window.addEventListener("hashchange", renderRoute);
            window.addEventListener("popstate", renderRoute);
        }

        /* ---------- Mobile menu ---------- */

        /** Mobile menu: toggle, Escape key, click outside, close on nav. */
        function setupMobileMenu() {
            var header = document.getElementById("siteHeader");
            var toggle = header.querySelector(".menu-toggle");

            function setOpen(open) {
                header.classList.toggle("nav-open", open);
                toggle.setAttribute("aria-expanded", open ? "true" : "false");
            }

            toggle.addEventListener("click", function () {
                setOpen(!header.classList.contains("nav-open"));
            });

            document.addEventListener("keydown", function (event) {
                if (event.key === "Escape" && header.classList.contains("nav-open")) {
                    setOpen(false);
                    toggle.focus();
                }
            });

            document.addEventListener("click", function (event) {
                if (header.classList.contains("nav-open") && !header.contains(event.target)) {
                    setOpen(false);
                }
            });
        }

        function closeMobileMenu() {
            var header = document.getElementById("siteHeader");
            var toggle = header ? header.querySelector(".menu-toggle") : null;
            if (header) header.classList.remove("nav-open");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        }


        // ============================================================
        // INITIALIZATION
        // ============================================================

        var assets = [];

        async function loadAssetData() {
            var manifestResponse = await fetch("assets/index.json");
            if (!manifestResponse.ok) {
                throw new Error("Could not load assets/index.json (" + manifestResponse.status + ")");
            }

            var assetIds = JSON.parse(await manifestResponse.text());
            assets = await Promise.all(assetIds.map(async function (assetId) {
                var basePath = "assets/" + encodeURIComponent(assetId) + "/";
                var assetResponse = await fetch(basePath + "asset.json");
                if (!assetResponse.ok) {
                    throw new Error("Could not load " + basePath + "asset.json (" + assetResponse.status + ")");
                }

                var asset = JSON.parse(await assetResponse.text());
                var changelogResponse = await fetch(basePath + "changelog.json");
                var documentationResponse = await fetch(basePath + "documentation.json");

                if (changelogResponse.ok) {
                    asset.changelog = JSON.parse(await changelogResponse.text());
                }
                if (documentationResponse.ok) {
                    asset.documentation = {
                        enabled: true,
                        sections: JSON.parse(await documentationResponse.text())
                    };
                }
                if (asset.media) asset.media = basePath + encodeURIComponent(asset.media);
                return asset;
            }));
        }

        (async function initSite() {
            try {
                await loadAssetData();
                validateData();

                var faviconLink = document.getElementById("faviconLink");
                if (faviconLink && siteConfig.logo) faviconLink.href = siteConfig.logo;

                renderHeader();
                renderFooter();
                setupMobileMenu();
                setupInternalNavigation();
                renderRoute();
            } catch (error) {
                console.error("[Swimpie's Assets] Could not load site data:", error);
                document.getElementById("app").innerHTML =
                    '<div class="page"><div class="container"><div class="empty-state"><h1>Unable to load site data</h1><p>Check that the site is being served over HTTP and that the asset files are available.</p></div></div></div>';
            }
        })();

