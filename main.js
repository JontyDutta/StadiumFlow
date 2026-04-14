// Mock Data for Smart Queues
const mockQueues = [
    { id: 1, name: 'North Gate Concessions', type: 'food', baseTime: 12 },
    { id: 2, name: 'South Stand Burgers', type: 'food', baseTime: 5 },
    { id: 3, name: 'East Wing Restrooms', type: 'restroom', baseTime: 2 },
    { id: 4, name: 'West Level 1 Restrooms', type: 'restroom', baseTime: 18 },
    { id: 5, name: 'Center Circle Drinks', type: 'food', baseTime: 8 }
];

let currentFilter = 'all';

// DOM Elements
const globalSearchForm = document.getElementById('globalSearchForm');
const stadiumSearch = document.getElementById('stadiumSearch');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const queuesList = document.getElementById('queuesList');
const filterBtns = document.querySelectorAll('.filter-btn');
const routeForm = document.getElementById('routeForm');
const seatInput = document.getElementById('seatInput');
const routeResult = document.getElementById('routeResult');
const searchDropdown = document.getElementById('searchDropdown');


// Map Modal Elements
const openMapBtn = document.getElementById('openMapBtn');
const mapModal = document.getElementById('mapModal');
const closeMapBtn = document.getElementById('closeMapBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    setupAboutDrawer();
    initSmartQueues();
    setupFilters();
    setupRoutingLogic();
    setupModals();
    setupStadiumSearch();
    initGreeting();
    setTimeout(() => {
        updateStadiumOverview(currentStadiumName, currentStadiumCoords, currentStadiumLocationString);
    }, 300);
});

// --- Smart Queues Simulated WebSocket Logic ---

class MockWebSocketConnector {
    constructor(onMessage) {
        this.onMessage = onMessage;
        this.connect();
    }

    connect() {
        console.log("[WebSocket] Connecting to stadium queue sensors...");
        setTimeout(() => {
            console.log("[WebSocket] Connected successfully.");
            this.sendInitialData();
            this.startStreaming();
        }, 800);
    }

    sendInitialData() {
        this.onMessage(mockQueues.map(q => ({
            ...q,
            currentWait: q.baseTime
        })));
    }

    startStreaming() {
        // Simulate a push event from the server every 8 seconds
        setInterval(() => {
            const updatedData = mockQueues.map(q => {
                const fluctuation = Math.floor(Math.random() * 7) - 3;
                return {
                    ...q,
                    currentWait: Math.max(1, q.baseTime + fluctuation)
                };
            });
            this.onMessage(updatedData);
        }, 8000);
    }
}

let activeQueuesData = [];

