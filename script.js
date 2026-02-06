// Monexa - JavaScript Principal
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Configuration
const CONFIG = {
    usdToFcfa: 600,
    minDeposit: 5,
    maxDeposit: 500,
    tradingFee: 0.001, // 0.1%
    withdrawalFee: 0.015, // 1.5%
    refreshInterval: 10000 // 10 secondes
};

// Données initiales
let marketData = [];
let userLoggedIn = false;
let currentLanguage = 'fr';
let selectedCrypto = 'BTC';

// Données de marché (simulées - à remplacer par API)
const initialMarketData = [
    { symbol: 'BTC', name: 'Bitcoin', price: 81519.41, change24h: -1.49, volume: '32.8B', marketCap: '1.6T', color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', price: 2534.05, change24h: -6.72, volume: '14.2B', marketCap: '304.5B', color: '#627EEA' },
    { symbol: 'BNB', name: 'BNB', price: 803.46, change24h: -5.45, volume: '2.4B', marketCap: '120.5B', color: '#F0B90B' },
    { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.01, volume: '45.2B', marketCap: '95.4B', color: '#26A17B' },
    { symbol: 'SOL', name: 'Solana', price: 108.98, change24h: -6.51, volume: '3.8B', marketCap: '47.2B', color: '#00FFA3' },
    { symbol: 'XRP', name: 'Ripple', price: 1.6405, change24h: -6.42, volume: '2.1B', marketCap: '89.4B', color: '#00AAE4' }
];

// Initialisation de l'application
function initializeApp() {
    loadMarketData();
    setupEventListeners();
    updateMarketTable();
    startPriceUpdates();
    updateLastUpdateTime();
    
    // Vérifier si l'utilisateur est déjà connecté
    checkLoginStatus();
    
    // Initialiser les conversions
    updateConversion();
}

// Charger les données du marché
function loadMarketData() {
    marketData = [...initialMarketData];
}

// Mettre en place les écouteurs d'événements
function setupEventListeners() {
    // Navigation mobile
    document.querySelector('.menu-toggle').addEventListener('click', toggleMenu);
    
    // Filtres du marché
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMarket(this.dataset.filter);
        });
    });
    
    // Onglets de trading
    document.querySelectorAll('.trading-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.trading-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            switchTradingTab(this.dataset.tab);
        });
    });
    
    // Boutons de pourcentage
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const percent = parseFloat(this.dataset.percent) / 100;
            const amountInput = document.getElementById('amount');
            const currentAmount = parseFloat(amountInput.value) || 0;
            amountInput.value = (currentAmount * percent).toFixed(2);
            updateConversion();
        });
    });
    
    // Fermeture des modals en cliquant à l'extérieur
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Formulaires
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Mise à jour en temps réel des conversions
    document.getElementById('amount')?.addEventListener('input', updateConversion);
    document.getElementById('fromCurrency')?.addEventListener('change', updateConversion);
    document.getElementById('toCurrency')?.addEventListener('change', updateConversion);
}

