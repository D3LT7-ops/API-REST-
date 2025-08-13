// API Configuration
const API_KEY = 'demo'; // Use 'demo' for testing, replace with real API key
const BASE_URL = 'https://www.alphavantage.co/query';

// Global state
let favorites = JSON.parse(localStorage.getItem('stockFavorites')) || [];
let comparisonHistory = JSON.parse(localStorage.getItem('comparisonHistory')) || [];

// Utility functions
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
};

const formatPercentage = (value) => {
    const num = parseFloat(value);
    const formatted = num.toFixed(2);
    return `${num >= 0 ? '+' : ''}${formatted}%`;
};

const showLoading = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) element.classList.remove('hidden');
};

const hideLoading = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) element.classList.add('hidden');
};

const showError = (message) => {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
};

// API Functions
const fetchStockData = async (symbol) => {
    try {
        const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
        const data = await response.json();
        
        if (data['Error Message']) {
            throw new Error('Símbolo de ação não encontrado');
        }
        
        if (data['Note']) {
            throw new Error('Limite de requisições da API atingido. Tente novamente em 1 minuto.');
        }
        
        const quote = data['Global Quote'];
        if (!quote) {
            throw new Error('Dados não disponíveis para este símbolo');
        }
        
        return {
            symbol: quote['01. symbol'],
            open: quote['02. open'],
            high: quote['03. high'],
            low: quote['04. low'],
            price: quote['05. price'],
            volume: quote['06. volume'],
            latestTradingDay: quote['07. latest trading day'],
            previousClose: quote['08. previous close'],
            change: quote['09. change'],
            changePercent: quote['10. change percent']
        };
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw error;
    }
};

const fetchCompanyOverview = async (symbol) => {
    try {
        const response = await fetch(`${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`);
        const data = await response.json();
        
        return {
            name: data.Name || symbol,
            description: data.Description || '',
            sector: data.Sector || 'N/A',
            industry: data.Industry || 'N/A'
        };
    } catch (error) {
        console.error('Error fetching company overview:', error);
        return { name: symbol, description: '', sector: 'N/A', industry: 'N/A' };
    }
};

const getStockLogo = (symbol) => {
    // Using a placeholder logo service for demonstration
    return `https://logo.clearbit.com/${symbol.toLowerCase()}.com`;
};