function getWaitLevelInfo(minutes) {
    if (minutes < 5) return { text: 'Low Wait', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-400/20', icon: 'check_circle' };
    if (minutes < 15) return { text: 'Med Wait', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-400/20', icon: 'schedule' };
    return { text: 'High Wait', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-400/20', icon: 'warning' };
}

function processWebSocketData(data) {
    activeQueuesData = data;
    renderQueues();
}

function renderQueues() {
    queuesList.innerHTML = '';
    
    const filtered = activeQueuesData.filter(q => currentFilter === 'all' || q.type === currentFilter);
    
    if (filtered.length === 0) {
        queuesList.innerHTML = `<p class="text-slate-400 text-sm text-center py-4">No queues found for this category.</p>`;
        return;
    }

    filtered.forEach(q => {
        const status = getWaitLevelInfo(q.currentWait);
        const typeIcon = q.type === 'food' ? 'restaurant' : 'wc';

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]';
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                    <span class="material-icons-round text-slate-500 dark:text-slate-300 text-sm" aria-hidden="true">${typeIcon}</span>
                </div>
                <div>
                    <h3 class="font-medium text-slate-900 dark:text-slate-100 text-sm">${q.name}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 capitalize">${q.type}</p>
                </div>
            </div>
            <div class="flex flex-col items-end">
                <span class="text-lg font-bold text-slate-900 dark:text-slate-100">${q.currentWait}<span class="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">min</span></span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.color} flex items-center gap-1 mt-1">
                    <span class="material-icons-round text-[10px]" aria-hidden="true">${status.icon}</span> ${status.text}
                </span>
            </div>
        `;
        queuesList.appendChild(card);
    });
}

function initSmartQueues() {
    new MockWebSocketConnector(processWebSocketData);
}

function setupFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            filterBtns.forEach(b => {
                b.className = 'filter-btn px-4 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200';
            });
            e.target.className = 'filter-btn active px-4 py-1.5 rounded-full text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transition-all duration-200';
            
            currentFilter = e.target.dataset.filter;
            renderQueues();
        });
    });
}

// --- Routing / Logic ---

function setupRoutingLogic() {
    routeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sectionNum = parseInt(seatInput.value, 10);
        
        if (isNaN(sectionNum)) return;

        let bestOption = '';
        let mapHint = '';

        // Dynamic routing generation using modulo so ANY section number works seamlessly
        const directions = [
            { opt: 'North Gate Concessions', hint: 'NORTH STAND' },
            { opt: 'East Wing Restrooms & Snack Bar', hint: 'EAST WING' },
            { opt: 'South Stand Burgers', hint: 'SOUTH STAND' },
            { opt: 'West Level Amenities', hint: 'WEST WING' }
        ];

        // Ensure we always have a valid index between 0 and 3
        const dirIndex = sectionNum % 4;
        const dir = directions[dirIndex];

        // Make the resulting option look specifically tailored to the active stadium
        bestOption = `${currentStadiumName} - ${dir.opt}`;
        mapHint = dir.hint;

        routeResult.innerHTML = `
            <div class="flex items-start gap-2">
                <span class="material-icons-round text-green-500 mt-0.5" aria-hidden="true">check_circle</span>
                <div>
                    <p class="text-sm text-slate-600 dark:text-slate-300">Fastest Route for <b class="text-slate-800 dark:text-slate-200">Section ${sectionNum}</b>:</p>
                    <p class="text-lg font-bold text-slate-900 dark:text-white">${bestOption}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Follow signs towards <b class="text-slate-700 dark:text-slate-200">${mapHint}</b></p>
                </div>
            </div>
        `;
        routeResult.classList.remove('hidden');
        routeResult.classList.add('animate-fade-in-up');
    });
}

// --- Modals and Map Setup ---

// Default to Narendra Modi Stadium [Lat, Lng]
let currentStadiumCoords = [23.1023, 72.5975];
let currentStadiumName = "Narendra Modi Stadium";
let currentStadiumLocationString = "Ahmedabad, Gujarat, India";
let leafletMap = null;
let mapMarkers = [];

let debounceTimeout = null;
let activeIndex = -1;
let currentResults = [];

function getSportIcon(sportArray) {
    if (!sportArray || sportArray.length === 0) return '🏟️';
    const s = sportArray[0].toLowerCase();
    if (s.includes('cricket')) return '🏏';
    if (s.includes('football') || s.includes('soccer')) return '⚽';
    if (s.includes('ice hockey') || s.includes('hockey')) return '🏒';
    if (s.includes('basketball')) return '🏀';
    if (s.includes('tennis')) return '🎾';
    if (s.includes('american football')) return '🏈';
    if (s.includes('rugby')) return '🏉';
    return '🏟️';
}

function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\\\]/g, '\\\\$&')})`, 'gi');
    return text.replace(regex, '<b class="text-primary">$1</b>');
}

function performLocalSearch(query) {
    const q = query.toLowerCase();
    if (typeof globalStadiums === 'undefined') return [];
    
    let scoredResults = globalStadiums.map(stadium => {
        let score = 0;
        const name = stadium.name.toLowerCase();
        
        // Priority 1: Exact Name
        if (name === q) score = 100;
        // Priority 2: Partial Name
        else if (name.includes(q)) score = 80;
        // Priority 3: Location
        else if (stadium.city.toLowerCase().includes(q) || stadium.country.toLowerCase().includes(q) || stadium.state.toLowerCase().includes(q)) score = 60;
        // Priority 4: Sport
        else if (stadium.sport.some(s => s.toLowerCase().includes(q))) score = 40;
        // Priority 5: Alias
        else if (stadium.aliases && stadium.aliases.some(a => a.toLowerCase().includes(q))) score = 20;

        return { stadium, score };
    });

    // Filter out zero scores and sort by score descending
    scoredResults = scoredResults.filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    
    // Return top 8 results
    return scoredResults.slice(0, 8).map(item => item.stadium);
}

function renderDropdown(results, query) {
    searchDropdown.innerHTML = '';
    currentResults = results;
    activeIndex = -1;

    if (results.length === 0) {
        searchDropdown.classList.add('hidden');
        return;
    }

    results.forEach((stadium, index) => {
        const li = document.createElement('li');
        li.className = 'p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors';
        li.dataset.index = index;
        
        const icon = getSportIcon(stadium.sport);
        const nameHtml = highlightMatch(stadium.name, query);
        const locString = highlightMatch(`${stadium.city}, ${stadium.country}`, query);
        const capacity = stadium.capacity ? stadium.capacity.toLocaleString() : 'N/A';

        li.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden pr-2">
                <span class="text-xl shrink-0" aria-hidden="true">${icon}</span>
                <div class="truncate">
                    <div class="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">${nameHtml}</div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${locString} &bull; ${stadium.sport.join(', ')}</div>
                </div>
            </div>
            <div class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium px-2 py-1 rounded-full shrink-0 border border-slate-200 dark:border-slate-700">
                <span class="material-icons-round text-[10px]" aria-hidden="true">groups</span> ${capacity}
            </div>
        `;

        li.addEventListener('click', () => {
            selectStadium(stadium.name);
        });

        searchDropdown.appendChild(li);
    });

    searchDropdown.classList.remove('hidden');
}

function updateActiveDropdownItem() {
    const items = searchDropdown.querySelectorAll('li[data-index]');
    items.forEach(item => {
        item.classList.remove('bg-slate-100', 'dark:bg-slate-700');
        if (parseInt(item.dataset.index) === activeIndex) {
            item.classList.add('bg-slate-100', 'dark:bg-slate-700');
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

function selectStadium(name) {
    stadiumSearch.value = name;
    searchDropdown.classList.add('hidden');
    // Programmatically trigger map search
    globalSearchForm.dispatchEvent(new Event('submit'));
}

function setupStadiumSearch() {
    if (!globalSearchForm) return;

    // Autocomplete Input Handling
    stadiumSearch.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        clearTimeout(debounceTimeout);
        
        if (val.length < 2) {
            searchDropdown.classList.add('hidden');
            return;
        }

        debounceTimeout = setTimeout(() => {
            const results = performLocalSearch(val);
            renderDropdown(results, val);
        }, 300);
    });

    // Keyboard Navigation
    stadiumSearch.addEventListener('keydown', (e) => {
        if (searchDropdown.classList.contains('hidden') || currentResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % currentResults.length;
            updateActiveDropdownItem();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = activeIndex <= 0 ? currentResults.length - 1 : activeIndex - 1;
            updateActiveDropdownItem();
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && activeIndex < currentResults.length) {
                e.preventDefault();
                selectStadium(currentResults[activeIndex].name);
            }
        } else if (e.key === 'Escape') {
            searchDropdown.classList.add('hidden');
        }
    });

    // Hide dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!globalSearchForm.contains(e.target)) {
            searchDropdown.classList.add('hidden');
        }
    });

    globalSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const val = stadiumSearch.value.trim();
        if (!val) return;

        searchDropdown.classList.add('hidden');

        // UI Loading State
        searchBtn.disabled = true;
        searchBtn.innerHTML = `<span class="material-icons-round text-sm animate-spin" aria-hidden="true">autorenew</span>`;
        searchStatus.classList.remove('hidden', 'text-rose-400');
        searchStatus.classList.add('text-slate-400');
        searchStatus.innerText = "Querying global satellites...";

        try {
            // Append "stadium" to assist the geocoding logic
            let query = val.toLowerCase().includes('stadium') ? val : val + ' stadium';
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=en`);
            const data = await response.json();

            if (data && data.length > 0) {
                // Use the exact node location from OSM to prevent map shifting from irregular parking lots
                let lat = parseFloat(data[0].lat);
                let lon = parseFloat(data[0].lon);

                currentStadiumCoords = [lat, lon];
                let displayNameParts = data[0].display_name.split(',');
                currentStadiumName = displayNameParts[0].trim();
                
                let locParts = [];
                if (displayNameParts.length > 2) {
                    locParts = displayNameParts.slice(-3).map(p => p.trim());
                } else if (displayNameParts.length > 1) {
                    locParts = displayNameParts.slice(1).map(p => p.trim());
                } else {
                    locParts = ["Unknown Region"];
                }
                currentStadiumLocationString = locParts.join(', ');
                
                searchStatus.innerHTML = `<span class="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1"><span class="material-icons-round text-[12px] mt-[1px]">check_circle</span> Map linked to ${currentStadiumName}</span>`;
                
                updateStadiumOverview(currentStadiumName, currentStadiumCoords, currentStadiumLocationString);

                if (leafletMap) {
                    updateMapMarkers();
                }
            } else {
                searchStatus.classList.remove('text-slate-400');
                searchStatus.classList.add('text-rose-400');
                searchStatus.innerText = `No stadiums found for "${val}"`;
            }

        } catch (error) {
            console.error(error);
            searchStatus.classList.remove('text-slate-400');
            searchStatus.classList.add('text-rose-400');
            searchStatus.innerText = "Network API Error.";
        } finally {
            searchBtn.disabled = false;
            searchBtn.innerHTML = `<span>Search</span>`;
        }
    });
}

