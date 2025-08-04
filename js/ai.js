// Système de Contact Intelligent pour Institut de Gestion et de Technologie
// Fonctionnalités : Validation temps réel, sauvegarde brouillons, suggestions IA, analytics

class SmartContactSystem {
    constructor() {
        this.form = document.querySelector('.newsletter form');
        this.nameInput = this.form.querySelector('input[type="text"]');
        this.messageInput = this.form.querySelector('input[type="email"]');
        this.submitBtn = this.form.querySelector('button[type="submit"]');
        
        // Données locales pour suggestions et analytics
        this.suggestions = {
            formations: ['Gestion', 'Informatique', 'Marketing', 'Finance', 'RH', 'Logistique'],
            intentions: ['Information', 'Inscription', 'Partenariat', 'Stage', 'Emploi', 'Consultation'],
            salutations: ['Bonjour', 'Madame/Monsieur', 'Cher équipe IGT']
        };
        
        this.analytics = {
            interactions: 0,
            completionRate: 0,
            popularTopics: {},
            sessionStart: Date.now()
        };
        
        this.messageTemplates = {
            'information': 'Bonjour, je souhaiterais obtenir des informations sur vos formations en',
            'inscription': 'Bonjour, je suis intéressé(e) par une inscription dans votre programme de',
            'partenariat': 'Bonjour, notre organisation souhaiterait explorer un partenariat avec IGT concernant',
            'stage': 'Bonjour, je recherche un stage dans le domaine de',
            'emploi': 'Bonjour, je souhaiterais postuler pour un poste dans votre établissement'
        };
        
        this.init();
    }
    
    init() {
        this.setupRealTimeValidation();
        this.setupAutoSave();
        this.setupSmartSuggestions();
        this.setupFormEnhancement();
        this.setupAnalytics();
        this.loadSavedDraft();
        this.createFloatingHelp();
    }
    
    setupRealTimeValidation() {
        // Validation en temps réel du nom
        this.nameInput.addEventListener('input', (e) => {
            const value = e.target.value;
            this.validateName(value);
            this.updateAnalytics('nameInput');
        });
        
        // Validation et suggestions pour le message
        this.messageInput.addEventListener('input', (e) => {
            const value = e.target.value;
            this.validateMessage(value);
            this.provideSuggestions(value);
            this.updateAnalytics('messageInput');
        });
        
        // Validation finale à la soumission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }
    
    validateName(name) {
        const feedback = this.getOrCreateFeedback(this.nameInput);
        
        if (name.length < 2) {
            this.showFeedback(feedback, 'Le nom doit contenir au moins 2 caractères', 'warning');
        } else if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(name)) {
            this.showFeedback(feedback, 'Seules les lettres, espaces et tirets sont autorisés', 'error');
        } else if (name.length > 50) {
            this.showFeedback(feedback, 'Le nom ne peut excéder 50 caractères', 'warning');
        } else {
            this.showFeedback(feedback, '✓ Nom valide', 'success');
        }
    }
    
    validateMessage(message) {
        const feedback = this.getOrCreateFeedback(this.messageInput);
        const wordCount = message.split(' ').filter(word => word.length > 0).length;
        
        if (message.length < 10) {
            this.showFeedback(feedback, 'Message trop court (minimum 10 caractères)', 'warning');
        } else if (message.length > 500) {
            this.showFeedback(feedback, `Caractères restants: ${500 - message.length}`, 'warning');
        } else if (wordCount < 3) {
            this.showFeedback(feedback, 'Veuillez écrire au moins 3 mots', 'info');
        } else {
            this.showFeedback(feedback, `✓ Message valide (${wordCount} mots)`, 'success');
        }
    }
    
    setupAutoSave() {
        // Sauvegarde automatique toutes les 3 secondes
        setInterval(() => {
            this.saveDraft();
        }, 3000);
        
        // Sauvegarde avant fermeture de page
        window.addEventListener('beforeunload', () => {
            this.saveDraft();
        });
    }
    
    saveDraft() {
        const draft = {
            name: this.nameInput.value,
            message: this.messageInput.value,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };
        
        if (draft.name || draft.message) {
            localStorage.setItem('igt_contact_draft', JSON.stringify(draft));
        }
    }
    