// Mettre à jour le tableau du marché
function updateMarketTable() {
    const tableBody = document.getElementById('marketTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    marketData.forEach(crypto => {
        const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = crypto.change24h >= 0 ? '+' : '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; background-color: ${crypto.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${crypto.symbol.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 600;">${crypto.name}</div>
                        <div style="color: var(--gray-light); font-size: 0.9rem;">${crypto.symbol}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-weight: 600;">$${formatNumber(crypto.price)}</div>
                <div style="color: var(--gray-light); font-size: 0.9rem;">${formatNumber(crypto.price * CONFIG.usdToFcfa, 0)} FCFA</div>
            </td>
            <td>
                <span class="${changeClass}" style="padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                    ${changeSign}${crypto.change24h.toFixed(2)}%
                </span>
            </td>
            <td>$${crypto.volume}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="tradeCrypto('${crypto.symbol}')">
                    <i class="fas fa-exchange-alt"></i> Trade
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Démarrer les mises à jour de prix
function startPriceUpdates() {
    setInterval(() => {
        updatePrices();
        updateLastUpdateTime();
    }, CONFIG.refreshInterval);
}

// Mettre à jour les prix (simulation)
function updatePrices() {
    marketData.forEach(crypto => {
        // Variation aléatoire entre -0.2% et +0.2%
        const variation = (Math.random() - 0.5) * 0.004;
        crypto.price = crypto.price * (1 + variation);
        crypto.change24h = crypto.change24h + variation;
        
        // Limiter les variations
        crypto.change24h = Math.max(Math.min(crypto.change24h, 20), -20);
    });
    
    // Mettre à jour l'affichage
    updateMarketDisplay();
}

// Mettre à jour l'affichage du marché
function updateMarketDisplay() {
    const tableRows = document.querySelectorAll('#marketTable tr');
    
    marketData.forEach((crypto, index) => {
        if (tableRows[index]) {
            const cells = tableRows[index].querySelectorAll('td');
            if (cells.length >= 3) {
                const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
                const changeSign = crypto.change24h >= 0 ? '+' : '';
                
                // Mettre à jour le prix
                cells[1].innerHTML = `
                    <div style="font-weight: 600;">$${formatNumber(crypto.price)}</div>
                    <div style="color: var(--gray-light); font-size: 0.9rem;">${formatNumber(crypto.price * CONFIG.usdToFcfa, 0)} FCFA</div>
                `;
                
                // Mettre à jour le changement
                cells[2].innerHTML = `
                    <span class="${changeClass}" style="padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                        ${changeSign}${crypto.change24h.toFixed(2)}%
                    </span>
                `;
            }
        }
    });
    
    // Mettre à jour le prix BTC dans le hero
    const btc = marketData.find(c => c.symbol === 'BTC');
    if (btc) {
        document.getElementById('btcLivePrice').textContent = formatNumber(btc.price);
        document.getElementById('btcChange').textContent = `${btc.change24h >= 0 ? '+' : ''}${btc.change24h.toFixed(2)}%`;
        document.getElementById('btcChange').className = btc.change24h >= 0 ? 'change positive' : 'change negative';
    }
}

// Mettre à jour l'heure de dernière mise à jour
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const element = document.getElementById('lastUpdateTime');
    if (element) {
        element.textContent = timeString;
    }
}

// Rafraîchir le marché manuellement
function refreshMarket() {
    showLoading();
    
    // Simuler le chargement
    setTimeout(() => {
        updatePrices();
        hideLoading();
        showToast('Marché rafraîchi avec succès', 'success');
    }, 1000);
}

// Filtrer le marché
function filterMarket(filter) {
    const rows = document.querySelectorAll('#marketTable tr');
    
    rows.forEach(row => {
        let show = true;
        
        if (filter === 'gainers') {
            const changeElement = row.querySelector('.positive');
            show = !!changeElement;
        } else if (filter === 'losers') {
            const changeElement = row.querySelector('.negative');
            show = !!changeElement;
        } else if (filter === 'favorites') {
            // Ici, vous pourriez vérifier les favoris de l'utilisateur
            const symbol = row.querySelector('td:first-child div div:last-child')?.textContent;
            show = ['BTC', 'ETH', 'BNB'].includes(symbol);
        }
        
        row.style.display = show ? '' : 'none';
    });
}

// Changer d'onglet de trading
function switchTradingTab(tab) {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    
    switch(tab) {
        case 'buy':
            fromCurrency.value = 'FCFA';
            toCurrency.value = 'BTC';
            break;
        case 'sell':
            fromCurrency.value = 'BTC';
            toCurrency.value = 'FCFA';
            break;
        case 'convert':
            fromCurrency.value = 'BTC';
            toCurrency.value = 'ETH';
            break;
        case 'p2p':
            fromCurrency.value = 'FCFA';
            toCurrency.value = 'USDT';
            break;
    }
    
    updateConversion();
}

// Mettre à jour la conversion
function updateConversion() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    
    // Convertir en USD d'abord
    let amountUSD = amount;
    
    if (fromCurrency === 'FCFA') {
        amountUSD = amount / CONFIG.usdToFcfa;
    } else if (fromCurrency === 'BTC') {
        const btcPrice = marketData.find(c => c.symbol === 'BTC')?.price || 1;
        amountUSD = amount * btcPrice;
    } else if (fromCurrency === 'ETH') {
        const ethPrice = marketData.find(c => c.symbol === 'ETH')?.price || 1;
        amountUSD = amount * ethPrice;
    } else if (fromCurrency === 'USDT') {
        amountUSD = amount; // 1 USDT = 1 USD
    } else if (fromCurrency === 'BNB') {
        const bnbPrice = marketData.find(c => c.symbol === 'BNB')?.price || 1;
        amountUSD = amount * bnbPrice;
    }
    
    // Valider les limites
    if (amountUSD < CONFIG.minDeposit) {
        document.getElementById('amount').value = CONFIG.minDeposit;
        updateConversion();
        return;
    }
    
    if (amountUSD > CONFIG.maxDeposit) {
        document.getElementById('amount').value = CONFIG.maxDeposit;
        updateConversion();
        return;
    }
    
    // Convertir vers la devise de destination
    let receiveAmount = amountUSD;
    
    if (toCurrency === 'FCFA') {
        receiveAmount = amountUSD * CONFIG.usdToFcfa;
    } else if (toCurrency === 'BTC') {
        const btcPrice = marketData.find(c => c.symbol === 'BTC')?.price || 1;
        receiveAmount = amountUSD / btcPrice;
    } else if (toCurrency === 'ETH') {
        const ethPrice = marketData.find(c => c.symbol === 'ETH')?.price || 1;
        receiveAmount = amountUSD / ethPrice;
    } else if (toCurrency === 'USDT') {
        receiveAmount = amountUSD; // 1 USD = 1 USDT
    } else if (toCurrency === 'BNB') {
        const bnbPrice = marketData.find(c => c.symbol === 'BNB')?.price || 1;
        receiveAmount = amountUSD / bnbPrice;
    }
    
    // Appliquer les frais
    const fee = receiveAmount * CONFIG.tradingFee;
    const total = receiveAmount - fee;
    
    // Mettre à jour l'affichage
    const rate = total / amount;
    
    document.getElementById('conversionRate').textContent = 
        `1 ${fromCurrency} = ${formatNumber(rate, 8)} ${toCurrency}`;
    
    document.getElementById('conversionFee').textContent = 
        `${(CONFIG.tradingFee * 100).toFixed(2)}% (${formatNumber(fee, 8)} ${toCurrency})`;
    
    document.getElementById('conversionTotal').textContent = 
        `${formatNumber(total, 8)} ${toCurrency}`;
}