function updateMapMarkers() {
    if (!leafletMap) return;
    
    // Clear old markers
    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];
    
    // Fly to new center
    leafletMap.flyTo(currentStadiumCoords, 16);
    
    // Add new markers around center
    const [lat, lng] = currentStadiumCoords;
    const m1 = L.marker([lat + 0.0008, lng]).addTo(leafletMap).bindPopup('<b>North Gate Concessions</b>');
    const m2 = L.marker([lat - 0.0008, lng]).addTo(leafletMap).bindPopup('<b>South Stand Burgers</b>');
    const circ = L.circle([lat, lng], { radius: 100, color: '#3b82f6', fillOpacity: 0.1 }).addTo(leafletMap);
    
    mapMarkers.push(m1, m2, circ);
}

function initLeafletMap() {
    if (leafletMap) return; // Only init once
    
    leafletMap = L.map('interactiveMap').setView(currentStadiumCoords, 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(leafletMap);

    updateMapMarkers();
}

function setupModals() {    // Map Modal
    openMapBtn.addEventListener('click', (e) => {
        e.preventDefault();
        mapModal.classList.add('modal-open');
        initLeafletMap();
        setTimeout(() => leafletMap.invalidateSize(), 300);
    });

    closeMapBtn.addEventListener('click', () => {
        mapModal.classList.remove('modal-open');
    });

    // Close Modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === mapModal) mapModal.classList.remove('modal-open');
    });
}