    loadSavedDraft() {
        const saved = localStorage.getItem('igt_contact_draft');
        if (saved) {
            const draft = JSON.parse(saved);
            const age = Date.now() - draft.timestamp;
            
            // Charger si moins de 24h
            if (age < 24 * 60 * 60 * 1000) {
                this.nameInput.value = draft.name || '';
                this.messageInput.value = draft.message || '';
                
                if (draft.name || draft.message) {
                    this.showNotification('Brouillon restauré automatiquement', 'info');
                }
            }
        }
    }
    
    setupSmartSuggestions() {
        // Créer un conteneur pour les suggestions
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'smart-suggestions';
        suggestionsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
            display: none;
        `;
        
        this.messageInput.parentElement.style.position = 'relative';
        this.messageInput.parentElement.appendChild(suggestionsContainer);
        this.suggestionsContainer = suggestionsContainer;
        
        // Suggestions basées sur l'intention détectée
        this.messageInput.addEventListener('focus', () => {
            this.showQuickTemplates();
        });
        
        document.addEventListener('click', (e) => {
            if (!this.messageInput.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }
    
    provideSuggestions(text) {
        if (text.length < 3) return;
        
        const suggestions = [];
        const lowerText = text.toLowerCase();
        
        // Détecter l'intention
        Object.keys(this.messageTemplates).forEach(intent => {
            if (lowerText.includes(intent) || this.detectIntent(lowerText, intent)) {
                suggestions.push({
                    type: 'template',
                    text: this.messageTemplates[intent],
                    label: `Modèle ${intent}`
                });
            }
        });
        
        // Suggestions de formations
        this.suggestions.formations.forEach(formation => {
            if (formation.toLowerCase().includes(lowerText) || lowerText.includes(formation.toLowerCase())) {
                suggestions.push({
                    type: 'formation',
                    text: ` ${formation}`,
                    label: `Formation: ${formation}`
                });
            }
        });
        
        this.displaySuggestions(suggestions.slice(0, 5));
    }
    
    showQuickTemplates() {
        const templates = Object.keys(this.messageTemplates).map(intent => ({
            type: 'quickTemplate',
            text: this.messageTemplates[intent],
            label: `${intent.charAt(0).toUpperCase() + intent.slice(1)}`
        }));
        
        this.displaySuggestions(templates);
    }
    
    displaySuggestions(suggestions) {
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" style="
                padding: 10px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                transition: background-color 0.2s;
            " data-text="${suggestion.text}">
                <strong>${suggestion.label}</strong>
                <div style="font-size: 0.9em; color: #666; margin-top: 2px;">
                    ${suggestion.text.substring(0, 60)}${suggestion.text.length > 60 ? '...' : ''}
                </div>
            </div>
        `).join('');
        