// Exécuter un trade
function executeTrade() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = document.getElementById('amount').value;
    const total = document.getElementById('conversionTotal').textContent;
    
    if (!userLoggedIn) {
        showToast('Veuillez vous connecter pour effectuer un trade', 'warning');
        openModal('loginModal');
        return;
    }
    
    const confirmMessage = `Confirmer l'échange:\n${amount} ${fromCurrency} → ${total}\n\nAppliquer les frais de 0.1%`;
    
    if (confirm(confirmMessage)) {
        showLoading();
        
        // Simuler le traitement
        setTimeout(() => {
            hideLoading();
            showToast(`Échange réussi! ${total} ont été crédités sur votre compte.`, 'success');
            
            // Réinitialiser le formulaire
            document.getElementById('amount').value = '100';
            updateConversion();
        }, 2000);
    }
}

// Acheter du BTC depuis le hero
function buyCrypto() {
    if (!userLoggedIn) {
        showToast('Veuillez vous connecter pour acheter', 'warning');
        openModal('loginModal');
        return;
    }
    
    const amount = document.getElementById('buyAmount').value;
    const receive = document.getElementById('receiveCrypto').value;
    
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast(`Achat réussi! ${receive} BTC ont été crédités sur votre compte.`, 'success');
    }, 1500);
}

// Trader une crypto spécifique
function tradeCrypto(symbol) {
    selectedCrypto = symbol;
    const crypto = marketData.find(c => c.symbol === symbol);
    
    if (crypto) {
        // Mettre à jour le formulaire
        document.getElementById('toCurrency').value = symbol;
        updateConversion();
        
        // Scroll vers la section trading
        document.getElementById('echanger').scrollIntoView({ behavior: 'smooth' });
        
        showToast(`Prêt à trader ${symbol}!`, 'success');
    }
}

// Gérer l'inscription
function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        showToast('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (password.length < 8) {
        showToast('Le mot de passe doit faire au moins 8 caractères', 'error');
        return;
    }
    
    showLoading();
    
    // Simuler l'inscription
    setTimeout(() => {
        hideLoading();
        closeModal('signupModal');
        showToast('Compte créé avec succès! Vérifiez votre email.', 'success');
        userLoggedIn = true;
        updateLoginStatus();
    }, 2000);
}

// Gérer la connexion
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    showLoading();
    
    // Simuler la connexion
    setTimeout(() => {
        hideLoading();
        closeModal('loginModal');
        showToast('Connexion réussie!', 'success');
        userLoggedIn = true;
        updateLoginStatus();
    }, 1500);
}

// Vérifier le statut de connexion
function checkLoginStatus() {
    // Dans une vraie application, vérifier le token/cookie
    const isLoggedIn = localStorage.getItem('monexa_logged_in') === 'true';
    userLoggedIn = isLoggedIn;
    updateLoginStatus();
}

// Mettre à jour le statut de connexion
function updateLoginStatus() {
    const loginBtn = document.querySelector('#loginBtn');
    const headerButtons = document.querySelector('.header-buttons');
    
    if (userLoggedIn) {
        // Sauvegarder dans localStorage
        localStorage.setItem('monexa_logged_in', 'true');
        
        // Mettre à jour l'interface
        if (loginBtn && headerButtons) {
            headerButtons.innerHTML = `
                <div class="user-menu">
                    <button class="btn btn-outline btn-sm" onclick="openUserMenu()">
                        <i class="fas fa-user-circle"></i> Mon Compte
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
                <div class="language-selector">
                    <i class="fas fa-globe"></i>
                    <select onchange="changeLanguage(this.value)">
                        <option value="fr" selected>FR</option>
                        <option value="en">EN</option>
                    </select>
                </div>
            `;
        }
    } else {
        localStorage.removeItem('monexa_logged_in');
    }
}

