document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Scroll Effect & Mobile Menu ---
    const nav = document.querySelector('.glass-nav');
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    });

    // --- Network Fingerprint ---
    const ipEl = document.getElementById('client-ip');
    const browserEl = document.getElementById('client-browser');
    const osEl = document.getElementById('client-os');

    async function detectPublicIp() {
        const providers = [
            {
                url: 'https://api.ipify.org?format=json',
                extract: (data) => data && data.ip
            },
            {
                url: 'https://api64.ipify.org?format=json',
                extract: (data) => data && data.ip
            },
            {
                url: 'https://ifconfig.co/json',
                extract: (data) => data && data.ip
            }
        ];

        for (const provider of providers) {
            try {
                const response = await fetch(provider.url, {
                    headers: { Accept: 'application/json' }
                });

                if (!response.ok) {
                    continue;
                }

                const payload = await response.json();
                const ip = provider.extract(payload);

                if (ip && typeof ip === 'string') {
                    return ip;
                }
            } catch (error) {
                // Try next provider.
            }
        }

        return 'Unavailable';
    }

    function detectOS(ua) {
        if (/Android/i.test(ua)) return 'Android';
        if (/(iPhone|iPad|iPod)/i.test(ua)) return 'iOS';
        if (/Windows NT/i.test(ua)) return 'Windows';
        if (/(Macintosh|Mac OS X)/i.test(ua)) return 'MacOS';
        if (/(Linux|X11|CrOS)/i.test(ua)) return 'Linux';
        return 'Linux';
    }

    function detectBrowser(ua, detectedOS) {
        if (/Edg(A|iOS)?\//i.test(ua)) return 'Edge';
        if (/Brave\//i.test(ua) || /\bBrave\b/i.test(ua)) return 'Brave';
        if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) return 'Firefox';
        if (/Chrome\//i.test(ua) || /CriOS\//i.test(ua)) return 'Chrome';
        if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return 'Safari';

        // Keep output constrained to the requested browser set.
        return detectedOS === 'iOS' || detectedOS === 'MacOS' ? 'Safari' : 'Chrome';
    }

    const ua = navigator.userAgent || '';
    const detectedOS = detectOS(ua);
    const detectedBrowser = detectBrowser(ua, detectedOS);

    if (browserEl) {
        browserEl.textContent = detectedBrowser;
        browserEl.title = detectedBrowser;
    }
    if (osEl) osEl.textContent = detectedOS;
    if (ipEl) {
        detectPublicIp().then((ip) => {
            ipEl.textContent = ip;
        });
    }

    // --- Demo Networks ---
    document.getElementById('demo-coffee').addEventListener('click', () => {
        document.getElementById('network-type').value = 'public';
        document.getElementById('encryption-type').value = 'none';
        document.getElementById('password-strength').value = 'none';
        window.scrollTo({ top: document.getElementById('analyzer').offsetTop, behavior: 'smooth' });
    });
    document.getElementById('demo-airport').addEventListener('click', () => {
        document.getElementById('network-type').value = 'airport';
        document.getElementById('encryption-type').value = 'none';
        document.getElementById('password-strength').value = 'none';
        window.scrollTo({ top: document.getElementById('analyzer').offsetTop, behavior: 'smooth' });
    });
    document.getElementById('demo-home').addEventListener('click', () => {
        document.getElementById('network-type').value = 'home';
        document.getElementById('encryption-type').value = 'wpa3';
        document.getElementById('password-strength').value = 'strong';
        window.scrollTo({ top: document.getElementById('analyzer').offsetTop, behavior: 'smooth' });
    });

    // --- Interactive Analyzer Logic ---
    const form = document.getElementById('security-form');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    const resultsDashboard = document.getElementById('results-dashboard');
    const circularProgress = document.querySelector('.circular-progress');
    const progressValue = document.querySelector('.value-container');
    const riskLevelText = document.getElementById('risk-level-text');
    const riskDescription = document.getElementById('risk-description');
    const vulnItems = document.getElementById('vuln-items');
    const overallStatus = document.getElementById('overall-status');
    const actionPlan = document.getElementById('action-plan');
    const suggestionItems = document.getElementById('suggestion-items');

    const metricEnc = document.getElementById('metric-enc');
    const metricPass = document.getElementById('metric-pass');
    const metricRisk = document.getElementById('metric-risk');
    const trackEnc = document.getElementById('track-enc');
    const trackPass = document.getElementById('track-pass');
    const trackRisk = document.getElementById('track-risk');
    const dashboardMetrics = document.getElementById('dashboard-metrics');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const network = document.getElementById('network-type').value;
        const encryption = document.getElementById('encryption-type').value;
        const password = document.getElementById('password-strength').value;

        // UI Loading State
        btnText.textContent = 'Analyzing network security...';
        loader.classList.remove('hidden');
        resultsDashboard.classList.add('hidden'); // keep it hidden while loading

        // Reset Meter
        circularProgress.style.background = `conic-gradient(#333 0deg, rgba(255,255,255,0.05) 0deg)`;
        progressValue.textContent = '0%';
        overallStatus.textContent = "Analyzing...";
        overallStatus.style.background = "rgba(255,255,255,0.1)";
        overallStatus.style.color = "white";

        let loadSteps = ['Scanning encryption...', 'Detecting vulnerabilities...', 'Compiling report...'];
        let step = 0;
        let loadInterval = setInterval(() => {
            if (step < loadSteps.length) {
                btnText.textContent = loadSteps[step];
                step++;
            }
        }, 800);

        // Simulate analysis calculation delay
        setTimeout(() => {
            clearInterval(loadInterval);
            resultsDashboard.classList.remove('hidden');
            resultsDashboard.style.opacity = '1';
            resultsDashboard.style.filter = 'grayscale(0)';
            resultsDashboard.style.transform = 'scale(1)';
            calculateRisk(network, encryption, password);
            btnText.textContent = 'Re-Analyze Network';
            loader.classList.add('hidden');
            if (dashboardMetrics) dashboardMetrics.classList.remove('hidden');
        }, 3200);
    });

    function calculateRisk(network, encryption, password) {
        let riskScore = 0; // 0 = Safe, 100 = Critical
        let notes = [];
        let suggestions = [];
        let encScore = 0, passScore = 0, attackExposure = 0;

        // Evaluate Network Type
        if (network === 'public') {
            riskScore += 30; // 30 public
            attackExposure += 8;
            notes.push({ text: "Public Wi-Fi detected. High susceptibility to sniffing.", type: "danger" });
            suggestions.push({ text: "Enable a VPN immediately.", type: "critical" });
        } else if (network === 'airport') {
            riskScore += 25; // 25 coffee shop/airport
            attackExposure += 7;
            notes.push({ text: "Shared public network. Medium physical medium risk.", type: "warning" });
        } else if (network === 'home') {
            riskScore += 0;
            attackExposure += 2;
        } else if (network === 'corporate') {
            riskScore += 0;
            attackExposure += 1;
        }

        // Evaluate Encryption
        if (encryption === 'none') {
            riskScore += 40; // 40 no encryption
            encScore = 0;
            attackExposure += 2;
            notes.push({ text: "NO ENCRYPTION active. All traffic is sent in plaintext and can be sniffed.", type: "danger" });
        } else if (encryption === 'wep') {
            riskScore += 25; // 25 WEP
            encScore = 3;
            notes.push({ text: "WEP encryption is obsolete and can be cracked in minutes.", type: "danger" });
        } else if (encryption === 'wpa2') {
            riskScore += 5;
            encScore = 7;
        } else if (encryption === 'wpa3') {
            riskScore += 0;
            encScore = 10;
        }

        // Evaluate Password
        if (password === 'none') {
            riskScore += 20;
            passScore = 0;
            notes.push({ text: "Open network. Anyone can connect, allowing rogue devices on the subnet.", type: "danger" });
        } else if (password === 'weak') {
            riskScore += 15; // 15 weak password
            passScore = 3;
            notes.push({ text: "Weak authentication. Vulnerable to dictionary/brute-force attacks.", type: "warning" });
        } else if (password === 'medium') {
            riskScore += 5;
            passScore = 6;
        } else if (password === 'strong') {
            riskScore -= 10; // -10 strong password
            passScore = 10;
        }

        // Cap score
        if (riskScore > 100) riskScore = 100;
        if (riskScore < 0) riskScore = 0;

        // Determine Theme based on score rules
        // 0–30 → Secure, 31–60 → Moderate Risk, 61–100 → High Risk
        let colorTheme = '#10b981'; // Green
        let riskLabel = 'Secure';
        let desc = 'Minimal Risk. Your connection parameters indicate a secure environment.';

        circularProgress.parentElement.classList.remove('pulse-critical');

        if (riskScore > 60) {
            colorTheme = '#ef4444'; // Red
            riskLabel = 'High Risk';
            desc = 'DANGER. Your network environment is highly vulnerable. Disconnect immediately or use a VPN.';
            circularProgress.parentElement.classList.add('pulse-critical');
        } else if (riskScore > 30) {
            colorTheme = '#f59e0b'; // Yellow
            riskLabel = 'Moderate Risk';
            desc = 'Caution advised. Refrain from transmitting sensitive data (banking, logins) without a VPN.';
        }

        // Update Dashboard Metrics UI
        metricEnc.textContent = `${encScore}/10`;
        trackEnc.style.setProperty('--percent', `${encScore * 10}%`);
        trackEnc.style.setProperty('--color', encScore > 6 ? 'var(--success)' : encScore > 3 ? 'var(--warning)' : 'var(--danger)');

        metricPass.textContent = `${passScore}/10`;
        trackPass.style.setProperty('--percent', `${passScore * 10}%`);
        trackPass.style.setProperty('--color', passScore > 6 ? 'var(--success)' : passScore > 3 ? 'var(--warning)' : 'var(--danger)');

        let attackRiskScore = Math.min(10, attackExposure);
        metricRisk.textContent = `${attackRiskScore}/10`;
        trackRisk.style.setProperty('--percent', `${attackRiskScore * 10}%`);
        trackRisk.style.setProperty('--color', attackRiskScore < 4 ? 'var(--success)' : attackRiskScore < 7 ? 'var(--warning)' : 'var(--danger)');

        // --- Animate Results UI ---
        resultsDashboard.style.borderTopColor = colorTheme;
        riskLevelText.style.color = colorTheme;
        riskLevelText.textContent = `Risk Level: ${riskLabel}`;
        riskDescription.textContent = desc;

        overallStatus.textContent = riskScore <= 30 ? "SECURE" : riskScore <= 60 ? "WARNING" : "COMPROMISED";
        overallStatus.style.color = colorTheme;
        overallStatus.style.border = `1px solid ${colorTheme}`;

        // Populate Vulnerabilities
        vulnItems.innerHTML = '';
        if (notes.length === 0) {
            vulnItems.innerHTML = '<li style="border-left-color: var(--glow-green)">Standard security protocols are active and functioning. No glaring issues detected.</li>';
        } else {
            notes.forEach(note => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fa-solid ${note.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}"></i> ` + note.text;
                li.style.borderLeftColor = note.type === 'danger' ? 'var(--glow-red)' : note.type === 'warning' ? '#ffb800' : 'var(--glow-green)';
                vulnItems.appendChild(li);
            });
        }

        // Populate Suggestions Action Plan
        suggestionItems.innerHTML = '';
        if (suggestions.length > 0) {
            actionPlan.classList.remove('hidden');
            suggestions.forEach(sug => {
                const li = document.createElement('li');
                let iconClass = sug.type === 'critical' ? 'fa-shield-virus' : sug.type === 'warning' ? 'fa-shield-halved' : 'fa-shield-check';
                let iconColor = sug.type === 'critical' ? 'var(--glow-red)' : sug.type === 'warning' ? '#ffb800' : 'var(--glow-green)';
                if (sug.type === 'info') { iconClass = 'fa-circle-info'; iconColor = 'var(--glow-blue)'; }

                li.innerHTML = `<i class="fa-solid ${iconClass}" style="color: ${iconColor}"></i> ` + sug.text;
                li.style.borderLeftColor = iconColor;
                suggestionItems.appendChild(li);
            });
        } else {
            actionPlan.classList.add('hidden');
        }

        // Animate Circular Progress
        let currentProgress = 0;
        const progressEndValue = riskScore;
        const speed = 15; // ms per tick

        const progress = setInterval(() => {
            if (currentProgress >= progressEndValue) {
                clearInterval(progress);
                progressValue.textContent = `${progressEndValue}%`;
            } else {
                currentProgress++;
                progressValue.textContent = `${currentProgress}%`;
                circularProgress.style.background = `conic-gradient(${colorTheme} ${currentProgress * 3.6}deg, rgba(255,255,255,0.05) 0deg)`;
            }
        }, speed);
    }

    // --- Statistics Scroll Animation ---
    const statsSection = document.getElementById('stats');
    const tracks = document.querySelectorAll('.progress-track');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                tracks.forEach(track => track.classList.add('animate'));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (statsSection) {
        observer.observe(statsSection);
    }

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.classList.remove('active'); // close mobile menu
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
