// KoziExpandAll.js V2.1 by Noel-50
const CONFIG = {
    discussionBatchSize: 50,
    commentBatchSize: 200,
    retryTimeout: 10000,
    mutationTimeout: 2500
};

async function processElements(selector, containerSelector, label, batchSize) {
    let pass = 1;
    let elements;

    console.log(`🔧 Batch size for ${label}: ${batchSize}`);

    do {
        elements = Array.from(document.querySelectorAll(selector));
        const totalElements = elements.length;

        console.log(`🔄 Pass #${pass}: Found ${totalElements} expandable ${label}(s).`);

        if (totalElements === 0) {
            console.log(`✅ No more ${label}s to process.`);
            return;
        }

        const totalBatches = Math.ceil(totalElements / batchSize);

        for (let i = 0; i < totalElements; i += batchSize) {
            const batch = elements.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;

            console.log(`🚀 Processing batch ${batchNumber}/${totalBatches} (${batch.length} elements)...`);

            try {
                await Promise.all(batch.map((button, index) => {
                    const elementIndex = i + index + 1;
                    return clickAndWait(button, containerSelector, elementIndex, totalElements, label);
                }));
            } catch (error) {
                console.error(`❌ Error while processing ${label} batch; retrying...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryTimeout));
            }
        }

        pass++;
    } while (elements.length > 0);

    console.log(`✅ All passes completed for ${label}.`);
}

async function clickAndWait(button, containerSelector, index, total, label) {
    const buttonText = button.textContent.trim();

    console.log(`📤 (${index}/${total}) Processing '${buttonText}'...`);
    button.click();
    await waitForNewContent(containerSelector);
}

function waitForNewContent(targetSelector) {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    observer.disconnect();
                    console.log("✅ New element detected, skipping...");
                    resolve();
                    return;
                }
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

// Load partial discussions and comments
async function runScript() {
    await processElements(
        "button.kz-post-discussion--comments-loadmore", 
        ".kz-post-description", 
        "discussion", 
        CONFIG.discussionBatchSize);
    
    await processElements(
        ".read-more-cta .read-more-span", 
        ".kz-post-description", 
        "comment", 
        CONFIG.commentBatchSize);
}

// Hide unwanted elements
document.querySelector(".kz-header")?.style.setProperty("display", "none");
document.querySelector(".kz-navbar.ng-star-inserted")?.style.setProperty("display", "none");
document.querySelector("app-countdown-timer .maintenance")?.style.setProperty("display", "none");

// Entry point
runScript();
