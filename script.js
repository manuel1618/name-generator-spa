// Name Generator SPA
class NameGenerator {
    constructor() {
        this.names = [];
        this.filteredNames = [];
        this.currentBatch = 0;
        this.batchSize = 10;
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadNames();
    }

    initializeElements() {
        // Filter inputs
        this.genderSelect = document.getElementById('gender');
        this.startWithInput = document.getElementById('startWith');
        this.endWithInput = document.getElementById('endWith');
        this.containsInput = document.getElementById('contains');
        this.notStartingInput = document.getElementById('notStarting');
        this.notEndingInput = document.getElementById('notEnding');
        this.notContainingInput = document.getElementById('notContaining');
        this.minSyllablesSelect = document.getElementById('minSyllables');
        this.maxSyllablesSelect = document.getElementById('maxSyllables');
        this.batchSizeInput = document.getElementById('batchSize');
        
        // Buttons
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        
        // Results elements
        this.resultsContainer = document.getElementById('resultsContainer');
        this.resultsCount = document.getElementById('resultsCount');
        this.resultsTime = document.getElementById('resultsTime');
        this.loadMoreContainer = document.getElementById('loadMoreContainer');
        
        // Status elements
        this.statusText = document.getElementById('statusText');
        this.totalNames = document.getElementById('totalNames');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Generate button
        this.generateBtn.addEventListener('click', () => this.generateNames());
        
        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearFilters());
        