// Stock display functions
const displayStockData = (stockData, companyData) => {
    const stockCard = document.getElementById('stockData');
    const elements = {
        logo: document.getElementById('stockLogo'),
        name: document.getElementById('companyName'),
        symbol: document.getElementById('stockSymbolDisplay'),
        currentPrice: document.getElementById('currentPrice'),
        priceChange: document.getElementById('priceChange'),
        percentChange: document.getElementById('percentChange'),
        volume: document.getElementById('volume'),
        openPrice: document.getElementById('openPrice'),
        highPrice: document.getElementById('highPrice'),
        lowPrice: document.getElementById('lowPrice'),
        previousClose: document.getElementById('previousClose')
    };
    
    if (elements.logo) {
        elements.logo.src = getStockLogo(stockData.symbol);
        elements.logo.onerror = () => {
            elements.logo.src = 'https://via.placeholder.com/60x60/667eea/ffffff?text=' + stockData.symbol.charAt(0);
        };
    }
    
    if (elements.name) elements.name.textContent = companyData.name;
    if (elements.symbol) elements.symbol.textContent = stockData.symbol;
    if (elements.currentPrice) elements.currentPrice.textContent = formatCurrency(stockData.price);
    if (elements.volume) elements.volume.textContent = formatNumber(stockData.volume);
    if (elements.openPrice) elements.openPrice.textContent = formatCurrency(stockData.open);
    if (elements.highPrice) elements.highPrice.textContent = formatCurrency(stockData.high);
    if (elements.lowPrice) elements.lowPrice.textContent = formatCurrency(stockData.low);
    if (elements.previousClose) elements.previousClose.textContent = formatCurrency(stockData.previousClose);
    
    // Price change styling
    const change = parseFloat(stockData.change);
    if (elements.priceChange) {
        elements.priceChange.textContent = formatCurrency(change);
        elements.priceChange.className = `metric-value ${change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (elements.percentChange) {
        const percentValue = stockData.changePercent.replace('%', '');
        elements.percentChange.textContent = formatPercentage(percentValue);
        elements.percentChange.className = `metric-value ${change >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Setup favorite button
    const favoriteBtn = document.getElementById('addToFavorites');
    if (favoriteBtn) {
        const isFavorite = favorites.some(fav => fav.symbol === stockData.symbol);
        favoriteBtn.textContent = isFavorite ? '⭐ Remover dos Favoritos' : '⭐ Adicionar aos Favoritos';
        favoriteBtn.onclick = () => toggleFavorite(stockData, companyData);
    }
    
    if (stockCard) stockCard.classList.remove('hidden');
};

// Favorite functions
const toggleFavorite = (stockData, companyData) => {
    const existingIndex = favorites.findIndex(fav => fav.symbol === stockData.symbol);
    
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
        showError(`${stockData.symbol} removida dos favoritos!`);
    } else {
        favorites.push({
            symbol: stockData.symbol,
            name: companyData.name,
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
            addedAt: new Date().toISOString()
        });
        showError(`${stockData.symbol} adicionada aos favoritos!`);
    }
    
    localStorage.setItem('stockFavorites', JSON.stringify(favorites));
    
    // Update favorite button
    const favoriteBtn = document.getElementById('addToFavorites');
    if (favoriteBtn) {
        const isFavorite = favorites.some(fav => fav.symbol === stockData.symbol);
        favoriteBtn.textContent = isFavorite ? '⭐ Remover dos Favoritos' : '⭐ Adicionar aos Favoritos';
    }
    
    // Update favorites page if we're on it
    if (window.location.pathname.includes('favoritos.html')) {
        loadFavorites();
    }
};

const loadFavorites = async () => {
    const favoritesList = document.getElementById('favoritesList');
    const noFavorites = document.getElementById('noFavorites');
    
    if (favorites.length === 0) {
        if (noFavorites) noFavorites.style.display = 'block';
        if (favoritesList) favoritesList.innerHTML = '';
        updateFavoritesSummary();
        return;
    }
    
    if (noFavorites) noFavorites.style.display = 'none';
    showLoading('favoritesLoading');
    
    if (favoritesList) {
        favoritesList.innerHTML = '';
        
        for (const favorite of favorites) {
            try {
                const stockData = await fetchStockData(favorite.symbol);
                const favoriteCard = createFavoriteCard(stockData, favorite);
                favoritesList.appendChild(favoriteCard);
            } catch (error) {
                console.error(`Error loading favorite ${favorite.symbol}:`, error);
            }
        }
    }
    
    hideLoading('favoritesLoading');
    updateFavoritesSummary();
};

const createFavoriteCard = (stockData, favoriteInfo) => {
    const card = document.createElement('div');
    card.className = 'favorite-card';
    
    const change = parseFloat(stockData.change);
    const changeClass = change >= 0 ? 'positive' : 'negative';
    
    card.innerHTML = `
        <button class="remove-favorite" onclick="removeFavorite('${stockData.symbol}')">×</button>
        <div class="stock-header">
            <img src="${getStockLogo(stockData.symbol)}" alt="Logo" class="stock-logo" 
                 onerror="this.src='https://via.placeholder.com/60x60/667eea/ffffff?text=${stockData.symbol.charAt(0)}'">
            <div class="stock-info">
                <h4>${favoriteInfo.name}</h4>
                <span class="symbol">${stockData.symbol}</span>
            </div>
        </div>
        <div class="stock-metrics">
            <div class="metric">
                <span class="metric-label">Preço</span>
                <span class="metric-value price">${formatCurrency(stockData.price)}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Variação</span>
                <span class="metric-value ${changeClass}">${formatCurrency(change)}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Variação (%)</span>
                <span class="metric-value ${changeClass}">${formatPercentage(stockData.changePercent.replace('%', ''))}</span>
            </div>
        </div>
    `;
    
    return card;
};

const removeFavorite = (symbol) => {
    favorites = favorites.filter(fav => fav.symbol !== symbol);
    localStorage.setItem('stockFavorites', JSON.stringify(favorites));
    loadFavorites();
    showError(`${symbol} removida dos favoritos!`);
};

const updateFavoritesSummary = () => {
    const totalCount = document.getElementById('totalCount');
    const positiveCount = document.getElementById('positiveCount');
    const negativeCount = document.getElementById('negativeCount');
    
    if (totalCount) totalCount.textContent = favorites.length;
    
    // This would need real-time data to be accurate
    if (positiveCount) positiveCount.textContent = '0';
    if (negativeCount) negativeCount.textContent = '0';
};

// Comparison functions
const compareStocks = async () => {
    const stock1Input = document.getElementById('stock1');
    const stock2Input = document.getElementById('stock2');
    
    if (!stock1Input || !stock2Input) return;
    
    const symbol1 = stock1Input.value.trim().toUpperCase();
    const symbol2 = stock2Input.value.trim().toUpperCase();
    
    if (!symbol1 || !symbol2) {
        showError('Por favor, insira ambos os símbolos das ações');
        return;
    }
    
    if (symbol1 === symbol2) {
        showError('Por favor, insira símbolos diferentes');
        return;
    }
    
    showLoading('comparisonLoading');
    
    try {
        const [stockData1, stockData2, companyData1, companyData2] = await Promise.all([
            fetchStockData(symbol1),
            fetchStockData(symbol2),
            fetchCompanyOverview(symbol1),
            fetchCompanyOverview(symbol2)
        ]);
        
        displayComparison(stockData1, stockData2, companyData1, companyData2);
        saveComparisonHistory(stockData1, stockData2, companyData1, companyData2);
        
    } catch (error) {
        showError('Erro ao buscar dados para comparação: ' + error.message);
    } finally {
        hideLoading('comparisonLoading');
    }
};

const displayComparison = (stock1, stock2, company1, company2) => {
    const comparisonResults = document.getElementById('comparisonResults');
    const comparisonAnalysis = document.getElementById('comparisonAnalysis');
    
    // Update stock 1 data
    updateComparisonCard('1', stock1, company1);
    
    // Update stock 2 data
    updateComparisonCard('2', stock2, company2);
    
    // Show results
    if (comparisonResults) comparisonResults.classList.remove('hidden');
    
    // Analysis
    if (comparisonAnalysis) {
        const winner = determineWinner(stock1, stock2);
        const analysis = generateAnalysis(stock1, stock2, company1, company2, winner);
        
        const winnerElement = document.getElementById('winner');
        const analysisElement = document.getElementById('analysisText');
        
        if (winnerElement) {
            winnerElement.innerHTML = `🏆 ${winner.symbol} está com melhor performance hoje`;
        }
        
        if (analysisElement) {
            analysisElement.innerHTML = analysis;
        }
        
        comparisonAnalysis.classList.remove('hidden');
    }
};

const updateComparisonCard = (cardNumber, stockData, companyData) => {
    const elements = {
        logo: document.getElementById(`logo${cardNumber}`),
        name: document.getElementById(`name${cardNumber}`),
        symbol: document.getElementById(`symbol${cardNumber}`),
        price: document.getElementById(`price${cardNumber}`),
        change: document.getElementById(`change${cardNumber}`),
        volume: document.getElementById(`volume${cardNumber}`)
    };
    
    if (elements.logo) {
        elements.logo.src = getStockLogo(stockData.symbol);
        elements.logo.onerror = () => {
            elements.logo.src = 'https://via.placeholder.com/50x50/667eea/ffffff?text=' + stockData.symbol.charAt(0);
        };
    }
    
    if (elements.name) elements.name.textContent = companyData.name;
    if (elements.symbol) elements.symbol.textContent = stockData.symbol;
    if (elements.price) elements.price.textContent = formatCurrency(stockData.price);
    if (elements.volume) elements.volume.textContent = formatNumber(stockData.volume);
    
    if (elements.change) {
        const change = parseFloat(stockData.change);
        elements.change.textContent = formatCurrency(change);
        elements.change.className = `metric-value ${change >= 0 ? 'positive' : 'negative'}`;
    }
};

const determineWinner = (stock1, stock2) => {
    const change1 = parseFloat(stock1.change);
    const change2 = parseFloat(stock2.change);
    
    return change1 > change2 ? stock1 : stock2;
};

const generateAnalysis = (stock1, stock2, company1, company2, winner) => {
    const change1 = parseFloat(stock1.change);
    const change2 = parseFloat(stock2.change);
    const price1 = parseFloat(stock1.price);
    const price2 = parseFloat(stock2.price);
    
    let analysis = `<p><strong>${winner.symbol}</strong> está tendo um desempenho superior hoje `;
    analysis += `com uma variação de <strong>${formatCurrency(parseFloat(winner.change))}</strong>.</p>`;
    
    analysis += `<p><strong>${stock1.symbol}</strong> está cotada a ${formatCurrency(price1)} `;
    analysis += `enquanto <strong>${stock2.symbol}</strong> está a ${formatCurrency(price2)}.</p>`;
    
    if (Math.abs(change1) > Math.abs(change2)) {
        analysis += `<p><strong>${stock1.symbol}</strong> está mais volátil hoje com maior variação de preço.</p>`;
    } else {
        analysis += `<p><strong>${stock2.symbol}</strong> está mais volátil hoje com maior variação de preço.</p>`;
    }
    
    return analysis;
};

const saveComparisonHistory = (stock1, stock2, company1, company2) => {
    const comparison = {
        date: new Date().toISOString(),
        stock1: { symbol: stock1.symbol, name: company1.name, change: stock1.change },
        stock2: { symbol: stock2.symbol, name: company2.name, change: stock2.change },
        winner: determineWinner(stock1, stock2).symbol
    };
    
    comparisonHistory.unshift(comparison);
    if (comparisonHistory.length > 10) {
        comparisonHistory = comparisonHistory.slice(0, 10);
    }
    
    localStorage.setItem('comparisonHistory', JSON.stringify(comparisonHistory));
    loadComparisonHistory();
};

const loadComparisonHistory = () => {
    const historyElement = document.getElementById('analysisHistory');
    if (!historyElement) return;
    
    if (comparisonHistory.length === 0) {
        historyElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <p>Nenhuma comparação realizada ainda</p>
            </div>
        `;
        return;
    }
    
    historyElement.innerHTML = comparisonHistory.map(comparison => `
        <div class="history-item">
            <div class="symbols">${comparison.stock1.symbol} vs ${comparison.stock2.symbol}</div>
            <div class="winner">Vencedor: ${comparison.winner}</div>
            <div class="date">${new Date(comparison.date).toLocaleDateString('pt-BR')}</div>
        </div>
    `).join('');
};

// Popular stocks
const loadPopularStocks = async () => {
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'];
    const popularStocksContainer = document.getElementById('popularStocks');
    
    if (!popularStocksContainer) return;
    
    popularStocksContainer.innerHTML = '';
    
    for (const symbol of popularSymbols.slice(0, 6)) {
        try {
            const stockData = await fetchStockData(symbol);
            const companyData = await fetchCompanyOverview(symbol);
            
            const card = createPopularStockCard(stockData, companyData);
            popularStocksContainer.appendChild(card);
        } catch (error) {
            console.error(`Error loading popular stock ${symbol}:`, error);
        }
    }
};

const createPopularStockCard = (stockData, companyData) => {
    const card = document.createElement('div');
    card.className = 'popular-stock-card';
    
    const change = parseFloat(stockData.change);
    const changeClass = change >= 0 ? 'positive' : 'negative';
    
    card.innerHTML = `
        <img src="${getStockLogo(stockData.symbol)}" alt="Logo" class="stock-logo" 
             onerror="this.src='https://via.placeholder.com/60x60/667eea/ffffff?text=${stockData.symbol.charAt(0)}'">
        <h4>${companyData.name}</h4>
        <span class="symbol">${stockData.symbol}</span>
        <div class="price">${formatCurrency(stockData.price)}</div>
        <div class="${changeClass}">${formatCurrency(change)} (${formatPercentage(stockData.changePercent.replace('%', ''))})</div>
    `;
    
    card.onclick = () => {
        const symbolInput = document.getElementById('stockSymbol');
        if (symbolInput) {
            symbolInput.value = stockData.symbol;
            searchStock();
        }
    };
    
    return card;
};

// Search functionality
const searchStock = async () => {
    const symbolInput = document.getElementById('stockSymbol');
    if (!symbolInput) return;
    
    const symbol = symbolInput.value.trim().toUpperCase();
    
    if (!symbol) {
        showError('Por favor, digite um símbolo de ação');
        return;
    }
    
    const stockCard = document.getElementById('stockData');
    if (stockCard) stockCard.classList.add('hidden');
    
    showLoading('loadingSpinner');
    
    try {
        const [stockData, companyData] = await Promise.all([
            fetchStockData(symbol),
            fetchCompanyOverview(symbol)
        ]);
        
        displayStockData(stockData, companyData);
    } catch (error) {
        showError('Erro ao buscar dados da ação: ' + error.message);
    } finally {
        hideLoading('loadingSpinner');
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Main page
    const searchBtn = document.getElementById('searchBtn');
    const stockSymbolInput = document.getElementById('stockSymbol');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchStock);
    }
    
    if (stockSymbolInput) {
        stockSymbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchStock();
            }
        });
        
        // Load popular stocks on main page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            setTimeout(loadPopularStocks, 1000); // Delay to avoid API rate limits
        }
    }
    
    // Favorites page
    if (window.location.pathname.includes('favoritos.html')) {
        loadFavorites();
        
        const refreshAllBtn = document.getElementById('refreshAll');
        const clearAllBtn = document.getElementById('clearAll');
        const addFavoriteBtn = document.getElementById('addFavoriteBtn');
        
        if (refreshAllBtn) {
            refreshAllBtn.addEventListener('click', loadFavorites);
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja limpar todos os favoritos?')) {
                    favorites = [];
                    localStorage.setItem('stockFavorites', JSON.stringify(favorites));
                    loadFavorites();
                    showError('Todos os favoritos foram removidos!');
                }
            });
        }
        
        if (addFavoriteBtn) {
            addFavoriteBtn.addEventListener('click', async () => {
                const symbolInput = document.getElementById('newFavoriteSymbol');
                if (!symbolInput) return;
                
                const symbol = symbolInput.value.trim().toUpperCase();
                if (!symbol) {
                    showError('Digite um símbolo de ação');
                    return;
                }
                
                if (favorites.some(fav => fav.symbol === symbol)) {
                    showError('Esta ação já está nos favoritos');
                    return;
                }
                
                try {
                    const [stockData, companyData] = await Promise.all([
                        fetchStockData(symbol),
                        fetchCompanyOverview(symbol)
                    ]);
                    
                    toggleFavorite(stockData, companyData);
                    symbolInput.value = '';
                } catch (error) {
                    showError('Erro ao adicionar favorito: ' + error.message);
                }
            });
        }
    }
    
    // Analysis page
    if (window.location.pathname.includes('racas.html')) {
        loadComparisonHistory();
        loadMarketOverview();
        
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', compareStocks);
        }
        
        const stock1Input = document.getElementById('stock1');
        const stock2Input = document.getElementById('stock2');
        
        if (stock1Input) {
            stock1Input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    compareStocks();
                }
            });
        }
        
        if (stock2Input) {
            stock2Input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    compareStocks();
                }
            });
        }
    }
});

// Market overview function
const loadMarketOverview = async () => {
    const marketData = document.getElementById('marketData');
    if (!marketData) return;
    
    const majorIndices = [
        { symbol: 'SPY', name: 'S&P 500' },
        { symbol: 'QQQ', name: 'NASDAQ' },
        { symbol: 'DIA', name: 'Dow Jones' },
        { symbol: 'VTI', name: 'Total Market' }
    ];
    
    marketData.innerHTML = '';
    
    for (const index of majorIndices) {
        try {
            const stockData = await fetchStockData(index.symbol);
            const card = createMarketIndicatorCard(stockData, index.name);
            marketData.appendChild(card);
        } catch (error) {
            console.error(`Error loading market data for ${index.symbol}:`, error);
        }
    }
};

const createMarketIndicatorCard = (stockData, indexName) => {
    const card = document.createElement('div');
    card.className = 'indicator-card';
    
    const change = parseFloat(stockData.change);
    const changeClass = change >= 0 ? 'positive' : 'negative';
    
    card.innerHTML = `
        <h4>${indexName}</h4>
        <div class="value">${formatCurrency(stockData.price)}</div>
        <div class="${changeClass}">
            ${formatCurrency(change)} (${formatPercentage(stockData.changePercent.replace('%', ''))})
        </div>
    `;
    
    return card;
};

// Demo data fallback for when API is not available
const getDemoStockData = (symbol) => {
    const demoData = {
        'AAPL': {
            symbol: 'AAPL',
            open: '150.00',
            high: '155.00',
            low: '149.50',
            price: '152.30',
            volume: '50000000',
            latestTradingDay: new Date().toISOString().split('T')[0],
            previousClose: '151.00',
            change: '1.30',
            changePercent: '0.86%'
        },
        'MSFT': {
            symbol: 'MSFT',
            open: '300.00',
            high: '305.50',
            low: '299.00',
            price: '304.20',
            volume: '25000000',
            latestTradingDay: new Date().toISOString().split('T')[0],
            previousClose: '301.50',
            change: '2.70',
            changePercent: '0.90%'
        },
        'GOOGL': {
            symbol: 'GOOGL',
            open: '2800.00',
            high: '2825.00',
            low: '2795.00',
            price: '2810.50',
            volume: '1500000',
            latestTradingDay: new Date().toISOString().split('T')[0],
            previousClose: '2805.00',
            change: '5.50',
            changePercent: '0.20%'
        }
    };
    
    return demoData[symbol] || demoData['AAPL'];
};

const getDemoCompanyData = (symbol) => {
    const demoData = {
        'AAPL': {
            name: 'Apple Inc.',
            description: 'Technology company',
            sector: 'Technology',
            industry: 'Consumer Electronics'
        },
        'MSFT': {
            name: 'Microsoft Corporation',
            description: 'Technology company',
            sector: 'Technology',
            industry: 'Software'
        },
        'GOOGL': {
            name: 'Alphabet Inc.',
            description: 'Technology company',
            sector: 'Technology',
            industry: 'Internet Services'
        }
    };
    
    return demoData[symbol] || { name: symbol, description: 'Company', sector: 'N/A', industry: 'N/A' };
};

// Error handling for API limits - fallback to demo data
const fetchStockDataWithFallback = async (symbol) => {
    try {
        return await fetchStockData(symbol);
    } catch (error) {
        console.warn(`API error for ${symbol}, using demo data:`, error.message);
        return getDemoStockData(symbol);
    }
};

const fetchCompanyOverviewWithFallback = async (symbol) => {
    try {
        return await fetchCompanyOverview(symbol);
    } catch (error) {
        console.warn(`API error for company ${symbol}, using demo data:`, error.message);
        return getDemoCompanyData(symbol);
    }
};

// Export functions for global access
window.searchStock = searchStock;
window.compareStocks = compareStocks;
window.toggleFavorite = toggleFavorite;
window.removeFavorite = removeFavorite;