function initTheme() {
    // Default to dark mode if no preference found
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && !prefersLight);
    
    updateThemeColor(isDark);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
        const themeIcon = document.getElementById('themeIcon');
        if(themeIcon) themeIcon.textContent = 'light_mode';
    } else {
        document.documentElement.classList.remove('dark');
        const themeIcon = document.getElementById('themeIcon');
        if(themeIcon) themeIcon.textContent = 'dark_mode';
    }
}

function updateThemeColor(isDark) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#f5f5f7');
    }
}

function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    if (!themeToggleBtn) return;
    
    themeToggleBtn.addEventListener('click', () => {
        const h = document.documentElement;
        if (h.classList.contains('dark')) {
            h.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            themeIcon.textContent = 'dark_mode';
            updateThemeColor(false);
        } else {
            h.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.textContent = 'light_mode';
            updateThemeColor(true);
        }
    });
}

// --- About Drawer ---
function setupAboutDrawer() {
    const aboutBtn = document.getElementById('aboutBtn');
    const closeAboutBtn = document.getElementById('closeAboutBtn');
    const aboutDrawer = document.getElementById('aboutDrawer');
    const aboutOverlay = document.getElementById('aboutOverlay');

    if(!aboutBtn || !aboutDrawer) return;

    function openDrawer() {
        aboutDrawer.classList.remove('translate-x-full');
        aboutOverlay.classList.remove('opacity-0', 'pointer-events-none');
    }

    function closeDrawer() {
        aboutDrawer.classList.add('translate-x-full');
        aboutOverlay.classList.add('opacity-0', 'pointer-events-none');
    }

    aboutBtn.addEventListener('click', openDrawer);
    closeAboutBtn.addEventListener('click', closeDrawer);
    aboutOverlay.addEventListener('click', closeDrawer);
}

// --- Overview & Weather ---

function initGreeting() {
    const banner = document.getElementById('greetingBanner');
    const msgEl = document.getElementById('greetingMessage');
    
    if(!banner || !msgEl) return;
    
    const hour = new Date().getHours();
    let greeting = "";
    
    if (hour >= 6 && hour < 12) {
        greeting = "Good morning! ☀️ Ready to explore the world's greatest stadiums?";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon! 🌤️ What stadium can I help you discover today?";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good evening! 🌆 Let's find your perfect stadium!";
    } else {
        greeting = "Hey night owl! 🌙 Still exploring stadiums? I'm here for it!";
    }
    
    msgEl.textContent = greeting;
    banner.classList.remove('hidden');
}