        // Ajouter les événements click
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f5f5f5';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            
            item.addEventListener('click', () => {
                const text = item.dataset.text;
                if (item.querySelector('strong').textContent.includes('')) {
                    this.messageInput.value = text;
                } else {
                    this.messageInput.value += text;
                }
                this.hideSuggestions();
                this.messageInput.focus();
                this.updateAnalytics('suggestionUsed');
            });
        });
        
        this.suggestionsContainer.style.display = 'block';
    }
    
    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
    }
    
    setupFormEnhancement() {
        // Compteur de caractères pour le message
        const charCounter = document.createElement('div');
        charCounter.className = 'char-counter';
        charCounter.style.cssText = `
            font-size: 0.8em;
            color: #666;
            text-align: right;
            margin-top: 5px;
        `;
        this.messageInput.parentElement.appendChild(charCounter);
        
        this.messageInput.addEventListener('input', () => {
            const count = this.messageInput.value.length;
            charCounter.textContent = `${count}/500 caractères`;
            charCounter.style.color = count > 450 ? '#ff6b6b' : count > 400 ? '#ffa500' : '#666';
        });
        
        // Amélioration du bouton de soumission
        this.enhanceSubmitButton();
    }
    
    enhanceSubmitButton() {
        const originalText = this.submitBtn.textContent;
        
        // État de validation en temps réel
        setInterval(() => {
            const isValid = this.isFormValid();
            this.submitBtn.disabled = !isValid;
            this.submitBtn.style.opacity = isValid ? '1' : '0.6';
            
            if (isValid && this.submitBtn.textContent === originalText) {
                this.submitBtn.innerHTML = `
                    <span style="display: inline-flex; align-items: center; gap: 5px;">
                        ✓ ${originalText}
                    </span>
                `;
            } else if (!isValid && this.submitBtn.textContent !== originalText) {
                this.submitBtn.textContent = originalText;
            }
        }, 500);
    }
    
    setupAnalytics() {
        // Tracking des interactions utilisateur
        this.nameInput.addEventListener('focus', () => this.updateAnalytics('nameFieldFocus'));
        this.messageInput.addEventListener('focus', () => this.updateAnalytics('messageFieldFocus'));
        
        // Analyse de l'engagement
        setInterval(() => {
            this.calculateEngagementMetrics();
        }, 10000);
    }
    
    updateAnalytics(action) {
        this.analytics.interactions++;
        
        if (action === 'messageInput') {
            const message = this.messageInput.value.toLowerCase();
            this.suggestions.formations.forEach(formation => {
                if (message.includes(formation.toLowerCase())) {
                    this.analytics.popularTopics[formation] = (this.analytics.popularTopics[formation] || 0) + 1;
                }
            });
        }
    }
    
    calculateEngagementMetrics() {
        const sessionDuration = Date.now() - this.analytics.sessionStart;
        const hasContent = this.nameInput.value.length > 0 || this.messageInput.value.length > 0;
        
        if (sessionDuration > 30000 && hasContent) { // Plus de 30 secondes avec du contenu
            this.analytics.completionRate = Math.min(
                (this.nameInput.value.length / 10 + this.messageInput.value.length / 50) * 50,
                100
            );
        }
    }
    
    createFloatingHelp() {
        const helpButton = document.createElement('div');
        helpButton.innerHTML = '💡';
        helpButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #0e3f7b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 1.5em;
            transition: transform 0.2s;
        `;
        
        helpButton.addEventListener('mouseenter', () => {
            helpButton.style.transform = 'scale(1.1)';
        });
        
        helpButton.addEventListener('mouseleave', () => {
            helpButton.style.transform = 'scale(1)';
        });
        
        helpButton.addEventListener('click', () => {
            this.showHelpModal();
        });
        
        document.body.appendChild(helpButton);
    }
    
    showHelpModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        modal.innerHTML = `
    <div style="
        background: #fff;
        padding: 25px;
        border-radius: 8px;
        max-width: 500px;
        margin: 20px auto;
        font-family: Arial, sans-serif;
        color: #333;
    ">
        <h3 style="margin-top: 0; color: #0e3f7b;">Aide Smart Contact</h3>
        <h5>Fonctionnalités intelligentes :</h5>
        <ul style="line-height: 1.6; padding-left: 20px;">
            <li><strong>Validation en temps réel :</strong> Vérification automatique des champs</li>
            <li><strong>Suggestions IA :</strong> Messages adaptés à votre intention</li>
            <li><strong>Sauvegarde automatique :</strong> Vos brouillons sont enregistrés</li>
            <li><strong>Formations recommandées :</strong> Propositions selon vos mots-clés</li>
            <li><strong>Compteur intelligent :</strong> Suivi de la longueur optimale</li>
        </ul>
        <h5>Statistiques :</h5>
        <p><strong>Interactions :</strong> ${this.analytics.interactions}</p>
        <p><strong>Taux d'engagement :</strong> ${Math.round(this.analytics.completionRate)}%</p>
        <button onclick="this.closest('div').remove()" style="
            background: #0e3f7b;
            color: #fff;
            border: none;
            padding: 10px 18px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 15px;
        ">Fermer</button>
    </div>
`;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    handleSubmit() {
        if (!this.isFormValid()) {
            this.showNotification('Veuillez corriger les erreurs avant d\'envoyer', 'error');
            return;
        }
        
        // Simulation d'envoi avec feedback avancé
        this.simulateAdvancedSubmission();
    }
    
    simulateAdvancedSubmission() {
        const submitBtn = this.submitBtn;
        const originalText = submitBtn.textContent;
        
        // Phase 1: Validation
        submitBtn.innerHTML = 'Validation...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            // Phase 2: Analyse IA
            submitBtn.innerHTML = 'Analyse IA...';
            
            setTimeout(() => {
                // Phase 3: Envoi
                submitBtn.innerHTML = 'Envoi...';
                
                setTimeout(() => {
                    // Phase 4: Succès
                    submitBtn.innerHTML = 'Envoyé avec succès!';
                    submitBtn.style.background = '#0e3f7b';
                    
                    // Générer un rapport d'analyse
                    this.generateSubmissionReport();
                    
                    // Nettoyer le brouillon
                    localStorage.removeItem('igt_contact_draft');
                    
                    setTimeout(() => {
                        this.resetForm();
                        submitBtn.textContent = originalText;
                        submitBtn.style.background = '';
                        submitBtn.disabled = false;
                    }, 3000);
                    
                }, 1500);
            }, 1000);
        }, 800);
    }
    
    generateSubmissionReport() {
        const message = this.messageInput.value;
        const detectedTopics = this.suggestions.formations.filter(f => 
            message.toLowerCase().includes(f.toLowerCase())
        );
        
        const report = {
            timestamp: new Date().toLocaleString('fr-FR'),
            name: this.nameInput.value,
            messageLength: message.length,
            detectedTopics: detectedTopics,
            estimatedResponse: this.estimateResponseTime(message),
            priority: this.calculatePriority(message)
        };
        
        this.showSubmissionReport(report);
    }
    
    showSubmissionReport(report) {
        this.showNotification(`
            <strong>📊 Rapport d'analyse:</strong><br>
            • Sujets détectés: ${report.detectedTopics.join(', ') || 'Général'}<br>
            • Priorité: ${report.priority}<br>
            • Réponse estimée: ${report.estimatedResponse}<br>
            • Référence: IGT-${Date.now().toString(36).toUpperCase()}
        `, 'success', 8000);
    }
    
    estimateResponseTime(message) {
        const urgentKeywords = ['urgent', 'rapidement', 'vite', 'immédiat'];
        const isUrgent = urgentKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        return isUrgent ? '2-4 heures' : '24-48 heures';
    }
    
    calculatePriority(message) {
        const highPriorityKeywords = ['partenariat', 'emploi', 'direction', 'urgent'];
        const isHighPriority = highPriorityKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        return isHighPriority ? 'Haute' : 'Normale';
    }
    
    // Fonctions utilitaires
    isFormValid() {
        const nameValid = this.nameInput.value.length >= 2 && 
                         /^[a-zA-ZÀ-ÿ\s-]+$/.test(this.nameInput.value);
        const messageValid = this.messageInput.value.length >= 10 && 
                            this.messageInput.value.length <= 500;
        
        return nameValid && messageValid;
    }
    
    getOrCreateFeedback(input) {
        let feedback = input.parentElement.querySelector('.field-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'field-feedback';
            feedback.style.cssText = `
                font-size: 0.8em;
                margin-top: 5px;
                padding: 5px;
                border-radius: 3px;
                transition: all 0.3s;
            `;
            input.parentElement.appendChild(feedback);
        }
        return feedback;
    }
    
    showFeedback(element, message, type) {
        element.textContent = message;
        element.className = `field-feedback ${type}`;
        
        const colors = {
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
        };
        
        const style = colors[type] || colors.info;
        element.style.background = style.bg;
        element.style.color = style.color;
        element.style.border = `1px solid ${style.border}`;
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 3000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        const colors = {
            success: '#0e3f7b',
            warning: '#FF9800',
            error: '#F44336',
            info: '#2196F3'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    resetForm() {
        this.nameInput.value = '';
        this.messageInput.value = '';
        
        // Nettoyer les feedbacks
        this.form.querySelectorAll('.field-feedback').forEach(el => el.remove());
    }
    
    detectIntent(text, intent) {
        const intentKeywords = {
            'information': ['info', 'renseignement', 'détail', 'savoir'],
            'inscription': ['inscrire', 'inscription', 'candidature', 'admission'],
            'partenariat': ['partenaire', 'collaboration', 'coopération'],
            'stage': ['stage', 'stagiaire', 'alternance'],
            'emploi': ['emploi', 'travail', 'poste', 'recrutement', 'carrière']
        };
        
        return intentKeywords[intent]?.some(keyword => text.includes(keyword)) || false;
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('igt_session_id');
        if (!sessionId) {
            sessionId = 'IGT-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            sessionStorage.setItem('igt_session_id', sessionId);
        }
        return sessionId;
    }
}

// Ajouter les styles CSS pour les animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .smart-suggestions::-webkit-scrollbar {
        width: 6px;
    }
    
    .smart-suggestions::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    .smart-suggestions::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
    }
    
    .smart-suggestions::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

document.head.appendChild(styleSheet);

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new SmartContactSystem();
});

// Si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SmartContactSystem();
    });
} else {
    new SmartContactSystem();
}