        // Load more button
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreNames());
        
        // Real-time filtering on input change
        const filterInputs = [
            this.genderSelect,
            this.startWithInput,
            this.endWithInput,
            this.containsInput,
            this.notStartingInput,
            this.notEndingInput,
            this.notContainingInput,
            this.minSyllablesSelect,
            this.maxSyllablesSelect,
            this.batchSizeInput
        ];
        
        filterInputs.forEach(input => {
            input.addEventListener('input', () => this.debounceFilter());
            input.addEventListener('change', () => this.debounceFilter());
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.generateNames();
                } else if (e.key === 'k') {
                    e.preventDefault();
                    this.clearFilters();
                }
            }
        });
    }

    async loadNames() {
        try {
            this.showLoading(true);
            this.updateStatus('Loading names...');
            
            const response = await fetch('names.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.names = await response.json();
            this.genderNeutralNames = this.findGenderNeutralNames();
            this.updateStatus(`Loaded ${this.names.length.toLocaleString()} names`);
            this.totalNames.textContent = `${this.names.length.toLocaleString()} names available`;
            
        } catch (error) {
            console.error('Error loading names:', error);
            this.updateStatus('Error loading names');
            this.showError('Failed to load names data. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }

    findGenderNeutralNames() {
        const nameCounts = {};
        
        // Count occurrences of each name by gender
        this.names.forEach(nameObj => {
            if (!nameCounts[nameObj.name]) {
                nameCounts[nameObj.name] = { m: 0, w: 0 };
            }
            nameCounts[nameObj.name][nameObj.gender]++;
        });
        
        // Find names that exist in both male and female versions
        const genderNeutralNames = [];
        Object.keys(nameCounts).forEach(name => {
            if (nameCounts[name].m > 0 && nameCounts[name].w > 0) {
                // Find the name object with the highest popularity
                const maleVersion = this.names.find(n => n.name === name && n.gender === 'm');
                const femaleVersion = this.names.find(n => n.name === name && n.gender === 'w');
                
                // Use the version with higher popularity, or male if equal
                const bestVersion = (maleVersion.popularity >= femaleVersion.popularity) ? maleVersion : femaleVersion;
                genderNeutralNames.push({
                    ...bestVersion,
                    gender: 'neutral'
                });
            }
        });
        
        return genderNeutralNames;
    }

    parseListInput(input) {
        if (!input || !input.trim()) return [];
        return input.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
    }

    createFilter() {
        return {
            gender: this.genderSelect.value === 'any' ? null : this.genderSelect.value,
            startWith: this.startWithInput.value.trim().toLowerCase(),
            endWith: this.endWithInput.value.trim().toLowerCase(),
            contains: this.parseListInput(this.containsInput.value),
            notStartingWith: this.parseListInput(this.notStartingInput.value),
            notEndingWith: this.parseListInput(this.notEndingInput.value),
            notContaining: this.parseListInput(this.notContainingInput.value),
            minSyllables: parseInt(this.minSyllablesSelect.value) || null,
            maxSyllables: parseInt(this.maxSyllablesSelect.value) || null,
            batchSize: parseInt(this.batchSizeInput.value) || 10
        };
    }

    filterNames(filter) {
        // Choose the appropriate dataset based on gender filter
        const dataset = filter.gender === 'neutral' ? this.genderNeutralNames : this.names;
        
        return dataset.filter(nameObj => {
            const name = nameObj.name.toLowerCase();
            
            // Gender filter
            if (filter.gender && filter.gender !== 'neutral' && nameObj.gender !== filter.gender) {
                return false;
            }
            
            // Start with filter
            if (filter.startWith && !name.startsWith(filter.startWith)) {
                return false;
            }
            
            // End with filter
            if (filter.endWith && !name.endsWith(filter.endWith)) {
                return false;
            }
            
            // Contains filter
            if (filter.contains.length > 0) {
                for (const letter of filter.contains) {
                    if (!name.includes(letter)) {
                        return false;
                    }
                }
            }
            
            // Not starting with filter
            if (filter.notStartingWith.length > 0) {
                for (const letter of filter.notStartingWith) {
                    if (name.startsWith(letter)) {
                        return false;
                    }
                }
            }
            
            // Not ending with filter
            if (filter.notEndingWith.length > 0) {
                for (const letter of filter.notEndingWith) {
                    if (name.endsWith(letter)) {
                        return false;
                    }
                }
            }
            
            // Not containing filter
            if (filter.notContaining.length > 0) {
                for (const letter of filter.notContaining) {
                    if (name.includes(letter)) {
                        return false;
                    }
                }
            }
            
            // Syllable range filter
            if (filter.minSyllables && nameObj.syllables < filter.minSyllables) {
                return false;
            }
            
            if (filter.maxSyllables && nameObj.syllables > filter.maxSyllables) {
                return false;
            }
            
            return true;
        });
    }

    generateNames() {
        if (this.isLoading) return;
        
        const startTime = performance.now();
        this.isLoading = true;
        
        try {
            const filter = this.createFilter();
            this.filteredNames = this.filterNames(filter);
            
            if (this.filteredNames.length === 0) {
                this.showNoResults();
                return;
            }
            
            // Sort by popularity (descending)
            this.filteredNames.sort((a, b) => b.popularity - a.popularity);
            
            this.currentBatch = 0;
            this.batchSize = filter.batchSize;
            
            this.displayResults();
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this.resultsTime.textContent = `Generated in ${duration}ms`;
            this.updateStatus(`Found ${this.filteredNames.length.toLocaleString()} matching names`);
            
        } catch (error) {
            console.error('Error generating names:', error);
            this.showError('An error occurred while generating names');
        } finally {
            this.isLoading = false;
        }
    }

    displayResults() {
        const startIndex = this.currentBatch * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, this.filteredNames.length);
        const currentBatch = this.filteredNames.slice(startIndex, endIndex);
        
        if (this.currentBatch === 0) {
            // First batch - replace content
            this.resultsContainer.innerHTML = this.createNameListHTML(currentBatch);
        } else {
            // Additional batch - append content
            const existingList = this.resultsContainer.querySelector('.name-list');
            const newList = this.createNameListHTML(currentBatch);
            const newListElement = document.createElement('div');
            newListElement.innerHTML = newList;
            existingList.appendChild(newListElement.firstElementChild);
        }
        
        this.resultsCount.textContent = `${endIndex.toLocaleString()} of ${this.filteredNames.length.toLocaleString()} names`;
        
        // Show/hide load more button
        if (endIndex < this.filteredNames.length) {
            this.loadMoreContainer.style.display = 'block';
            this.loadMoreBtn.innerHTML = `Load More (${this.filteredNames.length - endIndex} remaining)`;
        } else {
            this.loadMoreContainer.style.display = 'none';
        }
        
        this.currentBatch++;
    }

    createNameListHTML(names) {
        if (names.length === 0) return '<div class="results-placeholder"><p class="placeholder-text">No names found</p></div>';
        
        const namesHTML = names.map(nameObj => {
            const genderIcon = nameObj.gender === 'neutral' ? '⚧' : (nameObj.gender === 'm' ? '♂' : '♀');
            return `<div class="name-item" data-gender="${nameObj.gender}" data-popularity="${nameObj.popularity}" title="Popularity: ${nameObj.popularity}">${nameObj.name} ${genderIcon}</div>`;
        }).join('');
        
        return `<div class="name-list">${namesHTML}</div>`;
    }

    loadMoreNames() {
        if (this.isLoading || this.filteredNames.length === 0) return;
        
        this.displayResults();
    }

    clearFilters() {
        this.genderSelect.value = 'any';
        this.startWithInput.value = '';
        this.endWithInput.value = '';
        this.containsInput.value = '';
        this.notStartingInput.value = '';
        this.notEndingInput.value = '';
        this.notContainingInput.value = '';
        this.minSyllablesSelect.value = '1';
        this.maxSyllablesSelect.value = '10';
        this.batchSizeInput.value = '10';
        
        this.resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <p class="placeholder-text">Click "Generate Names" to see results</p>
            </div>
        `;
        
        this.resultsCount.textContent = '0 names';
        this.resultsTime.textContent = '';
        this.loadMoreContainer.style.display = 'none';
        this.updateStatus('Filters cleared');
        
        // Focus on first input
        this.genderSelect.focus();
    }

    showNoResults() {
        this.resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <p class="placeholder-text">No names found matching your criteria</p>
                <p class="placeholder-text" style="font-size: 0.875rem; margin-top: 0.5rem;">Try adjusting your filters</p>
            </div>
        `;
        this.resultsCount.textContent = '0 names';
        this.resultsTime.textContent = '';
        this.loadMoreContainer.style.display = 'none';
    }

    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <p class="placeholder-text">${message}</p>
            </div>
        `;
        this.resultsCount.textContent = '0 names';
        this.resultsTime.textContent = '';
        this.loadMoreContainer.style.display = 'none';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
        this.generateBtn.disabled = show;
    }

    updateStatus(message) {
        this.statusText.textContent = message;
    }

    // Debounced filtering for real-time updates
    debounceFilter() {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            if (this.hasActiveFilters()) {
                this.generateNames();
            }
        }, 500);
    }

    hasActiveFilters() {
        return this.genderSelect.value !== 'any' ||
               this.startWithInput.value.trim() ||
               this.endWithInput.value.trim() ||
               this.containsInput.value.trim() ||
               this.notStartingInput.value.trim() ||
               this.notEndingInput.value.trim() ||
               this.notContainingInput.value.trim() ||
               this.minSyllablesSelect.value !== '1' ||
               this.maxSyllablesSelect.value !== '10';
    }
}

// Utility functions
function formatNumber(num) {
    return num.toLocaleString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loading state to body
    document.body.classList.add('loading');
    
    // Initialize the name generator
    window.nameGenerator = new NameGenerator();
    
    // Remove loading state
    document.body.classList.remove('loading');
    
    // Add some helpful console messages
    console.log('Name Generator SPA loaded successfully!');
    console.log('Keyboard shortcuts:');
    console.log('   Ctrl/Cmd + Enter: Generate names');
    console.log('   Ctrl/Cmd + K: Clear filters');
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