function updateStadiumOverview(stadiumName, coords, locString) {
    const section = document.getElementById('stadiumOverviewSection');
    const oName = document.getElementById('overviewName');
    const oLoc = document.getElementById('overviewLocation');
    const oCap = document.getElementById('overviewCapacity');
    const oSports = document.getElementById('overviewSports');
    
    if(!section) return;

    section.classList.remove('hidden');
    
    const match = typeof globalStadiums !== 'undefined' ? globalStadiums.find(s => s.name.toLowerCase() === stadiumName.toLowerCase()) : null;
    
    if (match) {
        oName.textContent = match.name;
        oLoc.textContent = `${match.city}, ${match.country}`;
        oCap.textContent = match.capacity ? `${match.capacity.toLocaleString()} Capacity` : 'Capacity N/A';
        oSports.textContent = match.sport.join(', ');
    } else {
        oName.textContent = stadiumName;
        oLoc.textContent = locString || "Global Location View";
        
        let foundSports = [];
        const lowerName = stadiumName.toLowerCase();
        const searchInput = document.getElementById('stadiumSearch');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const combined = lowerName + " " + searchTerm;
        
        if (combined.includes('cricket')) foundSports.push('Cricket');
        if (combined.includes('hockey')) foundSports.push('Hockey');
        if (combined.includes('football') || combined.includes('soccer')) foundSports.push('Football');
        if (combined.includes('tennis')) foundSports.push('Tennis');
        if (combined.includes('basketball')) foundSports.push('Basketball');
        if (combined.includes('rugby')) foundSports.push('Rugby');
        if (combined.includes('baseball')) foundSports.push('Baseball');
        
        if (foundSports.length > 0) {
            oSports.textContent = Array.from(new Set(foundSports)).join(', ');
        } else {
            oSports.textContent = "Multi-purpose Stadium";
        }

        oCap.textContent = "Calculating Capacity...";
        fetchWikiCapacity(stadiumName).then(cap => {
            oCap.textContent = cap ? `${cap} Capacity` : "Capacity Data Unavailable";
        });
    }
    
    fetchWeather(coords[0], coords[1], stadiumName);
}

// Global Wiki Fetch Fallback
async function fetchWikiCapacity(stName) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvsection=0&titles=${encodeURIComponent(stName)}&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.query && data.query.pages) {
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== "-1") {
                const content = pages[pageId].revisions[0]['*'];
                const match = content.match(/capacity\s*=\s*[^\n]*?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,6})/i);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
    } catch (e) {
        console.log("No capacity found via wiki.");
    }
    return null;
}

async function fetchWeather(lat, lon, name) {
    const wLoc = document.getElementById('weatherLocation');
    const wTemp = document.getElementById('weatherTemp');
    const wWind = document.getElementById('weatherWind');
    const wCond = document.getElementById('weatherCondition');
    const wIcon = document.getElementById('weatherIcon');
    
    if(!wLoc) return;

    wLoc.textContent = name;
    wTemp.textContent = '--';
    wWind.textContent = '-- km/h';
    wCond.textContent = 'Fetching...';
    
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        
        if(data && data.current_weather) {
            const c = data.current_weather;
            wTemp.textContent = Math.round(c.temperature);
            wWind.textContent = `${c.windspeed} km/h`;
            
            const code = c.weathercode;
            let condStr = "Clear";
            let iconStr = "wb_sunny";
            
            if(code === 0) { condStr = "Clear sky"; iconStr = "wb_sunny"; }
            else if(code <= 3) { condStr = "Partly cloudy"; iconStr = "cloud"; }
            else if(code <= 49) { condStr = "Fog/Haze"; iconStr = "foggy"; }
            else if(code <= 69) { condStr = "Rain"; iconStr = "water_drop"; }
            else if(code <= 79) { condStr = "Snow"; iconStr = "ac_unit"; }
            else if(code <= 99) { condStr = "Thunderstorm"; iconStr = "thunderstorm"; }
            
            wCond.textContent = condStr;
            wIcon.textContent = iconStr;
        }
    } catch (err) {
        console.error("Weather fetch failed", err);
        wCond.textContent = "Unavailable";
        wTemp.textContent = "--";
    }
}