// Déconnexion
function logout() {
    userLoggedIn = false;
    updateLoginStatus();
    showToast('Déconnexion réussie', 'success');
    
    // Recharger les boutons d'en-tête
    const headerButtons = document.querySelector('.header-buttons');
    if (headerButtons) {
        headerButtons.innerHTML = `
            <button class="btn btn-outline btn-sm" onclick="openModal('loginModal')">
                <i class="fas fa-sign-in-alt"></i> Connexion
            </button>
            <button class="btn btn-primary btn-sm" onclick="openModal('signupModal')">
                <i class="fas fa-user-plus"></i> S'inscrire
            </button>
            <div class="language-selector">
                <i class="fas fa-globe"></i>
                <select onchange="changeLanguage(this.value)">
                    <option value="fr" selected>FR</option>
                    <option value="en">EN</option>
                </select>
            </div>
        `;
    }
}

// Ouvrir le menu utilisateur
function openUserMenu() {
    // Ici, vous pourriez ouvrir un menu déroulant ou une modal
    showToast('Menu utilisateur (à implémenter)', 'info');
}

// Changer la langue
function changeLanguage(lang) {
    currentLanguage = lang;
    
    if (lang === 'en') {
        // Traductions en anglais
        document.querySelector('.logo span').textContent = 'MONEXA';
        document.querySelector('title').textContent = 'Monexa - Crypto Platform Niger';
        document.querySelector('meta[name="description"]').content = 'Monexa - Exchange Bitcoin, Ethereum, USDT with Airtel Money and Moov Money in Niger. Simple and secure crypto platform.';
        
        // Mettre à jour les textes de l'interface
        const translations = {
            '#navMenu a[href="#accueil"]': 'Home',
            '#navMenu a[href="#marche"]': 'Market',
            '#navMenu a[href="#echanger"]': 'Exchange',
            '#navMenu a[href="#paiements"]': 'Payments',
            '#navMenu a[href="#aide"]': 'Help',
            '.hero-text h1': 'Exchange Cryptos <span class="highlight">Easily</span> in Niger',
            '.hero-subtitle': 'The first crypto platform adapted to the Nigerian market. Buy, sell and exchange Bitcoin, Ethereum, USDT with Airtel Money and Moov Money.'
        };
        
        Object.entries(translations).forEach(([selector, text]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = text;
            }
        });
        
        showToast('Language changed to English', 'success');
    } else {
        // Retour en français
        document.querySelector('.logo span').textContent = 'MONEXA';
        document.querySelector('title').textContent = 'Monexa - Plateforme Crypto Niger';
        document.querySelector('meta[name="description"]').content = 'Monexa - Échangez Bitcoin, Ethereum, USDT avec Airtel Money et Moov Money au Niger. Plateforme crypto simple et sécurisée.';
        
        showToast('Langue changée en français', 'success');
    }
}

// S'abonner à la newsletter
function subscribeNewsletter() {
    const email = document.getElementById('newsletterEmail').value;
    
    if (!email || !email.includes('@')) {
        showToast('Veuillez entrer une adresse email valide', 'error');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        document.getElementById('newsletterEmail').value = '';
        showToast('Merci pour votre inscription à la newsletter!', 'success');
    }, 1000);
}

// Basculer le menu mobile
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('show');
}

// Faire défiler vers une section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Ouvrir une modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Fermer une modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Afficher le loading
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.add('active');
    }
}

// Cacher le loading
function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

// Afficher une notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        
        // Mettre à jour l'icône
        const icon = toast.querySelector('i');
        if (icon) {
            icon.className = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            }[type] || 'fas fa-check-circle';
        }
        
        // Masquer automatiquement après 5 secondes
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }
}

// Basculer FAQ
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    element.classList.toggle('active');
    answer.classList.toggle('show');
}

// Formater un nombre
function formatNumber(num, decimals = 2) {
    if (num >= 1000) {
        return num.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: decimals 
        });
    } else {
        return num.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 8 
        });
    }
}

// Classes CSS pour les couleurs
const style = document.createElement('style');
style.textContent = `
    .positive { color: var(--success); }
    .negative { color: var(--danger); }
`;
document.head.appendChild(style);

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker enregistré avec succès:', registration);
            })
            .catch(error => {
                console.log('Échec d\'enregistrement du Service Worker:', error);
            });
    });
}