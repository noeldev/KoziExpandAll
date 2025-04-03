// KoziExpandAll.js by Noel-50
// 2.5 - Fixed Uncaught SyntaxError
// 2.4 - Improved code to hide elements
// 2.3 - Integrated auto-scrolling functions
// 2.2 - Created an Expander class (OOP)
// 2.1 - Some fixes
// 2.0 - First release

const DEBUG = localStorage.getItem("DEBUG") === "true";

const CONFIG = DEBUG ? {
    discussionBatchSize: 50,
    commentBatchSize: 200,
    retryTimeout: 10000,
    mutationTimeout: 3500,
    scrollDelay: 300,
    maxScrollAttempts: 20
} : {
    discussionBatchSize: 20,
    commentBatchSize: 50,
    retryTimeout: 30000,
    mutationTimeout: 8000,
    scrollDelay: 500,
    maxScrollAttempts: 50
};

console.log("CONFIG:", CONFIG);

class Expander {
    constructor(selector, containerSelector, label, batchSize) {
        this.selector = selector;
        this.containerSelector = containerSelector;
        this.label = label;
        this.batchSize = batchSize;
    }

    async process() {
        let pass = 1;

        while (true) {
            const elements = Array.from(document.querySelectorAll(this.selector));
            if (elements.length === 0) {
                console.log(`✅ No more ${this.label}s to process.`);
                break;
            }

            console.log(`🔄 Pass #${pass}: Found ${elements.length} expandable ${this.label}(s).`);
            await this.processBatches(elements);
            pass++;
        }

        console.log(`✅ All passes completed for ${this.label}.`);
    }

    async processBatches(elements) {
        const totalElements = elements.length;
        const totalBatches = Math.ceil(totalElements / this.batchSize);

        for (let i = 0; i < totalElements; i += this.batchSize) {
            const batch = elements.slice(i, i + this.batchSize);
            console.log(`🚀 Processing batch ${Math.floor(i / this.batchSize) + 1}/${totalBatches} (${batch.length} elements)...`);

            try {
                await Promise.all(batch.map((button, index) =>
                    this.clickAndWait(button, i + index + 1, totalElements)
                ));
            } catch (error) {
                console.error(`❌ Error while processing ${this.label} batch; retrying...`);
                await this.wait(CONFIG.retryTimeout);
            }
        }
    }

    async clickAndWait(button, index, total) {
        const buttonText = button.textContent.trim();
        console.log(`📤 (${index}/${total}) Processing '${buttonText}'...`);
        button.click();
        await waitForNewContent(this.containerSelector);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

function waitForNewContent(targetSelector) {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutationsList, observer) => {
            if (mutationsList.some(m => m.type === "childList" && m.addedNodes.length > 0)) {
                observer.disconnect();
                console.log("✅ New element detected, skipping...");
                resolve();
            }
        });

        const targetNode = document.querySelector(targetSelector);
        if (!targetNode) {
            console.warn(`⚠️ Container '${targetSelector}' not found, skipping.`);
            resolve();
            return;
        }

        observer.observe(targetNode, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            console.warn("⏳ Timeout expired without detecting any new items, skipping.");
            resolve();
        }, CONFIG.mutationTimeout);
    });
}

async function fetchStory() {
    let lastHeight = 0;
    let newHeight = document.body.scrollHeight;
    let attempts = 0;

    console.log("🔽 Scrolling to load the whole story...");

    while (attempts < CONFIG.maxScrollAttempts) {
        window.scrollTo(0, newHeight);
        await new Promise(resolve => setTimeout(resolve, CONFIG.scrollDelay));

        lastHeight = newHeight;
        newHeight = document.body.scrollHeight;

        if (newHeight === lastHeight) {
            attempts++;
        } else {
            attempts = 0;
        }
    }

    console.log("✅ Story fully loaded.");
}

async function loadAllImages(scrollStep = 300, scrollDelay = 50) {
    console.log("🔼 Scrolling to top...");
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));
    while (window.scrollY > 0) {
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("🔽 Scrolling down to trigger image loading...");
    let scrollPosition = 0;
    let pageHeight = document.body.scrollHeight;

    while (scrollPosition < pageHeight) {
        scrollPosition += scrollStep;
        window.scrollTo(0, scrollPosition);
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
    }

    console.log("✅ Image loading complete.");
}

async function runScript() {
    await fetchStory();

    await new Expander("button.kz-post-discussion--comments-loadmore", ".kz-post-description", "discussion", CONFIG.discussionBatchSize).process();
    await new Expander(".read-more-cta .read-more-span", ".kz-post-description", "comment", CONFIG.commentBatchSize).process();

    await loadAllImages();
}

const hideElements = (selectors) => {
    selectors.forEach(selector => {
        document.querySelector(selector)?.style.setProperty("display", "none");
    });
};

hideElements([
    ".kz-header",
    ".kz-navbar.ng-star-inserted",
    ".kz-navbar",
    ".kz-kaza--options",
    ".kz-kaza-header--user-more.ng-star-inserted",
    "app-countdown-timer .maintenance",
    "app-footer"
]);

runScript().then(() => console.log("🎉 Process is complete."));
