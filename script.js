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
        
        // Modal elements
        this.variantModal = document.getElementById('variantModal');
        this.exportModal = document.getElementById('exportModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalOptions = document.getElementById('modalOptions');
        
        // Store current item for modal operations
        this.currentItem = null;
        this.currentExportData = null;
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
        
        // Close modals when clicking outside
        if (this.variantModal) {
            this.variantModal.addEventListener('click', (e) => {
                if (e.target === this.variantModal) {
                    this.closeVariantModal();
                }
            });
        }
        
        if (this.exportModal) {
            this.exportModal.addEventListener('click', (e) => {
                if (e.target === this.exportModal) {
                    this.closeExportModal();
                }
            });
        }
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

        // Try our backend proxy first (if available), then fallback to CORS proxies
        const proxyServices = [
            // Our backend proxy (works when deployed with server.js)
            `/api/fetch-feed?url=${encodeURIComponent(url)}`,
            // Fallback CORS proxies
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
        errorMessage += '• Use the "Upload XML File" button instead\n';
        errorMessage += '• Download the XML file from your feed URL and upload it\n';
        errorMessage += '• Make sure the URL is correct and publicly accessible\n';
        errorMessage += '• Some feeds require authentication or block automated access\n';
        errorMessage += '• For production use, deploy with the included server.js backend';
        
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
        const item = this.feedData.find(i => i.id === itemId);
        if (!item) return;

        const isCurrentlyExcluded = this.excludedItems.has(itemId);
        
        if (!isCurrentlyExcluded) {
            // When excluding an item, ask about variants
            this.handleExclusionWithVariants(item);
        } else {
            // When including an item, just include this one
            this.excludedItems.delete(itemId);
            this.updateItemAppearance(itemId);
            this.updateStats();
        }
    }

    handleExclusionWithVariants(item) {
        console.log('handleExclusionWithVariants called for item:', item.title);
        
        // Find potential variants
        const groupVariants = item.itemGroupId ? 
            this.feedData.filter(i => i.itemGroupId === item.itemGroupId && i.id !== item.id) : [];
        
        const titleVariants = this.findTitleVariants(item);
        
        console.log('Found variants:', { groupVariants: groupVariants.length, titleVariants: titleVariants.length });
        
        if (groupVariants.length === 0 && titleVariants.length === 0) {
            // No variants found, just exclude this item
            console.log('No variants found, excluding single item');
            this.excludedItems.add(item.id);
            this.updateItemAppearance(item.id);
            this.updateStats();
            return;
        }
        
        // Store current item for modal callbacks
        this.currentItem = item;
        
        console.log('Showing variant modal...');
        
        if (!this.variantModal) {
            console.error('Variant modal not found!');
            // Fallback to simple exclusion
            this.excludedItems.add(item.id);
            this.updateItemAppearance(item.id);
            this.updateStats();
            return;
        }
        
        // Update modal content
        this.modalTitle.textContent = 'Exclude Product Variants';
        this.modalMessage.innerHTML = `Exclude "<strong>${item.title}</strong>"?<br><br>Choose how you want to exclude this product:`;
        
        // Build options
        let optionsHTML = '';
        
        // Option 1: Single item
        optionsHTML += `
            <button class="modal-option-btn primary" onclick="feedViewer.excludeVariants('single')">
                <strong>Exclude only this item</strong>
                <span>Just exclude "${item.title}"</span>
            </button>
        `;
        
        // Option 2: Group variants
        if (groupVariants.length > 0) {
            optionsHTML += `
                <button class="modal-option-btn" onclick="feedViewer.excludeVariants('group')">
                    <strong>Exclude all ${groupVariants.length + 1} items with same Group ID</strong>
                    <span>Group ID: "${item.itemGroupId}"</span>
                </button>
            `;
        }
        
        // Option 3: Title variants
        if (titleVariants.length > 0) {
            const baseTitle = this.extractBaseTitle(item.title);
            optionsHTML += `
                <button class="modal-option-btn" onclick="feedViewer.excludeVariants('title')">
                    <strong>Exclude all ${titleVariants.length + 1} items with similar title</strong>
                    <span>Base title: "${baseTitle}"</span>
                </button>
            `;
        }
        
        this.modalOptions.innerHTML = optionsHTML;
        
        // Show modal
        this.variantModal.classList.remove('hidden');
        this.variantModal.style.display = 'flex'; // Make sure it shows
        
        console.log('Variant modal should now be visible');
    }

    findTitleVariants(item) {
        // Extract base title by removing common variant indicators
        const baseTitle = this.extractBaseTitle(item.title);
        
        return this.feedData.filter(i => {
            if (i.id === item.id) return false;
            const otherBaseTitle = this.extractBaseTitle(i.title);
            return baseTitle === otherBaseTitle;
        });
    }

    extractBaseTitle(title) {
        // Remove common variant patterns like sizes, colors, etc.
        return title
            .replace(/\s*-\s*(Small|Medium|Large|XL|XXL|S|M|L)\s*$/i, '')
            .replace(/\s*-\s*(Red|Blue|Green|Black|White|Yellow|Pink|Purple|Orange|Brown|Grey|Gray)\s*$/i, '')
            .replace(/\s*-\s*\d+(\.\d+)?\s*(cm|mm|m|inch|in|ft)\s*$/i, '')
            .replace(/\s*-\s*\d+\s*x\s*\d+\s*(cm|mm|m|inch|in|ft)?\s*$/i, '')
            .replace(/\s*\(\s*(Small|Medium|Large|XL|XXL|S|M|L)\s*\)\s*$/i, '')
            .replace(/\s*\(\s*(Red|Blue|Green|Black|White|Yellow|Pink|Purple|Orange|Brown|Grey|Gray)\s*\)\s*$/i, '')
            .trim();
    }

    excludeVariantsByGroup(item) {
        const variants = this.feedData.filter(i => i.itemGroupId === item.itemGroupId);
        
        variants.forEach(variant => {
            this.excludedItems.add(variant.id);
            this.updateItemAppearance(variant.id);
        });
        
        console.log(`Excluded ${variants.length} items with Group ID: ${item.itemGroupId}`);
    }

    excludeVariantsByTitle(item) {
        const baseTitle = this.extractBaseTitle(item.title);
        const variants = this.feedData.filter(i => {
            const otherBaseTitle = this.extractBaseTitle(i.title);
            return baseTitle === otherBaseTitle;
        });
        
        variants.forEach(variant => {
            this.excludedItems.add(variant.id);
            this.updateItemAppearance(variant.id);
        });
        
        console.log(`Excluded ${variants.length} items with similar title: ${baseTitle}`);
    }

    updateItemAppearance(itemId) {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            const isExcluded = this.excludedItems.has(itemId);
            itemElement.classList.toggle('excluded', isExcluded);
            
            const excludeBtn = itemElement.querySelector('.exclude-btn');
            if (excludeBtn) {
                excludeBtn.textContent = isExcluded ? 'Include' : 'Exclude';
                excludeBtn.classList.toggle('excluded', isExcluded);
            }
        }
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

        console.log('Export button clicked, checking modal...');
        
        if (!this.exportModal) {
            console.error('Export modal not found!');
            alert('Modal system error. Please refresh the page.');
            return;
        }

        const excludedList = Array.from(this.excludedItems);
        const excludedItemsData = this.feedData.filter(item => this.excludedItems.has(item.id));

        // Store data for modal callbacks
        this.currentExportData = { excludedList, excludedItemsData };
        
        console.log('Showing export modal...');
        
        // Show export modal
        this.exportModal.classList.remove('hidden');
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

    // Modal callback methods
    excludeVariants(type) {
        if (!this.currentItem) return;
        
        switch (type) {
            case 'single':
                this.excludedItems.add(this.currentItem.id);
                this.updateItemAppearance(this.currentItem.id);
                break;
                
            case 'group':
                this.excludeVariantsByGroup(this.currentItem);
                break;
                
            case 'title':
                this.excludeVariantsByTitle(this.currentItem);
                break;
        }
        
        this.updateStats();
        this.closeVariantModal();
    }

    closeVariantModal() {
        this.variantModal.classList.add('hidden');
        this.currentItem = null;
    }

    closeExportModal() {
        this.exportModal.classList.add('hidden');
        this.currentExportData = null;
    }

    exportFormat(format) {
        console.log('Export format clicked:', format);
        
        if (!this.currentExportData) {
            console.error('No export data available!');
            return;
        }
        
        const { excludedList, excludedItemsData } = this.currentExportData;
        
        console.log('Processing export with format:', format);
        
        switch (format) {
            case 'csv':
                this.exportAsCSV(excludedList, excludedItemsData);
                break;
            case 'excel':
                this.exportAsExcel(excludedList, excludedItemsData);
                break;
            case 'json':
                this.exportAsJSON(excludedList, excludedItemsData);
                break;
            default:
                console.error('Unknown export format:', format);
                return;
        }
        
        this.closeExportModal();
    }

    exportAsCSV(excludedList, excludedItemsData) {
        // Create CSV header
        const headers = ['ID', 'Title', 'Price', 'Availability', 'Condition', 'Product Type', 'Link', 'Image Link', 'Item Group ID'];
        
        // Create CSV rows
        const rows = excludedItemsData.map(item => [
            item.id || '',
            `"${(item.title || '').replace(/"/g, '""')}"`, // Escape quotes
            item.price || '',
            item.availability || '',
            item.condition || '',
            `"${(item.productType || '').replace(/"/g, '""')}"`,
            item.link || '',
            item.imageLink || '',
            item.itemGroupId || ''
        ]);

        // Combine header and rows
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feed-exclusions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportAsExcel(excludedList, excludedItemsData) {
        // For Excel export, we'll create a more detailed format
        const workbookData = [
            // Summary sheet data
            ['Shopping Feed Exclusions Report'],
            ['Generated:', new Date().toLocaleString()],
            ['Feed URL:', this.feedUrlInput.value],
            ['Total Excluded Items:', excludedList.length],
            [''],
            ['Excluded Item IDs:'],
            ...excludedList.map(id => [id]),
            [''],
            ['Detailed Item Information:'],
            ['ID', 'Title', 'Price', 'Availability', 'Condition', 'Product Type', 'Link', 'Image Link', 'Item Group ID', 'Brand', 'GTIN', 'MPN'],
            ...excludedItemsData.map(item => [
                item.id || '',
                item.title || '',
                item.price || '',
                item.availability || '',
                item.condition || '',
                item.productType || '',
                item.link || '',
                item.imageLink || '',
                item.itemGroupId || '',
                item.brand || '',
                item.gtin || '',
                item.mpn || ''
            ])
        ];

        // Convert to CSV format (Excel can open CSV files)
        const csvContent = workbookData.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feed-exclusions-${new Date().toISOString().split('T')[0]}.xlsx.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportAsJSON(excludedList, excludedItemsData) {
        const exportData = {
            timestamp: new Date().toISOString(),
            feedUrl: this.feedUrlInput.value,
            excludedItemIds: excludedList,
            excludedItems: excludedItemsData
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
}

// Initialize the feed viewer when the page loads
let feedViewer;
document.addEventListener('DOMContentLoaded', () => {
    feedViewer = new FeedViewer();
}); 