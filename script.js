class FeedViewer {
    constructor() {
        this.feedData = [];
        this.excludedItems = new Set();
        this.filteredData = [];
        this.categories = new Set();
        
        this.initializeElements();
        this.bindEvents();
        this.loadSampleData();
    }

    initializeElements() {
        this.feedUrlInput = document.getElementById('feedUrl');
        this.sampleFeedsSelect = document.getElementById('sampleFeeds');
        this.fileUpload = document.getElementById('fileUpload');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.loadBtn = document.getElementById('loadFeed');
        this.refreshBtn = document.getElementById('refreshFeed');
        this.searchInput = document.getElementById('searchFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.exportBtn = document.getElementById('exportExclusions');
        this.loadingDiv = document.getElementById('loading');
        this.errorDiv = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.feedContainer = document.getElementById('feedContainer');
        this.totalItemsSpan = document.getElementById('totalItems');
        this.excludedItemsSpan = document.getElementById('excludedItems');
    }

    bindEvents() {
        this.loadBtn.addEventListener('click', () => this.loadFeed());
        this.refreshBtn.addEventListener('click', () => this.refreshFeed());
        this.searchInput.addEventListener('input', () => this.filterItems());
        this.categoryFilter.addEventListener('change', () => this.filterItems());
        this.exportBtn.addEventListener('click', () => this.exportExclusions());
        
        // Handle sample feeds dropdown
        this.sampleFeedsSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.feedUrlInput.value = e.target.value;
                this.loadFeed();
                e.target.value = ''; // Reset dropdown
            }
        });
        
        // Handle file upload
        this.uploadBtn.addEventListener('click', () => {
            this.fileUpload.click();
        });
        
        this.fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadFileContent(file);
            }
        });
        
        // Allow Enter key to load feed
        this.feedUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadFeed();
            }
        });
    }

    loadSampleData() {
        // Load the sample item you provided
        const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<item>
<g:id>16409</g:id>
<g:title>PVC Mesh Banners</g:title>
<g:availability>in stock</g:availability>
<g:condition>new</g:condition>
<g:price>GBP 120.00</g:price>
<g:link>https://surfturf.co.uk/shop/promotional-items/promotional-banners/pvc-mesh-banners-2/?attribute_pa_banner-size=10m-x-1m&utm_source=Meta%20/%20Facebook%20Catalog%20Feed%20/%20Instagram&utm_campaign=Meta%20Feed&utm_medium=cpc&utm_term=16409</g:link>
<g:image_link>https://surfturf.co.uk/wp-content/uploads/2018/11/PVC-Mesh-EDIT.jpg</g:image_link>
<g:item_group_id>2471</g:item_group_id>
<product_type>Home &gt; Promotional Products &amp; Items &gt; Promotional Banners &amp; Signs</product_type>
</item>
</channel>
</rss>`;
        
        this.parseFeedData(sampleXml);
    }

    async loadFeed() {
        const url = this.feedUrlInput.value.trim();
        if (!url) {
            this.showError('Please enter a feed URL');
            return;
        }

        this.showLoading(true);
        this.hideError();

        // List of CORS proxy services to try
        const proxyServices = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            // Direct fetch (will work if the server supports CORS)
            url
        ];

        let lastError = null;

        for (let i = 0; i < proxyServices.length; i++) {
            try {
                console.log(`Trying proxy ${i + 1}/${proxyServices.length}: ${proxyServices[i]}`);
                
                const response = await fetch(proxyServices[i], {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/xml, text/xml, */*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const xmlText = await response.text();
                
                // Validate that we got XML content
                if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<')) {
                    throw new Error('Response is not valid XML');
                }
                
                console.log('Successfully loaded feed');
                this.parseFeedData(xmlText);
                return; // Success! Exit the function
                
            } catch (error) {
                console.warn(`Proxy ${i + 1} failed:`, error.message);
                lastError = error;
                
                // If this is the last proxy and it failed, we'll show the error
                if (i === proxyServices.length - 1) {
                    break;
                }
                
                // Wait a bit before trying the next proxy
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // If we get here, all proxies failed
        console.error('All proxy attempts failed. Last error:', lastError);
        
        let errorMessage = 'Failed to load feed. ';
        
        if (lastError.message.includes('CORS')) {
            errorMessage += 'This appears to be a CORS (Cross-Origin) issue. ';
        } else if (lastError.message.includes('Failed to fetch')) {
            errorMessage += 'Network connection issue or the URL is not accessible. ';
        } else if (lastError.message.includes('HTTP')) {
            errorMessage += `Server returned an error: ${lastError.message}. `;
        }
        
        errorMessage += '\n\nTroubleshooting tips:\n';
        errorMessage += '• Make sure the URL is correct and publicly accessible\n';
        errorMessage += '• Try a different feed URL to test\n';
        errorMessage += '• Check if the feed requires authentication\n';
        errorMessage += '• Some feeds may block automated access';
        
        this.showError(errorMessage);
        this.showLoading(false);
    }

    refreshFeed() {
        if (this.feedUrlInput.value.trim()) {
            this.loadFeed();
        } else {
            this.loadSampleData();
        }
    }

    async loadFileContent(file) {
        this.showLoading(true);
        this.hideError();

        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const xmlContent = e.target.result;
                console.log('File loaded successfully');
                this.feedUrlInput.value = `Uploaded: ${file.name}`;
                this.parseFeedData(xmlContent);
                this.showLoading(false);
            };
            
            reader.onerror = () => {
                this.showError('Failed to read the uploaded file');
                this.showLoading(false);
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Error reading file:', error);
            this.showError(`Failed to read file: ${error.message}`);
            this.showLoading(false);
        }
    }

    parseFeedData(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Check for parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Invalid XML format');
            }

            const items = xmlDoc.querySelectorAll('item');
            this.feedData = Array.from(items).map(item => this.parseItem(item));
            
            this.updateCategories();
            this.filterItems();
            this.updateStats();
            
        } catch (error) {
            console.error('Error parsing feed:', error);
            this.showError(`Failed to parse feed: ${error.message}`);
        }
    }

    parseItem(itemElement) {
        const getElementText = (tagName) => {
            const element = itemElement.querySelector(tagName) || 
                           itemElement.querySelector(`g\\:${tagName}`) ||
                           itemElement.querySelector(`[*|${tagName}]`);
            return element ? element.textContent.trim() : '';
        };

        const item = {
            id: getElementText('id'),
            title: getElementText('title'),
            price: getElementText('price'),
            availability: getElementText('availability'),
            condition: getElementText('condition'),
            link: getElementText('link'),
            imageLink: getElementText('image_link'),
            itemGroupId: getElementText('item_group_id'),
            productType: getElementText('product_type'),
            description: getElementText('description'),
            brand: getElementText('brand'),
            gtin: getElementText('gtin'),
            mpn: getElementText('mpn')
        };

        // Decode HTML entities
        Object.keys(item).forEach(key => {
            if (typeof item[key] === 'string') {
                item[key] = this.decodeHtmlEntities(item[key]);
            }
        });

        return item;
    }

    decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    updateCategories() {
        this.categories.clear();
        this.feedData.forEach(item => {
            if (item.productType) {
                this.categories.add(item.productType);
            }
        });

        // Update category filter dropdown
        this.categoryFilter.innerHTML = '<option value="">All Categories</option>';
        Array.from(this.categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.categoryFilter.appendChild(option);
        });
    }

    filterItems() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const selectedCategory = this.categoryFilter.value;

        this.filteredData = this.feedData.filter(item => {
            const matchesSearch = !searchTerm || 
                item.title.toLowerCase().includes(searchTerm) ||
                item.productType.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm);

            const matchesCategory = !selectedCategory || 
                item.productType === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        this.renderItems();
        this.updateStats();
    }

    renderItems() {
        this.feedContainer.innerHTML = '';

        if (this.filteredData.length === 0) {
            this.feedContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 12px;">
                    <h3>No items found</h3>
                    <p>Try adjusting your search or category filter.</p>
                </div>
            `;
            return;
        }

        this.filteredData.forEach(item => {
            const itemElement = this.createItemElement(item);
            this.feedContainer.appendChild(itemElement);
        });
    }

    createItemElement(item) {
        const isExcluded = this.excludedItems.has(item.id);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `feed-item ${isExcluded ? 'excluded' : ''}`;
        itemDiv.dataset.itemId = item.id;

        itemDiv.innerHTML = `
            <img src="${item.imageLink || 'https://via.placeholder.com/350x200?text=No+Image'}" 
                 alt="${item.title}" 
                 class="item-image"
                 onerror="this.src='https://via.placeholder.com/350x200?text=Image+Not+Found'">
            
            <div class="item-content">
                <h3 class="item-title">${item.title}</h3>
                <div class="item-price">${item.price}</div>
                
                ${item.productType ? `<div class="item-category">${item.productType}</div>` : ''}
                
                <div class="item-details">
                    <div class="item-detail">
                        <span class="item-detail-label">ID:</span>
                        <span class="item-detail-value">${item.id}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Availability:</span>
                        <span class="item-detail-value">${item.availability}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Condition:</span>
                        <span class="item-detail-value">${item.condition}</span>
                    </div>
                    ${item.itemGroupId ? `
                    <div class="item-detail">
                        <span class="item-detail-label">Group ID:</span>
                        <span class="item-detail-value">${item.itemGroupId}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="raw-data-section hidden" id="rawData-${item.id}">
                    <div class="raw-data-header">
                        <h4>Raw Data</h4>
                    </div>
                    <pre class="raw-data-content">${JSON.stringify(item, null, 2)}</pre>
                </div>
                
                <div class="item-actions">
                    <button class="exclude-btn ${isExcluded ? 'excluded' : ''}" 
                            onclick="feedViewer.toggleExclusion('${item.id}')">
                        ${isExcluded ? 'Include' : 'Exclude'}
                    </button>
                    <button class="raw-data-btn" 
                            onclick="feedViewer.toggleRawData('${item.id}')">
                        View Raw Data
                    </button>
                    <button class="view-btn" onclick="window.open('${item.link}', '_blank')">
                        View Product
                    </button>
                </div>
            </div>
        `;

        return itemDiv;
    }

    toggleExclusion(itemId) {
        if (this.excludedItems.has(itemId)) {
            this.excludedItems.delete(itemId);
        } else {
            this.excludedItems.add(itemId);
        }

        // Update the specific item's appearance
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            const isExcluded = this.excludedItems.has(itemId);
            itemElement.classList.toggle('excluded', isExcluded);
            
            const excludeBtn = itemElement.querySelector('.exclude-btn');
            excludeBtn.textContent = isExcluded ? 'Include' : 'Exclude';
            excludeBtn.classList.toggle('excluded', isExcluded);
        }

        this.updateStats();
    }

    toggleRawData(itemId) {
        const rawDataSection = document.getElementById(`rawData-${itemId}`);
        const rawDataBtn = document.querySelector(`[data-item-id="${itemId}"] .raw-data-btn`);
        
        if (rawDataSection && rawDataBtn) {
            const isHidden = rawDataSection.classList.contains('hidden');
            
            if (isHidden) {
                rawDataSection.classList.remove('hidden');
                rawDataBtn.textContent = 'Hide Raw Data';
                rawDataBtn.classList.add('active');
            } else {
                rawDataSection.classList.add('hidden');
                rawDataBtn.textContent = 'View Raw Data';
                rawDataBtn.classList.remove('active');
            }
        }
    }

    updateStats() {
        this.totalItemsSpan.textContent = `${this.filteredData.length} items`;
        this.excludedItemsSpan.textContent = `${this.excludedItems.size} excluded`;
    }

    exportExclusions() {
        if (this.excludedItems.size === 0) {
            alert('No items excluded yet.');
            return;
        }

        const excludedList = Array.from(this.excludedItems);
        const exportData = {
            timestamp: new Date().toISOString(),
            feedUrl: this.feedUrlInput.value,
            excludedItemIds: excludedList,
            excludedItems: this.feedData.filter(item => this.excludedItems.has(item.id))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feed-exclusions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showLoading(show) {
        this.loadingDiv.classList.toggle('hidden', !show);
        this.feedContainer.classList.toggle('hidden', show);
    }

    showError(message) {
        // Convert newlines to HTML breaks for better display
        const formattedMessage = message.replace(/\n/g, '<br>');
        this.errorMessage.innerHTML = formattedMessage;
        this.errorDiv.classList.remove('hidden');
    }

    hideError() {
        this.errorDiv.classList.add('hidden');
    }
}

// Initialize the feed viewer when the page loads
let feedViewer;
document.addEventListener('DOMContentLoaded', () => {
    feedViewer = new FeedViewer();
}); 