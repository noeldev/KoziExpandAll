// KoziExpandAll.js (V2.2 OOP) by Noel-50
const CONFIG = {
    discussionBatchSize: 30,
    commentBatchSize: 50,
    retryTimeout: 10000,
    mutationTimeout: 8000
};

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

async function runScript() {
    await new Expander("button.kz-post-discussion--comments-loadmore", ".kz-post-description", "discussion", CONFIG.discussionBatchSize).process();
    await new Expander(".read-more-cta .read-more-span", ".kz-post-description", "comment", CONFIG.commentBatchSize).process();
}

// Hide UI elements
[".kz-header", ".kz-navbar.ng-star-inserted", "app-countdown-timer .maintenance"]
    .forEach(selector => document.querySelector(selector)?.style.setProperty("display", "none"));

runScript();
