class FeedViewer {
    constructor() {
        this.feedData = [];
        this.excludedItems = new Set();
        this.filteredData = [];
        this.categories = new Set();
        this.compareItems = new Set();

        this.initializeElements();
        this.bindEvents();
        // Don't load sample data automatically
    }

    initializeElements() {
        this.feedPresets = document.getElementById('feedPresets');
        this.feedUrlInput = document.getElementById('feedUrl');
        this.fileUpload = document.getElementById('fileUpload');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.loadBtn = document.getElementById('loadFeed');
        this.refreshBtn = document.getElementById('refreshFeed');
        this.searchInput = document.getElementById('searchFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.excludedFilter = document.getElementById('excludedFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.minPriceInput = document.getElementById('minPrice');
        this.maxPriceInput = document.getElementById('maxPrice');
        this.priceFilter = document.getElementById('priceFilter');
        this.sortBySelect = document.getElementById('sortBy');
        this.compareBtn = document.getElementById('compareBtn');
        this.exportViewBtn = document.getElementById('exportView');
        this.excludeAllVisibleBtn = document.getElementById('excludeAllVisible');
        this.includeAllVisibleBtn = document.getElementById('includeAllVisible');
        this.visibleItemsSpan = document.getElementById('visibleItems');
        this.compareCount = document.getElementById('compareCount');
        this.exportBtn = document.getElementById('exportExclusions');
        this.importBtn = document.getElementById('importExclusions');
        this.exclusionUpload = document.getElementById('exclusionUpload');
        this.loadingDiv = document.getElementById('loading');
        this.errorDiv = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.feedContainer = document.getElementById('feedContainer');
        this.totalItemsSpan = document.getElementById('totalItems');
        this.excludedItemsSpan = document.getElementById('excludedItems');

        // Modal elements
        this.variantModal = document.getElementById('variantModal');
        this.exportModal = document.getElementById('exportModal');
        this.importModal = document.getElementById('importModal');
        this.comparisonModal = document.getElementById('comparisonModal');
        this.comparisonTable = document.getElementById('comparisonTable');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalOptions = document.getElementById('modalOptions');
        this.importResults = document.getElementById('importResults');
        this.applyImportBtn = document.getElementById('applyImport');

        // Store current item for modal operations
        this.currentItem = null;
        this.currentExportData = null;
        this.currentImportData = null;
    }

    bindEvents() {
        // Feed preset dropdown - auto-load when selected
        this.feedPresets.addEventListener('change', () => {
            const selectedUrl = this.feedPresets.value;
            if (selectedUrl) {
                this.feedUrlInput.value = selectedUrl;
                this.loadFeed();
            }
        });

        this.loadBtn.addEventListener('click', () => this.loadFeed());
        this.refreshBtn.addEventListener('click', () => this.refreshFeed());
        this.searchInput.addEventListener('input', () => this.filterItems());
        this.categoryFilter.addEventListener('change', () => this.filterItems());
        this.excludedFilter.addEventListener('change', () => this.filterItems());
        this.statusFilter.addEventListener('change', () => this.filterItems());
        this.minPriceInput.addEventListener('input', () => this.filterItems());
        this.maxPriceInput.addEventListener('input', () => this.filterItems());
        this.priceFilter.addEventListener('change', () => this.filterItems());
        this.sortBySelect.addEventListener('change', () => this.filterItems());
        this.compareBtn.addEventListener('click', () => this.showComparison());
        this.exportViewBtn.addEventListener('click', () => this.exportCurrentView());
        this.excludeAllVisibleBtn.addEventListener('click', () => this.excludeAllVisible());
        this.includeAllVisibleBtn.addEventListener('click', () => this.includeAllVisible());
        this.exportBtn.addEventListener('click', () => this.exportExclusions());
        this.importBtn.addEventListener('click', () => this.importExclusions());
        
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

        // Handle exclusion file upload
        this.exclusionUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadExclusionFile(file);
            }
        });

        // Handle import modal apply button
        if (this.applyImportBtn) {
            this.applyImportBtn.addEventListener('click', () => this.applyImportedExclusions());
        }
        
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

        if (this.importModal) {
            this.importModal.addEventListener('click', (e) => {
                if (e.target === this.importModal) {
                    this.closeImportModal();
                }
            });
        }
    }

    // Removed loadSampleData - we don't load samples anymore
    loadSampleDataOld() {
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

        // Use our backend proxy (Cloudflare Function or Express server)
        const proxyServices = [
            `/api/fetch-feed?url=${encodeURIComponent(url)}`,
            // Direct fetch fallback (works if the source has CORS headers)
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
                this.showLoading(false);
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
        const excludedFilter = this.excludedFilter.value;
        const statusFilter = this.statusFilter.value;
        const minPrice = parseFloat(this.minPriceInput.value) || 0;
        const maxPrice = parseFloat(this.maxPriceInput.value) || Infinity;
        const priceFilter = this.priceFilter.value;

        this.filteredData = this.feedData.filter(item => {
            const matchesSearch = !searchTerm ||
                item.title.toLowerCase().includes(searchTerm) ||
                item.productType.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm);

            const matchesCategory = !selectedCategory ||
                item.productType === selectedCategory;

            const isExcluded = this.excludedItems.has(item.id);
            const matchesExcluded = !excludedFilter ||
                (excludedFilter === 'excluded' && isExcluded) ||
                (excludedFilter === 'not-excluded' && !isExcluded);

            // Status filter
            const itemAvailability = item.availability.toLowerCase().trim().replace(/\s+/g, '_');
            const filterAvailability = statusFilter.toLowerCase().trim();
            const matchesStatus = !statusFilter ||
                itemAvailability === filterAvailability ||
                item.availability.toLowerCase().trim() === filterAvailability;

            // Price filter
            const itemPrice = this.parsePrice(item.price);
            const matchesPrice = itemPrice >= minPrice && itemPrice <= maxPrice;

            // Price type filter (with price, no price)
            const matchesPriceType = !priceFilter ||
                (priceFilter === 'with-price' && itemPrice > 0) ||
                (priceFilter === 'no-price' && itemPrice === 0);

            return matchesSearch && matchesCategory && matchesExcluded && matchesStatus && matchesPrice && matchesPriceType;
        });

        // Apply sorting
        this.sortItems();

        this.renderItems();
        this.updateStats();
    }

    parsePrice(priceString) {
        if (!priceString) return 0;
        // Remove currency symbols and extract numeric value
        const match = priceString.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return 0;
    }

    sortItems() {
        const sortBy = this.sortBySelect.value;

        if (!sortBy) return; // Default order

        this.filteredData.sort((a, b) => {
            switch (sortBy) {
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'price-asc':
                    return this.parsePrice(a.price) - this.parsePrice(b.price);
                case 'price-desc':
                    return this.parsePrice(b.price) - this.parsePrice(a.price);
                case 'id-asc':
                    return a.id.localeCompare(b.id);
                case 'id-desc':
                    return b.id.localeCompare(a.id);
                case 'availability':
                    // Sort by availability: in_stock -> backorder -> out_of_stock -> others
                    const availabilityOrder = {
                        'in_stock': 1,
                        'backorder': 2,
                        'preorder': 3,
                        'limited_availability': 4,
                        'out_of_stock': 5
                    };
                    const orderA = availabilityOrder[a.availability] || 6;
                    const orderB = availabilityOrder[b.availability] || 6;
                    return orderA - orderB;
                default:
                    return 0;
            }
        });
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

                <div class="availability-badge ${item.availability.replace(/[_\s]/g, '-')}">
                    ${item.availability.replace(/_/g, ' ')}
                </div>
                
                <div class="item-details">
                    <span class="item-detail">ID: <strong>${item.id}</strong></span>
                    <span class="item-detail">Condition: <strong>${item.condition}</strong></span>
                    ${item.itemGroupId ? `<span class="item-detail">Group: <strong>${item.itemGroupId}</strong></span>` : ''}
                </div>
                
                <div class="raw-data-section hidden" id="rawData-${item.id}">
                    <div class="raw-data-header">
                        <h4>Raw Data</h4>
                    </div>
                    <pre class="raw-data-content">${JSON.stringify(item, null, 2)}</pre>
                </div>
                
                <div class="item-actions">
                    <label class="compare-checkbox">
                        <input type="checkbox"
                               onchange="feedViewer.toggleCompare('${item.id}')"
                               ${this.compareItems.has(item.id) ? 'checked' : ''}>
                        Compare
                    </label>
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
        const total = this.feedData.length;
        const excluded = this.excludedItems.size;
        const visible = this.filteredData.length;

        this.totalItemsSpan.textContent = total;
        this.excludedItemsSpan.textContent = excluded;
        this.visibleItemsSpan.textContent = visible;
    }

    // Import functionality
    importExclusions() {
        if (this.feedData.length === 0) {
            alert('Please load a feed first before importing exclusions.');
            return;
        }
        
        this.exclusionUpload.click();
    }

    async loadExclusionFile(file) {
        try {
            const content = await this.readFileContent(file);
            const importData = await this.parseExclusionFile(content, file.name);
            this.validateAndShowImportResults(importData);
        } catch (error) {
            console.error('Failed to load exclusion file:', error);
            alert(`Failed to load exclusion file: ${error.message}`);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async parseExclusionFile(content, filename) {
        const extension = filename.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'json':
                return this.parseJSONExclusions(content);
            case 'csv':
            case 'txt':
                return this.parseCSVExclusions(content);
            default:
                throw new Error(`Unsupported file format: ${extension}. Please use CSV, TXT, or JSON files.`);
        }
    }

    parseJSONExclusions(content) {
        try {
            const data = JSON.parse(content);
            
            // Handle our export format
            if (data.excludedItemIds && Array.isArray(data.excludedItemIds)) {
                return {
                    format: 'json',
                    excludedIds: data.excludedItemIds,
                    metadata: {
                        timestamp: data.timestamp,
                        feedUrl: data.feedUrl,
                        totalExcluded: data.excludedItemIds.length
                    }
                };
            }
            
            // Handle simple array format
            if (Array.isArray(data)) {
                return {
                    format: 'json',
                    excludedIds: data.map(item => String(item)),
                    metadata: {
                        totalExcluded: data.length
                    }
                };
            }
            
            throw new Error('JSON file does not contain valid exclusion data');
        } catch (error) {
            throw new Error(`Invalid JSON format: ${error.message}`);
        }
    }

    parseCSVExclusions(content) {
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        const excludedIds = [];
        
        // Skip header if it looks like one
        let startIndex = 0;
        if (lines.length > 0 && (lines[0].toLowerCase().includes('id') || lines[0].includes('ID'))) {
            startIndex = 1;
        }
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            
            // Handle CSV format - take first column as ID
            const columns = this.parseCSVLine(line);
            if (columns.length > 0 && columns[0]) {
                excludedIds.push(String(columns[0]));
            }
        }
        
        return {
            format: 'csv',
            excludedIds: excludedIds,
            metadata: {
                totalExcluded: excludedIds.length
            }
        };
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result.map(item => item.replace(/^"(.*)"$/, '$1')); // Remove surrounding quotes
    }

    validateAndShowImportResults(importData) {
        const { excludedIds, metadata } = importData;
        
        // Validate against current feed
        const foundIds = [];
        const notFoundIds = [];
        const currentlyExcluded = [];
        
        excludedIds.forEach(id => {
            const item = this.feedData.find(item => item.id === id);
            if (item) {
                foundIds.push({ id, title: item.title });
                if (this.excludedItems.has(id)) {
                    currentlyExcluded.push({ id, title: item.title });
                }
            } else {
                notFoundIds.push(id);
            }
        });
        
        // Store validation results
        this.currentImportData = {
            importData,
            validation: {
                total: excludedIds.length,
                found: foundIds,
                notFound: notFoundIds,
                currentlyExcluded: currentlyExcluded,
                newExclusions: foundIds.filter(item => !this.excludedItems.has(item.id))
            }
        };
        
        this.showImportResults();
    }

    showImportResults() {
        const { importData, validation } = this.currentImportData;
        const { found, notFound, currentlyExcluded, newExclusions } = validation;
        
        let html = `
            <div class="import-summary">
                <h4>Import Summary</h4>
                <div class="import-status">
                    <div class="status-icon ${found.length > 0 ? 'success' : 'error'}"></div>
                    <span><strong>${found.length}</strong> items found in current feed</span>
                </div>`;
        
        if (notFound.length > 0) {
            html += `
                <div class="import-status">
                    <div class="status-icon warning"></div>
                    <span><strong>${notFound.length}</strong> items not found in current feed</span>
                </div>`;
        }
        
        if (currentlyExcluded.length > 0) {
            html += `
                <div class="import-status">
                    <div class="status-icon warning"></div>
                    <span><strong>${currentlyExcluded.length}</strong> items already excluded</span>
                </div>`;
        }
        
        html += `
                <p><strong>${newExclusions.length}</strong> new items will be excluded</p>
            </div>`;
        
        if (importData.metadata.timestamp) {
            html += `
                <div class="import-details">
                    <p><strong>Export Date:</strong> ${new Date(importData.metadata.timestamp).toLocaleString()}</p>
                </div>`;
        }
        
        // Show found items
        if (found.length > 0) {
            html += `
                <div class="import-section">
                    <h5>Items Found in Feed (${found.length})</h5>
                    <div class="import-list">`;
            
            found.forEach(item => {
                const isExcluded = this.excludedItems.has(item.id);
                html += `<div class="import-item found">${item.id} - ${item.title} ${isExcluded ? '(already excluded)' : ''}</div>`;
            });
            
            html += `</div></div>`;
        }
        
        // Show not found items
        if (notFound.length > 0) {
            html += `
                <div class="import-section">
                    <h5>Items Not Found in Current Feed (${notFound.length})</h5>
                    <div class="import-list">`;
            
            notFound.forEach(id => {
                html += `<div class="import-item not-found">${id} - Not found in current feed</div>`;
            });
            
            html += `</div></div>`;
        }
        
        this.importResults.innerHTML = html;
        
        // Enable/disable apply button
        if (this.applyImportBtn) {
            this.applyImportBtn.disabled = newExclusions.length === 0;
            this.applyImportBtn.textContent = newExclusions.length > 0 
                ? `Apply ${newExclusions.length} New Exclusions` 
                : 'No New Exclusions to Apply';
        }
        
        // Show modal
        this.importModal.classList.remove('hidden');
    }

    applyImportedExclusions() {
        if (!this.currentImportData) return;
        
        const { validation } = this.currentImportData;
        const { newExclusions } = validation;
        
        // Apply new exclusions
        newExclusions.forEach(item => {
            this.excludedItems.add(item.id);
            this.updateItemAppearance(item.id);
        });
        
        // Update UI
        this.updateStats();
        this.renderItems(); // Re-render to show exclusion status
        
        // Close modal and show success message
        this.closeImportModal();
        
        if (newExclusions.length > 0) {
            alert(`Successfully applied ${newExclusions.length} new exclusions!`);
        }
    }

    closeImportModal() {
        this.importModal.classList.add('hidden');
        this.currentImportData = null;
        
        // Reset file input
        if (this.exclusionUpload) {
            this.exclusionUpload.value = '';
        }
    }

    // Intelligent Pattern Analysis for Feed Generator Mapping
    analyzeExclusionPatterns(excludedItemsData) {
        const patterns = {
            brands: this.analyzeBrandPatterns(excludedItemsData),
            categories: this.analyzeCategoryPatterns(excludedItemsData),
            titles: this.analyzeTitlePatterns(excludedItemsData),
            priceRanges: this.analyzePricePatterns(excludedItemsData),
            itemGroups: this.analyzeItemGroupPatterns(excludedItemsData),
            availability: this.analyzeAvailabilityPatterns(excludedItemsData),
            condition: this.analyzeConditionPatterns(excludedItemsData)
        };

        return this.generateExclusionRules(patterns, excludedItemsData);
    }

    analyzeBrandPatterns(items) {
        const brandCounts = {};
        const totalByBrand = {};
        
        // Count excluded items by brand
        items.forEach(item => {
            const brand = item.brand || 'Unknown Brand';
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });

        // Count total items by brand in the entire feed
        this.feedData.forEach(item => {
            const brand = item.brand || 'Unknown Brand';
            totalByBrand[brand] = (totalByBrand[brand] || 0) + 1;
        });

        return Object.keys(brandCounts).map(brand => ({
            brand,
            excludedCount: brandCounts[brand],
            totalCount: totalByBrand[brand] || 0,
            percentage: totalByBrand[brand] ? Math.round((brandCounts[brand] / totalByBrand[brand]) * 100) : 0
        })).filter(item => item.excludedCount > 1 || item.percentage > 50);
    }

    analyzeCategoryPatterns(items) {
        const categoryCounts = {};
        const totalByCategory = {};
        
        items.forEach(item => {
            const category = item.productType || 'Unknown Category';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        this.feedData.forEach(item => {
            const category = item.productType || 'Unknown Category';
            totalByCategory[category] = (totalByCategory[category] || 0) + 1;
        });

        return Object.keys(categoryCounts).map(category => ({
            category,
            excludedCount: categoryCounts[category],
            totalCount: totalByCategory[category] || 0,
            percentage: totalByCategory[category] ? Math.round((categoryCounts[category] / totalByCategory[category]) * 100) : 0
        })).filter(item => item.excludedCount > 1 || item.percentage > 30);
    }

    analyzeTitlePatterns(items) {
        const patterns = {};
        const commonWords = new Set(['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'a', 'an']);
        
        items.forEach(item => {
            const title = (item.title || '').toLowerCase();
            const words = title.split(/\s+/).filter(word => 
                word.length > 3 && !commonWords.has(word) && !/^\d+$/.test(word)
            );
            
            words.forEach(word => {
                if (!patterns[word]) {
                    patterns[word] = { count: 0, items: [] };
                }
                patterns[word].count++;
                patterns[word].items.push(item.id);
            });
        });

        return Object.keys(patterns)
            .filter(word => patterns[word].count >= 2)
            .map(word => ({
                keyword: word,
                count: patterns[word].count,
                items: patterns[word].items
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    analyzePricePatterns(items) {
        const prices = items
            .map(item => parseFloat((item.price || '0').replace(/[^\d.]/g, '')))
            .filter(price => price > 0)
            .sort((a, b) => a - b);

        if (prices.length < 2) return [];

        const ranges = [
            { min: 0, max: 50, label: 'Under £50' },
            { min: 50, max: 100, label: '£50 - £100' },
            { min: 100, max: 200, label: '£100 - £200' },
            { min: 200, max: 500, label: '£200 - £500' },
            { min: 500, max: Infinity, label: 'Over £500' }
        ];

        return ranges.map(range => {
            const count = prices.filter(price => price >= range.min && price < range.max).length;
            return {
                range: range.label,
                min: range.min,
                max: range.max === Infinity ? null : range.max,
                count
            };
        }).filter(item => item.count > 0);
    }

    analyzeItemGroupPatterns(items) {
        const groupCounts = {};
        const totalByGroup = {};
        
        items.forEach(item => {
            if (item.itemGroupId) {
                groupCounts[item.itemGroupId] = (groupCounts[item.itemGroupId] || 0) + 1;
            }
        });

        this.feedData.forEach(item => {
            if (item.itemGroupId) {
                totalByGroup[item.itemGroupId] = (totalByGroup[item.itemGroupId] || 0) + 1;
            }
        });

        return Object.keys(groupCounts).map(groupId => ({
            groupId,
            excludedCount: groupCounts[groupId],
            totalCount: totalByGroup[groupId] || 0,
            percentage: totalByGroup[groupId] ? Math.round((groupCounts[groupId] / totalByGroup[groupId]) * 100) : 0
        })).filter(item => item.percentage > 50);
    }

    analyzeAvailabilityPatterns(items) {
        const availabilityCounts = {};
        items.forEach(item => {
            const availability = item.availability || 'unknown';
            availabilityCounts[availability] = (availabilityCounts[availability] || 0) + 1;
        });
        
        return Object.keys(availabilityCounts).map(availability => ({
            availability,
            count: availabilityCounts[availability]
        })).filter(item => item.count > 1);
    }

    analyzeConditionPatterns(items) {
        const conditionCounts = {};
        items.forEach(item => {
            const condition = item.condition || 'unknown';
            conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
        });
        
        return Object.keys(conditionCounts).map(condition => ({
            condition,
            count: conditionCounts[condition]
        })).filter(item => item.count > 1);
    }

    generateExclusionRules(patterns, excludedItemsData) {
        const rules = [];

        // Brand-based rules
        patterns.brands.forEach(brand => {
            if (brand.percentage >= 80) {
                rules.push({
                    type: 'brand_exclude_all',
                    priority: 'high',
                    field: 'brand',
                    operator: 'equals',
                    value: brand.brand,
                    description: `Exclude ALL products from brand "${brand.brand}" (${brand.excludedCount}/${brand.totalCount} excluded)`,
                    googleMerchantRule: `brand = "${brand.brand}"`,
                    confidence: brand.percentage
                });
            } else if (brand.excludedCount >= 3) {
                rules.push({
                    type: 'brand_partial',
                    priority: 'medium',
                    field: 'brand',
                    operator: 'equals',
                    value: brand.brand,
                    description: `Consider excluding brand "${brand.brand}" (${brand.excludedCount}/${brand.totalCount} currently excluded)`,
                    googleMerchantRule: `brand = "${brand.brand}"`,
                    confidence: brand.percentage
                });
            }
        });

        // Category-based rules
        patterns.categories.forEach(category => {
            if (category.percentage >= 60) {
                rules.push({
                    type: 'category_exclude',
                    priority: 'high',
                    field: 'product_type',
                    operator: 'contains',
                    value: category.category,
                    description: `Exclude category "${category.category}" (${category.excludedCount}/${category.totalCount} excluded)`,
                    googleMerchantRule: `product_type = "${category.category}"`,
                    confidence: category.percentage
                });
            }
        });

        // Title keyword rules
        patterns.titles.forEach(keyword => {
            if (keyword.count >= 3) {
                rules.push({
                    type: 'title_keyword',
                    priority: 'medium',
                    field: 'title',
                    operator: 'contains',
                    value: keyword.keyword,
                    description: `Exclude products with "${keyword.keyword}" in title (${keyword.count} items)`,
                    googleMerchantRule: `title ~ "${keyword.keyword}"`,
                    confidence: Math.min(95, (keyword.count / excludedItemsData.length) * 100)
                });
            }
        });

        // Price range rules
        patterns.priceRanges.forEach(range => {
            if (range.count >= 3) {
                let rule = `price >= ${range.min}`;
                if (range.max) {
                    rule += ` AND price < ${range.max}`;
                }
                
                rules.push({
                    type: 'price_range',
                    priority: 'low',
                    field: 'price',
                    operator: 'range',
                    value: `${range.min}-${range.max || 'unlimited'}`,
                    description: `Exclude products in price range ${range.range} (${range.count} items)`,
                    googleMerchantRule: rule,
                    confidence: (range.count / excludedItemsData.length) * 100
                });
            }
        });

        // Item group rules
        patterns.itemGroups.forEach(group => {
            if (group.percentage >= 70) {
                rules.push({
                    type: 'item_group',
                    priority: 'high',
                    field: 'item_group_id',
                    operator: 'equals',
                    value: group.groupId,
                    description: `Exclude entire product group "${group.groupId}" (${group.excludedCount}/${group.totalCount} excluded)`,
                    googleMerchantRule: `item_group_id = "${group.groupId}"`,
                    confidence: group.percentage
                });
            }
        });

        // Availability rules
        patterns.availability.forEach(avail => {
            if (avail.count >= Math.max(3, excludedItemsData.length * 0.3)) {
                rules.push({
                    type: 'availability',
                    priority: 'medium',
                    field: 'availability',
                    operator: 'equals',
                    value: avail.availability,
                    description: `Exclude all "${avail.availability}" products (${avail.count} items)`,
                    googleMerchantRule: `availability = "${avail.availability}"`,
                    confidence: (avail.count / excludedItemsData.length) * 100
                });
            }
        });

        // Sort by priority and confidence
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return rules.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return b.confidence - a.confidence;
        });
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
            case 'smart-rules':
                this.exportAsSmartRules(excludedList, excludedItemsData);
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

    exportAsSmartRules(excludedList, excludedItemsData) {
        // Analyze patterns in excluded items
        const rules = this.analyzeExclusionPatterns(excludedItemsData);
        
        // Generate comprehensive smart rules report
        const reportData = [
            ['🧠 SMART EXCLUSION RULES & FEED MAPPING REPORT'],
            ['Generated:', new Date().toLocaleString()],
            ['Feed URL:', this.feedUrlInput.value],
            ['Total Excluded Items:', excludedList.length],
            ['Total Feed Items:', this.feedData.length],
            ['Exclusion Rate:', `${Math.round((excludedList.length / this.feedData.length) * 100)}%`],
            [''],
            
            // Executive Summary
            ['=== EXECUTIVE SUMMARY ==='],
            ['This report analyzes your exclusions and suggests smart rules for your feed generator.'],
            ['High Priority rules can save significant manual work by excluding entire groups at once.'],
            [''],
            
            // High Priority Rules
            ['=== HIGH PRIORITY RULES (Recommended) ==='],
            ['These rules will automatically exclude groups of items based on detected patterns:'],
            ['']
        ];

        // Add high priority rules
        const highPriorityRules = rules.filter(rule => rule.priority === 'high');
        if (highPriorityRules.length > 0) {
            reportData.push(['Rule Type', 'Feed Generator Rule', 'Description', 'Confidence %', 'Google Merchant Rule']);
            highPriorityRules.forEach(rule => {
                reportData.push([
                    rule.type.replace(/_/g, ' ').toUpperCase(),
                    `${rule.field} ${rule.operator} "${rule.value}"`,
                    rule.description,
                    `${Math.round(rule.confidence)}%`,
                    rule.googleMerchantRule
                ]);
            });
        } else {
            reportData.push(['No high-priority rules detected. Your exclusions appear to be individual items.']);
        }
        
        reportData.push(['']);

        // Medium Priority Rules
        const mediumPriorityRules = rules.filter(rule => rule.priority === 'medium');
        if (mediumPriorityRules.length > 0) {
            reportData.push(['=== MEDIUM PRIORITY RULES (Consider) ===']);
            reportData.push(['These rules may help but review carefully before implementing:']);
            reportData.push(['']);
            reportData.push(['Rule Type', 'Feed Generator Rule', 'Description', 'Confidence %', 'Google Merchant Rule']);
            mediumPriorityRules.forEach(rule => {
                reportData.push([
                    rule.type.replace(/_/g, ' ').toUpperCase(),
                    `${rule.field} ${rule.operator} "${rule.value}"`,
                    rule.description,
                    `${Math.round(rule.confidence)}%`,
                    rule.googleMerchantRule
                ]);
            });
            reportData.push(['']);
        }

        // Implementation Guide
        reportData.push(['=== IMPLEMENTATION GUIDE ===']);
        reportData.push(['Google Merchant Center:', 'Account Settings > Shopping ads > Feeds > Supplemental feeds']);
        reportData.push(['Facebook Catalog:', 'Catalog Manager > Data Sources > Rules']);
        reportData.push(['Custom Feed Generator:', 'Use the "Feed Generator Rule" column for filtering logic']);
        reportData.push(['']);

        // Feed Platform Specific Rules
        reportData.push(['=== GOOGLE MERCHANT CENTER EXCLUSION RULES ===']);
        reportData.push(['Copy these rules into your Merchant Center supplemental feed:']);
        reportData.push(['']);
        highPriorityRules.concat(mediumPriorityRules).forEach(rule => {
            if (rule.googleMerchantRule) {
                reportData.push([`${rule.googleMerchantRule} [Action: Exclude]`]);
            }
        });
        reportData.push(['']);

        // Facebook/Meta Catalog Rules
        reportData.push(['=== FACEBOOK/META CATALOG RULES ===']);
        reportData.push(['Use these rules in Facebook Business Manager:']);
        reportData.push(['']);
        highPriorityRules.concat(mediumPriorityRules).forEach(rule => {
            const fbRule = this.convertToFacebookRule(rule);
            if (fbRule) {
                reportData.push([fbRule]);
            }
        });
        reportData.push(['']);

        // Detailed Exclusion Analysis
        reportData.push(['=== DETAILED EXCLUSION ANALYSIS ===']);
        reportData.push(['']);

        // Brand Analysis
        const brandPatterns = this.analyzeBrandPatterns(excludedItemsData);
        if (brandPatterns.length > 0) {
            reportData.push(['BRAND ANALYSIS:']);
            reportData.push(['Brand', 'Excluded Items', 'Total Items', 'Exclusion %', 'Recommendation']);
            brandPatterns.forEach(brand => {
                let recommendation = 'Individual exclusions';
                if (brand.percentage >= 80) recommendation = '🔴 EXCLUDE ENTIRE BRAND';
                else if (brand.percentage >= 50) recommendation = '🟡 Consider brand exclusion';
                
                reportData.push([
                    brand.brand,
                    brand.excludedCount,
                    brand.totalCount,
                    `${brand.percentage}%`,
                    recommendation
                ]);
            });
            reportData.push(['']);
        }

        // Category Analysis
        const categoryPatterns = this.analyzeCategoryPatterns(excludedItemsData);
        if (categoryPatterns.length > 0) {
            reportData.push(['CATEGORY ANALYSIS:']);
            reportData.push(['Category', 'Excluded Items', 'Total Items', 'Exclusion %', 'Recommendation']);
            categoryPatterns.forEach(category => {
                let recommendation = 'Individual exclusions';
                if (category.percentage >= 60) recommendation = '🔴 EXCLUDE ENTIRE CATEGORY';
                else if (category.percentage >= 30) recommendation = '🟡 Consider category exclusion';
                
                reportData.push([
                    category.category,
                    category.excludedCount,
                    category.totalCount,
                    `${category.percentage}%`,
                    recommendation
                ]);
            });
            reportData.push(['']);
        }

        // Title Keyword Analysis
        const titlePatterns = this.analyzeTitlePatterns(excludedItemsData);
        if (titlePatterns.length > 0) {
            reportData.push(['TITLE KEYWORD ANALYSIS:']);
            reportData.push(['Keyword', 'Occurrences', 'Potential Rule']);
            titlePatterns.slice(0, 5).forEach(keyword => {
                reportData.push([
                    keyword.keyword,
                    keyword.count,
                    `title contains "${keyword.keyword}"`
                ]);
            });
            reportData.push(['']);
        }

        // Raw excluded item IDs for reference
        reportData.push(['=== EXCLUDED ITEM IDS (For Reference) ===']);
        reportData.push(['Individual item IDs that were excluded:']);
        reportData.push(['']);
        const chunked = this.chunkArray(excludedList, 10);
        chunked.forEach(chunk => {
            reportData.push(chunk);
        });

        // Convert to CSV
        const csvContent = reportData.map(row => 
            row.map(cell => {
                const cellStr = String(cell);
                // Escape quotes and wrap in quotes if contains comma or quotes
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');

        // Download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smart-exclusion-rules-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message with quick tips
        alert(`🧠 Smart Rules Report Generated!

Key Benefits:
• ${highPriorityRules.length} high-priority automation rules detected
• Potential to reduce manual exclusions by ${this.calculatePotentialSavings(rules, excludedItemsData)}%
• Ready-to-use rules for Google Merchant Center & Facebook

Next Steps:
1. Open the downloaded CSV file
2. Review the HIGH PRIORITY rules section
3. Copy the Google Merchant Center rules to your feed setup
4. Test with a small batch before full implementation`);
    }

    convertToFacebookRule(rule) {
        switch (rule.type) {
            case 'brand_exclude_all':
            case 'brand_partial':
                return `brand equals "${rule.value}" → Exclude`;
            case 'category_exclude':
                return `product_type contains "${rule.value}" → Exclude`;
            case 'title_keyword':
                return `product_name contains "${rule.value}" → Exclude`;
            case 'availability':
                return `availability equals "${rule.value}" → Exclude`;
            case 'price_range':
                return `price in range ${rule.value} → Exclude`;
            default:
                return null;
        }
    }

    calculatePotentialSavings(rules, excludedItemsData) {
        const highPriorityRules = rules.filter(rule => rule.priority === 'high');
        const totalAutomatable = highPriorityRules.reduce((sum, rule) => {
            return sum + (rule.confidence / 100) * excludedItemsData.length;
        }, 0);
        
        return Math.min(95, Math.round((totalAutomatable / excludedItemsData.length) * 100));
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    // Comparison functionality
    toggleCompare(itemId) {
        if (this.compareItems.has(itemId)) {
            this.compareItems.delete(itemId);
        } else {
            this.compareItems.add(itemId);
        }
        this.updateCompareCount();
    }

    updateCompareCount() {
        this.compareCount.textContent = this.compareItems.size;
        this.compareBtn.disabled = this.compareItems.size === 0;
    }

    showComparison() {
        if (this.compareItems.size === 0) {
            this.showError('Please select items to compare');
            return;
        }

        const compareData = this.feedData.filter(item => this.compareItems.has(item.id));

        // Build comparison table
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>ID</th>
                        <th>Price</th>
                        <th>Availability</th>
                        <th>Condition</th>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        compareData.forEach(item => {
            tableHTML += `
                <tr>
                    <td><img src="${item.imageLink || 'https://via.placeholder.com/80x80?text=No+Image'}"
                             alt="${item.title}" class="product-image"
                             onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'"></td>
                    <td>${item.title}</td>
                    <td>${item.id}</td>
                    <td>${item.price}</td>
                    <td>${item.availability}</td>
                    <td>${item.condition}</td>
                    <td>${item.productType || 'N/A'}</td>
                    <td>
                        <button onclick="feedViewer.removeFromComparison('${item.id}')" class="modal-option-btn">Remove</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        this.comparisonTable.innerHTML = tableHTML;
        this.comparisonModal.classList.remove('hidden');
    }

    removeFromComparison(itemId) {
        this.compareItems.delete(itemId);
        this.updateCompareCount();
        this.showComparison();

        // Uncheck the checkbox in the main list
        const checkbox = document.querySelector(`input[onchange="feedViewer.toggleCompare('${itemId}')"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    clearComparison() {
        this.compareItems.clear();
        this.updateCompareCount();
        this.closeComparisonModal();

        // Uncheck all checkboxes
        document.querySelectorAll('input[type="checkbox"][onchange*="toggleCompare"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    closeComparisonModal() {
        this.comparisonModal.classList.add('hidden');
    }

    // Export current view functionality
    exportCurrentView() {
        if (this.filteredData.length === 0) {
            this.showError('No items to export in current view');
            return;
        }

        // Create CSV content for current view
        let csv = 'ID,Title,Price,Availability,Condition,Category,Excluded\n';

        this.filteredData.forEach(item => {
            const isExcluded = this.excludedItems.has(item.id);
            csv += `"${item.id}","${item.title}","${item.price}","${item.availability}","${item.condition}","${item.productType || ''}","${isExcluded ? 'Yes' : 'No'}"\n`;
        });

        // Download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feed-view-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Bulk actions
    excludeAllVisible() {
        if (this.filteredData.length === 0) {
            this.showError('No visible items to exclude');
            return;
        }

        const count = this.filteredData.length;
        if (confirm(`Are you sure you want to exclude all ${count} visible items?`)) {
            this.filteredData.forEach(item => {
                this.excludedItems.add(item.id);
            });
            this.renderItems();
            this.updateStats();
        }
    }

    includeAllVisible() {
        const excludedVisible = this.filteredData.filter(item => this.excludedItems.has(item.id));

        if (excludedVisible.length === 0) {
            this.showError('No excluded items in current view');
            return;
        }

        const count = excludedVisible.length;
        if (confirm(`Are you sure you want to include all ${count} excluded items in the current view?`)) {
            excludedVisible.forEach(item => {
                this.excludedItems.delete(item.id);
            });
            this.renderItems();
            this.updateStats();
        }
    }
}

// Initialize the feed viewer when the page loads
let feedViewer;
document.addEventListener('DOMContentLoaded', () => {
    feedViewer = new FeedViewer();
}); 